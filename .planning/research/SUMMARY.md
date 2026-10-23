# Project Research Summary

**Project:** Family Finance
**Domain:** Private, mobile-first family finance web application
**Researched:** 2026-10-23
**Confidence:** MEDIUM

## Executive Summary

Family Finance is an operational ledger for one family: it must persist accounts, categories, income, expenses, and transfers; derive trustworthy balances and monthly summaries from posted records; and let users reconcile a reported daily balance with the ledger. The MVP should be a responsive web application with simple phone-first flows, authenticated and authorized server-side access, scoped financial data, and audit evidence for every financial change. A transfer is a movement between family accounts, never income or spending; a reconciliation is evidence of a discrepancy and its resolution, never a silent rewrite of an account balance.

The recommended delivery path is incremental reuse of the existing Next.js 16, React 19, TypeScript, Tailwind, Prisma 7, PostgreSQL, Auth.js, Zod, and finance-service foundation. Server Actions should adapt forms to the existing domain services; service-layer commands remain responsible for validation, authorization, decimal arithmetic, atomic writes, idempotency, and audit events. Server-side query services should provide the history, dashboard, and reconciliation projections. No new dependency, client data cache, external bank integration, queue, or new ORM is justified for this MVP.

The central risks are false financial facts and irreproducible balances. Address them by introducing a finance-space/household scope before operational exposure, retaining exact `Decimal` money and date-only boundaries, making commands idempotent, recording transfers atomically, and keeping corrections and reconciliation evidence append-only. Require database-backed service and critical mobile-flow tests before real family use. Jurisdiction, locale, and currency remain unconfirmed product inputs and must not be inferred from Portuguese UI text.

## Key Findings

### Recommended Stack

Keep the installed stack and complete the missing domain wiring and migration work. This preserves one authoritative service layer for all financial writes and prevents a second validation, calculation, or authorization model in the browser. Financial values remain `Prisma.Decimal`/canonical decimal strings; chart rendering can receive derived presentation values only after exact server-side calculation.

**Core technologies:**

- **Next.js 16.4.2 App Router and Server Actions:** server-first pages and native forms for mobile capture; actions authenticate, call one command service, then revalidate committed views.
- **React 19.3.1 built-ins:** focused pending, error, and duplicate-submit feedback without another form-state library.
- **TypeScript 5.9.0, Zod 4.6.7, and existing finance services:** typed, server-side parsing and one domain boundary for validation, policy, transactions, and audit.
- **Prisma 7.10.1 with PostgreSQL 17:** typed migrations, durable ledger and audit storage, and atomic multi-write transactions.
- **PostgreSQL `DECIMAL(14,2)` with `Prisma.Decimal`:** exact financial amounts; JavaScript number arithmetic is excluded from authoritative calculations.
- **Existing Tailwind, `Intl.NumberFormat`, and Recharts:** responsive presentation and optional charts derived exclusively from persisted projections. Locale and ISO 4217 currency must be configured only after confirmation.
- **Existing Docker/Coolify and `tsx` test runner:** deployment and targeted service/integration tests; add no runtime or development dependency for the MVP.

### Expected Features

The table stakes are secure sign-in and role-aware, family-scoped access; account and category administration; low-interaction income and expense capture; explicit account-to-account transfers; derived per-account and consolidated balances; filterable history; a real monthly dashboard; cancellation/correction with an audit trail; daily reconciliation; mobile-first layouts; and tests for critical finance rules. Dashboard values must come only from persisted posted records, with an explicit date/month basis.

**Must have (table stakes):**

- Accounts with controlled opening balance/reference date, active categories, and persisted income/expense entries.
- Atomic transfers with distinct origin/destination accounts, equal debit and credit effects, and exclusion from consolidated income/expense totals.
- Real dashboard, monthly summary, and unified history with date, account, category, type, and supported text filters.
- Dated daily reconciliation showing reported balance, calculated balance, variance, status, actor, resolution, and any linked corrective event.
- Role-aware authorization, future-safe household scoping, cancellation/correction evidence, and service-level financial-rule coverage.

**Should have (MVP differentiators):**

- Reconciliation as a first-class, reviewable workflow with unresolved discrepancies discoverable from the account and dashboard.
- Immutable financial provenance: corrections, cancellations, and resolutions are new auditable facts.
- A real-data-only dashboard whose cash-flow summaries keep transfers separate from spending and income.

**Defer (next stage or later):**

- Debts, creditors/debtors, installments, due dates, partial payments, recurring commitments, and reminders; these need an explicit commitment lifecycle after the cash ledger is validated.
- WhatsApp/statement interpretation; any future parser must create a reviewable draft with source context and require human confirmation before normal posting.
- Banking aggregation, automatic matching, advanced budgeting/forecasting, native/PWA/offline sync, push notifications, and self-service multi-family operation.

### Architecture Approach

Use a server-first, source-ledger architecture. Pages and mobile UI render projections and submit forms; Server Actions construct trusted actor context and call exactly one command service; command services enforce household and role policy, validate data, run atomic Prisma transactions, and append audit evidence; query services produce history, balances, monthly totals, and reconciliation views. The database remains the sole source of truth: `POSTED` source records determine balances, cancelled records remain visible but do not affect totals, and reports do not become writable balances.

**Major components:**

1. **Server pages and mobile UI** — accessible responsive forms and persisted views, with no client-authoritative financial calculation.
2. **Server Actions** — narrow `FormData` adapters that authenticate, invoke a command service, return safe feedback, and refresh committed routes.
3. **Finance command services** — actor-derived household scope, validation, exact money rules, idempotency, transactional mutation, cancellation/correction transitions, and audit events.
4. **Finance query services** — stable paginated/filterable history, account balances, consolidated monthly summaries, and reconciliation projections.
5. **Ledger source records and audit contract** — accounts, categories, transactions, transfers, typed/versioned audit payloads, and immutable business meaning.
6. **Reconciliation evidence** — immutable observation of reported/calculated/difference values plus append-only resolution; an approved correction is a separate linked financial event.

**Key patterns:** derive balances from source records; make receipt-backed commands idempotent; enforce state transitions in the database transaction; scope every finance query and write from authenticated actor context; preserve financial days as date-only values; and use an immutable reconciliation observation with a separate resolution record.

### Critical Pitfalls

1. **Overwriting a correction or reported balance** — retain original entries and reconciliation observations; use cancellation/versioned correction and an explicit linked adjustment when authorized.
2. **Treating transfers as income/expense or writing one side only** — model a first-class transfer, commit it with its audit event atomically, test equal debit/credit, and exclude it from cash-flow totals.
3. **Role-only authorization without financial-record scope** — introduce a finance-space/household identifier, derive it from the server actor, scope every query and mutation, and test foreign-ID denial.
4. **Duplicate or stale mobile writes** — use durable, scoped idempotency receipts for create commands and version/`updatedAt` preconditions for edits; retry with the original key.
5. **Unreliable audit and test coverage** — define typed/versioned audit events in the same transaction as each mutation, require PostgreSQL-backed service tests in CI, and exercise date, cancellation, concurrency, authorization, transfer, and reconciliation paths.

## Implications for Roadmap

Based on the combined research, suggested phase structure follows.

### Phase 1: Finance Space, Authorization, and Audit Foundations

**Rationale:** Data isolation and reconstructible evidence are prerequisites for entering real financial facts; retrofitting them after operational use changes every query and constraint.

**Delivers:** A deliberate singleton-family/finance-space migration path, actor-derived scoping across finance services, typed/versioned audit-event contract, and authorization/audit integration tests including a second test household.

**Addresses:** Authentication, authorization, data isolation, and immutable provenance.

**Avoids:** Role-only access, unscoped foreign-ID access, free-form audit evidence, and client-side authorization assumptions.

### Phase 2: Operational Accounts, Categories, and Opening-Balance Rules

**Rationale:** Posting and reporting require valid accounts, categories, and a stable opening-balance boundary.

**Delivers:** Mobile-first account/category administration wired through Server Actions and services; active/inactive behavior; reference-date enforcement; and a frozen date-only/UTC query contract with boundary tests.

**Addresses:** Persisted accounts, categories, initial balances, and simple administration.

**Avoids:** Editable opening bases after history exists, entries before reference dates, physical deletion of used records, and timezone/month-boundary drift.

### Phase 3: Ledger Posting and Transfer Integrity

**Rationale:** The core manual operational loop must be trustworthy before summaries or reconciliation can be trusted.

**Delivers:** Phone-first income/expense/transfer actions connected to existing services; server-side validation; idempotency receipts; cancellation/correction workflow; atomic audit writes; and critical finance service tests.

**Addresses:** Real persisted income, expenses, transfers, and auditable corrections.

**Avoids:** Duplicate taps/retries, stale edits, split transfers, float arithmetic, cancellation replays, and transfer double counting.

### Phase 4: Persisted History and Monthly Dashboard

**Rationale:** Read models depend on a correct posted ledger and must replace demo values consistently rather than card by card.

**Delivers:** Unified stable-order, filterable history; per-account and consolidated balances; date-bounded monthly income/expense summaries that exclude transfers; mobile-friendly empty/loading states; and real-data dashboard views.

**Addresses:** Filterable history and a real dashboard/monthly summary.

**Avoids:** Mixed fixture and persisted figures, client-authoritative balances, unbounded reads, and report totals used as sources of truth.

### Phase 5: Daily Reconciliation and Discrepancy Review

**Rationale:** Reconciliation depends on the ledger, account boundary, audit contract, and reliable read-model calculations.

**Delivers:** Prisma migration for immutable reconciliation observations and append-only resolutions; reported-versus-calculated daily checks; status/reason/reviewer fields; linked, explicit corrective events where approved; account/dashboard visibility; and end-to-end evidence tests.

**Addresses:** Daily reconciliation with reviewable, auditable discrepancies.

**Avoids:** Silent balance rewrites, unexplained adjustments, loss of the historical difference, and treating pending/unmodeled activity as a confirmed match.

### Phase 6: Operational Hardening and Real-Data Readiness

**Rationale:** The application must prove its critical guarantees before family data is relied on in normal use.

**Delivers:** PostgreSQL integration coverage in CI; mobile-path validation for capture, history, reconciliation, and authorization; session/cookie/CSRF/production-proxy checks; secret-safe logging; and backup/restore readiness evidence.

**Addresses:** The confirmed test criterion and safe use on shared mobile devices.

**Avoids:** Passing helper tests without database orchestration, session exposure, incomplete auth checks, and untested production configuration.

### Phase Ordering Rationale

- Finance-space scoping, audit evidence, and date/opening rules form the contract that every later command and query must obey.
- Ledger writes and transfer invariants precede dashboard/history because all read models derive from posted source records.
- Reconciliation is deliberately after reliable ledger and query projections; it must record evidence of those calculations, not invent an alternate balance source.
- Hardening is a release gate that validates the completed operational loop with the real persistence, authorization, and mobile conditions it will use.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1:** Decide the least disruptive `familyId`/membership migration and composite constraints for the existing schema; confirm the future ownership boundary without assuming multi-family product scope.
- **Phase 3:** Specify idempotency receipt retention, input fingerprints, stale-edit conflict behavior, and correction semantics at the existing service boundary.
- **Phase 5:** Resolve reconciliation-adjustment accounting treatment so it cannot inflate monthly income/expense totals; define permitted resolution types and reporting behavior.
- **Phase 6:** Verify deployment-specific Auth.js cookie, CSRF, proxy, HTTPS, backup, and integration-database configuration against the actual environment.

Phases with standard patterns (skip research-phase unless checkout evidence changes):

- **Phase 2:** Server Action forms, Zod parsing, account/category administration, and date-only validation are well documented and align with existing repository patterns.
- **Phase 4:** Server-side aggregates, bounded date filters, stable history ordering, and route revalidation have established Prisma/Next.js patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Repository versions and architecture are directly verified; incremental framework guidance was checked against current official documentation. |
| Features | MEDIUM | Confirmed MVP scope and existing domain contract are primary evidence; product-pattern comparisons are secondary evidence. |
| Architecture | HIGH | Component boundaries, current service patterns, schema constraints, and migration implications were grounded in the inspected repository. |
| Pitfalls | MEDIUM | Current-checkout markers are direct evidence; security and operational mitigations are supported by OWASP, NIST, and product documentation. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Locale, jurisdiction, and currency:** Confirm a single locale and ISO 4217 currency before making display configuration or product policy permanent. Do not infer either from the Portuguese interface.
- **Household boundary:** Confirm whether the first migration introduces a seeded singleton finance space and exact membership semantics; the MVP remains one-family even while services become scope-safe.
- **Reconciliation correction treatment:** Decide whether a discrepancy can be waived, requires a separate adjustment type, or only links to a corrective ledger record; document how any adjustment affects monthly reporting before schema implementation.
- **Existing-service behavior:** Re-test cancellation, cross-scope authorization, concurrent writes, and date boundaries against PostgreSQL rather than relying on mapped unit coverage.
- **Operational policy:** Define retention, backup/restore ownership, and authentication deployment settings from the actual hosting environment; no legal or accounting-jurisdiction conclusion is implied by this research.

## Sources

### Primary (HIGH confidence)

- Repository evidence in `package.json`, `prisma/schema.prisma`, finance services, Auth.js guards, formatting helpers, and planning/codebase documents — installed stack, current boundaries, and current risk markers.
- Confirmed project MVP scope — operational ledger, mobile-first workflow, real persisted summaries, reconciliation, isolation, and critical-rule testing.

### Secondary (MEDIUM confidence)

- Next.js Forms and Mutating Data documentation — Server Action form and authorization model.
- Prisma Transactions documentation — atomic multi-write guidance.
- MDN `Intl.NumberFormat` — explicit locale and ISO 4217 currency formatting.
- OWASP Authorization and Logging Cheat Sheets; NIST SP 800-63B-4 and SP 800-163 — authorization, audit, session, and mobile-data safeguards.
- YNAB reconciliation/duplicate-import guidance and comparable finance product documentation — operational reconciliation and duplicate-entry failure modes.

---
*Research completed: 2026-10-23*
*Ready for roadmap: yes*
