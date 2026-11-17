# SETUP.md — CreatorHub Local Setup

Follow these steps in order. Run backend steps from `backend/`, frontend
steps from `frontend/`, unless noted otherwise.

## Prerequisites

- Node.js 22+
- A running PostgreSQL 16+ instance (local install, or `docker run` -- see below)
- A Razorpay account (test mode is fine to start)
- A Cloudflare R2 bucket (or any S3-compatible storage)

Optional: start Postgres via Docker if you don't have it installed locally:
```bash
docker run -d --name creatorhub-postgres \
  -e POSTGRES_USER=creatorhub -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=creatorhub \
  -p 5432:5432 postgres:16-alpine
```

---

## 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 2. Configure .env

```bash
cd backend
cp .env.example .env
# Open .env and fill in: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
# RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
# R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME,
# CLIENT_ORIGIN (defaults to http://localhost:5173)

cd ../frontend
cp .env.example .env
# VITE_API_BASE_URL defaults to http://localhost:4000
```

Generate strong JWT secrets:
```bash
openssl rand -base64 48
```
Run this twice -- use a different value for JWT_ACCESS_SECRET and
JWT_REFRESH_SECRET.

## 3. Run prisma generate

```bash
cd backend
npx prisma generate
```
Reads prisma/schema.prisma and generates the typed Prisma Client into
node_modules/@prisma/client. Requires network access (downloads a
query-engine binary on first run).

## 4. Run database migrations

```bash
npx prisma migrate dev --name init
```
Creates and applies the initial migration against the database in your
DATABASE_URL. Use `npx prisma studio` afterward for a local GUI.

## 5. Start the backend

```bash
npm run dev
```
Starts on http://localhost:4000. Confirm it's up:
```bash
curl http://localhost:4000/health
```

## 6. Start the frontend

In a separate terminal:
```bash
cd frontend
npm run dev
```
Starts on http://localhost:5173.

Create your first admin user: register a normal account through the
UI, then promote it directly in the database:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Razorpay webhook (local dev): Razorpay needs a public URL to send
webhooks to. Use a tunnel:
```bash
ngrok http 4000
# In the Razorpay Dashboard, set the webhook endpoint to:
#   https://<your-ngrok-subdomain>.ngrok.io/api/orders/webhook
# Copy the webhook signing secret into backend/.env as RAZORPAY_WEBHOOK_SECRET
```

## 7. Build for production

```bash
# Backend
cd backend
npm run build
npm run start

# Frontend
cd frontend
npm run build
npm run preview
```

For containerized deployment instead, see README.md -> "Production
Deployment (Docker Compose)".

---

## Troubleshooting

- PrismaClient type errors in your editor -> you haven't run step 3
  yet, or your editor's TS server needs a restart after running it.
- CORS errors in the browser console -> CLIENT_ORIGIN in backend/.env
  must exactly match the frontend's origin.
- Cookies not being set / login doesn't persist -> confirm both
  frontend and backend are running on the same hostname (localhost vs
  127.0.0.1 can be treated as different origins).
- Razorpay Checkout doesn't open -> check the browser console; the
  checkout.razorpay.com script may be blocked by an ad blocker or a
  modified CSP in backend/src/app.ts.
