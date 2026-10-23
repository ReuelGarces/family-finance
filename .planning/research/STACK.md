# Technology Stack

**Project:** Family Finance MVP
**Researched:** 2026-10-23
**Confidence:** MEDIUM — repository facts are directly verified; the incremental implementation guidance was checked against current official Next.js, Prisma, and MDN documentation. The research-cache write was unavailable in this sandbox.

## Decision

**Add no third-party dependency for the operational MVP.** The repository already has every technology needed for persisted accounts, entries, transfers, history, dashboard summaries, mobile-first forms, and daily reconciliation: Next.js App Router, React, TypeScript, Zod, Prisma, PostgreSQL, and `Intl`.

The missing work is domain wiring and a narrow Prisma schema migration: operational routes/actions and screens must call the existing finance services; the service layer needs purpose-built history, dashboard, and reconciliation queries; reconciliation needs durable models and audit events. Retaining these boundaries avoids duplicating validation, authorization, money arithmetic, and transaction handling that already exist.

## Current Verified Baseline

| Technology | Pinned repository version | Existing role | MVP decision |
|------------|---------------------------|---------------|--------------|
| Next.js App Router | 16.4.2 | Server-first pages, layouts, routes | Retain; use Server Actions for finance forms and server components for reads. |
| React / React DOM | 19.3.1 | Interactive dashboard components and forms | Retain; use built-in form pending/error state only where interaction needs it. |
| TypeScript | 5.9.0 | Strict domain and UI types | Retain. Keep financial amounts as domain strings/`Prisma.Decimal`, never JavaScript numbers for calculation. |
| Zod | 4.6.7 | Credential and finance input parsing | Retain as the authoritative server-side boundary for `FormData` inputs. |
| Prisma + PostgreSQL adapter | 7.10.1 | Schema, migrations, typed data access | Retain; add a migration and service methods for reconciliation and future household scoping. |
| PostgreSQL | 17 (deployment) | Durable financial and audit persistence | Retain; existing date/status indexes cover the first household MVP. |
| `Intl.NumberFormat` | Built into Node/browser runtime | Current currency presentation | Retain; parameterize the existing hard-coded locale and currency after product confirmation. |

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js App Router Server Actions | Existing Next.js 16.4.2 | Submit account, transaction, transfer, cancellation, and reconciliation forms | Native HTML forms can invoke server functions, preserve progressive enhancement, and let each action authenticate then delegate to the existing service layer. No REST client or form library is required. |
| React built-ins (`useActionState`, `useFormStatus`) | Existing React 19.3.1 | Pending state, field feedback, duplicate-submit prevention | They cover the small amount of client interaction needed for mobile forms without introducing a second validation or state model. |
| Existing finance services + Zod | Existing code / Zod 4.6.7 | Single domain boundary for mutations | Server Actions must convert `FormData` to plain inputs and call the relevant service. They must not write through Prisma directly; current services already validate, authorize, transact, and audit. |

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Prisma schema + migration | Existing Prisma 7.10.1 | Add reconciliation persistence and any confirmed scope fields | The MVP needs a durable record of each reported balance, calculated balance, variance, workflow status, actor, timestamps, resolution, and its related corrective event. This is a schema extension, not a database product change. |
| Prisma interactive transaction (`prisma.$transaction`) | Existing Prisma 7.10.1 | Atomically record a reconciliation event, optional explicit correction, and `AuditLog` entry | Transfers already demonstrate the required transaction-and-audit pattern. Reconciliation must use the transaction client for all related writes so an audit receipt cannot exist without its domain record. |
| PostgreSQL `DECIMAL(14,2)` + `Prisma.Decimal` | Existing schema/runtime | Exact monetary persistence and balance calculation | This preserves the established financial precision contract. Do not introduce float columns, chart-oriented numeric conversions, or a money package. |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Existing Docker/Coolify deployment and PostgreSQL 17 service | Existing repository configuration | Production deployment | The MVP has no need for a queue, cache, separate API service, search service, PWA runtime, or external reconciliation provider. |
| Existing Node test runner with `tsx` | Existing repository configuration | Financial-rule and service tests | Add targeted tests for reconciliation, unified history ordering/filtering, dashboard totals, and cache invalidation boundaries. A new test framework provides no MVP value. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | Existing 4.6.7 | Parse raw form data | At every Server Action boundary before calling a service; retain the domain schemas as the source of validation rules. |
| `recharts` | Existing 3.10.1 | Display dashboard charts | Feed it presentation-safe values derived from server queries only. It may receive `number` values for rendering after financial totals have been calculated exactly by the domain. |
| `Intl.NumberFormat` | Runtime API | Locale/currency display | Instantiate from an explicit configured locale and ISO 4217 currency. Keep canonical persisted amounts currency-neutral decimal strings in this single-currency MVP. |
| No new package | — | Forms, queries, reconciliation | Use this as the default recommendation: the current packages are sufficient. |

## Incremental Implementation Choices

### 1. Server Actions are the UI-to-domain adapter

Create thin feature-local action modules marked `"use server"`. Each action should:

1. read only expected values from `FormData`;
2. pass them to the existing Zod-backed finance service;
3. translate known domain errors into safe, field-appropriate feedback;
4. call `revalidatePath` for the changed dashboard/history/account views only after a committed mutation.

Authentication and authorization stay in the finance services even though the dashboard layout already requires a session. Next.js documents Server Actions as directly reachable `POST` endpoints, so UI gating is not an authorization boundary.

Use normal post-commit refresh for money-changing operations. Do not use optimistic balance, transfer, or reconciliation updates: the value shown to the family must come from the committed, audited result.

### 2. Add a read-model service, not a client cache or another ORM

The repository already has separate transaction and transfer list functions and balance/summary calculation. Add service-level queries that produce:

- a merged chronological history stream with an explicit kind (`TRANSACTION` or `TRANSFER`), stable date/creation ordering, and account/date/category/type/status filters;
- a dashboard projection with per-account balance, consolidated balance, and monthly income/expense totals from only `POSTED` records;
- a reconciliation projection that joins each account/date with its observed balance, calculated balance, variance, status, and audit metadata.

For the one-household MVP, use existing PostgreSQL indexes and date-bounded Prisma queries. Do not add Redis, TanStack Query, a reporting warehouse, or a materialized-balance table. Add cursor pagination only when the history view has measured evidence that it needs it.

### 3. Model reconciliation as evidence, never as a silent balance rewrite

Add a Prisma model such as `DailyReconciliation` plus an explicit state enum. It should retain the account, reconciliation date, observed balance, calculated balance, variance, status, creator/resolver, timestamps, notes, and a reference to any approved corrective financial event.

The service must calculate the expected balance from posted transactions and transfers, persist the comparison and `AuditLog` entry in one database transaction, and require an authorized explicit correction when the variance is resolved. Do not overwrite `FinancialAccount.initialBalance`, mutate an earlier entry without its normal audit trail, or store a calculated balance as a new source of truth.

The exact correction representation needs a product decision before schema work: a reconciliation adjustment cannot reuse ordinary income/expense semantics if it would inflate the monthly income or expense totals. Model it explicitly and define its reporting treatment before implementation.

### 4. Make locale/currency configuration a confirmed product input

`src/lib/format.ts` currently fixes presentation to `pt-BR` and `BRL`. The jurisdiction, locale, and currency have not been confirmed. Do not infer them from the interface language.

Until confirmed, isolate display configuration behind one formatter API and keep entry parsing in the existing canonical dot-decimal string format. When confirmed, store one household-level locale/currency configuration or an equivalent controlled configuration source; use an ISO 4217 currency code with `Intl.NumberFormat`. Supporting exchange rates or multi-currency balances is outside this MVP and requires separate monetary semantics.

### 5. Preserve the future household boundary through data ownership, not a tenancy package

No multi-tenant library is needed. Before broader rollout, decide whether the MVP migration introduces a seeded singleton `Household` and `householdId` ownership for users, accounts, categories, entries, transfers, reconciliations, and audit records. That is the clean future isolation path, but it has a migration and authorization impact and should be planned as a cohesive domain change instead of partially filtering pages.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Form handling | Native forms + Server Actions + Zod | React Hook Form / Formik | Existing forms can submit directly to the server and the service layer already owns validation. A second form state/validation model increases drift risk. |
| Client data state | Server component reads + path revalidation | TanStack Query/SWR/Redux | The operational MVP has server-owned finance state and modest data volume. A cache adds invalidation paths around transfers and reconciliation without solving an identified gap. |
| Persistence | Prisma + PostgreSQL | Drizzle / raw SQL / another ORM | Prisma and migrations are already established, typed, and used correctly in finance services. |
| Reconciliation | New Prisma models/services/audit records | Spreadsheet or external bank-reconciliation API | The required workflow is an internal daily comparison of family-reported balances. No institution integration has been requested, and jurisdiction is unknown. |
| Money/locale | Existing `Prisma.Decimal` + `Intl` | Currency/money or full i18n library | Decimal arithmetic already meets the current precision rule and `Intl` provides explicit locale/currency formatting. |
| Background processing | Synchronous request transaction | Queue/cron/job scheduler | Daily reconciliation is user-triggered in this MVP. Introduce scheduling only after a concrete unattended workflow exists. |

## Installation

No installation is recommended for this MVP.

```bash
# No new runtime or development dependencies.
# Add only Prisma migrations and TypeScript modules within the existing toolchain.
```

## Roadmap Implications

1. Connect mobile-first Server Actions and screens to the existing services; verify every mutation produces its existing audit event and refreshes only committed data.
2. Add the unified read-model queries and replace dashboard demonstration data with persisted, date-bounded projections.
3. Define reconciliation adjustment semantics, then add its migration, transactional service workflow, views, and tests.
4. Resolve locale/currency and future-household ownership decisions before any schema migration that would make either difficult to change.

## Sources

- [Next.js: Forms](https://nextjs.org/docs/app/guides/forms) — current documentation, last updated 2026-02-27; Server Actions with forms, validation, and progressive enhancement. Confidence: MEDIUM.
- [Next.js: Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data) — current documentation, last updated 2026-03-10; Server Action security and `POST` invocation model. Confidence: MEDIUM.
- [Prisma ORM: Transactions](https://www.prisma.io/docs/orm/fundamentals/transactions) — current official guidance for atomic multi-write operations. Confidence: MEDIUM.
- [MDN: `Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat) — explicit locale and ISO 4217 currency formatting. Confidence: MEDIUM.
- Repository evidence: `package.json`, `prisma/schema.prisma`, `src/lib/finance/services/`, and `src/lib/format.ts` — verified 2026-10-23.
