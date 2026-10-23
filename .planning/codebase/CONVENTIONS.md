---
last_mapped_commit: e71d371f0b1a0bb7717760e1980d0ce50cf0072c
last_mapped_at: 2026-10-23
---
# Coding Conventions

**Analysis Date:** 2026-10-23

## Naming Patterns

**Files:**
- Use lowercase kebab case for React components, such as `src/components/auth/login-form.tsx` and `src/components/dashboard/sign-out-button.tsx`.
- Use lowercase names for domain modules, with grouped services under `src/lib/finance/services/`.
- Test files use the feature prefix followed by `.test.ts`, for example `tests/finance-money.test.ts`.

**Functions:**
- Use camelCase for functions and exported service operations, such as `calculateAccountBalance` in `src/lib/finance/money.ts` and `createTransfer` in `src/lib/finance/services/transfers.ts`.
- Use `assert...` for authorization and invariant checks, such as `assertCanReadFinance` in `src/lib/finance/authorization.ts`.
- Use `parse...` for input conversion and validation helpers, such as `parseDateOnly` in `src/lib/finance/validation.ts`.

**Variables:**
- Use camelCase for local values and parameters.
- Use descriptive domain names (`accountId`, `referenceDate`, `transfersOut`) rather than abbreviations, as shown in `src/lib/finance/services/queries.ts`.
- Use UPPER_SNAKE_CASE for module constants, such as `MONEY_PATTERN` in `src/lib/finance/money.ts`.

**Types:**
- Use PascalCase for exported types (`FinanceActor`, `DecimalInput`) in `src/lib/finance/types.ts` and `src/lib/finance/money.ts`.
- Use string literal unions for domain roles, statuses, and operation types, as in `src/lib/finance/authorization.ts` and `prisma/schema.prisma`.
- Use `type` declarations for structural data and `interface` only where framework augmentation requires it, as in `src/types/next-auth.d.ts`.

## Code Style

**Formatting:**
- TypeScript and TSX use double quotes, semicolons, trailing commas, and two space indentation, consistent across `src/lib/finance/money.ts` and `tests/finance-money.test.ts`.
- Keep JSX props and imported icons readable across multiple lines, as in `src/components/dashboard/overview.tsx`.
- No Prettier configuration is present; preserve the established ESLint and TypeScript style manually.

**Linting:**
- Run ESLint through `npm run lint` using `eslint.config.mjs`.
- The config combines `@eslint/js` recommended rules with `typescript-eslint` recommended rules and ignores `.next/**`, `node_modules/**`, `src/generated/**`, and `next-env.d.ts`.
- Keep strict TypeScript compatibility with `tsconfig.json`, which enables `strict`, `isolatedModules`, and `noEmit`.

## Import Organization

**Order:**
1. Node and external packages (`node:test`, `@prisma/...`, `next/...`).
2. Project absolute imports through the `@/*` alias.
3. Relative project imports, with type-only imports explicitly marked where useful.

**Path Aliases:**
- Use `@/*` for `src/*`, configured in `tsconfig.json`; examples include `@/lib/prisma` and `@/generated/prisma/client`.
- Prefer aliases across application layers and relative imports for nearby finance modules, as in `src/lib/finance/services/transfers.ts`.

## Error Handling

**Patterns:**
- Validate untrusted inputs with Zod schemas in `src/lib/finance/validation.ts` before service operations persist data.
- Throw domain-specific errors from `src/lib/finance/errors.ts` for authorization, not-found, and conflict conditions.
- Use `try/finally` for integration tests that create database records, ensuring cleanup and `$disconnect()` in `tests/finance-postgres.test.ts`.
- Preserve transactional consistency by wrapping multi-step writes and audit records in `prisma.$transaction`, as in `src/lib/finance/services/transfers.ts`.

## Logging

**Framework:**
- No application logging framework or logging wrapper is detected.

**Patterns:**
- Domain services return values or throw typed errors; they do not log normal control flow. Follow `src/lib/finance/services/queries.ts` for this behavior.

## Comments

**When to Comment:**
- Comments are sparse; encode business rules in names, schemas, and explicit checks. Keep comments for non-obvious domain constraints, as documented in `docs/financial-domain.md`.

**JSDoc/TSDoc:**
- No consistent JSDoc/TSDoc usage is detected. Prefer explicit types and focused helper names.

## Function Design

**Size:**
- Keep pure calculations small and composable, as in `src/lib/finance/money.ts`.
- Service functions may coordinate authorization, validation, Prisma persistence, and audit recording, as in `src/lib/finance/services/transactions.ts`.

**Parameters:**
- Accept `unknown` at service boundaries and parse it with a Zod schema (`src/lib/finance/services/accounts.ts`).
- Use object parameters for multi-field calculations and query options (`src/lib/finance/money.ts`, `src/lib/finance/services/queries.ts`).

**Return Values:**
- Return typed domain or Prisma records from services; return formatted strings for money at presentation boundaries using `decimalToString` in `src/lib/finance/money.ts`.
- Use `undefined` for optional filters and `null` for nullable persisted fields, matching Prisma query construction in `src/lib/finance/services/queries.ts`.

## Module Design

**Exports:**
- Export public domain operations as named exports, for example `src/lib/finance/services/index.ts` and `src/lib/finance/index.ts`.
- Keep implementation helpers private unless another module needs them.

**Barrel Files:**
- Barrel modules exist for finance services and the finance domain (`src/lib/finance/services/index.ts`, `src/lib/finance/index.ts`); add public exports there when extending the API.

---

*Convention analysis: 2026-10-23*
