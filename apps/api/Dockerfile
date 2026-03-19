# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy ALL workspace manifests (npm ci needs all of them)
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# Copy source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package and point its main to compiled output
RUN cd packages/shared && npx tsc
RUN node -e " \
  const p = require('./packages/shared/package.json'); \
  p.main = './dist/index.js'; \
  p.types = './dist/index.d.ts'; \
  require('fs').writeFileSync('./packages/shared/package.json', JSON.stringify(p, null, 2)); \
"

# Generate Prisma client and build API
RUN cd apps/api && npx prisma generate
RUN cd apps/api && npx tsc

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy ALL workspace manifests so npm ci can process the full workspace graph
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install production deps only
RUN npm ci --omit=dev

# Copy compiled shared (and its updated package.json pointing to dist)
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy compiled API
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy Prisma schema + generated client
COPY apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy prisma CLI for migrations
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

EXPOSE 3001

# Migrate (non-fatal if DB not ready) then start
CMD ["sh", "-c", "cd apps/api && node ../node_modules/.bin/prisma migrate deploy; cd /app && node apps/api/dist/index.js"]
