# Requirements: Family Finance

**Defined:** 2026-10-23
**Core Value:** A família consegue registrar movimentações reais com facilidade e confiar que cada saldo e resumo representa o histórico financeiro auditável.

## v1 Requirements

Requirements for the initial operational MVP. Each maps to one roadmap phase.

### Access and Authorization

- [ ] **AUTH-01**: Administrators and family members can authenticate through the existing sign-in flow.
- [ ] **AUTH-02**: The application enforces distinct permissions for family members who record movements and administrators who configure accounts and categories and review discrepancies.
- [ ] **AUTH-03**: Every financial read and write is scoped to the family authorized by the authenticated server-side session.

### Accounts and Categories

- [ ] **ACCT-01**: An administrator can create, edit, and deactivate bank, wallet, and cash accounts.
- [ ] **ACCT-02**: An administrator can define an account's opening balance and reference date, and the calculated balance includes that starting point.
- [ ] **CAT-01**: An administrator can create, edit, and deactivate income and expense categories.

### Financial Movements

- [ ] **MOVE-01**: A family member can record an income with amount, date, account, category, and description.
- [ ] **MOVE-02**: A family member can record an expense with amount, date, account, category, and description.
- [ ] **MOVE-03**: A user can transfer an amount between two accounts; the debit and credit persist atomically, and the transfer does not count as income or expense.
- [ ] **MOVE-04**: A user can cancel or correct a movement while preserving its original record and an auditable link to the resulting event.
- [ ] **MOVE-05**: Repeated submissions or retries of a movement request do not create duplicate financial records.

### History

- [ ] **HIST-01**: A user can browse financial movements and filter them by date range, account, category, and movement type.
- [ ] **HIST-02**: The history identifies cancellations and corrections and lets an authorized user inspect their related audit events.

### Dashboard and Monthly Summary

- [ ] **DASH-01**: The dashboard displays balances by account and consolidated balance calculated from persisted financial records, with no demonstration data.
- [ ] **DASH-02**: The selected month's summary displays income, expenses, and net cash flow derived from persisted records, excluding transfers from income and expense totals.
- [ ] **DASH-03**: The selected month's dashboard displays expense totals by category, derived from persisted records.

### Daily Reconciliation

- [ ] **RECN-01**: A family member can submit a daily reported balance for an account, and the system records the calculated balance for the same date, the variance, timestamp, and responsible user.
- [ ] **RECN-02**: An administrator can review a discrepancy and record a rationale or link an approved corrective movement while preserving the original reconciliation and financial history.
- [ ] **RECN-03**: An authorized user can inspect prior reconciliations and identify discrepancies that still need review.

### Mobile Experience and Financial Validation

- [ ] **UX-01**: The primary account, movement, history, and reconciliation flows are responsive and usable on a smartphone with simple, low-interaction forms.
- [ ] **TEST-01**: Automated tests cover critical money, balance, transfer, cancellation, reconciliation, authorization, and family-isolation rules.

## v2 Requirements

Deferred until the basic financial operation has been validated with the family.

### Debts and Commitments

- **DEBT-01**: An administrator can register debts and creditors and review the outstanding balance.
- **DEBT-02**: A user can track installments, due dates, partial payments, and remaining amounts for a debt.
- **DEBT-03**: A user can manage recurring household commitments and their expected due dates.

### Assisted Statement Import

- **IMPT-01**: An administrator can paste a financial statement message and review proposed income, expense, and balance records before confirming any persistence.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Operating multiple independent families or self-service family onboarding | The MVP serves one family; data scoping must support safe future expansion without adding multi-family operations now. |
| Automatic WhatsApp parsing or posting without human confirmation | Financial records must not be created from uncertain interpretation; assisted import is deferred and requires review. |
| Bank aggregation or automatic bank-feed imports | The first operational delivery focuses on family-entered records and daily reconciliation. |
| Native mobile application or offline/PWA synchronization | The MVP is a responsive web application; native and offline workflows can be evaluated later. |
| Advanced budgeting, investment planning, and automated financial recommendations | The MVP establishes reliable operational records before planning and intelligence features. |

## Traceability

The roadmap will assign each v1 requirement to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21

---
*Requirements defined: 2026-10-23*
*Last updated: 2026-10-23 after MVP scope approval*
