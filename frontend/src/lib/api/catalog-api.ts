import { api, apiGetWithMeta } from "./client";
import type {
  Product,
  ProductListMeta,
  Order,
  CheckoutResponse,
  LibraryEntry,
  DownloadUrlResponse,
} from "@/types/api";

export interface ProductListParams {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

function buildQuery(params: ProductListParams): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export const productApi = {
  list: (params: ProductListParams = {}) =>
    apiGetWithMeta<Product[]>(`/api/products${buildQuery(params)}`) as Promise<{
      data: Product[];
      meta: ProductListMeta;
    }>,
  getBySlug: (slug: string) => api.get<Product>(`/api/products/${slug}`),
};

export const orderApi = {
  checkout: (productIds: string[], couponCode?: string) =>
    api.post<CheckoutResponse>("/api/orders/checkout", { productIds, couponCode }),
  verify: (input: { orderId: string; providerPaymentId: string; signature: string }) =>
    api.post<{ success: boolean; orderId: string }>("/api/orders/verify", input),
  list: () => api.get<Order[]>("/api/orders"),
};

export const downloadApi = {
  library: () => api.get<LibraryEntry[]>("/api/downloads"),
  getDownloadUrl: (productId: string) =>
    api.post<DownloadUrlResponse>(`/api/downloads/${productId}`),
};
