import express from "express";
import cors from "cors";
import path from "path";
import "dotenv/config";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import adminRouter from "./routes/admin";

const app = express();

app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());

// ── API ───────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/admin", adminRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Фронтенд (скопирован в public при сборке) ────────────
// На Railway: backend/public/  (скопировано из frontend/dist)
// Локально:   ../frontend/dist (через Vite proxy)
const FRONTEND_DIST = path.join(__dirname, "../public");

app.use(express.static(FRONTEND_DIST));

app.get("*", (_req, res) => {
  const indexPath = path.join(FRONTEND_DIST, "index.html");
  res.sendFile(indexPath);
});

// ── Запуск ────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server on port ${PORT}`);
});
