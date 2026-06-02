import express from "express";
import cors from "cors";
import path from "path";
import "dotenv/config";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import adminRouter from "./routes/admin";

const app = express();

// CORS — разрешаем всё (Railway + localhost)
app.use(cors({
  origin: "*",
  credentials: false,
}));

app.use(express.json());

// ── API маршруты ──────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/admin", adminRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Раздача собранного фронтенда ─────────────────────────
const FRONTEND_DIST = path.join(__dirname, "../../frontend/dist");

app.use(express.static(FRONTEND_DIST));

// SPA fallback — все остальные GET → index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

// ── Запуск ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT}`);
});
