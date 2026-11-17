import { z } from "zod";

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const createProductSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priceAmount: z.number().int().min(0),
  category: z.string().min(1),
  thumbnailUrl: z.string().url(),
  fileStorageKey: z.string().min(1),
  fileSizeBytes: z.number().int().min(1),
  isPublished: z.boolean().default(false),
  downloadLimit: z.number().int().min(1).default(5),
  downloadExpiryDays: z.number().int().min(1).default(365),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
