# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared → dist/index.js (main field already points here)
RUN cd packages/shared && npx tsc

# Generate Prisma client and build API
RUN cd apps/api && npx prisma generate
RUN cd apps/api && npx tsc

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci --omit=dev

# Copy compiled shared
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy compiled API
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy Prisma schema + generated client
COPY apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy prisma CLI for migrations
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

EXPOSE 3001

CMD ["sh", "-c", "cd apps/api && node ../node_modules/.bin/prisma migrate deploy; cd /app && node apps/api/dist/index.js"]
