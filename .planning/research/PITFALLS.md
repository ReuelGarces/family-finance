# Domain Pitfalls

**Domain:** Operational family-finance ledger MVP  
**Researched:** 2026-10-23  
**Overall confidence:** MEDIUM — recommendations are cross-checked against current OWASP and NIST guidance, product reconciliation guidance, and the current checkout. No jurisdiction or currency has been confirmed.

## Critical Pitfalls

### Pitfall 1: Treating a correction as an overwrite

**What goes wrong:** An incorrect income, expense, transfer, opening balance, or reconciliation result is edited in place. A later balance may look correct, but it is no longer possible to explain how the earlier result was produced.

**Why it happens:** CRUD screens make update and delete the default; a “balance adjustment” is used as a shortcut instead of recording the reported balance, the discrepancy, its investigation, and a linked compensating entry or terminal cancellation.

**Consequences:** The ledger cannot be audited or trusted; a family member cannot distinguish a missing entry from a real bank timing difference; dispute resolution and future imports become unsafe.

**Prevention:** Make posted financial records append-only in business behavior. Permit a correction only as (1) a versioned replacement while the original remains visible, or (2) a terminal cancellation plus a new posted record; require an actor, reason, and timestamps. Model reconciliation explicitly with `reportedBalance`, `calculatedBalance`, `difference`, `asOfDate`, status, reviewer, resolution reason, and links to the affected original and corrective records. Never mutate an original to make a discrepancy disappear.

**Detection:** Acceptance test: create an erroneous expense, reconcile, resolve it, then query the historical register and audit trail. The original amount, who changed it, why, the resolution, and the resulting balance must all remain reconstructable. Alert or fail a test if any financial mutation lacks an audit event.

**Phase that should address it:** Ledger write model and reconciliation workflow, before the dashboard reads real money.

### Pitfall 2: Counting transfers as spending or recording only one side

**What goes wrong:** Moving money from cash to bank, between wallets, or to pay a family-held credit account changes spending or income totals, or only one account balance changes.

**Why it happens:** Transfers are represented as ordinary expenses/income, two loosely coordinated records, or a client-side calculation. Retries and concurrent submissions can create duplicate transfer records.

**Consequences:** Monthly income and expense reports inflate, consolidated net change is wrong, account balances cease to reconcile, and the error is hard to locate because both accounts can appear plausible separately.

**Prevention:** Keep a first-class transfer with one immutable identifier, origin, destination, amount, date, author, and status. Create/cancel it together with its audit event inside one database transaction; require different active accounts and validate both reference dates. Exclude transfers from consolidated income and expense totals while including their debit and credit in per-account balances. Use a server-issued idempotency key for entry submission and return the original result on retry.

**Detection:** Integration tests must assert, for every posted transfer, that origin decreases and destination increases by exactly the same decimal amount, aggregate net change is zero, and a retry produces one transfer. Test cancellation, editing, duplicate taps, a same-account transfer, and two concurrent requests.

**Phase that should address it:** Ledger invariants and service integration, before history and monthly reporting.

### Pitfall 3: Accepting a reported balance without a bounded reconciliation record

**What goes wrong:** A user types a bank or cash balance and the application overwrites the computed balance, creates an unexplained adjustment, or loses which records were considered.

**Why it happens:** Reconciliation is treated as a dashboard widget instead of a domain event. Common causes such as missing records, duplicates, pending items, fees, and timing differences are flattened into one number. Current finance products identify duplicate and pending versus posted transactions as distinct causes, rather than guessing a merge or correction.[^ynab-reconciliation]

**Consequences:** Daily use hides errors until the difference is too large to investigate. A correction can quietly distort an earlier month and users stop trusting the totals.

**Prevention:** Reconcile a specific account and date against one user-supplied observed balance. Preserve the comparison inputs and status (`OPEN`, `INVESTIGATING`, `RESOLVED`, `WAIVED`); require an explicit resolution type and reason. A resolution that changes the ledger must be a normal audited record linked to that reconciliation. Keep pending transactions out of a “confirmed” match unless the product explicitly models their lifecycle.

**Detection:** Given the same ledger and reported balance, the calculation must be deterministic. Tests must show that a resolved discrepancy preserves its original difference and that altering a past posted record changes later reconciliation outcomes predictably. A daily job or admin view should flag open discrepancies and accounts with no recent reconciliation.

**Phase that should address it:** Reconciliation data model and admin review flow, after core posting invariants and before declaring balances operational.

### Pitfall 4: Moving the opening-balance or date boundary after history exists

**What goes wrong:** The initial balance or its reference date is changed after transactions exist, or a date-only record crosses a timezone boundary. Entries may be counted twice, excluded, or assigned to the wrong month.

**Why it happens:** A `DATE` field is handled through JavaScript timestamps without one documented convention, or account setup remains editable after use. The opening balance is mistaken for a normal transaction rather than a controlled boundary.

**Consequences:** “Available today” and month summaries differ across devices or after a deployment; reconciliation cannot establish whether an error is in the opening balance or later activity.

**Prevention:** Keep one UTC date-only parsing and presentation policy, document it in the UI and API, and test local-midnight boundaries. Reject entries and transfers before each account’s reference date. Lock amount, type, and reference date after the first posted record; make historical migration a separately approved workflow with before/after reconciliation evidence.

**Detection:** Boundary tests for dates at month end, daylight-saving changes where applicable, and a user in a timezone west of UTC. Tests must prove that an account with history rejects an opening-basis change and that all monthly queries use inclusive, date-only boundaries.

**Phase that should address it:** Account setup and query contract, before entry forms and monthly dashboard.

### Pitfall 5: Letting mobile entry create duplicate or stale writes

**What goes wrong:** A user taps Save twice, retries after a poor connection, returns from a backgrounded browser, or has two tabs open. The server receives duplicate expenses or a stale edit overwrites a newer correction.

**Why it happens:** Disabling a button is treated as integrity control; the API has no idempotency key or optimistic-concurrency check; the UI cannot tell the user whether the original request committed.

**Consequences:** Small household expenses are duplicated and later reconciliations become manual forensic work. A family user may believe a failed save was lost and enter it again.

**Prevention:** Generate an idempotency key before submitting a new posting and persist it with a unique scope (household, actor, operation). Return the prior successful result for the same key. For edits, require a version or `updatedAt` precondition and show a conflict for a stale form. On the responsive UI, use a single submit state, explicit success receipt, and a retry path that reuses the same key.

**Detection:** Browser and service tests should simulate double-click, connection timeout after database commit, replay of the same request, and two concurrent edits. Verify one posted record/audit event and a conflict response where appropriate.

**Phase that should address it:** Entry API contract and mobile UX, before family users create production entries.

### Pitfall 6: Authorization that verifies a role but not the financial record's household

**What goes wrong:** A signed-in user can enumerate or mutate an account, category, transaction, transfer, audit event, or reconciliation by guessing an ID, or a future second household shares data because queries have no household scope.

**Why it happens:** Role checks are used as the sole authorization decision, client visibility is mistaken for access control, and a one-family schema postpones ownership design. OWASP recommends server-side, deny-by-default authorization with unit and integration coverage for the actual rules.[^owasp-auth]

**Consequences:** Private financial history is disclosed or changed. Retrofitting isolation after real data exists requires a risky backfill and changes every unique constraint and query.

**Prevention:** Define a household/finance-space identity now, even with one seeded household. Make it mandatory on accounts, categories, entries, transfers, reconciliations, and relevant audits; scope every read and mutation from authenticated server context, never from a client-supplied household ID. Use composite unique constraints scoped to household and test that each endpoint denies cross-household access by default. Reload role and active status at privileged server boundaries.

**Detection:** Automated matrix tests for FAMILY, ADMIN, inactive, unauthenticated, and a second test household; attempt read, list, update, cancel, reconcile, and audit access with foreign IDs. A security review must find no finance query that accepts an unverified ID without household scope.

**Phase that should address it:** Authorization and tenancy boundary, before exposing operational financial routes.

### Pitfall 7: Having an audit table that cannot serve as evidence

**What goes wrong:** Audit events have arbitrary action names or JSON shapes, omit a mutation path, log sensitive text, or can be changed/deleted alongside the financial records they describe.

**Why it happens:** Audit logging is added locally in service methods but has no versioned event contract, coverage test, retention/integrity policy, or separation from security logs. OWASP distinguishes transaction/audit trails from security logs and warns against both under- and over-logging.[^owasp-logging]

**Consequences:** The administrator cannot reconstruct what happened, monitoring exposes financial descriptions or session material, and later reporting breaks when a JSON field changes.

**Prevention:** Define typed, versioned financial audit events with correlation ID, actor, server timestamp, entity identifier, event type, before/after summary, and reason. Write the business mutation and audit event in one database transaction. Restrict mutation/deletion of the audit store to an audited maintenance procedure; keep corrections as new events. Keep security telemetry separate and exclude passwords, cookies, bearer tokens, and unnecessary financial narrative from logs.

**Detection:** Contract tests enumerate each create/update/cancel/reconcile operation and require exactly one well-formed audit event. Attempt a direct service replay and ensure the event stream remains chronological and parseable. Log scanning must reject secrets and session-cookie values.

**Phase that should address it:** Audit-event contract alongside all ledger mutation work.

### Pitfall 8: Treating a responsive browser as low-risk for financial data

**What goes wrong:** A shared or lost phone exposes a persistent session; financial data or a token is stored in browser local storage; errors and logs disclose account details; HTTPS/cookie deployment settings differ behind the production proxy.

**Why it happens:** Mobile entry is framed only as responsive layout. NIST treats financial data and credentials as sensitive, and its current session guidance says not to place session secrets in insecure browser locations such as HTML5 local storage.[^nist-session][^nist-mobile]

**Consequences:** Account takeover or casual disclosure of an entire household history; a production-only proxy/cookie error can invalidate otherwise correct authorization.

**Prevention:** Use HTTPS-only, `HttpOnly`, `Secure`, narrowly scoped cookies with CSRF protection, expiry, logout invalidation, and database-backed authorization at sensitive routes. Do not store credentials, tokens, or full finance data in browser storage. Validate production host/proxy configuration at startup; redact errors; rate-limit and atomically persist failed-login controls. Keep the first release to the existing web application rather than adding offline persistence.

**Detection:** Automated checks for cookie attributes, HTTPS redirects, CSRF on mutations, logout/session invalidation, stale-role denial, and unauthorized route access. Manual mobile testing on a shared-device scenario must verify logout and no sensitive data remains in browser storage or screenshots generated by the application.

**Phase that should address it:** Authentication hardening and production-readiness gate before real family data is entered.

## Moderate Pitfalls

### Pitfall 1: Replacing demo values piecemeal

**What goes wrong:** Some dashboard cards use persisted queries while charts or empty states still use fixtures, so users compare incompatible numbers.

**Prevention:** Remove or visibly label every demo source before any operational release. Define one read-model contract for current balance, month range, income, expense, and transfer exclusion; test each dashboard value against seeded ledger records.

### Pitfall 2: “Passing” tests that never run the database or service orchestration

**What goes wrong:** Money helpers pass, while transactions, transfers, audit events, authorization, and reconciliation fail when Prisma and PostgreSQL are involved.

**Prevention:** Make a disposable PostgreSQL integration database mandatory in CI and fail setup when it is missing. Add service-level tests and a minimal browser path for entry, history, reconciliation, and authorization.

### Pitfall 3: Unbounded history and in-memory summaries

**What goes wrong:** All entries are fetched to calculate a dashboard, and history has no cursor or maximum page size; performance deteriorates as real records accumulate.

**Prevention:** Use server-side date-bounded aggregates, stable cursor pagination, narrow projections, and explicit report ranges. Test that a dashboard query is bounded and that pagination cannot skip or duplicate a stable order.

## Minor Pitfalls

### Pitfall 1: Mistaking a report for a source of truth

**What goes wrong:** A chart total or cached UI state becomes the value used to make corrections.

**Prevention:** Derive reports only from posted ledger data and label account/date scope. The correction workflow must open the underlying register and reconciliation record, never edit a chart total.

### Pitfall 2: Preemptive automation of unconfirmed inputs

**What goes wrong:** Future WhatsApp parsing posts guessed amount, category, or transfer semantics directly into the ledger.

**Prevention:** Keep it out of this MVP. Any later parser must create a reviewable draft with provenance and require an authorized human confirmation before using the normal posting path.

## Current Codebase Risk Markers

These are checkout-specific observations, distinct from the general risks above.

| Marker | Evidence in current checkout | Roadmap response |
|---|---|---|
| Audit event contract is loose | `AuditLog.action` and `entityType` are strings and `metadata` is unconstrained JSON; `recordAudit` accepts the same free-form contract. | Define event unions/versioned payloads and add mutation-path contract tests. |
| Finance integration coverage is incomplete | Unit tests cover money and authorization; the PostgreSQL test is skipped without `TEST_DATABASE_URL`; no service, reconciliation, or browser flow coverage is mapped. | Require an integration database in CI and test the service/UI paths before using real data. |
| Date handling needs boundary proof | Dates are normalized to UTC in `parseDateOnly`, but the mapped codebase has no direct date-boundary service tests. | Freeze the UTC date-only contract and add reference-date, month-end, and timezone boundary tests. |
| Household ownership is absent from the present schema | Accounts, categories, transactions, and transfers have no `familyId`/household relation. This is expected for the one-family foundation, but it makes future isolation a schema migration. | Introduce a finance-space boundary before operational routes; exercise it with a second test household. |
| The mapped repeat-cancellation concern needs retesting | `CONCERNS.md` reports repeat cancellation, but the current `cancelTransaction`/`cancelTransfer` call `assertCanModifyEntry`, which rejects non-`POSTED` records before update. | Add service integration tests for a second cancellation and treat this as a verification item, not an unverified current defect. |

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Household and authorization foundation | Role-only checks and future cross-family leakage | Add finance-space ownership, server-side scoped queries, deny-by-default tests. |
| Accounts and opening balances | Post-history baseline edits or date drift | Lock opening basis after posting; formalize UTC date-only behavior and tests. |
| Transaction and transfer posting | Duplicate mobile submit, split transfer, report inflation | Atomic posting/audit, transfer invariants, idempotency keys, concurrency tests. |
| History and dashboard | Demo/persisted totals mixed; unbounded reads | One persisted read-model contract, pagination, database aggregates, empty states. |
| Daily reconciliation | Silent balance adjustment and unresolved discrepancies | Explicit reconciliation records, immutable original evidence, reviewed corrective entries. |
| Audit and operations | Incomplete/unreadable audit events; secrets in logs | Typed audit taxonomy, atomic writes, redaction, integrity/coverage checks. |
| Production readiness | Session and proxy weaknesses with real household data | Cookie/CSRF/host validation tests, lockout concurrency fix, backup-and-restore drill. |

## Sources

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — MEDIUM confidence through verified web research; server-side authorization, deny by default, and authorization testing.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — MEDIUM confidence through verified web research; audit/security log separation, integrity, and sensitive-data minimization.
- [NIST SP 800-63B-4: Digital Identity Guidelines](https://pages.nist.gov/800-63-4/sp800-63b.html) — MEDIUM confidence through verified web research; session-secret, cookie, HTTPS, logout, and CSRF guidance.
- [NIST SP 800-163: Vetting the Security of Mobile Applications](https://csrc.nist.gov/pubs/sp/800/163/final) — MEDIUM confidence through verified web research; financial data sensitivity and mobile threat considerations.
- [YNAB: Troubleshooting Reconciliation Issues](https://support.ynab.com/en_us/troubleshooting-reconciliation-issues-rJkijlVki) and [YNAB: Duplicate Imports](https://support.ynab.com/en_us/my-transactions-are-importing-more-than-once-ByyZUaPge) — MEDIUM confidence through verified web research; operational examples of duplicates, pending entries, and reconciliation investigation.
- Local evidence: `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, `docs/financial-domain.md`, and the inspected ledger, audit, authorization, validation, account, and query services — HIGH confidence for current-checkout observations.

[^ynab-reconciliation]: Product documentation is operational evidence, not an accounting standard; it informs the failure modes to support rather than financial policy.
[^owasp-auth]: OWASP guidance is used here for application authorization design; it does not replace the product's household authorization policy.
[^owasp-logging]: The recommended financial audit trail supplements, and should remain distinct from, security monitoring.
[^nist-session]: NIST SP 800-63B-4, July 2025, session-management requirements and browser storage guidance.
[^nist-mobile]: NIST SP 800-163 is older mobile-security guidance; its data-sensitivity and native-app concerns are applied only where relevant to this responsive web MVP.
