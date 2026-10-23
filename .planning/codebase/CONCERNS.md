---
last_mapped_commit: e71d371f0b1a0bb7717760e1980d0ce50cf0072c
last_mapped_at: 2026-10-23
---
# Codebase Concerns

**Analysis Date:** 2026-10-23

## Tech Debt

**Demonstration dashboard mixed with production domain services:**
- Issue: The dashboard still renders hard-coded category chart values and the README describes it as a visual preview, while the financial services are database-backed.
- Files: `src/components/dashboard/overview-data.ts`, `src/components/dashboard/overview.tsx`, `README.md`
- Impact: Users can mistake fictional totals for persisted family finances; the UI does not exercise the available transaction and transfer services.
- Fix approach: Replace demonstration data with an explicitly labeled empty state or server query, then add UI flows for the service contracts.

**Duplicated entry mutation logic:**
- Issue: Transaction and transfer services duplicate authorization, lookup, update, cancellation, and audit orchestration.
- Files: `src/lib/finance/services/transactions.ts`, `src/lib/finance/services/transfers.ts`
- Impact: Fixes to cancellation rules or audit semantics can diverge between the two entry types.
- Fix approach: Extract shared posted-entry cancellation and audit helpers while keeping type-specific reference validation explicit.

## Known Bugs

**Repeated cancellation is not rejected:**
- Symptoms: An ADMIN can call `cancelTransaction` or `cancelTransfer` on an already canceled record; the update overwrites cancellation time, actor, and reason and records another cancellation audit.
- Files: `src/lib/finance/services/transactions.ts`, `src/lib/finance/services/transfers.ts`, `src/lib/finance/authorization.ts`
- Trigger: Cancel the same ID twice using an ADMIN actor.
- Workaround: Treat the first cancellation as final at the caller boundary.

## Security Considerations

**Failed-login counter is a read-modify-write sequence:**
- Risk: Concurrent credential attempts can read the same counter and overwrite one another, weakening the five-attempt lockout under parallel requests.
- Files: `src/auth.ts`, `prisma/schema.prisma`
- Current mitigation: Failed attempts and a 15-minute `lockedUntil` are persisted; inactive and locked users are rejected.
- Recommendations: Use an atomic conditional update or serializable transaction, and test concurrent failures and lock expiry.

**JWT claims can outlive role changes:**
- Risk: The eight-hour JWT contains the role at sign-in. A role change is not reflected until token renewal, increasing the window for stale claims in any future route that trusts the token directly.
- Files: `src/auth.ts`, `src/lib/auth/guards.ts`
- Current mitigation: `requireUser` reloads active status and `requireAdmin` checks the database role.
- Recommendations: Keep database-backed authorization at every privileged boundary and add an explicit role-revocation test.

**Host trust and deployment configuration rely on operator discipline:**
- Risk: `trustHost: true` accepts host-derived Auth.js behavior; an incorrect `AUTH_URL` or proxy configuration can produce unsafe callback or cookie behavior.
- Files: `src/auth.ts`, `docker-compose.yml`, `.env.example`, `README.md`
- Current mitigation: Production configuration documents `AUTH_URL` and keeps the Compose app bound to localhost by default.
- Recommendations: Validate production URL and proxy assumptions at startup and document the required trusted-host setup for Coolify.

## Performance Bottlenecks

**Consolidated summary materializes and filters all history in memory:**
- Problem: `getConsolidatedSummary` loads every account, posted transaction, and posted transfer through the requested date, then repeatedly filters arrays per account.
- Files: `src/lib/finance/services/queries.ts`
- Cause: Aggregation is performed in application code rather than grouped SQL queries; work grows with account count times transaction history.
- Improvement path: Aggregate by account in PostgreSQL with bounded date predicates, or introduce a summary query/read model.

**List endpoints have no pagination or result cap:**
- Problem: `listTransactions` and `listTransfers` return every matching row and include related account and author records.
- Files: `src/lib/finance/services/transactions.ts`, `src/lib/finance/services/transfers.ts`, `prisma/schema.prisma`
- Cause: Query inputs contain filters but no limit/cursor contract.
- Improvement path: Add cursor pagination, stable maximum page size, and narrow select projections for UI lists.

## Fragile Areas

**Date-only accounting boundaries:**
- Files: `src/lib/finance/validation.ts`, `src/lib/finance/services/queries.ts`, `prisma/schema.prisma`
- Why fragile: PostgreSQL `Date` values are represented as JavaScript `Date`; comparisons use timestamps and local/UTC parsing assumptions. A timezone change can move a reference or occurred date across a boundary.
- Safe modification: Keep all date-only parsing centralized in `parseDateOnly`, use a documented UTC convention, and add boundary tests around reference date and `asOf`.
- Test coverage: `tests/finance-money.test.ts` covers money rules but no date boundary; service query behavior is not directly tested.

**Audit metadata is an unconstrained JSON contract:**
- Files: `src/lib/finance/audit.ts`, `src/lib/finance/services/transactions.ts`, `src/lib/finance/services/transfers.ts`, `prisma/schema.prisma`
- Why fragile: Action and entity strings are free-form and metadata shape is inferred by callers, so audit consumers can silently break when fields change.
- Safe modification: Define action/entity unions and versioned metadata types before adding new events.
- Test coverage: No audit-specific assertions verify all mutation paths or metadata schema.

## Scaling Limits

**Single PostgreSQL instance and in-process calculations:**
- Current capacity: One Compose PostgreSQL service with a persistent named volume; no read replica or queue is configured.
- Limit: Database failure and large historical datasets directly affect login, health, and dashboard request latency.
- Scaling path: Establish tested backups/restores, move expensive summaries to database aggregates or a read model, and add operational monitoring before increasing traffic.

## Dependencies at Risk

**NextAuth beta:**
- Risk: Authentication uses `next-auth` `5.0.0-beta.32`, so API and security behavior may change between beta releases.
- Impact: Login, callbacks, session handling, and deployment behavior are security-sensitive and currently have no integration coverage.
- Migration plan: Pin and periodically review the supported Auth.js release, then run route/session regression tests before upgrades.

## Missing Critical Features

**No operational backup verification or observability:**
- Problem: Deployment documentation requests scheduled backups and restore tests, but the repository provides no backup job, restore check, metrics, or error tracking integration.
- Blocks: Reliable recovery and diagnosis of production financial-data incidents.

## Test Coverage Gaps

**Authentication and route protection:**
- What's not tested: Credential validation, lockout behavior, session claims, inactive users, redirects, and health endpoint failure behavior.
- Files: `src/auth.ts`, `src/lib/auth/guards.ts`, `src/app/api/health/route.ts`
- Risk: Security regressions can pass lint and typecheck unnoticed.
- Priority: High

**Finance service orchestration:**
- What's not tested: `createTransaction`, update/cancel flows, reference validation, audit records, transfer authorization, and query date filters.
- Files: `src/lib/finance/services/transactions.ts`, `src/lib/finance/services/transfers.ts`, `src/lib/finance/services/queries.ts`, `src/lib/finance/services/references.ts`
- Risk: Domain rules can be correct in isolated helpers while integration behavior is wrong.
- Priority: High

**Database test can silently skip:**
- What's not tested: PostgreSQL persistence when `TEST_DATABASE_URL` is absent; the test is marked skipped rather than failing setup.
- Files: `tests/finance-postgres.test.ts`, `.github/workflows/ci.yml`
- Risk: Local runs can report success with no database assertions, and the test does not cover service-level authorization or audit transactions.
- Priority: Medium

**UI and seed/deployment paths:**
- What's not tested: Login form behavior, dashboard rendering, seed idempotency, startup migration failures, and container health behavior.
- Files: `src/components/auth/login-form.tsx`, `src/components/dashboard/overview.tsx`, `prisma/seed.ts`, `scripts/start.sh`, `docker-compose.yml`
- Risk: Production-only failures remain undiscovered until deployment.
- Priority: Medium

---

*Concerns audit: 2026-10-23*
