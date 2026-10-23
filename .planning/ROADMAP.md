# Roadmap: Family Finance

## Overview

O MVP evolui a base existente de Next.js, Prisma, Auth.js e serviços financeiros para uma operação familiar confiável. A sequência primeiro protege o espaço financeiro e seus papéis, depois prepara contas e categorias, registra fatos financeiros íntegros, torna o histórico e o resumo mensal consultáveis e encerra com a conciliação diária, experiência móvel e evidência automatizada das regras críticas.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Protected Family Access** - Give each authenticated person only the finance data and actions allowed for their family role.
- [ ] **Phase 2: Accounts and Categories** - Let administrators prepare accounts, opening balances, and active financial categories.
- [ ] **Phase 3: Reliable Movement Capture** - Let family members post, transfer, correct, and safely retry real financial movements.
- [ ] **Phase 4: Financial History and Monthly View** - Turn persisted movements into filterable history, current balances, and a real monthly dashboard.
- [ ] **Phase 5: Daily Reconciliation and Mobile Confidence** - Close the daily ledger loop with auditable reconciliation, phone-first workflows, and critical-rule evidence.

## Phase Details

### Phase 1: Protected Family Access
**Goal**: Family members enter a protected finance space with permissions that match their role and data limited to their authorized family.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. Administrators and family members can sign in through the existing credential and session flow.
  2. A family member can use only the finance actions allowed to the FAMILY role, while an administrator can configure and review finance data without a role escalation path.
  3. A request for another family's finance data or a finance write outside the authenticated session's family is rejected server-side and reveals no financial data.
**Plans**: TBD

### Phase 2: Accounts and Categories
**Goal**: Administrators can prepare the accounts and categories that make family movements meaningful and historically bounded.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: ACCT-01, ACCT-02, CAT-01
**Success Criteria** (what must be TRUE):
  1. An administrator can create, edit, and deactivate bank, wallet, and cash accounts through an administrative form.
  2. An administrator can set an account's opening balance and reference date, and its displayed calculated balance includes that starting point.
  3. An administrator can create, edit, and deactivate distinct income and expense categories so the active catalog is ready for movement entry.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Reliable Movement Capture
**Goal**: Family members can record real financial facts once, move money between accounts correctly, and preserve evidence when a fact changes.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: MOVE-01, MOVE-02, MOVE-03, MOVE-04, MOVE-05
**Success Criteria** (what must be TRUE):
  1. A family member can submit a simple mobile form for an income with amount, date, account, category, and description, and the movement is persisted once.
  2. A family member can submit an expense with amount, date, account, category, and description, and the movement is persisted once.
  3. A user can transfer money between two accounts and receive one atomic debit-and-credit result that is identified as a transfer rather than income or expense.
  4. A user can cancel or correct a movement without erasing its original record, and retrying the same submission does not create another financial record.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Financial History and Monthly View
**Goal**: Family members can inspect persisted financial history and understand current and monthly financial results without demonstration data.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: HIST-01, HIST-02, DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. A user can browse financial movements and filter the history by date range, account, category, and movement type.
  2. A user can see which movements were cancelled or corrected, and an authorized user can inspect their related audit events.
  3. The dashboard shows per-account and consolidated balances calculated only from the family's persisted financial records.
  4. For a selected month, the dashboard shows income, expenses, net cash flow, and expense totals by category while excluding transfers from income and expense totals.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Daily Reconciliation and Mobile Confidence
**Goal**: The family can reconcile daily balances without rewriting financial history and complete the full MVP workflow simply on a smartphone.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: RECN-01, RECN-02, RECN-03, UX-01, TEST-01
**Success Criteria** (what must be TRUE):
  1. A family member can submit a daily reported balance for an account and see the calculated balance for that date, variance, timestamp, and responsible user recorded with it.
  2. An administrator can review a discrepancy, record a rationale or link an approved corrective movement, and retain the original reconciliation and financial history.
  3. An authorized user can inspect prior reconciliations and identify discrepancies that still need review.
  4. A family member can complete the primary account, movement, history, and reconciliation workflows on a smartphone through responsive, low-interaction forms.
  5. Automated coverage demonstrates that invalid money, balance, transfer, cancellation, reconciliation, authorization, and family-isolation scenarios cannot silently corrupt financial results.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Protected Family Access | 0/TBD | Not started | - |
| 2. Accounts and Categories | 0/TBD | Not started | - |
| 3. Reliable Movement Capture | 0/TBD | Not started | - |
| 4. Financial History and Monthly View | 0/TBD | Not started | - |
| 5. Daily Reconciliation and Mobile Confidence | 0/TBD | Not started | - |
