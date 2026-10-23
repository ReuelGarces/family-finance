---
last_mapped_commit: e71d371f0b1a0bb7717760e1980d0ce50cf0072c
last_mapped_at: 2026-10-23
---
<!-- refreshed: 2026-10-23 -->

# Architecture

**Analysis Date:** 2026-10-23

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│ Next.js App Router (`src/app`)                              │
│ pages, route handlers, layouts, redirects                   │
└───────────────┬───────────────────────┬─────────────────────┘
                │                       │
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│ UI components             │  │ Auth and finance services     │
│ `src/components`          │  │ `src/lib/auth`, `src/lib/finance` │
└───────────────┬──────────┘  └──────────────┬───────────────┘
                │                            │
                └──────────────┬─────────────┘
                               ▼
                 ┌──────────────────────────┐
                 │ Prisma + PostgreSQL       │
                 │ `src/lib/prisma.ts`       │
                 │ `prisma/schema.prisma`    │
                 └──────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App Router | Public pages, authenticated dashboard layouts, API handlers | `src/app` |
| Authentication | Auth.js credentials provider, JWT session callbacks | `src/auth.ts` |
| Auth guards | Resolve active users and enforce ADMIN/FAMILY access | `src/lib/auth/guards.ts` |
| Finance domain | Validation, policy checks, money conversion, auditing, service operations | `src/lib/finance` |
| Persistence | Singleton Prisma client using PostgreSQL adapter | `src/lib/prisma.ts` |
| Presentation | Login and dashboard components, charts and sample overview data | `src/components` |
| Database model | Users, audit logs, accounts, categories, transactions, transfers | `prisma/schema.prisma` |

## Pattern Overview

**Overall:** Server-first Next.js application with domain services over Prisma.

**Key Characteristics:**
- Server components and route handlers call authentication and persistence directly.
- Finance mutations are service functions that validate input, authorize the actor, execute a Prisma transaction, and append an audit record.
- PostgreSQL schema and migrations are the source of persistence structure; decimal values remain Prisma `Decimal` until formatted.

## Layers

**Presentation and routing:**
- Purpose: Render login/dashboard pages and expose health/Auth.js endpoints.
- Location: `src/app`, `src/components`
- Contains: App Router pages, layouts, route handlers, client UI components.
- Depends on: Auth guards, dashboard data, formatting helpers.
- Used by: Browser requests to the Next.js server.

**Authentication and authorization:**
- Purpose: Authenticate credentials and enforce active-user and role policies.
- Location: `src/auth.ts`, `src/lib/auth`, `src/lib/finance/authorization.ts`
- Contains: Credentials parsing, bcrypt checks, JWT enrichment, redirects, finance actor policy functions.
- Depends on: Prisma and Auth.js.
- Used by: Dashboard layout and finance services.

**Finance domain services:**
- Purpose: Own financial commands and queries with validation, reference checks, cancellation rules, and audit events.
- Location: `src/lib/finance/services`
- Contains: Account/category management, transaction/transfer operations, read queries, reference validation.
- Depends on: `src/lib/finance/validation.ts`, `src/lib/finance/authorization.ts`, `src/lib/finance/audit.ts`, Prisma.
- Used by: Future server actions/API/UI callers; current dashboard remains demonstrative.

**Persistence:**
- Purpose: Provide the generated Prisma client and relational schema.
- Location: `src/lib/prisma.ts`, `prisma/schema.prisma`, `prisma/migrations`
- Contains: PostgreSQL adapter setup, models, indexes, migration history, seed.
- Depends on: `DATABASE_URL` and PostgreSQL.
- Used by: Auth, health endpoint, finance services, seed.

## Data Flow

### Primary Request Path

1. The root page resolves a session and redirects (`src/app/page.tsx`).
2. Dashboard layout calls `requireUser`, which uses Auth.js then loads the active user (`src/app/(dashboard)/layout.tsx`, `src/lib/auth/guards.ts`).
3. A finance service validates input and policy, runs Prisma work in `$transaction`, and records audit metadata (`src/lib/finance/services/transactions.ts`, `src/lib/finance/audit.ts`).
4. Prisma persists to PostgreSQL through the adapter (`src/lib/prisma.ts`).

### Health Check Flow

1. `GET /api/health` invokes `prisma.$queryRaw` (`src/app/api/health/route.ts`).
2. It returns `{ status: "ok" }` on connectivity or HTTP 503 with `unavailable` on failure.

**State Management:** Auth.js uses an eight-hour JWT session; durable finance state is PostgreSQL. Dashboard overview currently consumes demonstrative data in `src/components/dashboard/overview-data.ts`.

## Key Abstractions

**Finance service functions:**
- Purpose: Encapsulate command/query workflows and transaction boundaries.
- Examples: `src/lib/finance/services/accounts.ts`, `src/lib/finance/services/transactions.ts`, `src/lib/finance/services/transfers.ts`.
- Pattern: Require user/admin, parse Zod input, authorize, persist atomically, audit.

**Finance actor policy:**
- Purpose: Represent the authenticated user for domain authorization.
- Examples: `src/lib/finance/types.ts`, `src/lib/finance/authorization.ts`.
- Pattern: Convert Auth user to `{ id, role }` and apply explicit policy assertions.

## Entry Points

**Web application:** `src/app/layout.tsx` and route pages under `src/app`.

**Authentication:** `src/app/api/auth/[...nextauth]/route.ts` exports Auth.js handlers from `src/auth.ts`.

**Container startup:** `scripts/start.sh` applies migrations/seeding before starting Next.js.

## Architectural Constraints

- **Runtime:** Next.js server code uses Node.js; finance service modules explicitly import `server-only`.
- **Global state:** `src/lib/prisma.ts` caches Prisma in `globalThis` outside production to avoid development connection churn.
- **Data integrity:** Financial references use restrictive deletes and service-level reference validation; mutations and audits share a Prisma transaction.
- **Module boundaries:** `@/*` resolves to `src/*`; generated Prisma output is under `src/generated/prisma` and excluded from normal source mapping.

## Anti-Patterns

### Bypassing finance services

**What happens:** Direct writes can skip authorization, reference checks, and audit entries.
**Why it's wrong:** Domain mutations require all three controls to preserve financial integrity.
**Do this instead:** Add operations in `src/lib/finance/services` and use the shared validators and `recordAudit`.

### Treating dashboard sample values as persistence

**What happens:** UI overview data is static/demo data in `src/components/dashboard/overview-data.ts`.
**Why it's wrong:** README states the dashboard is demonstrative and contains no real family records.
**Do this instead:** Introduce a server query through `src/lib/finance/services/queries.ts` before displaying persisted values.

## Error Handling

**Strategy:** Zod parsing and explicit domain errors handle expected failures; Next.js redirects handle authentication failures; health endpoint converts database failures to 503.

**Patterns:**
- `FinanceNotFoundError` and `FinanceConflictError` are thrown by service operations (`src/lib/finance/errors.ts`).
- Prisma mutations are wrapped in `$transaction` with audit writes.
- Auth failures return `null` from credentials authorization and redirect through guards.

## Cross-Cutting Concerns

**Logging:** No dedicated logger detected; errors are generally translated into return/throw behavior.
**Validation:** Zod schemas in `src/lib/auth/schema.ts` and `src/lib/finance/validation.ts`.
**Authentication:** Auth.js credentials, bcrypt password verification, JWT sessions, server guards.

---

*Architecture analysis: 2026-10-23*
