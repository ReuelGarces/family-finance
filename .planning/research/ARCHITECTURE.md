# Architecture Patterns

**Domain:** Household financial ledger MVP  
**Researched:** 2026-10-23  
**Confidence:** MEDIUM for external implementation guidance; HIGH for the cited current-code facts.

## Recommended Architecture

Extend the existing server-first Next.js application and the finance service layer. Keep PostgreSQL as the financial system of record and keep `Transaction` and `Transfer` as the authoritative economic events. Do not introduce a separate balance column that application code mutates on every operation for this MVP.

The existing schema already has the right basic split: `Transaction` is an income or expense affecting one account, and `Transfer` is one event that moves value from an origin account to a destination account. A balance is therefore a deterministic projection, rather than a second mutable fact:

```text
account balance(asOf) = initialBalance
  + posted income amounts for the account through asOf
  - posted expense amounts for the account through asOf
  - posted outgoing transfer amounts through asOf
  + posted incoming transfer amounts through asOf
```

Use the same projection for the dashboard, history totals, and daily reconciliation. Transfers affect two account balances but are excluded from income/expense aggregates, so a household transfer cannot inflate monthly income, expense, or consolidated net change.

```text
Mobile form / server-rendered page
        |
        v
Thin Server Action (session + input boundary + revalidation)
        |
        v
Finance command service (actor, household scope, validation, idempotency)
        |
        v
Short Prisma transaction (economic event + audit + request receipt)
        |
        +-------------------------+
        |                         |
        v                         v
PostgreSQL source records    Read/query services
accounts, categories,        ledger projection, history,
transactions, transfers,     monthly summary, reconciliation
reconciliation evidence
```

Prisma documents a transaction as an all-or-nothing unit and supports interactive transactions with a configured isolation level. PostgreSQL defaults to `Read Committed`; it allows anomalies that matter when a command first reads state and then decides what to write. Use short `Serializable` transactions with bounded retry for the commands that make a state decision (cancellation, idempotent posting, reconciliation resolution, and any future balance-affecting adjustment). Prisma specifically identifies `P2034` for retryable write conflict/deadlock cases; PostgreSQL likewise requires retry after a serialization failure. [Prisma transactions](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions), [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)

### Existing Patterns to Preserve

| Existing boundary | Evidence in current project | Keep it because |
|---|---|---|
| Server-first routing and guards | App Router routes/layouts call Auth.js-backed `requireUser` / `requireAdmin` | Financial mutations stay off the client and authorization is rechecked against persisted user state. |
| Domain service boundary | `src/lib/finance/services` owns account, category, transaction, transfer, and query operations | It centralizes validation, authorization, database work, and future household scoping. |
| Atomic mutation plus audit | Finance services use Prisma `$transaction` and create `AuditLog` records | The economic operation and its audit evidence must commit or roll back together. |
| Decimal monetary representation | `Decimal(14,2)` schema columns and money helpers | Avoids binary floating-point amounts in financial calculations. |
| Date-only financial dates | `referenceDate`, `occurredOn`, and `transferredOn` use PostgreSQL `date` | A posted entry belongs to a financial day, separate from its UTC audit timestamp. |

The current `FinancialAccount.name` unique constraint, `Category(name,type)` unique constraint, global `User.role`, and absence of a household key are single-household assumptions. Treat them as migration targets, not as access controls for a future family boundary.

### Component Boundaries

| Component | Responsibility | Communicates with |
|---|---|---|
| Server pages and mobile UI | Render persisted ledger data and submit accessible forms; never compute an authoritative balance locally. | Query services; Server Actions. |
| Server Actions | Parse transport data, call `requireUser`, construct actor context server-side, call exactly one command service, then refresh affected views after success. | Auth guards, command services, `revalidatePath`/`revalidateTag`. |
| Finance command services | Enforce role and household policy, validate references and money, provide idempotent commands, own transaction/retry behavior, and append audit events. | Prisma transaction, audit helper. |
| Finance query services | Return a paginated history, account balances, consolidated summary, and reconciliation views from posted source records. | Prisma/PostgreSQL only. |
| Ledger source records | Persist accounts, categories, transactions, and transfers. Once posted, preserve their financial meaning; cancellation/correction is a separate auditable state change. | Reconciliation and query services. |
| Reconciliation evidence | Persist a reported balance, the exact calculated balance and difference seen at that time, and append-only resolution evidence. | Ledger projection, explicit adjustment transaction when approved. |
| Household boundary (introduced now) | Resolve membership and make `familyId` an obligatory query/write scope for every financial aggregate root. | Auth actor construction, all finance services, later RLS. |

Next.js treats Server Actions as direct POST-reachable server functions, not as UI-only callbacks. Each must authenticate and authorize inside the action before invoking the existing service layer. Revalidate only after the command transaction succeeds so the user sees the committed projection. [Next.js mutating data](https://nextjs.org/docs/app/getting-started/mutating-data)

### Data Flow

#### Posting income, expense, or transfer

1. The form submits a client-generated idempotency key with validated input. The Server Action obtains the actor from the session and database; it never accepts `authorId`, role, or `familyId` from the form.
2. The command service verifies the actor's family membership and verifies the referenced account/category belongs to that family. It rejects inactive/archived references according to the existing policy.
3. In one short `Serializable` transaction, it claims an idempotency receipt, writes exactly one `Transaction` *or* one `Transfer`, and appends a typed, versioned audit event. A duplicate key with the same command fingerprint returns the original result; a duplicate key with different input is a conflict.
4. The service retries only a recognized serialization/deadlock failure and uses the same idempotency key for every attempt. It does not retry validation, authorization, or unknown database failures.
5. The action revalidates the relevant account/history/summary paths after the service returns the committed result.

The UI may serialize Action dispatches, but that behavior is not a database invariant and does not cover multiple tabs, devices, or direct POSTs. The source records, uniqueness constraint, and transaction boundary provide the real duplicate protection. [Next.js mutation dispatch](https://nextjs.org/docs/app/getting-started/mutating-data), [Prisma transaction timing guidance](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions)

#### Reading balances and monthly summary

1. The query service takes only an actor-derived `familyId`, filters by `POSTED`, and bounds all source rows by the requested financial date.
2. It aggregates transactions as income and expense per account, then aggregates transfer-out and transfer-in separately. Do not join both transfer relations to transactions in a single multiplicative query.
3. It derives each account and consolidated balance from the formula above. The monthly summary includes only `Transaction` income/expense rows; transfers may appear in history but have zero effect on household income/expense totals.
4. For MVP-sized history, use grouped PostgreSQL aggregation with pagination for history. Do not retain the current all-history, in-memory per-account filtering path from `getConsolidatedSummary`; it is both harder to review and grows with history times account count.

#### Daily reported-versus-calculated balance check

1. A family member records a reported amount for one account and financial date.
2. The reconciliation service calculates the account projection in the same transaction/snapshot, then persists the reported amount, calculated amount, difference, account, financial date, calculation timestamp, actor, and ledger cutoff definition.
3. A zero difference is a recorded match. A nonzero difference remains visible as open evidence; it is never hidden by rewriting the report or an older source entry.
4. An authorized resolution appends a `ReconciliationResolution` record with a reason and actor. If the resolution changes the ledger, it references a newly posted, explicit adjustment transaction; it does not mutate the original transaction or transfer.
5. Queries show the original observation, all resolution attempts, the linked adjustment if any, and the current derived status.

This uses reconciliation as a comparison and evidence stream, rather than treating a reported balance as a replacement for the ledger balance. It gives the family an explanation trail without claiming a jurisdiction-specific accounting treatment.

## Patterns to Follow

### Pattern 1: Source ledger plus derived balance projection

**What:** Store immutable business facts, calculate balances from them, and reserve the current account fields for account setup (`initialBalance`, `referenceDate`, status), not a rolling balance.

**When:** Always for the initial operational ledger. Consider a versioned daily balance read model only after measured query performance requires it; it must be rebuildable from the source records.

**Why:** It makes the balance formula reviewable, prevents transfer double counting, and makes a reconciliation calculation reproducible.

```typescript
// Query semantics, not an implementation tied to an ORM API.
const balance = account.initialBalance
  + totals.income
  - totals.expense
  - totals.transferOut
  + totals.transferIn;

const monthlyCashFlow = totals.income - totals.expense;
// Transfers are deliberately absent from monthlyCashFlow.
```

### Pattern 2: Idempotent financial command receipt

**What:** Add a small `FinanceCommandReceipt` (or similarly named) table with `familyId`, `actorId`, `idempotencyKey`, command type, immutable input fingerprint, resulting entity id/type, and timestamps. Enforce `@@unique([familyId, actorId, idempotencyKey])`.

**When:** For create, cancel, and reconciliation-resolution commands reached from mobile forms or any future API. Reads do not need a receipt.

**Why:** A browser retry or double submit can otherwise create two valid, independently audited financial events. A unique constraint makes duplicate prevention durable across processes and deployments.

**Implementation note:** Claim the receipt, source event, and audit event inside the same transaction. On a unique conflict, read the receipt and return its result only if the stored fingerprint matches. This is stronger than checking for a duplicate description, amount, or timestamp.

### Pattern 3: State transition guarded in SQL

**What:** Treat cancellation as a one-way state transition. Update only a `POSTED` row, inspect the affected-row count, and create the cancellation audit record in the same transaction.

**When:** Cancelling transactions and transfers, resolving a reconciliation, or any status transition that must only happen once.

**Why:** The mapped codebase identifies repeated cancellation as an existing bug: a second request overwrites prior cancellation evidence and writes another audit event. A guarded update converts the second request into an explicit conflict.

```typescript
// Shape only: add household scope and use the transaction client in production code.
const result = await tx.transaction.updateMany({
  where: { id, familyId: actor.familyId, status: "POSTED" },
  data: { status: "CANCELED", canceledAt: new Date(), canceledById: actor.userId, cancellationReason },
});
if (result.count !== 1) throw new FinanceConflictError("Entry is no longer posted");
```

### Pattern 4: Append-only reconciliation observation and resolution

**What:** Add `BalanceReconciliation` as the immutable observed comparison and `ReconciliationResolution` as append-only resolution evidence. The latter can reference an explicit corrective `Transaction` when approved.

**When:** Daily account checks in the MVP.

**Suggested fields:**

| Record | Essential fields |
|---|---|
| `BalanceReconciliation` | `familyId`, `accountId`, `balanceDate @db.Date`, `reportedBalance`, `calculatedBalance`, `difference`, `calculatedAt`, `reportedById`, `createdAt` |
| `ReconciliationResolution` | `reconciliationId`, `type`, `reason`, `adjustmentTransactionId?`, `resolvedById`, `createdAt` |

**Why:** A later correction can explain or adjust a discrepancy without erasing what was reported or what calculation was shown at the time.

### Pattern 5: Household scope from the actor, then defense in depth later

**What:** Introduce `Family` and `FamilyMembership` now, seed one family, and make `FinanceActor` include `{ userId, familyId, role }`. Add a non-null `familyId` to every financial root and audit/reconciliation row. Every service query and mutation filters/sets it from the actor context.

**When:** In the schema/invariant phase before the UI begins writing real money data.

**Why:** It makes single-family operation explicit and prevents a future multi-family migration from touching every service contract at once. Change uniqueness to household-scoped (`[familyId, name]`, `[familyId, name, type]`). Use composite relationships or equivalent validation so a transaction cannot use an account/category from another family, and a transfer cannot connect accounts from different families.

PostgreSQL Row-Level Security is appropriate later as an additional database barrier once a real multi-family deployment exists. It is not a substitute for service authorization: table owners and `BYPASSRLS` roles normally bypass policies, and policies only work when the application connects as a role subject to them. [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Reconciliation Model Options

| Model | Result | Recommendation |
|---|---|---|
| Overwrite an account's balance with the reported amount | Hides which source event or report caused the difference; corrupts reproducibility. | Reject. |
| Store only `lastReconciledAt` on the account | Cannot show reported/calculated values, discrepancy history, or a resolver's rationale. | Reject. |
| Mutable daily check row with audit-log-only history | Can work, but audit metadata is currently free-form and not a sufficient domain query model. | Avoid for MVP. |
| Immutable observation plus append-only resolution, optionally linked to a separate adjustment transaction | Preserves the report, calculation, rationale, actor, and the financial correction as distinct facts. | Use. |

The product discussion must choose whether a day permits multiple reports and how to label a later corrected report. The recommended model supports either policy without destroying history: enforce one initial report per `(familyId, accountId, balanceDate)` if the family wants a single daily close, or retain a report sequence when corrections are expected.

## Transaction and Accounting Invariants

| Invariant | Enforcement point |
|---|---|
| Amount is an exact positive Decimal at the approved precision. | Existing money parser/validation; database `Decimal`; service tests. |
| Every financial source event belongs to exactly one family and references only records from that family. | Non-null `familyId`, composite FK/constraints where feasible, actor-scoped service validation. |
| A posted transaction affects one account once: income adds, expense subtracts. | Query aggregation and contract tests. |
| A posted transfer affects origin once and destination once, and never appears in income/expense totals. | Transfer-specific aggregate paths and transfer-safe summary tests. |
| A transfer's origin and destination are distinct active accounts in the same family. | Command validation plus composite family constraints. |
| Cancellation is one-way and retains original event data, cancellation actor/time/reason, and audit evidence. | Status-constrained update in one transaction; no destructive delete. |
| A command retried with the same key produces the original result; a reused key with different input conflicts. | Durable idempotency receipt unique constraint and input fingerprint. |
| Audit records are committed with the business mutation and have a typed action/entity plus versioned metadata. | Shared audit helper invoked inside the command transaction. |
| A reconciliation observation records the projected amount visible at that time; resolution does not rewrite that observation. | Separate reconciliation and resolution records; linked correction transaction where needed. |

Use a stable lock ordering (for example, ascending account id when an operation must lock two accounts) and keep external calls outside the transaction. PostgreSQL's locking documentation warns that row locks can wait and deadlocks remain possible; serializable retry remains required. [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)

## Date and Time Boundaries

- Keep `occurredOn`, `transferredOn`, `referenceDate`, and `balanceDate` as date-only values. Accept canonical ISO `YYYY-MM-DD` input and pass it through one centralized date-only adapter; never derive it by slicing a browser-local timestamp.
- Persist event/audit creation timestamps as UTC `DateTime`. They answer *when the system recorded it*; they do not replace the financial date.
- Add one explicit household financial time-zone setting before any workflow computes a default "today." For the single household it can be configuration; move it to `Family` during tenancy migration. Test the local midnight and month boundary for that zone.
- PostgreSQL distinguishes `date` (a calendar day) from both timestamp types, and recommends ISO-style dates to avoid ambiguous parsing. [PostgreSQL date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html)

## Migration Path

1. **Make the existing service contract safe for real writes.** Define typed audit actions/metadata, reject repeated cancellations, add pagination/stable ordering to history, centralize date-only conversion, and replace in-memory balance aggregation with grouped, bounded queries. Preserve existing migrations and records.
2. **Add the single-family root before operational UI.** Create `Family` and `FamilyMembership`, seed the initial family, backfill all existing financial rows and audits with its id, then make finance `familyId` non-null. Change account/category uniqueness and add account/category/transfer family consistency constraints. Construct the actor family scope only on the server.
3. **Add command reliability.** Add idempotency receipts and a short serializable-with-bounded-retry wrapper for state-changing financial commands. Refactor duplicated transaction/transfer cancellation orchestration into a shared helper without hiding their type-specific validation.
4. **Connect operational forms and history.** Keep Server Actions thin; call the hardened services, invalidate the affected views after commit, and expose paginated persisted history, balances, and monthly summary. Replace demonstration dashboard values only when these queries are ready.
5. **Add reconciliation as a separate domain flow.** Create immutable observations and append-only resolutions, then add an administrator review experience. If an adjustment is allowed by the agreed business rule, post an explicit transaction rather than changing prior history.
6. **Prepare scale only when evidence requires it.** Introduce a rebuildable daily balance read model for measured query pressure. When multiple households are actually enabled, add PostgreSQL RLS using a non-owner application role and transaction-local family context, while retaining service-level scopes and isolation tests.

## Anti-Patterns to Avoid

### Mutable running balance on `FinancialAccount`

**What:** Increment/decrement a `currentBalance` column alongside every entry and transfer.

**Why bad:** Double submits, partial transfer handling, and a missed correction desynchronize the cached value from history. It also makes a past-date entry or cancellation harder to explain.

**Instead:** Derive the authoritative balance from posted records. Add a rebuildable read model only after measurement demonstrates a need.

### Modeling a transfer as income plus expense

**What:** Create two generic transactions for one intra-family movement.

**Why bad:** Monthly income/expense and category analytics become inflated unless every consumer correctly reverses the pairing.

**Instead:** Retain the single `Transfer` entity and apply its opposite effects only in account-balance projection.

### Resolving a discrepancy by editing history

**What:** Alter an older amount/date or overwrite a reported balance until the comparison matches.

**Why bad:** Removes the evidence needed to understand why the mismatch existed and makes prior summaries non-reproducible.

**Instead:** Append a resolution and, when the business policy permits, link a new explicit adjustment transaction.

### Treating audit JSON as the financial history model

**What:** Put reconciliation state and correction logic only in unconstrained `AuditLog.metadata`.

**Why bad:** The current action/entity strings and JSON shapes are free-form, so reliable filtering, status rules, and reporting will drift.

**Instead:** Keep audit metadata typed and versioned, but use first-class reconciliation tables for domain facts.

### Relying on client state or route visibility for authorization

**What:** Hide controls for family users but trust submitted account ids, author ids, or family ids.

**Why bad:** Server Actions can be invoked directly, and client state does not prove tenant ownership.

**Instead:** Re-resolve the active actor server-side and scope every command/query in the finance service.

## Scalability Considerations

| Concern | At one household / MVP | At many households | At high volume |
|---|---|---|---|
| Balance queries | Grouped SQL aggregates over bounded dates; paginate history. | Require `familyId` in all indexes and query predicates. | Build a versioned, rebuildable daily read model from source events. |
| Concurrent writes | Idempotency receipt, short serializable command transactions, retry known conflicts. | Keep receipt uniqueness household-scoped; monitor conflicts. | Partition operational concerns only after measured contention; preserve source-ledger contract. |
| Isolation | Service-derived single family scope already exists. | Membership-driven scopes plus cross-tenant integration tests. | Add RLS defense in depth with non-owner roles and policy observability. |
| Audit/reconciliation | Typed audit metadata and reconciliation tables. | Include `familyId` and indexes on account/date/status. | Archive/read-optimized audit views without deleting financial source evidence. |

## Phase Discussion Decisions to Resolve

These are product rules, not assumptions this research should settle:

1. Which role may post, cancel, and resolve a discrepancy; does a family user ever need approval for a corrective adjustment?
2. Is a discrepancy resolved by explanation only, by an explicitly categorized adjustment, or both? Which categories are available for adjustments?
3. Is there one report per account per financial day, or may a corrected report create a new report version?
4. What is the household financial time zone, when is the daily cutoff, and may users post/backdate/future-date an entry after a day has been reconciled?
5. What does a negative balance mean for each account type, especially cash, bank, and credit card? Do credit-card balances participate in "available now" or appear separately?
6. Are posted amounts/date/category editable, or must a correction cancel/replace the original event? The latter is recommended for auditability.
7. Does the planned future require a user to belong to more than one household? The recommended `FamilyMembership` model supports it, but membership and role semantics still need agreement.

## Sources

- [Prisma Client transactions, isolation levels, and retry guidance](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions) — MEDIUM source-tier confidence (official documentation retrieved through web fallback; corroborated by PostgreSQL documentation).
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) — MEDIUM source-tier confidence (official documentation retrieved through web fallback; corroborates serializable retry requirement).
- [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html) — MEDIUM source-tier confidence (official documentation retrieved through web fallback).
- [PostgreSQL row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) — MEDIUM source-tier confidence (official documentation retrieved through web fallback).
- [PostgreSQL date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html) — MEDIUM source-tier confidence (official documentation retrieved through web fallback).
- [Next.js Server Functions and mutations](https://nextjs.org/docs/app/getting-started/mutating-data) — MEDIUM source-tier confidence (official documentation retrieved through web fallback).
- Current-project facts: `.planning/PROJECT.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, and `prisma/schema.prisma` — HIGH confidence (direct primary artifacts, read 2026-10-23).
