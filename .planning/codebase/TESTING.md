---
last_mapped_commit: e71d371f0b1a0bb7717760e1980d0ce50cf0072c
last_mapped_at: 2026-10-23
---
# Testing Patterns

**Analysis Date:** 2026-10-23

## Test Framework

**Runner:**
- Node.js built-in test runner via `node --import tsx --test tests/*.test.ts`, configured as the `test` script in `package.json`.
- TypeScript test files run through `tsx`; no Jest or Vitest configuration is present.

**Assertion Library:**
- Node's strict assertions from `node:assert/strict` are used in all tests, including `tests/finance-money.test.ts` and `tests/finance-authorization.test.ts`.

**Run Commands:**

```bash
npm test                 # Run all tests
npm run lint             # Lint source and tests
npm run typecheck        # Type-check without emitting
```

- No dedicated watch or coverage command is defined in `package.json`.

## Test File Organization

**Location:**
- Tests are kept in the top-level `tests/` directory, separate from `src/`.

**Naming:**
- Name files by domain area with `.test.ts`, such as `tests/finance-money.test.ts`, `tests/finance-authorization.test.ts`, and `tests/finance-postgres.test.ts`.

**Structure:**

```
tests/
├── finance-money.test.ts          # pure monetary calculations and validation
├── finance-authorization.test.ts  # role and edit-window rules
└── finance-postgres.test.ts       # Prisma/PostgreSQL persistence integration
```

## Test Structure

**Suite Organization:**

```typescript
import assert from "node:assert/strict";
import test from "node:test";

test("describes one business rule", () => {
  assert.equal(actual, expected);
});
```

**Patterns:**
- Use one top-level `test(...)` per business behavior, with Portuguese descriptions matching the application domain (`tests/finance-money.test.ts`).
- Keep pure unit tests deterministic and construct inputs inline.
- Use `assert.doesNotThrow` for allowed authorization paths and `assert.throws(..., DomainError)` for denied paths (`tests/finance-authorization.test.ts`).
- Use table-like loops for equivalent invalid inputs, as in the rejected money values in `tests/finance-money.test.ts`.

## Mocking

**Framework:**
- No mocking library or test double framework is present.

**Patterns:**

```typescript
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

test("database behavior", { skip: !testDatabaseUrl }, async () => {
  // use an isolated integration database and clean it in finally
});
```

**What to Mock:**
- Pure calculations and authorization receive literal objects directly; do not mock these modules (`tests/finance-money.test.ts`, `tests/finance-authorization.test.ts`).
- Database integration tests use a real Prisma PostgreSQL adapter when `TEST_DATABASE_URL` is configured (`tests/finance-postgres.test.ts`).

**What NOT to Mock:**
- Do not replace Prisma persistence in the PostgreSQL integration test; it verifies constraints, relationships, Decimal values, and cancellation behavior against the database.

## Fixtures and Factories

**Test Data:**
- Tests use local constants and inline objects, such as `admin`, `family`, and `ownRecentEntry` in `tests/finance-authorization.test.ts`.
- Database records use a per-test `randomUUID()` marker to avoid collisions, as in `tests/finance-postgres.test.ts`.

**Location:**
- No shared fixture or factory directory is detected. Keep small fixtures near the test that owns the behavior unless reuse becomes necessary.

## Coverage

**Requirements:**
- No coverage threshold or coverage configuration is detected.

**View Coverage:**

```bash

# Not configured

```

## Test Types

**Unit Tests:**
- Pure monetary arithmetic, formatting, parsing, and schema rejection are covered in `tests/finance-money.test.ts`.
- Role permissions and the 24-hour FAMILY edit rule are covered in `tests/finance-authorization.test.ts`.

**Integration Tests:**
- `tests/finance-postgres.test.ts` exercises Prisma persistence, relationships, Decimal precision, cancellation fields, transfer records, and a database-level invalid amount rejection.
- The integration test is skipped unless `TEST_DATABASE_URL` is set; a skipped run does not provide database coverage.

**E2E Tests:**
- No browser or end-to-end test framework is detected.

## Common Patterns

**Async Testing:**

```typescript
test("persists records", { skip: !testDatabaseUrl }, async () => {
  try {
    await db.transaction.create({ data: input });
  } finally {
    await db.$disconnect();
  }
});
```

**Error Testing:**

```typescript
assert.throws(() => parsePositiveMoney(value));
await assert.rejects(operation(), (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError,
);
```

- Prefer checking the domain error class or a stable persisted property over matching incidental error text.

---

*Testing analysis: 2026-10-23*
