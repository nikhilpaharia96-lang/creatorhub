import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth-middleware";

export const adminAnalyticsRouter = Router();

// GET /api/admin/analytics/summary — admin only
adminAnalyticsRouter.get("/summary", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [totalRevenue, paidOrderCount, customerCount, productCount, topProducts] =
      await Promise.all([
        prisma.order.aggregate({
          where: { status: "PAID" },
          _sum: { totalAmount: true },
        }),
        prisma.order.count({ where: { status: "PAID" } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.product.count({ where: { isPublished: true } }),
        prisma.orderItem.groupBy({
          by: ["productId"],
          _count: { productId: true },
          orderBy: { _count: { productId: "desc" } },
          take: 5,
        }),
      ]);

    const productIds = topProducts.map((p: { productId: string }) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true },
    });
    const productTitleById = new Map(products.map((p: { id: string; title: string }) => [p.id, p.title]));

    res.status(200).json({
      data: {
        totalRevenue: totalRevenue._sum.totalAmount ?? 0,
        paidOrderCount,
        customerCount,
        productCount,
        topProducts: topProducts.map((p: { productId: string; _count: { productId: number } }) => ({
          productId: p.productId,
          title: productTitleById.get(p.productId) ?? "Unknown product",
          unitsSold: p._count.productId,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});
