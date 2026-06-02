import { Router, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../db";

const router = Router();

function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Только для администраторов" });
    return;
  }
  next();
}

// GET /admin/users
router.get("/users", authMiddleware, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, username: true,
        game: true, role: true, createdAt: true,
        _count: { select: { dialogs: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /admin/stats
router.get("/stats", authMiddleware, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalDialogs, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.dialog.count(),
      prisma.message.count(),
    ]);
    const usersByGame = await prisma.user.groupBy({
      by: ["game"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    res.json({ totalUsers, totalDialogs, totalMessages, usersByGame });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PATCH /admin/users/:id/role
router.patch("/users/:id/role", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!["player", "admin"].includes(role)) {
      return res.status(400).json({ error: "Роль должна быть player или admin" });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, username: true, role: true },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// DELETE /admin/users/:id
router.delete("/users/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
