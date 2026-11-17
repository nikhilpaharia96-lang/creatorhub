# ============================================================
# CreatorHub Backend — Production Dockerfile
# ============================================================
# Multi-stage build: install deps + generate Prisma client + compile
# TypeScript in a build stage, then copy only the compiled output and
# production dependencies into a slim runtime image.

# ---- Stage 1: Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Stage 2: Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma client generation requires network access to fetch the query
# engine binary at build time — this step must succeed in the CI/build
# environment (unlike this sandbox, which has restricted egress).
RUN npx prisma generate
RUN npm run build

# ---- Stage 3: Production runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S creatorhub -u 1001

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

USER creatorhub

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/server.js"]
