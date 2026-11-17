import { api } from "./client";
import type { Product } from "@/types/api";

export const wishlistApi = {
  list: () => api.get<Product[]>("/api/wishlist"),
  add: (productId: string) => api.post<{ success: boolean }>("/api/wishlist", { productId }),
  remove: (productId: string) => api.delete<{ success: boolean }>(`/api/wishlist/${productId}`),
};
