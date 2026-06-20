# SchoolBridge — Development Plan

> A modern mobile application that replaces the traditional paper-based parent–teacher
> communication booklet used in Nigerian schools. SchoolBridge digitises daily messages,
> homework, attendance, results, fees reminders, events and announcements into a single,
> low-bandwidth-friendly platform.

---

## 1. Product Overview

### 1.1 Problem
Nigerian schools rely on a physical "communication booklet" carried by the pupil between
home and school. It is easily lost, damaged, forged or left unread. There is no audit
trail, no read-receipts, no broadcast capability, and parents who cannot physically reach
the school are excluded.

### 1.2 Solution
A mobile-first platform (with web back-office) where:

- **Teachers** post daily notes, homework, behaviour reports, attendance and results.
- **Parents/Guardians** receive notifications, acknowledge messages, reply, and track
  each of their children across subjects and terms.
- **School Admins** broadcast announcements, manage the roster, terms, classes and fees,
  and view engagement analytics.
- **Super Admin (SchoolBridge ops)** onboards schools (multi-tenant) and manages billing.

### 1.3 Design constraints (Nigeria context)
- **Low bandwidth / intermittent connectivity** → offline-first mobile, small payloads,
  image compression, optional SMS fallback for critical alerts.
- **Cost-sensitive** → free for parents; schools pay per-term/seat. Data-light by default.
- **Multi-language ready** → English first, i18n scaffolding for Hausa/Yoruba/Igbo/Pidgin.
- **Local payments** → Paystack/Flutterwave for school subscriptions & (optional) fees.
- **Trust & privacy** → minors' data; strict access control and audit logging.

---

## 2. Personas & Roles

| Role | Platform | Key actions |
|------|----------|-------------|
| Parent / Guardian | Mobile | View children's feed, acknowledge, reply, see homework/results/attendance, pay fees |
| Teacher | Mobile + Web | Post notes/homework/attendance/results to a class or pupil, broadcast to class |
| Class Teacher / Form Master | Mobile + Web | All teacher actions + class roster management |
| School Admin | Web back-office | Manage school, classes, terms, staff, pupils, fees, announcements, analytics |
| Super Admin | Web back-office | Onboard/suspend schools (tenants), plans, billing, platform analytics |

Authorization model: **RBAC scoped by tenant (school)**. A user may hold different roles
across different schools (e.g. teacher at School A, parent at School B).

---

## 3. Architecture

### 3.1 High level

```
                         ┌──────────────────────────┐
   React Native (Expo)   │      NestJS REST API      │
   Parent + Teacher app ─┤   (apps/api)  + WebSocket │
                         │   Auth / RBAC / Tenancy   │
   Next.js Landing +     │   Messaging / Notif / Fees│──── PostgreSQL (Prisma)
   Back-office (web)  ───┤                           │──── Redis (cache, queues, pub/sub)
                         │   BullMQ background jobs   │──── S3-compatible object store
                         └──────────┬────────────────┘      (Cloudflare R2 / AWS S3)
                                    │
                external providers: │ Push (Expo/FCM), SMS (Termii/Africa's Talking),
                                    │ Email (Resend/SES), Payments (Paystack/Flutterwave)
```

### 3.2 Monorepo layout (Turborepo + pnpm)

```
schoolbridge/
├── apps/
│   ├── api/        NestJS backend (REST + WS), Prisma, BullMQ workers
│   ├── web/        Next.js 14 (App Router) — landing page + back-office
│   └── mobile/     React Native (Expo) — parent & teacher app
├── packages/
│   ├── types/      Shared TS types, Zod schemas, API DTO contracts
│   ├── config/     Shared eslint/tsconfig/prettier
│   └── ui/         (web) shared React UI primitives / design tokens
├── docs/           Plan, ADRs, API & data-model docs
├── docker-compose.yml   Postgres + Redis + MinIO for local dev
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 3.3 Why this stack
- **NestJS** — modular DI, guards/interceptors for RBAC + tenancy, first-class WebSocket,
  Swagger, queue integration. Scales cleanly as features grow.
- **Prisma** — type-safe schema, painless migrations, the source of truth for the data model.
- **Next.js (App Router)** — landing (SEO, marketing) and back-office (RSC + dashboards) in one app.
- **Expo (React Native)** — OTA updates, push notifications, fast iteration, single codebase iOS/Android.
- **Turborepo + pnpm** — cached pipelines, shared packages, fast CI.

---

## 4. Data Model (core entities)

Multi-tenant: nearly every row carries a `schoolId`. Soft-deletes via `deletedAt`.

- **School** (tenant): name, slug, address, logo, plan, status, settings.
- **User**: name, phone (primary login in NG), email, passwordHash, locale.
- **Membership**: User ↔ School ↔ Role (a user can belong to many schools).
- **AcademicYear** / **Term**: school-scoped sessions (e.g. 2025/2026, First Term).
- **ClassRoom**: e.g. "JSS 1A", links to a `classTeacher` (Membership).
- **Subject**: per school; assigned to teachers per class.
- **Pupil** (Student): name, DOB, admission no, current class.
- **Guardian link**: Pupil ↔ User (parent) with relationship + permissions.
- **Enrollment**: Pupil ↔ ClassRoom ↔ Term.
- **Message / Post**: the digital booklet entry. Types: NOTE, HOMEWORK, BEHAVIOUR,
  ATTENDANCE, RESULT, ANNOUNCEMENT, FEE_REMINDER, EVENT. Target: pupil | class | school.
- **MessageReceipt**: per recipient delivered/read/acknowledged timestamps + reply thread.
- **Attendance**: pupil, term, date, status (present/absent/late/excused).
- **AssessmentResult**: pupil, subject, term, scores, grade, teacher remark.
- **FeeInvoice / Payment**: term fees, status, provider reference.
- **Subscription / Invoice**: school billing (plan, seats, period).
- **Notification**: fan-out record (push/sms/email channel + status).
- **AuditLog**: actor, action, entity, before/after, ip — for minors'-data compliance.

Full schema lives in `apps/api/prisma/schema.prisma`.

---

## 5. API Surface (representative)

```
POST   /auth/register            POST /auth/login (phone+OTP / password)
POST   /auth/refresh             GET  /me

GET    /schools/:id              (super-admin / admin)
POST   /schools                  onboarding

GET    /pupils?classId=          POST /pupils
GET    /pupils/:id/feed          parent timeline for a child

POST   /messages                 create booklet entry (note/homework/result…)
POST   /messages/:id/ack         parent acknowledge
POST   /messages/:id/replies     threaded reply

POST   /attendance/bulk          class register for the day
GET    /results?pupilId=&termId=
POST   /results

GET    /fees?pupilId=            POST /fees/:id/pay  (Paystack init)
POST   /webhooks/paystack        payment confirmation

GET    /announcements            POST /announcements (broadcast)
WS     /realtime                 live message + receipt + notification stream
```

All endpoints are tenant-scoped via an `x-school-id` header + membership check guard.
DTOs validated with `class-validator`/Zod; contracts shared via `packages/types`.

---

## 6. Cross-cutting Concerns

- **Auth**: phone + OTP (primary for NG) and email/password; JWT access + rotating refresh.
- **Tenancy**: `TenantGuard` resolves school from header/subdomain + checks membership/role.
- **Notifications**: BullMQ fan-out → Expo Push (primary), SMS fallback (Termii) for
  critical (absence/fees), email for digests.
- **Offline-first mobile**: local cache (MMKV/SQLite) + optimistic acks; sync queue on reconnect.
- **Media**: client-side compression → presigned upload to S3/R2.
- **Observability**: pino logs, OpenTelemetry traces, Sentry on all three apps.
- **Security**: Helmet, rate-limit, RBAC, audit log, encrypted PII at rest, OWASP review.
- **i18n**: `i18next` (mobile/web), locale on User; English baseline.

---

## 7. Delivery Phases

### Phase 0 — Foundation (this scaffold)
Monorepo, shared packages, NestJS + Prisma skeleton, Next.js landing+back-office shell,
Expo app shell, docker-compose, CI. **Deliverable: everything boots locally.**

### Phase 1 — Identity & Tenancy (Weeks 1–3)
Auth (phone OTP + password), users, schools onboarding, memberships, RBAC guards,
back-office shell with login. Seed script for a demo school.

### Phase 2 — Roster & Academic Setup (Weeks 3–5)
Academic years/terms, classes, subjects, pupils, guardian linking, enrollments.
Admin CRUD in back-office; CSV bulk import of pupils.

### Phase 3 — The Digital Booklet (Weeks 5–8) — core value
Messages/posts (note, homework, behaviour, event), pupil feed, receipts (delivered/read/
ack), threaded replies, class & school broadcasts. Mobile parent + teacher flows. Realtime + push.

### Phase 4 — Attendance & Results (Weeks 8–10)
Daily class register, attendance analytics, assessment entry, term result sheets, PDF export.

### Phase 5 — Fees & Payments (Weeks 10–12)
Fee invoices, Paystack/Flutterwave integration, payment reminders (push+SMS), receipts.

### Phase 6 — Billing, Analytics & Hardening (Weeks 12–14)
School subscriptions/billing, engagement analytics dashboard, SMS fallback, i18n,
security review, load test, app-store submission.

### Phase 7 — Pilot & Launch
Onboard 1–3 pilot schools, gather feedback, iterate, public launch.

---

## 8. Environments & DevOps

- **Local**: docker-compose (Postgres, Redis, MinIO) + `pnpm dev` (turbo runs all apps).
- **CI** (GitHub Actions): install → lint → typecheck → test → build (cached by Turbo).
- **Staging/Prod API**: containerised NestJS on Fly.io/Render/AWS; managed Postgres
  (Neon/Supabase/RDS); Redis (Upstash); object store (R2/S3).
- **Web**: Vercel (Next.js).
- **Mobile**: EAS Build + EAS Update (OTA); store delivery via EAS Submit.
- **Migrations**: `prisma migrate` gated in CI; run on deploy.

---

## 9. Testing Strategy

- **Unit**: services/guards (Jest) on API; hooks/utils on web & mobile.
- **Integration**: API e2e against ephemeral Postgres (Testcontainers) per PR.
- **Contract**: shared Zod schemas in `packages/types` keep client/server in sync.
- **E2E**: Playwright (back-office), Detox/Maestro (mobile happy paths).
- **Quality gates**: typecheck + lint + tests required to merge.

---

## 10. Getting Started

```bash
pnpm install
docker compose up -d            # Postgres + Redis + MinIO
cp apps/api/.env.example apps/api/.env
pnpm --filter @schoolbridge/api prisma:migrate
pnpm --filter @schoolbridge/api prisma:seed
pnpm dev                        # turbo: api + web + mobile
```

See the root `README.md` for per-app commands.
