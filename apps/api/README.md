# @schoolbridge/api

NestJS backend for the SchoolBridge parent-teacher communication platform.

## Prerequisites

- Node 22, pnpm 9+
- Docker (for Postgres, Redis, MinIO via docker-compose at repo root)

## Setup

```bash
# 1. Copy and fill environment variables
cp .env.example .env

# 2. Install dependencies (from repo root)
pnpm install

# 3. Generate Prisma client
pnpm --filter @schoolbridge/api prisma:generate

# 4. Run migrations (requires running Postgres)
pnpm --filter @schoolbridge/api prisma:migrate

# 5. Seed demo data
pnpm --filter @schoolbridge/api prisma:seed
```

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start in watch mode (port 4000) |
| `pnpm build` | Compile TypeScript to dist/ |
| `pnpm start` | Run compiled output |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm clean` | Delete dist/ |
| `pnpm prisma:generate` | Re-generate Prisma client |
| `pnpm prisma:migrate` | Create and apply a new migration |
| `pnpm prisma:deploy` | Apply pending migrations (CI/prod) |
| `pnpm prisma:seed` | Seed demo data |
| `pnpm prisma:studio` | Open Prisma Studio |

## API Docs

Swagger UI is available at `http://localhost:4000/docs` when the server is running.

## Demo Credentials (after seed)

All seeded accounts use password `Password123!`.

| Role | Phone |
|---|---|
| Super Admin | 08000000001 |
| School Admin | 08000000002 |
| Teacher (Class Teacher) | 08000000003 |
| Parent (Alice) | 08000000004 |
| Parent (Bob) | 08000000005 |

Pass `x-school-id: <schoolId>` header on all tenant-scoped endpoints.
Obtain the school ID from the seed output or `GET /schools` (SUPER_ADMIN only).

## Architecture Notes

- Multi-tenant: each school is a tenant. All data is scoped by `schoolId`.
- `TenantGuard` resolves and validates the school from the `x-school-id` header.
- `RolesGuard` enforces per-school role membership. `SUPER_ADMIN` bypasses all role checks.
- JWT access tokens expire in `JWT_ACCESS_TTL` (default 15m). Rotate with `POST /auth/refresh`.
- OTP SMS delivery is stubbed — the code is logged to stdout in development. Wire up Termii in `NotificationsProcessor`.
- Message fan-out uses a BullMQ queue backed by Redis. The `NotificationsProcessor` worker handles delivery.
- Real-time events are pushed via socket.io at `ws://localhost:4000/realtime`. Authenticate with `{ auth: { token } }` in the socket handshake.
