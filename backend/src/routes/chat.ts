import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../db";
import { HfInference } from '@huggingface/inference';

const router = Router();

// Инициализируем Hugging Face токеном из .env
const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

const GAME_PROMPTS: Record<string, string> = {
  chess: `Ты профессиональный шахматный тренер с уровнем гроссмейстера. Помогай пользователю улучшить игру. Анализируй позиции, объясняй дебюты (Испанская партия, Сицилианская защита, Королевский гамбит), стратегию миттельшпиля и технику эндшпиля. Используй алгебраическую нотацию. Отвечай конкретно и воодушевляюще. Пиши на русском языке.`,
  checkers: `Ты опытный тренер по шашкам. Помогай пользователю: последовательности взятий, стратегия дамок, эндшпильная техника, типичные ловушки. Давай конкретные практические советы. Отвечай на русском языке.`,
  backgammon: `Ты профессиональный тренер по нардам. Объясняй стратегию бегового гейма, построение прайма, атакующую игру, снятие шашек, стратегию куба удвоения и подсчёт пипов. Давай конкретные советы с примерами. Отвечай на русском языке.`,
  poker: `Ты профессиональный тренер по покеру (Техасский Холдем). Рассматривай диапазоны рук, позиционную игру, пот-оддсы, GTO vs эксплойтивная игра, управление банкроллом и контроль тильта. Давай чёткие примеры. Отвечай на русском языке.`,
  "league-of-legends": `Ты тренер высокого эло в League of Legends. Помогай с управлением волной, макростратегией, механикой чемпионов, сборкой предметов, контролем видения и ментальной игрой. Давай советы с учётом роли игрока. Отвечай на русском языке.`,
  "dota-2": `Ты профессиональный тренер по Dota 2. Помогай с паттернами фарма, теорией драфта, картой, таймингами предметов и позиционированием в teamfight. Давай советы по каждой роли. Отвечай на русском языке.`,
  cs2: `Ты профессиональный тренер по CS2. Помогай с прицеливанием, движением, использованием утилиты, экономикой, контролем карты и коммуникацией. Предлагай схемы разминки и советы по игре. Отвечай на русском языке.`,
  valorant: `Ты тренер высокого ранга по Valorant. Помогай со способностями агентов, постановкой прицела, экономикой, контролем карты и координацией. Давай советы по роли (duelist, initiator, controller, sentinel). Отвечай на русском языке.`,
  other: `Ты универсальный тренер по играм с широкой экспертизой в соревновательных и настольных/карточных играх. Помогай пользователю улучшить конкретные навыки, анализируй ошибки и давай практические рекомендации. Отвечай на русском языке.`,
};

// =====================
// HUGGING FACE (ОСНОВНОЙ ВАРИАНТ)
// =====================
async function callHuggingFace(
  messages: { role: string; content: string }[]
): Promise<string> {
  console.log("=== HUGGING FACE REQUEST (Llama-3) ===");
  
  const response = await hf.chatCompletion({
    model: "meta-llama/Meta-Llama-3-8B-Instruct",
    messages: messages as any,
    max_tokens: 600,
    temperature: 0.6,
  });

  return response.choices[0].message.content || "Не удалось сгенерировать текст ответа.";
}

// =====================
// OLLAMA (ЗАПАСНОЙ РЕЗЕРВНЫЙ ВАРИАНТ)
// =====================
async function callOllama(
  messages: { role: string; content: string }[],
  clientSignal: AbortSignal
): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "qwen3:4b";

  console.log("=== OLLAMA RECOVERY REQUEST ===");
  console.log("URL:", ollamaUrl);
  console.log("MODEL:", model);

  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), 60000);
  const combinedSignal = AbortSignal.any([clientSignal, timeoutController.signal]);

  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      signal: combinedSignal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: 0.5, num_ctx: 4096 },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama error ${response.status}: ${errText}`);
    }

    const rawText = await response.text();
    const data = JSON.parse(rawText);

    const reasoning = data?.message?.reasoning_content;
    const content = data?.message?.content ?? data?.response;

    if (reasoning && content) {
      return `*Мысли тренера:*\n> ${reasoning.trim().replace(/\n/g, '\n> ')}\n\n${content}`;
    }

    return content ?? data?.error ?? "Нет ответа от локальной модели.";
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// =====================
// ROUTES
// =====================

// GET dialogs
router.get("/dialogs", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dialogs = await prisma.dialog.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true },
        },
      },
    });
    res.json(dialogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// POST dialog
router.post("/dialogs", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const dialog = await prisma.dialog.create({
      data: {
        userId: req.userId!,
        title: title || "Новый чат",
      },
    });
    res.json(dialog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// DELETE dialog
router.delete("/dialogs/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.dialog.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET messages
router.get("/dialogs/:id/messages", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dialog = await prisma.dialog.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!dialog) {
      return res.status(404).json({ error: "Диалог не найден" });
    }

    const messages = await prisma.message.findMany({
      where: { dialogId: req.params.id },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// SEND message (С ДВОЙНОЙ НЕЙРОСЕТЬЮ И ОТМЕНОЙ)
router.post("/send", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { dialogId, message } = req.body;

    if (!dialogId || !message) {
      return res.status(400).json({ error: "dialogId и message обязательны" });
    }

    const dialog = await prisma.dialog.findFirst({
      where: { id: dialogId, userId: req.userId },
    });

    if (!dialog) {
      return res.status(404).json({ error: "Диалог не найден" });
    }

    const backendCancelController = new AbortController();

    req.on("close", () => {
      if (!backendCancelController.signal.aborted) {
        console.log("🛑 Клиент прервал соединение. Останавливаем генерацию...");
        backendCancelController.abort();
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    const gameKey = user?.game || "other";
    const systemPrompt = GAME_PROMPTS[gameKey];

    const history = await prisma.message.findMany({
      where: { dialogId },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    history.reverse();

    // Сохраняем сообщение юзера
    await prisma.message.create({
      data: {
        dialogId,
        role: "user",
        content: message,
      },
    });

    if (dialog.title === "Новый чат" || dialog.title === "New chat") {
      await prisma.dialog.update({
        where: { id: dialogId },
        data: { title: message.slice(0, 45) },
      });
    }

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    let aiText = "";

    try {
      // Шаг 1: Пробуем быстрый бесплатный Hugging Face (без VPN)
      aiText = await callHuggingFace(formattedMessages);
    } catch (hfErr: any) {
      console.warn("⚠️ Hugging Face недоступен. Переключаюсь на Ollama...", hfErr.message);
      
      if (backendCancelController.signal.aborted) return;

      try {
        // Шаг 2: Если HF упал, подхватывает локальная Ollama
        aiText = await callOllama(formattedMessages, backendCancelController.signal);
      } catch (ollamaErr: any) {
        if (backendCancelController.signal.aborted) {
          console.log("⚡ Генерация отменена пользователем.");
          return;
        }
        console.error("❌ Оба ИИ-сервиса недоступны:", ollamaErr.message);
        aiText = "Извини, тренер временно недоступен. Проверь интернет-соединение или статус локальной Ollama.";
      }
    }

    if (backendCancelController.signal.aborted) return;

    // Сохраняем финальный ответ ИИ в БД
    const saved = await prisma.message.create({
      data: {
        dialogId,
        role: "assistant",
        content: aiText,
      },
    });

    res.json({ message: saved });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Ошибка сервера" });
    }
  }
});

export default router;