import express from "express";
import cors from "cors";
import "dotenv/config";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import adminRouter from "./routes/admin";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("GameCoach AI Backend works! 🎮");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/admin", adminRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🤖 Ollama: ${process.env.OLLAMA_URL || "http://localhost:11434"}`);
  console.log(`📦 Модель: ${process.env.OLLAMA_MODEL || "llama3.2"}`);
});
