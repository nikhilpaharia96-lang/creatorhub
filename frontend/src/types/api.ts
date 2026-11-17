/**
 * Shared API types. Mirrors backend Prisma models + route response
 * shapes exactly (src/routes/*.ts, prisma/schema.prisma). Kept in
 * sync manually since frontend/backend are separate apps (Section 3
 * locked stack: no shared monorepo package at MVP) — any backend DTO
 * change must be reflected here in the same milestone.
 */

export type UserRole = "CUSTOMER" | "ADMIN";
export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type Currency = "INR";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceAmount: number;
  currency: Currency;
  category: string;
  thumbnailUrl: string;
  fileSizeBytes: number;
  createdAt: string;
}

export interface ProductListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface OrderItemSummary {
  id: string;
  productId: string;
  priceAmount: number;
  product: {
    title: string;
    thumbnailUrl: string;
    slug: string;
  };
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: Currency;
  createdAt: string;
  items: OrderItemSummary[];
}

export interface CheckoutResponse {
  orderId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  subtotalAmount: number;
  discountAmount: number;
}

export interface LibraryEntry {
  productId: string;
  product: {
    title: string;
    slug: string;
    thumbnailUrl: string;
    fileSizeBytes: number;
  };
  downloadsUsed: number;
  downloadLimit: number;
  expiresAt: string;
  isExpired: boolean;
  downloadsRemaining: number;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  expiresInSeconds: number;
  downloadsRemaining: number;
}

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  maxRedemptions: number | null;
  redemptionCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface AdminProduct extends Product {
  fileStorageKey: string;
  isPublished: boolean;
  downloadLimit: number;
  downloadExpiryDays: number;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: Currency;
  createdAt: string;
  user: { name: string; email: string };
  items: { product: { title: string } }[];
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: { orders: number };
}

export interface AnalyticsSummary {
  totalRevenue: number;
  paidOrderCount: number;
  customerCount: number;
  productCount: number;
  topProducts: { productId: string; title: string; unitsSold: number }[];
}

/** Standard API envelope shapes, matching backend's error-handler.ts */
export interface ApiSuccess<T> {
  data: T;
  meta?: ProductListMeta;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
