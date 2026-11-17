import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { Errors } from "../lib/errors";
import { requireAuth, requireAdmin } from "../middleware/auth-middleware";

export const adminCouponRouter = Router();

const createCouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, hyphens, underscores"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().int().min(1),
  maxRedemptions: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
});

adminCouponRouter.use(requireAuth, requireAdmin);

adminCouponRouter.get("/", async (_req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json({ data: coupons });
  } catch (err) {
    next(err);
  }
});

adminCouponRouter.post("/", async (req, res, next) => {
  try {
    const data = createCouponSchema.parse(req.body);

    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) {
      next(Errors.Conflict("A coupon with this code already exists"));
      return;
    }

    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      next(Errors.Validation("Percentage discount cannot exceed 100"));
      return;
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxRedemptions: data.maxRedemptions,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
    res.status(201).json({ data: coupon });
  } catch (err) {
    next(err);
  }
});

adminCouponRouter.patch("/:id", async (req, res, next) => {
  try {
    const data = z.object({ isActive: z.boolean() }).parse(req.body);
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      next(Errors.NotFound("Coupon not found"));
      return;
    }
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: { isActive: data.isActive },
    });
    res.status(200).json({ data: coupon });
  } catch (err) {
    next(err);
  }
});

adminCouponRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      next(Errors.NotFound("Coupon not found"));
      return;
    }
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.status(200).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});
