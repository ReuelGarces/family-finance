---
last_mapped_commit: e71d371f0b1a0bb7717760e1980d0ce50cf0072c
last_mapped_at: 2026-10-23
---
# Codebase Structure

**Analysis Date:** 2026-10-23

## Directory Layout

```text
family-finance/
├── src/app/                 # Next.js App Router pages, layouts, APIs
├── src/components/          # Reusable auth and dashboard UI
├── src/lib/auth/             # Auth schemas and server guards
├── src/lib/finance/          # Finance domain types, policies, services
├── prisma/                   # Schema, migrations, seed
├── tests/                    # Node test runner suites
├── docs/                     # Financial domain rules
├── scripts/                  # Container startup scripts
├── public/                   # Static assets
├── Dockerfile                # Standalone multi-stage image
├── docker-compose.yml        # Local PostgreSQL and app orchestration
└── package.json              # Scripts and dependencies
```

## Directory Purposes

**`src/app`:** App Router entry points. Route groups `src/app/(auth)` and `src/app/(dashboard)` organize login and protected shell without changing URLs. API routes live under `src/app/api`.

**`src/components`:** UI components grouped by feature: `src/components/auth` and `src/components/dashboard`.

**`src/lib/finance`:** Domain boundary. Put cross-cutting finance primitives at its root and persistence-backed use cases in `src/lib/finance/services`.

**`prisma`:** Database contract and operational setup: `prisma/schema.prisma`, `prisma/migrations`, and `prisma/seed.ts`.

**`tests`:** Top-level Node test files covering money, authorization, PostgreSQL persistence, and finance behavior.

**`docs`:** Human-readable domain policy, including `docs/financial-domain.md`.

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: session-based root redirect.
- `src/app/layout.tsx`: root HTML metadata and global CSS.
- `src/app/(dashboard)/layout.tsx`: protected dashboard shell.
- `src/app/api/health/route.ts`: database health endpoint.
- `src/auth.ts`: Auth.js configuration and credentials provider.

**Configuration:**
- `package.json`: scripts, runtime engine, dependencies.
- `tsconfig.json`: strict TypeScript and `@/*` alias.
- `next.config.ts`: standalone Next.js output.
- `prisma.config.ts`: Prisma configuration.
- `docker-compose.yml`, `Dockerfile`, `scripts/start.sh`: deployment/runtime orchestration.
- `.env.example`: documented environment variable shape; private `.env` may exist but is not read.

**Core Logic:**
- `src/lib/finance/services/accounts.ts`: account lifecycle.
- `src/lib/finance/services/categories.ts`: category lifecycle.
- `src/lib/finance/services/transactions.ts`: transaction commands and queries.
- `src/lib/finance/services/transfers.ts`: transfer commands and queries.
- `src/lib/finance/validation.ts`: input and date validation.
- `src/lib/finance/authorization.ts`: actor policy.
- `src/lib/prisma.ts`: database client singleton.

**Testing:**
- `tests/finance-money.test.ts`: money rules.
- `tests/finance-authorization.test.ts`: role and ownership policy.
- `tests/finance-postgres.test.ts`: PostgreSQL persistence integration coverage.

## Naming Conventions

**Files:** Lowercase kebab-case for UI modules such as `login-form.tsx` and `dashboard-header.tsx`; domain modules use lowercase names such as `transactions.ts`.

**Directories:** Lowercase feature directories; Next.js route groups use parentheses, for example `src/app/(dashboard)`.

**Exports:** Named exports are standard for services, helpers, and components; `src/lib/finance/index.ts` and `src/lib/finance/services/index.ts` provide selective barrels.

## Where to Add New Code

**New Feature:** Add the route under `src/app`, UI under the matching `src/components/<feature>`, and business operations under `src/lib/finance/services` or another focused `src/lib` module. Add schema changes in `prisma/schema.prisma` and a migration.

**New Component/Module:** Keep route-specific UI close to its feature directory; use `src/components` for reusable UI and `src/lib` for server/domain code.

**Utilities:** Add shared formatting or pure helpers to `src/lib` (for example `src/lib/format.ts`); keep finance-specific helpers inside `src/lib/finance`.

**Tests:** Add a focused file under `tests` named `*.test.ts`, matching the existing Node test command in `package.json`.

## Special Directories

**`src/generated/prisma`:** Generated Prisma client output. Generated, not hand-authored; regenerate with `npm run db:generate` and do not edit directly.

**`prisma/migrations`:** Versioned SQL migrations committed to the repository. Add migrations through Prisma tooling.

**`node_modules` and `.next`:** Generated dependency/build directories. Do not place application source there; they are excluded from this map.

---

*Structure analysis: 2026-10-23*
