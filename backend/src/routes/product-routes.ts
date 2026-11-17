import { Router } from "express";
import { prisma } from "../lib/prisma";
import { Errors } from "../lib/errors";
import { requireAuth, requireAdmin } from "../middleware/auth-middleware";
import {
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
} from "../types/product-schemas";

export const productRouter = Router();

/** Fields safe to expose publicly. Never leaks fileStorageKey. */
const PUBLIC_PRODUCT_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  priceAmount: true,
  currency: true,
  category: true,
  thumbnailUrl: true,
  fileSizeBytes: true,
  createdAt: true,
} as const;

// GET /api/products — public catalog listing, published only
productRouter.get("/", async (req, res, next) => {
  try {
    const query = productListQuerySchema.parse(req.query);

    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      next(Errors.Validation("Minimum price cannot exceed maximum price"));
      return;
    }

    const where = {
      isPublished: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" as const } },
              { description: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            priceAmount: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
    };

    const orderBy =
      query.sort === "price_asc"
        ? { priceAmount: "asc" as const }
        : query.sort === "price_desc"
          ? { priceAmount: "desc" as const }
          : { createdAt: "desc" as const };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: PUBLIC_PRODUCT_SELECT,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    res.status(200).json({
      data: items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---- Admin routes ----
// IMPORTANT: these static-path admin routes (/admin/all, /categories)
// MUST be registered before the public GET /:slug route below.
// Express matches routes in registration order, and /:slug is a
// catch-all for any single path segment — if it were registered
// first, a request to /api/products/admin/all would incorrectly
// match /:slug with slug="admin" and 404 before ever reaching the
// real admin handler. This ordering bug was caught during review.

// GET /api/products/admin/all — admin only, full fields incl. unpublished
productRouter.get("/admin/all", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const query = productListQuerySchema.parse(req.query);
    const where = query.category ? { category: query.category } : {};

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    res.status(200).json({
      data: items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/categories — public, distinct category list
productRouter.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.product.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    res.status(200).json({ data: categories.map((c: { category: string }) => c.category) });
  } catch (err) {
    next(err);
  }
});

// POST /api/products — admin only, create product
productRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = createProductSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) {
      next(Errors.Conflict("A product with this slug already exists"));
      return;
    }

    const product = await prisma.product.create({ data });
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:id — admin only, update product
productRouter.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = updateProductSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      next(Errors.NotFound("Product not found"));
      return;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id — admin only
productRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      next(Errors.NotFound("Product not found"));
      return;
    }

    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(200).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug — public product detail, published only.
// MUST remain the LAST GET route registered on this router (see note
// above at the admin routes section).
productRouter.get("/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
    });

    if (!product || !product.isPublished) {
      next(Errors.NotFound("Product not found"));
      return;
    }

    const { fileStorageKey, downloadLimit, downloadExpiryDays, isPublished, updatedAt, ...publicFields } =
      product;

    res.status(200).json({ data: publicFields });
  } catch (err) {
    next(err);
  }
});
