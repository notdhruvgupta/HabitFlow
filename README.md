# HabitFlow

A full-stack habit tracking application built with React, Node.js, and TypeScript.

## Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite, TypeScript, Tailwind    |
| State     | Zustand (auth), React Query (server)    |
| Backend   | Node.js, Express, TypeScript            |
| Database  | PostgreSQL via Prisma ORM               |
| Cache     | Redis (streaks, sessions)               |
| Validation| Zod (shared schemas, end-to-end typed)  |

## Project structure

```
habitflow/
├── apps/
│   ├── api/                  Express API
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── lib/          prisma, redis, jwt
│   │       ├── middleware/   auth, validate
│   │       ├── routes/       auth, habits, logs, analytics, ...
│   │       ├── services/     streak.service
│   │       └── index.ts      Express entry point
│   └── web/                  React SPA
│       └── src/
│           ├── components/   layout, habits, ui
│           ├── hooks/        React Query hooks
│           ├── pages/        Dashboard, Habits, Analytics, Settings
│           ├── store/        Zustand auth store
│           └── lib/          Axios client
└── packages/
    └── shared/               Types + Zod schemas (used by both apps)
```

## Quick start

### 1. Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis)

### 2. Start infrastructure

```bash
docker compose up -d
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — the defaults work with docker-compose as-is
```

### 5. Run database migrations

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

### 6. Start both apps

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API:      http://localhost:3001
- Prisma Studio: `cd apps/api && npx prisma studio`

## API overview

| Method | Path                        | Description                  |
|--------|-----------------------------|------------------------------|
| POST   | /api/auth/register          | Create account               |
| POST   | /api/auth/login             | Login, receive tokens        |
| POST   | /api/auth/refresh           | Rotate access token          |
| GET    | /api/habits                 | List habits (with streaks)   |
| POST   | /api/habits                 | Create habit                 |
| POST   | /api/habits/:id/logs        | Log completion + recalc streak|
| GET    | /api/analytics/overview     | Dashboard stats              |
| GET    | /api/analytics/heatmap      | Year-view completion grid    |

See `apps/api/src/routes/` for full route documentation.

## Key architectural decisions

**Optimistic UI** — Checking off a habit flips the checkbox immediately via React Query's `onMutate`, then reconciles with the server response. Users never wait for a network round-trip.

**Streak engine** — Streaks are never computed on-the-fly from raw logs. `streak.service.ts` recalculates and persists the streak record whenever a log changes. Redis caches the current/longest values for sub-millisecond dashboard reads.

**Shared types** — `packages/shared` exports Zod schemas and TypeScript types used by both the API and the frontend. The API validates request bodies with the same schemas the frontend uses for form validation — zero drift.

**JWT + refresh rotation** — Access tokens expire in 15 minutes. The Axios interceptor silently obtains a new one using the 30-day refresh token, queuing any concurrent requests that arrive during the refresh.
