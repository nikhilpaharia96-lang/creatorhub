import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { Errors } from "../lib/errors";
import { requireAuth } from "../middleware/auth-middleware";

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

// GET /api/wishlist — current user's wishlist
wishlistRouter.get("/", async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            priceAmount: true,
            currency: true,
            thumbnailUrl: true,
            category: true,
            isPublished: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      data: items
        .filter((item: (typeof items)[number]) => item.product.isPublished)
        .map((item: (typeof items)[number]) => item.product),
    });
  } catch (err) {
    next(err);
  }
});

const addSchema = z.object({ productId: z.string().min(1) });

// POST /api/wishlist — add a product to wishlist (idempotent)
wishlistRouter.post("/", async (req, res, next) => {
  try {
    const { productId } = addSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isPublished) {
      next(Errors.NotFound("Product not found"));
      return;
    }

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user!.userId, productId } },
      create: { userId: req.user!.userId, productId },
      update: {},
    });

    res.status(200).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wishlist/:productId
wishlistRouter.delete("/:productId", async (req, res, next) => {
  try {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user!.userId, productId: req.params.productId },
    });
    res.status(200).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});
