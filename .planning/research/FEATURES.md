# Feature Landscape

**Domain:** Private, mobile-first family finance web application
**Researched:** 2026-10-23
**Confidence:** MEDIUM — the confirmed scope and existing finance-domain contract are primary project evidence; current product patterns were cross-checked against official vendor documentation returned by web search.

## Scope Boundary

This document distinguishes the **confirmed operational MVP** from feature patterns seen in finance products. A feature being common in another product is not authorization to add it here. The MVP records real family financial facts in PostgreSQL and replaces the current demonstrative dashboard; it does not model commitments or automate ingestion.

The intended first audience is one family, with `ADMIN` and `FAMILY` roles. The existing domain fixes monetary storage at decimal precision and requires audit records around financial changes. The UI must preserve those rules rather than invent a parallel calculation model.

## Table Stakes

Features the confirmed MVP must deliver for the family to operate it reliably. The reasons below distinguish market expectations from project commitments.

| Feature | Why Expected | Complexity | Scope status and notes |
|---------|--------------|------------|------------------------|
| Sign-in, role-aware access, and family-data isolation | A private family ledger must restrict financial records to its authenticated family; the project already has `ADMIN` and `FAMILY` authorization foundations. | Med | **Confirmed MVP.** Start with one family, while every financial query and mutation remains scoped for future family separation. |
| Account administration with initial balance and reference date | Users need named places where money actually exists before a balance can be meaningful. | Med | **Confirmed MVP.** Admin manages accounts; preserve the existing rule that postings cannot predate an account's reference date. Inactivate used accounts instead of deleting them. |
| Expense and income recording on a phone | Manual entry is the core replacement for informal messages. Official Copilot and Quicken flows capture a type, date, amount, account, category, and optional description. | Med | **Confirmed MVP.** Family users can record income and expenses with few fields and few taps; validation stays server-side. |
| Category administration and assignment | Category is the basic way a household answers where money went and supports monthly totals. | Low | **Confirmed MVP.** Admin manages categories; entries use active categories. Do not add complex labels, splits, or category-rule automation. |
| Explicit account-to-account transfers | Household tools treat a transfer as money movement between accounts, separate from an income or expense. | High | **Confirmed MVP.** It requires source and destination accounts, one atomic operation, correct balances on both, and exclusion from consolidated income and expense totals. |
| Per-account and consolidated balances derived from persisted postings | The core promise is a trustworthy answer to how much is available today. | High | **Confirmed MVP.** Derive balances from initial balance plus `POSTED` income, expense, and transfer records using the existing decimal rules; never from browser state or dashboard samples. |
| Transaction history with simple search and filters | Current account products expose a transaction list and filters by common cues such as date, amount, category, and type; this becomes more valuable as entries accumulate. | Med | **Confirmed MVP.** Support a readable account or all-family history with date range, account, category, type, and a simple text/description search if the record model supports it. Use progressive filters, not a query-language UI. |
| Monthly dashboard based only on real family data | Families expect a current view of money in, money out, and available balance; static examples destroy trust. | Med | **Confirmed MVP.** Replace demonstrative overview values with server-side domain queries. Show only derived persisted facts, with the selected month or date basis made clear. |
| Daily reconciliation with visible discrepancy and auditable correction | Comparing a dated reported balance with a ledger balance is a recognized reconciliation pattern. BankTree presents statement balance, selected records, and difference, then creates a distinct adjustment when unmatched entries remain. | High | **Confirmed MVP and product differentiator.** Record calculated balance, reported balance, date, discrepancy, resolution, actor, and linked correction. A discrepancy must remain visible in audit history; no silent edit of original records. |
| Correct/cancel workflow with audit trail | A family will make entry mistakes. The existing contract already distinguishes correction/cancellation from physical deletion and retains before/after audit data. | High | **Confirmed MVP.** Preserve the 24-hour self-correction window for `FAMILY` users and require admin after it; cancelled records remain in history and do not affect balances. |
| Responsive, low-interaction workflows | The intended daily use is on smartphones by users with varied technical familiarity. | Med | **Confirmed MVP.** Optimize the capture, history, balance, and reconciliation routes for a narrow screen first; a native app or PWA is not required. |
| Tests for critical money rules | Incorrect arithmetic, authorization, transfer handling, or reconciliation damages the product's central trust claim. | Med | **Confirmed MVP acceptance criterion.** Cover money precision, balance formula, transfer exclusion from cash-flow totals, authorization, reconciliation, and audit events at the service boundary. |

## Differentiators

Features in the MVP that create more confidence than a lightweight expense tracker, while remaining inside the approved scope.

| Feature | Value Proposition | Complexity | Scope status and notes |
|---------|-------------------|------------|------------------------|
| Daily reconciliation as a first-class workflow | Turns an uncertain self-reported balance into a dated comparison, an explainable discrepancy, and a documented resolution. | High | **Confirmed MVP.** Make discrepancy status and unresolved amount discoverable from the relevant account and dashboard summary; do not turn it into bank-feed matching. |
| Immutable financial provenance | Users and the admin can explain why a balance changed without reconstructing prior records from messages or overwritten fields. | High | **Confirmed MVP.** Append audit and correction events in the same transaction as their finance mutation. |
| Strict separation of transfers from cash-flow reporting | Monthly income and expense summaries remain meaningful even when the family moves money between its own accounts. | High | **Confirmed MVP.** This is a domain integrity advantage, not a separate reporting feature. |
| Real-data-only dashboard | The family sees summaries that trace to its recorded entries rather than optimistic sample numbers. | Med | **Confirmed MVP.** Retire presentation-layer demo data as each dashboard value gains a backed domain query. |

## Explicit Later Stages

These are named product directions, not MVP work items. Their data model and UX should begin only after the family validates the basic operational ledger.

| Later-stage feature | Value proposition | Complexity | Prerequisite and boundary |
|---------------------|------------------|------------|--------------------------|
| Debtors, creditors, and debt tracking | Shows obligations and amounts owed beyond historical cash movement. | High | Requires the validated account/transaction ledger. Do not represent debts as ordinary categories or synthetic balances in the MVP. |
| Installments, due dates, partial payments, and settlement state | Lets a family track a commitment over time and its remaining obligation. | High | Requires an explicit commitment model and links to real payment postings; do not infer installments from descriptions. |
| Recurring commitments and reminders | Reduces omitted routine obligations once the family trusts the underlying ledger. | High | Requires due-date semantics and a confirmation policy before any actual transaction is created. It is not a monthly dashboard shortcut. |
| WhatsApp statement interpretation | Could reduce manual transcription of informal messages. | High | **Later vision.** Parsed material must be previewed and confirmed by a human before any record is persisted. Never auto-post an interpretation or treat it as reconciliation evidence. |

## Anti-Features

Features that should explicitly stay out of the operational MVP.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Debt, installment, creditor/debtor, due-date, and partial-payment modeling | It changes the model from historical cash tracking to commitments and requires lifecycle, allocation, and remaining-balance rules. | Validate accounts, postings, balances, history, and daily reconciliation first; plan it as the next stage. |
| Automatically posting records from WhatsApp, statements, or any parser | A misread message would create a false financial fact and contaminate balances, summaries, and reconciliation. | Defer interpretation. In a later stage, show a proposed set of entries with source context and require explicit human confirmation. |
| Banking aggregation, import synchronization, or automatic matching | It introduces connection, duplicate, pending/posted, correction, and consent workflows that are not necessary to prove the manual operational loop. | Let daily reconciliation reveal the next highest-value integration need after MVP validation. |
| Advanced budgeting, forecasts, savings goals, investment tracking, or debt-reduction advice | These depend on a trustworthy recorded history and broaden the interaction model before the basic ledger is validated. | Limit the dashboard to actual monthly inflows, outflows, account balances, and reconciliation state. |
| Native application, PWA, offline synchronization, or push notifications | They increase delivery and state-synchronization complexity without being required for responsive smartphone use. | Deliver responsive web flows first. |
| Self-service onboarding or multi-family operation | It adds tenant administration and support concerns before the private-family workflow is proven. | Keep the current family scope, enforce data scoping in services, and preserve a future extension path. |
| Physical deletion or silent overwriting of finance history | It breaks the ability to explain a balance and undermines reconciliation. | Use the existing cancellation, correction, and audit-log policies. |
| Demonstration financial figures mixed with real records | It can present misleading balances or monthly totals as if they belonged to the family. | Remove dashboard sample data as real queries replace each value; seed only non-financial setup data when needed. |

## Feature Dependencies

```text
Authentication + role guards + family scope
  -> account and category administration
  -> income / expense entry
  -> transaction history

Two active accounts + money validation + atomic audit
  -> transfer entry

Income / expense / transfer postings + initial balance/reference-date rules
  -> per-account balance
  -> consolidated balance and monthly dashboard
  -> daily reconciliation

Posted balances + reported balance + correction/cancellation audit policy
  -> discrepancy record
  -> auditable reconciliation correction/resolution

Validated operational ledger and user feedback
  -> debts / installments / due dates / recurring commitments
  -> later human-confirmed WhatsApp interpretation
```

## MVP Recommendation

Prioritize:

1. **Secure financial setup and capture:** authenticated family scope, account/category management, income/expense entry, and mobile validation feedback.
2. **Correct movement and visibility:** transfers, persisted history, filtered lookup, and account/consolidated balance queries.
3. **Trust loop:** real-data monthly dashboard, daily reconciliation, correction/cancellation flows, and tests that enforce money and audit invariants.

Defer: debtors/creditors, installments, due dates, recurring commitments, automatic imports, and WhatsApp interpretation. These need commitment or ingestion models that would distract from validating the basic cash ledger.

## Locale and Currency Assumptions

- The project documentation is written in Portuguese, but no approved operating jurisdiction, currency code, or display convention is specified. This research makes no jurisdiction-specific accounting or regulatory claim.
- The existing contract stores amounts as `DECIMAL(14,2)` and accepts normalized decimal strings with a period. Decide the display locale and the family's default currency before UI implementation; presentation formatting must not change the stored-value or arithmetic contract.
- The MVP should support one agreed default currency for the initial family. Multi-currency conversion, exchange rates, and exchange gains/losses are outside scope until explicitly approved.

## Sources

- [Project scope and requirements](../PROJECT.md) — primary project source, HIGH confidence.
- [Financial-domain contract](../../docs/financial-domain.md) — primary project source, HIGH confidence.
- [Copilot Money: Creating Manual Transactions](https://help.copilot.money/en/articles/4038706-creating-manual-transactions) — official vendor documentation, MEDIUM confidence after cross-check.
- [Quicken: Enter a Manual Spending Transaction](https://www.quicken.com/support/how-enter-manual-spending-transaction-quicken-windows/) — official vendor documentation, MEDIUM confidence after cross-check.
- [Quicken: Searching Transactions](https://info.quicken.com/sim/searching-transactions) — official vendor documentation, MEDIUM confidence after cross-check.
- [Panacea Financial: View and Search Transactions](https://help.panaceafinancial.com/how-do-i-view-search-my-transactions) — official vendor documentation, MEDIUM confidence after cross-check.
- [BankTree: Account Reconciliation](https://www.banktree.co.uk/support/knowledgebase.php?article=37) — official vendor documentation, MEDIUM confidence after cross-check.
