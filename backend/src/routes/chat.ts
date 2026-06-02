import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../db";

const router = Router();

const GAME_PROMPTS: Record<string, string> = {
  chess: `You are a professional chess coach at grandmaster level. Always respond in Russian. Help the user improve: analyze positions, explain openings (Ruy Lopez, Sicilian, King's Gambit), middlegame strategy, endgame technique. Use algebraic notation. Be specific and encouraging.`,
  checkers: `You are an expert checkers coach. Always respond in Russian. Help with: jumping sequences, king strategy, endgame technique, common traps. Give concrete practical advice.`,
  backgammon: `You are a professional backgammon coach. Always respond in Russian. Explain running game, priming, blitzing, bearing off, doubling cube strategy, pip counting. Give specific examples.`,
  poker: `You are a professional poker coach (Texas Hold'em). Always respond in Russian. Cover hand ranges, position play, pot odds, GTO vs exploitative play, bankroll management, tilt control.`,
  "league-of-legends": `You are a high-elo League of Legends coach. Always respond in Russian. Help with wave management, macro strategy, champion mechanics, itemization, vision control, mental game.`,
  "dota-2": `You are a professional Dota 2 coach. Always respond in Russian. Help with farming patterns, draft theory, map awareness, item timing, teamfight positioning.`,
  cs2: `You are a professional CS2 coach. Always respond in Russian. Help with aim, movement, utility usage, economy, map control, communication. Provide warmup routines.`,
  valorant: `You are a high-ranked Valorant coach. Always respond in Russian. Help with agent abilities, crosshair placement, economy, map control. Give tips per role.`,
  other: `You are a universal game coach. Always respond in Russian. Help improve specific skills, analyze mistakes, give actionable recommendations.`,
};

// ── HuggingFace через fetch (без SDK — надёжнее) ─────────
async function callHuggingFace(
  messages: { role: string; content: string }[]
): Promise<string> {
  const token = process.env.HUGGINGFACE_TOKEN;
  if (!token) throw new Error("HUGGINGFACE_TOKEN не задан");

  // Mistral-7B — открытая модель, не требует доп. доступа
  const MODEL = "HuggingFaceH4/zephyr-7b-beta";

  const resp = await fetch(
    `https://router.huggingface.co/hf-inference/models/${MODEL}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 800,
        temperature: 0.7,
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    }
  );

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`HF ${resp.status}: ${txt.slice(0, 200)}`);
  }

  const data = await resp.json() as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "Нет ответа от модели.";
}

// ── Routes ────────────────────────────────────────────────

router.get("/dialogs", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dialogs = await prisma.dialog.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, createdAt: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, role: true } },
      },
    });
    res.json(dialogs);
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

router.post("/dialogs", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const dialog = await prisma.dialog.create({
      data: { userId: req.userId!, title: title || "Новый чат" },
    });
    res.json(dialog);
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

router.delete("/dialogs/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.dialog.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

router.get("/dialogs/:id/messages", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dialog = await prisma.dialog.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!dialog) return res.status(404).json({ error: "Диалог не найден" });
    const messages = await prisma.message.findMany({
      where: { dialogId: req.params.id },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

router.post("/send", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { dialogId, message } = req.body;
    if (!dialogId || !message) return res.status(400).json({ error: "dialogId и message обязательны" });

    const dialog = await prisma.dialog.findFirst({ where: { id: dialogId, userId: req.userId } });
    if (!dialog) return res.status(404).json({ error: "Диалог не найден" });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const gameKey = user?.game || "other";
    const systemPrompt = GAME_PROMPTS[gameKey] ?? GAME_PROMPTS.other;

    const history = await prisma.message.findMany({
      where: { dialogId },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // Сохраняем сообщение пользователя
    await prisma.message.create({ data: { dialogId, role: "user", content: message } });

    // Авторименование
    if (dialog.title === "Новый чат" || dialog.title === "New chat") {
      await prisma.dialog.update({
        where: { id: dialogId },
        data: { title: message.slice(0, 45) + (message.length > 45 ? "…" : "") },
      });
    }

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    let aiText: string;

    try {
      aiText = await callHuggingFace(formattedMessages);
    } catch (err: any) {
      console.error("HuggingFace error:", err.message);
      aiText = `⚠️ ИИ временно недоступен. Ошибка: ${err.message.slice(0, 120)}\n\nПопробуйте ещё раз через минуту.`;
    }

    const saved = await prisma.message.create({
      data: { dialogId, role: "assistant", content: aiText },
    });

    res.json({ message: saved });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
