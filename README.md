# CreatorHub

A premium, mobile-first digital marketplace for buying and instantly
downloading digital products. Single-seller MVP, architected for
future multi-vendor, multi-currency, and multi-payment-provider support
without requiring a rewrite.

**Version:** 1.0.0 (MVP)

---

## Stack

- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS v4, React Query, React Hook Form + Zod, Framer Motion, Lucide icons
- **Backend:** Node.js + Express 5 + TypeScript, PostgreSQL, Prisma ORM, JWT auth (httpOnly cookies)
- **Payments:** Razorpay, behind a `PaymentProvider` interface (swappable)
- **Storage:** Cloudflare R2 (S3-compatible), signed short-lived download URLs
- **Deployment:** Docker + Docker Compose, Nginx (frontend), multi-stage builds

---

## Local Setup

### Prerequisites
- Node.js 22+
- PostgreSQL 16+ (local install or Docker)
- A Razorpay account (test mode is fine)
- A Cloudflare R2 bucket (or any S3-compatible storage)

### 1. Database
```bash
docker run -d --name creatorhub-postgres \
  -e POSTGRES_USER=creatorhub -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=creatorhub \
  -p 5432:5432 postgres:16-alpine
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with real values (DB URL, JWT secrets, Razorpay keys, R2 credentials)

npm install
npx prisma generate      # Requires network access to binaries.prisma.sh
npx prisma migrate dev --name init

npm run dev               # Starts on http://localhost:4000
```

Run the backend test suite (Vitest, no database required — see Known Limitations):
```bash
npm test                  # single run
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_BASE_URL should point to the backend (default http://localhost:4000)

npm install
npm run dev                # Starts on http://localhost:5173
```

### 4. Create an admin user
There's no seed script at MVP. Register a normal account via the UI, then
manually promote it in the database:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

### 5. Razorpay webhook (local development)
Razorpay needs a publicly reachable URL to send webhooks to. Use a tunnel:
```bash
ngrok http 4000
# Set the ngrok URL + /api/orders/webhook as the webhook endpoint in
# the Razorpay Dashboard, and copy the webhook secret into .env
```

---

## Production Deployment (Docker Compose)

```bash
cp .env.example .env
# Fill in real production secrets — DO NOT reuse development secrets

docker compose build
docker compose up -d

docker compose exec backend npx prisma migrate deploy
```

- Frontend served on port 8080 (map to 443 via your reverse proxy/load balancer with TLS)
- Backend on port 4000 (should not be exposed publicly — route through Nginx/load balancer, or restrict via firewall/security group)
- Postgres on port 5432 (should NOT be exposed publicly in production — remove the `ports` mapping in `docker-compose.yml` or restrict via firewall)

### TLS
`docker-compose.yml` does not terminate TLS. In production, either:
- Put a managed load balancer (e.g. AWS ALB, Cloudflare) in front with TLS termination, or
- Add a reverse-proxy service (Traefik/Caddy) to the compose stack with Let's Encrypt.

### Recommended production topology
```
Internet -> CDN/LB (TLS) -> Nginx (frontend, static)
                          -> Backend API (internal network only)
                          -> Postgres (internal network only, private subnet)
```

---

## Environment Variables

See `.env.example` (root, for Docker Compose), `backend/.env.example`, and
`frontend/.env.example` for the full list with descriptions. Summary:

| Variable | Where | Required | Notes |
|---|---|---|---|
| `DATABASE_URL` | backend | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | backend | Yes | Min 32 chars, generate with `openssl rand -base64 48` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | backend | Yes | From Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | backend | Yes | Separate from the API key secret |
| `R2_*` | backend | Yes | Cloudflare R2 (or S3-compatible) credentials |
| `CLIENT_ORIGIN` | backend | Yes | Must exactly match frontend's deployed origin |
| `VITE_API_BASE_URL` | frontend | Yes | Baked in at build time -- rebuild if changed |

---

## Testing Checklist

Manual end-to-end verification checklist (no automated test suite exists yet -- see Known Limitations):

**Auth**
- [ ] Register with a new email -> redirected to home, logged in
- [ ] Register with an existing email -> clear error, no account created
- [ ] Login with correct credentials -> succeeds
- [ ] Login with wrong password -> generic "invalid email or password" (no enumeration)
- [ ] Logout -> session cleared, protected routes redirect to login

**Catalog**
- [ ] Products load with correct images, prices, categories
- [ ] Search filters results
- [ ] Category filter works, combines correctly with search
- [ ] Price range filter works, combines with search + category
- [ ] Sort (newest / price asc / price desc) works
- [ ] Pagination works at page boundaries
- [ ] Empty state shows when no results match

**Product detail / Cart**
- [ ] Product detail loads correct data
- [ ] Add to cart works, cart badge updates
- [ ] Cart persists across page navigation (not across reload -- client-only state)
- [ ] Remove from cart works
- [ ] Wishlist heart toggles correctly (requires login)

**Checkout / Payment**
- [ ] Checkout redirects to login if not authenticated
- [ ] Razorpay Checkout opens with correct amount
- [ ] Coupon code applies discount correctly (percentage and fixed)
- [ ] Invalid/expired/exhausted coupon shows clear error
- [ ] Successful payment -> entitlement granted, redirected to library
- [ ] Failed/cancelled payment -> clear error, no entitlement granted
- [ ] Webhook correctly grants entitlement even if client-side verify is interrupted

**Downloads**
- [ ] Library shows purchased products only
- [ ] Download button generates a working signed URL
- [ ] Download count decrements correctly
- [ ] Download blocked after limit reached, with clear messaging
- [ ] Download blocked after expiry, with clear messaging

**Admin**
- [ ] Non-admin user cannot access /admin/* (client redirect AND server 403)
- [ ] Product CRUD works (create, edit, publish/unpublish, delete)
- [ ] Order list shows all users' orders with correct status
- [ ] Customer list shows correct order counts
- [ ] Coupon CRUD works, including enable/disable
- [ ] Analytics dashboard shows correct revenue/order/customer counts

**Cross-cutting**
- [ ] All forms show validation errors inline
- [ ] All async actions show loading states
- [ ] All list views show empty states when appropriate
- [ ] Mobile viewport (375px) -- no horizontal scroll, all tap targets reachable
- [ ] Keyboard navigation reaches every interactive element with visible focus
- [ ] Screen reader announces toast notifications and form errors

---

## Known Limitations

1. **Prisma client generation could not be verified in the build sandbox** -- `binaries.prisma.sh` was outside the sandbox's allowed network egress. Schema was manually reviewed for syntax correctness and all consuming code was written against the intended generated types, but `npx prisma generate` and `npx prisma migrate dev` must be run in a real environment before the backend will actually start. This is the single largest unverified piece of the entire build.
2. **Automated unit tests exist for backend business logic** (59 tests, Vitest): password hashing/JWT (`auth-service`), Razorpay signature verification (`razorpay-provider`), coupon validation/discount math (`coupon-logic`), download entitlement gating (`download-gate`), and request validation schemas (`product-schemas`). Run with `npm test` in `backend/`. **Not yet covered:** route-level integration tests (would require a live test database — none of the Express route handlers themselves are exercised, only the pure logic they call into) and any frontend tests. This is a partial fix, not a complete one — see the coverage report (`npm run test:coverage`) for the exact gap.
3. **Cart is client-only state**, not persisted server-side. Refreshing the page or switching devices loses cart contents (library/wishlist, which are server-backed, do not have this limitation).
4. **No seed script or admin bootstrap flow.** The first admin must be manually promoted via a direct SQL update.
5. **No automated database backup/restore strategy** is configured -- must be set up at the infrastructure layer before real customer data is stored.
6. **No CI/CD pipeline** is included -- Dockerfiles and Compose are deployment-ready, but no GitHub Actions/GitLab CI config exists yet.
7. **Docker builds were not executed** in this environment (no Docker daemon available in the sandbox). Dockerfiles were written and manually reviewed against the actual project structure, and the underlying `npm run build` steps they invoke were verified independently, but the containerized build itself is unverified end-to-end.
8. **CSP is same-origin + Razorpay only.** If additional third-party scripts are added later, the CSP in `backend/src/app.ts` needs updating or requests will be silently blocked.
9. **No refund UI.** The `PaymentProvider` interface includes `refundPayment()`, but no admin UI or route currently calls it.
10. **No email notifications** (order confirmation, download-ready, etc.) -- no email provider is integrated at MVP.
