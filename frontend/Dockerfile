# ============================================================
# CreatorHub Frontend — Production Dockerfile
# ============================================================
# Multi-stage: build the Vite SPA, then serve the static output
# through Nginx. Build context for this Dockerfile is expected to be
# the repository root (see docker-compose.yml), so nginx/nginx.conf
# can be referenced relative to the root, not this file's directory.

# ---- Stage 1: Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .

# Vite reads VITE_API_BASE_URL at build time and bakes it into the
# bundle — must be provided as a build arg for the correct backend
# URL to be compiled in for this environment.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:1.27-alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
