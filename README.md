# SchoolBridge

A modern mobile platform that replaces the traditional paper parent–teacher communication
booklet used in Nigerian schools. Teachers post notes, homework, attendance, behaviour and
results; parents get instant notifications, acknowledge and reply; admins broadcast and
track engagement — all in one low-bandwidth, offline-friendly app.

See [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) for the full architecture and roadmap.

## Monorepo layout

| Path | Stack | Purpose |
|------|-------|---------|
| `apps/api` | NestJS · Prisma · PostgreSQL · Redis/BullMQ | REST + WebSocket backend |
| `apps/web` | Next.js 14 (App Router) | Landing page + admin back-office |
| `apps/mobile` | React Native (Expo) | Parent & teacher app |
| `packages/types` | TypeScript · Zod | Shared API contracts/DTOs |
| `packages/config` | — | Shared tsconfig/eslint |

## Prerequisites

- Node 22 (`.nvmrc`), pnpm 11, Docker.

## Quick start

```bash
pnpm install
docker compose up -d                                   # Postgres + Redis + MinIO

cp apps/api/.env.example apps/api/.env
pnpm --filter @schoolbridge/api prisma:generate
pnpm --filter @schoolbridge/api prisma:migrate
pnpm --filter @schoolbridge/api prisma:seed            # demo school + users

pnpm dev                                               # runs api + web + mobile via turbo
```

| App | URL / command |
|-----|---------------|
| API | http://localhost:4000 (Swagger at `/docs`) |
| Web | http://localhost:3000 |
| Mobile | Expo dev server — press `i`/`a`, or scan the QR in Expo Go |

## Per-app commands

```bash
pnpm --filter @schoolbridge/api dev
pnpm --filter @schoolbridge/web dev
pnpm --filter @schoolbridge/mobile dev
```

## Tooling

```bash
pnpm lint        # all workspaces
pnpm typecheck
pnpm test
pnpm build
```

CI (GitHub Actions) runs install → prisma generate → lint → typecheck → test → build on every PR.
