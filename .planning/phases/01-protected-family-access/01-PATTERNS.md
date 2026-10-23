# Phase 01: Protected Family Access - Pattern Map

**Mapped:** 2026-10-23  
**Files analyzed:** 14 planned source/test files  
**Analogs found:** 14 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `prisma/schema.prisma` | model/config | CRUD | `prisma/schema.prisma` | exact |
| `prisma/migrations/<timestamp>_protected_family_access/migration.sql` | migration | batch | `prisma/migrations/20261021130000_financial_domain_foundation/migration.sql` | role-match |
| `src/lib/auth/guards.ts` | middleware/guard | request-response | `src/lib/auth/guards.ts` | exact |
| `src/lib/finance/types.ts` | utility/type | transform | `src/lib/finance/types.ts` | exact |
| `src/lib/finance/audit.ts` | service | CRUD | `src/lib/finance/audit.ts` | exact |
| `src/lib/finance/services/references.ts` | service | request-response | `src/lib/finance/services/references.ts` | exact |
| `src/lib/finance/services/accounts.ts` | service | CRUD | `src/lib/finance/services/accounts.ts` | exact |
| `src/lib/finance/services/categories.ts` | service | CRUD | `src/lib/finance/services/categories.ts` | exact |
| `src/lib/finance/services/queries.ts` | service | request-response | `src/lib/finance/services/queries.ts` | exact |
| `src/lib/finance/services/transactions.ts` | service | CRUD | `src/lib/finance/services/transactions.ts` | exact |
| `src/lib/finance/services/transfers.ts` | service | CRUD | `src/lib/finance/services/transfers.ts` | exact |
| `tests/finance-authorization.test.ts` | test | request-response | `tests/finance-authorization.test.ts` | exact |
| `tests/family-isolation.test.ts` | test | CRUD | `tests/finance-postgres.test.ts` | role-match |
| `tests/finance-postgres.test.ts` | test | batch | `tests/finance-postgres.test.ts` | exact |

`src/auth.ts` is an inspected dependency, not a planned edit: Phase 01 preserves its Credentials/JWT/session mechanism. `prisma/seed.ts` is also an inspected dependency; do not use it for an unreviewed production backfill.

## Pattern Assignments

### `prisma/schema.prisma` (model/config, CRUD)

**Analog:** `prisma/schema.prisma`

**Relation and constraint pattern** (lines 44-76, 78-155):

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique @db.VarChar(254)
  role      UserRole
  auditLogs AuditLog[]
  @@index([role, isActive])
}

model Transaction {
  accountId String
  categoryId String
  authorId  String
  account FinancialAccount @relation(fields: [accountId], references: [id], onDelete: Restrict)
  @@index([accountId, occurredOn, status])
}
```

Create `Family` and `FamilyMembership` as the primary representation. Model memberships explicitly and retain `User.role` for this phase until technical review decides whether membership roles are required. Add nullable ownership fields during expand/backfill, then make constraints required only in the reviewed follow-up step. Preserve existing decimal declarations and Restrict relationships.

### `prisma/migrations/<timestamp>_protected_family_access/migration.sql` (migration, batch)

**Analog:** `prisma/migrations/20261021130000_financial_domain_foundation/migration.sql`

**Additive table, index, and foreign-key pattern** (lines 7-29, 67-81, 109-135):

```sql
CREATE TABLE "FinancialAccount" (...);
CREATE INDEX "FinancialAccount_status_referenceDate_idx"
  ON "FinancialAccount"("status", "referenceDate");

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
```

The migration must be additive: create the family and membership tables, add nullable family ownership fields, deterministically create/backfill the legacy family, validate before required constraints, and preserve User, financial amounts/dates, and AuditLog history. The current migration is a syntax and constraint analog, not a backfill analog.

### `src/lib/auth/guards.ts` and `src/lib/finance/types.ts` (guard/type, request-response)

**Analog:** `src/lib/auth/guards.ts`

**Fresh server-side actor resolution** (lines 1-24):

```ts
import "server-only";

export async function requireUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user?.isActive) redirect("/login");
  return user;
}
```

Extend this path with a server-only `requireFamilyScope` (or extend its returned actor) that obtains the family through live membership selected from the authenticated `id`. The helper takes no client family ID. Keep the `FinanceActor` convention in `src/lib/finance/types.ts:1-6`, expanding it only with trusted scope data used internally by services.

### `src/lib/finance/audit.ts` (service, CRUD)

**Analog:** `src/lib/finance/audit.ts`

**Transaction-client audit append** (lines 1-22):

```ts
export async function recordAudit(db: Prisma.TransactionClient, input: {
  actorId: string; action: string; entityType: string; entityId: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await db.auditLog.create({ data: { ...input } });
}
```

After technical review selects direct audit ownership or a safe relational strategy, pass the resolved family data through this helper and write it with the same transaction client as the financial mutation. Do not make audit persistence a separate write.

### `src/lib/finance/services/references.ts` (service, request-response)

**Analog:** `src/lib/finance/services/references.ts`

**In-transaction reference validation** (lines 15-51, 54-82):

```ts
const [account, category] = await Promise.all([
  db.financialAccount.findUnique({ where: { id: input.accountId } }),
  db.category.findUnique({ where: { id: input.categoryId } }),
]);
if (!account) throw new FinanceNotFoundError("Conta financeira não encontrada.");
if (account.status !== "ACTIVE") throw new FinanceConflictError(...);
```

Accept the trusted server scope as an additional internal argument and replace global ID lookups with family predicates. Apply it to account/category validation and both transfer endpoints. Retain the current conflict/not-found checks and run them inside the caller transaction.

### `src/lib/finance/services/accounts.ts` and `src/lib/finance/services/categories.ts` (service, CRUD)

**Analogs:** `src/lib/finance/services/accounts.ts`, `src/lib/finance/services/categories.ts`

**Service entry, policy, transaction, audit pattern** (`accounts.ts:20-52`; `categories.ts:23-53`):

```ts
const user = await requireAdmin();
const actor = toActor(user);
assertCanManageCatalog(actor);
const data = createFinancialAccountSchema.parse(input);

return prisma.$transaction(async (db) => {
  const account = await db.financialAccount.create({ data });
  await recordAudit(db, { actorId: actor.id, action: "FINANCIAL_ACCOUNT_CREATED", ... });
  return account;
});
```

Keep ADMIN catalog policy and Zod parsing. Replace `requireUser`/`requireAdmin` use with the scope-bearing guard as appropriate; lists include `familyId`, creates assign only the resolved family, and updates first load the object with the family predicate before history checks and audit append. Preserve existing opening-basis and category-history conflict handling (`accounts.ts:79-92`, `categories.ts:72-76`).

### `src/lib/finance/services/queries.ts` (service, request-response)

**Analog:** `src/lib/finance/services/queries.ts`

**Read authorization plus parallel aggregate query pattern** (lines 35-73, 99-119):

```ts
const user = await requireUser();
assertCanReadFinance(toActor(user));
const [accounts, transactions, transfers] = await Promise.all([
  prisma.financialAccount.findMany({ orderBy: { name: "asc" } }),
  prisma.transaction.findMany({ where: { status: "POSTED", occurredOn: { lte: asOf } } }),
  prisma.transfer.findMany({ where: { status: "POSTED", transferredOn: { lte: asOf } } }),
]);
```

Resolve scope before each read. Account balance must load its account with family scope before its aggregate reads; consolidated summary and all list queries must add scope predicates while retaining date/status filters and Decimal calculations.

### `src/lib/finance/services/transactions.ts` and `src/lib/finance/services/transfers.ts` (service, CRUD)

**Analogs:** `src/lib/finance/services/transactions.ts`, `src/lib/finance/services/transfers.ts`

**Atomic validate, mutate, audit sequence** (`transactions.ts:53-75`, `116-197`; `transfers.ts:49-71`, `111-190`):

```ts
return prisma.$transaction(async (db) => {
  await validateTransactionReferences(db, data);
  const transaction = await db.transaction.create({
    data: { ...data, authorId: actor.id },
  });
  await recordAudit(db, {
    actorId: actor.id, action: "TRANSACTION_CREATED",
    entityType: "Transaction", entityId: transaction.id,
    metadata: transactionAuditValue(transaction),
  });
  return transaction;
});
```

Resolve family scope before the transaction; pass it to reference validation; scope every `findMany`, target load, and update/cancel target lookup. Keep `assertCanModifyEntry` after the scoped target is obtained, and preserve the single transaction around validation, mutation, and audit. Transfer validation must prove both accounts are in the same scope.

### `tests/finance-authorization.test.ts` (test, request-response)

**Analog:** `tests/finance-authorization.test.ts`

**Node test and domain-error assertions** (lines 1-49):

```ts
test("somente ADMIN administra o catálogo financeiro", () => {
  assert.doesNotThrow(() => assertCanManageCatalog(admin));
  assert.throws(() => assertCanManageCatalog(family), FinanceAuthorizationError);
});
```

Extend the existing test style for ADMIN/FAMILY policy only if the scope type changes. Keep role policy separate from data-isolation integration coverage.

### `tests/family-isolation.test.ts` and `tests/finance-postgres.test.ts` (test, CRUD/batch)

**Analog:** `tests/finance-postgres.test.ts`

**Isolated PostgreSQL fixture/cleanup pattern** (lines 7-24, 25-42, 157-170):

```ts
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
test("...", { skip: !testDatabaseUrl }, async () => {
  const adapter = new PrismaPg({ connectionString: testDatabaseUrl! });
  const db = new PrismaClient({ adapter });
  const marker = randomUUID();
  try { /* unique fixture rows */ }
  finally { /* delete by captured IDs; await db.$disconnect(); */ }
});
```

Create two families with distinct memberships and scoped financial roots. Assert foreign IDs cannot be read, mutated, canceled, used as transaction references, or used as either transfer endpoint; assert lists and summaries omit the other family. Preserve the marker-based fixture isolation and reverse-order cleanup, updated for the new foreign keys.

## Shared Patterns

### Authoritative actor and role policy

**Sources:** `src/lib/auth/guards.ts:7-34`, `src/lib/finance/authorization.ts:12-48`

```ts
export function assertCanManageCatalog(actor: FinanceActor): void {
  if (actor.role !== "ADMIN") {
    throw new FinanceAuthorizationError("Somente o ADMIN pode administrar contas e categorias.");
  }
}
```

Apply to every finance service after fresh server-side identity and membership resolution. JWT/session claims may identify the session; a live Prisma membership lookup supplies the family authority.

### Typed domain failures

**Source:** `src/lib/finance/errors.ts:10-34`

```ts
export class FinanceNotFoundError extends Error {
  readonly code = "FINANCE_NOT_FOUND";
}
export class FinanceConflictError extends Error {
  readonly code = "FINANCE_CONFLICT";
}
```

Use the existing not-found shape for an out-of-scope identifier after technical review confirms the desired disclosure policy; retain conflict errors for invalid state.

### Atomic financial writes and audit history

**Sources:** `src/lib/finance/services/transactions.ts:59-75`, `src/lib/finance/audit.ts:3-22`

All writes must keep scoped reference checking, write/cancel/update, and audit insertion in the existing `prisma.$transaction` callback. This preserves the financial and audit atomicity already established by the project.

## No Analog Found

| File/Concern | Role | Data Flow | Reason |
|---|---|---|---|
| `Family` / `FamilyMembership` semantic cardinality | model | CRUD | The repository has no tenant or membership model. Copy Prisma relation syntax, but make the canonical Family + FamilyMembership design decision explicit in the plan. |
| Legacy single-family data backfill | migration | batch | Existing migrations only establish empty financial-domain structures. Plan the deterministic backfill and validation proof before constraints become required. |
| Audit ownership design | model/service | CRUD | AuditLog currently links only to actor and entity metadata; direct versus derived family ownership remains open for technical review. |

## Metadata

**Analog search scope:** `prisma/`, `src/auth.ts`, `src/lib/auth/`, `src/lib/finance/`, `tests/`  
**Tracked-source check:** All named analog files were confirmed by `git ls-files`.  
**Files scanned:** 16  
**Pattern extraction date:** 2026-10-23
