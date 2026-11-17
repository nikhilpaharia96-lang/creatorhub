import { api, apiGetWithMeta } from "./client";
import type {
  AdminProduct,
  AdminOrder,
  AdminCustomer,
  AnalyticsSummary,
  Coupon,
  ProductListMeta,
} from "@/types/api";
import type { CreateProductInput, UpdateProductInput } from "@/types/product-forms";

export const adminProductApi = {
  list: (page = 1) =>
    apiGetWithMeta<AdminProduct[]>(`/api/products/admin/all?page=${page}&pageSize=50`) as Promise<{
      data: AdminProduct[];
      meta: ProductListMeta;
    }>,
  create: (input: CreateProductInput) => api.post<AdminProduct>("/api/products", input),
  update: (id: string, input: UpdateProductInput) =>
    api.patch<AdminProduct>(`/api/products/${id}`, input),
  remove: (id: string) => api.delete<{ success: boolean }>(`/api/products/${id}`),
};

export const adminOrderApi = {
  list: () => api.get<AdminOrder[]>("/api/orders/admin/all"),
};

export const adminCustomerApi = {
  list: () => api.get<AdminCustomer[]>("/api/admin/customers"),
};

export const adminAnalyticsApi = {
  summary: () => api.get<AnalyticsSummary>("/api/admin/analytics/summary"),
};

export interface CreateCouponInput {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxRedemptions?: number;
  expiresAt?: string;
}

export const adminCouponApi = {
  list: () => api.get<Coupon[]>("/api/admin/coupons"),
  create: (input: CreateCouponInput) => api.post<Coupon>("/api/admin/coupons", input),
  setActive: (id: string, isActive: boolean) =>
    api.patch<Coupon>(`/api/admin/coupons/${id}`, { isActive }),
  remove: (id: string) => api.delete<{ success: boolean }>(`/api/admin/coupons/${id}`),
};
