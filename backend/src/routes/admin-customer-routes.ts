import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth-middleware";

export const adminCustomerRouter = Router();

// GET /api/admin/customers — admin only
adminCustomerRouter.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.status(200).json({ data: customers });
  } catch (err) {
    next(err);
  }
});
