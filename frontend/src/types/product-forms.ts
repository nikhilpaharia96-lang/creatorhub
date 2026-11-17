/**
 * Mirrors backend src/types/product-schemas.ts createProductSchema /
 * updateProductSchema exactly.
 */
export interface CreateProductInput {
  slug: string;
  title: string;
  description: string;
  priceAmount: number;
  category: string;
  thumbnailUrl: string;
  fileStorageKey: string;
  fileSizeBytes: number;
  isPublished: boolean;
  downloadLimit: number;
  downloadExpiryDays: number;
}

export type UpdateProductInput = Partial<CreateProductInput>;
