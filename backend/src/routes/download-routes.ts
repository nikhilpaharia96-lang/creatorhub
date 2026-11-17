import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { Errors } from "../lib/errors";
import { requireAuth } from "../middleware/auth-middleware";
import { generateSignedDownloadUrl } from "../services/storage-service";
import { checkDownloadAllowed } from "../services/download-gate";

export const downloadRouter = Router();

// Rate-limit download link generation per Section 11 (sensitive endpoint).
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many download requests. Please try again later." } },
});

// GET /api/downloads — current user's purchased library
downloadRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const entitlements = await prisma.entitlement.findMany({
      where: { userId: req.user!.userId },
      include: { product: { select: { title: true, slug: true, thumbnailUrl: true, fileSizeBytes: true } } },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const data = entitlements.map((e: (typeof entitlements)[number]) => ({
      productId: e.productId,
      product: e.product,
      downloadsUsed: e.downloadsUsed,
      downloadLimit: e.downloadLimit,
      expiresAt: e.expiresAt,
      isExpired: e.expiresAt < now,
      downloadsRemaining: Math.max(0, e.downloadLimit - e.downloadsUsed),
    }));

    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/downloads/:productId — generates a short-lived signed URL.
// Verifies entitlement ownership, expiry, and remaining download count
// server-side before ever calling the storage service — never trust
// the client, never expose a signed URL without this check.
downloadRouter.post("/:productId", requireAuth, downloadLimiter, async (req, res, next) => {
  try {
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        userId_productId: {
          userId: req.user!.userId,
          productId: req.params.productId,
        },
      },
      include: { product: true },
    });

    if (!entitlement) {
      next(Errors.Forbidden("You do not own this product"));
      return;
    }

    const gateResult = checkDownloadAllowed(entitlement);
    if (!gateResult.allowed) {
      next(
        gateResult.reason === "expired"
          ? Errors.Forbidden("Your download access for this product has expired")
          : Errors.Forbidden("You have reached the download limit for this product")
      );
      return;
    }

    // Increment first (fail-safe: count the attempt even if the signed
    // URL generation somehow fails after this point) then generate.
    await prisma.entitlement.update({
      where: { id: entitlement.id },
      data: { downloadsUsed: { increment: 1 } },
    });

    const fileName = `${entitlement.product.slug}.zip`;
    const signedUrl = await generateSignedDownloadUrl(
      entitlement.product.fileStorageKey,
      fileName
    );

    res.status(200).json({
      data: {
        downloadUrl: signedUrl,
        expiresInSeconds: 300,
        downloadsRemaining: entitlement.downloadLimit - entitlement.downloadsUsed - 1,
      },
    });
  } catch (err) {
    next(err);
  }
});
