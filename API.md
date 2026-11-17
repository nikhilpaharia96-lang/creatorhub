# CreatorHub API Reference

Base URL: `http://localhost:4000` (dev) or your deployed backend origin.

All responses follow one of two shapes:

```json
{ "data": { }, "meta": { } }
{ "error": { "code": "STRING_CODE", "message": "Human-readable message" } }
```

Authentication is via httpOnly cookies (`accessToken`, `refreshToken`), set automatically on login/register. Requests must include `credentials: "include"` (fetch) or `withCredentials: true` (axios).

---

## Auth

### `POST /api/auth/register`
Body: `{ email, password, name }` -> `201 { data: User }`, sets auth cookies.

### `POST /api/auth/login`
Body: `{ email, password }` -> `200 { data: User }`. `401` on invalid credentials (generic message, no user enumeration).

### `POST /api/auth/refresh`
Uses the `refreshToken` cookie to issue a new `accessToken`. -> `200 { data: { success: true } }`

### `POST /api/auth/logout`
Clears both auth cookies. -> `200 { data: { success: true } }`

### `GET /api/auth/me`
Requires auth. -> `200 { data: User }`

---

## Products

### `GET /api/products`
Public. Query: `category`, `search`, `minPrice`, `maxPrice` (paise), `sort` (newest | price_asc | price_desc), `page`, `pageSize` (max 50).
-> `200 { data: Product[], meta: { page, pageSize, total, totalPages } }`

### `GET /api/products/categories`
Public. -> `200 { data: string[] }`

### `GET /api/products/:slug`
Public, published only; unpublished -> `404`. -> `200 { data: Product }`

### `GET /api/products/admin/all` -- Admin only
Full product fields. Query: `category`, `page`, `pageSize`. -> `200 { data: AdminProduct[], meta }`

### `POST /api/products` -- Admin only
Body: `CreateProductInput`. -> `201 { data: Product }`, `409` if slug exists.

### `PATCH /api/products/:id` -- Admin only
Body: partial `CreateProductInput`. -> `200 { data: Product }`

### `DELETE /api/products/:id` -- Admin only
-> `200 { data: { success: true } }`

---

## Orders / Checkout

### `POST /api/orders/checkout`
Requires auth. Body: `{ productIds: string[], couponCode?: string }`
-> `201 { data: { orderId, providerOrderId, amount, currency, razorpayKeyId, subtotalAmount, discountAmount } }`

### `POST /api/orders/verify`
Requires auth. Body: `{ orderId, providerPaymentId, signature }`.
-> `200 { data: { success: true, orderId } }`, grants entitlements. `402` on signature failure.

### `POST /api/orders/webhook`
Razorpay server-to-server webhook only. Requires `x-razorpay-signature` header; body must be raw bytes.
-> `200 { received: true }` or `400` on invalid signature.

### `GET /api/orders`
Requires auth. -> `200 { data: Order[] }`

### `GET /api/orders/admin/all` -- Admin only
-> `200 { data: AdminOrder[] }` (up to 100 most recent)

---

## Downloads

### `GET /api/downloads`
Requires auth. -> `200 { data: LibraryEntry[] }`

### `POST /api/downloads/:productId`
Requires auth. Rate-limited (30 / 15 min). Verifies ownership, expiry, remaining count server-side.
-> `200 { data: { downloadUrl, expiresInSeconds: 300, downloadsRemaining } }`, `403` if not owned/expired/exhausted.

---

## Wishlist

All routes require auth.

- `GET /api/wishlist` -> `200 { data: Product[] }`
- `POST /api/wishlist` -- Body: `{ productId }` -> `200 { data: { success: true } }` (idempotent)
- `DELETE /api/wishlist/:productId` -> `200 { data: { success: true } }`

---

## Admin -- Customers, Analytics, Coupons

All routes require `role: ADMIN`.

- `GET /api/admin/customers` -> `200 { data: AdminCustomer[] }`
- `GET /api/admin/analytics/summary` -> `200 { data: { totalRevenue, paidOrderCount, customerCount, productCount, topProducts } }`
- `GET /api/admin/coupons` -> `200 { data: Coupon[] }`
- `POST /api/admin/coupons` -- Body: `{ code, discountType, discountValue, maxRedemptions?, expiresAt? }` -> `201 { data: Coupon }`
- `PATCH /api/admin/coupons/:id` -- Body: `{ isActive }` -> `200 { data: Coupon }`
- `DELETE /api/admin/coupons/:id` -> `200 { data: { success: true } }`

---

## Error Codes

| Code | Status | Meaning |
|---|---|---|
| UNAUTHORIZED | 401 | Not logged in / invalid or expired session |
| FORBIDDEN | 403 | Logged in but not permitted |
| NOT_FOUND | 404 | Resource doesn't exist or is hidden |
| CONFLICT | 409 | Duplicate resource |
| VALIDATION_ERROR | 422 | Request failed validation |
| RATE_LIMITED | 429 | Too many requests |
| PAYMENT_FAILED | 402 | Payment signature verification failed |
| INTERNAL_ERROR | 500 | Unexpected server error |

## Rate Limits

| Scope | Limit |
|---|---|
| Global | 300 req / 15 min per IP |
| /api/auth/* | 20 req / 15 min per IP |
| /api/downloads/:productId | 30 req / 15 min per IP |
