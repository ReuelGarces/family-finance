---
last_mapped_commit: e71d371f0b1a0bb7717760e1980d0ce50cf0072c
last_mapped_at: 2026-10-23
---
# External Integrations

**Analysis Date:** 2026-10-23

## APIs & External Services

**Authentication:**
- Auth.js / NextAuth Credentials provider - email/password login, JWT sessions, and sign-in route at `src/app/api/auth/[...nextauth]/route.ts`
  - SDK/Client: `next-auth` and `next-auth/providers/credentials` in `src/auth.ts`
  - Auth: `AUTH_SECRET`; `AUTH_URL` is supplied for deployment configuration

**Hosting:**
- Coolify - documented deployment target for the Docker image/Compose stack in `README.md`
  - SDK/Client: Docker runtime; no provider SDK
  - Auth: deployment environment variables

## Data Storage

**Databases:**
- PostgreSQL 17 - primary relational store for users, audit logs, accounts, categories, transactions, and transfers
  - Connection: `DATABASE_URL`; `COMPOSE_DATABASE_URL` can override the injected URL in `scripts/start.sh`
  - Client: Prisma 7 with `@prisma/adapter-pg` and `pg`, configured by `prisma.config.ts` and `src/lib/prisma.ts`

**File Storage:**
- Local filesystem only for application assets under `public/`; PostgreSQL data persists in the `family_finance_pgdata` Docker volume from `docker-compose.yml`.

**Caching:**
- None detected. Development reuses a module-global Prisma client in `src/lib/prisma.ts`; this is connection reuse, not a data cache.

## Authentication & Identity

**Auth Provider:**
- Custom credentials backed by the local `User` table in `prisma/schema.prisma`.
  - Implementation: `src/auth.ts` validates credentials with Zod, loads users through Prisma, verifies bcrypt hashes, applies five-failure lockout, and issues JWT-backed sessions capped at eight hours.
  - Initial accounts are created idempotently by `prisma/seed.ts` from `INITIAL_ADMIN_*` and `INITIAL_FAMILY_*` variables.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- Container and seed lifecycle messages use `console.info`/`console.error` in `prisma/seed.ts` and `scripts/start.sh`.
- Liveness is exposed through `GET /api/health` in `src/app/api/health/route.ts`, which executes `SELECT 1` against PostgreSQL and returns HTTP 503 on failure.

## CI/CD & Deployment

**Hosting:**
- Coolify or Docker Compose; the production image is built by `Dockerfile` and listens on port 3000.

**CI Pipeline:**
- GitHub Actions workflow `.github/workflows/ci.yml` runs on pushes to `main` and pull requests, starts PostgreSQL 17, generates Prisma Client, deploys migrations, then runs lint, typecheck, tests, and build.

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Prisma/PostgreSQL connection for build and runtime.
- `AUTH_SECRET` - Auth.js signing secret.
- `AUTH_URL` - deployed application URL.
- `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, `INITIAL_ADMIN_NAME` - first ADMIN account inputs.
- `INITIAL_FAMILY_EMAIL`, `INITIAL_FAMILY_PASSWORD`, `INITIAL_FAMILY_NAME` - first FAMILY account inputs.
- Compose additionally requires `POSTGRES_PASSWORD` and `COMPOSE_DATABASE_URL`; defaults are defined in `docker-compose.yml` where applicable.
- Tests use `TEST_DATABASE_URL` in `tests/finance-postgres.test.ts`.

**Secrets location:**
- Private deployment environment or ignored `.env`; `.env.example` is present, while secret file contents are intentionally not inspected.

## Webhooks & Callbacks

**Incoming:**
- Auth.js callback route at `src/app/api/auth/[...nextauth]/route.ts`; no third-party webhooks detected.

**Outgoing:**
- None detected.

---

*Integration audit: 2026-10-23*
