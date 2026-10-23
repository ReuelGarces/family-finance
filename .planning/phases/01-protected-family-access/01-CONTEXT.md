# Phase 1 — Protected Family Access

**Date:** 2026-10-23
**Status:** Ready for planning
**Milestone:** Family Finance MVP v1

## Objective

Protect all financial reads and writes through authenticated family membership and existing role-based authorization.

## Existing Architecture

- Next.js with TypeScript.
- Auth.js authentication.
- User roles: ADMIN and FAMILY.
- Prisma with PostgreSQL.
- FinancialAccount, Category, Transaction and Transfer.
- AuditLog for financial activity.
- Production deployment through Coolify.

Existing validated functionality must be reused.

## Architectural Decisions

### 1. Authentication

Preserve the existing login, credential and session mechanisms.

Do not introduce public registration.

Do not recreate the authentication subsystem.

### 2. Authorization

ADMIN can configure financial accounts and categories, manage permitted transactions and inspect audit history.

FAMILY can access authorized family financial information and perform permitted financial operations.

Authorization must be enforced server-side.

Client-side role checks are not security boundaries.

### 3. Family Isolation

The first operational release serves one family.

The data model must establish explicit family ownership or membership so future multi-family expansion is possible.

The authorized family scope must be derived from the authenticated server-side identity.

Never accept a client-provided family identifier as authorization.

Every relevant financial read and write must enforce that scope.

### 4. Database Compatibility

Preserve existing users, financial tables and audit history.

Prefer additive, incremental Prisma migrations.

Plan existing-record backfills before introducing required family relationships.

Avoid destructive schema changes.

No production migration without an approved backup and deployment procedure.

### 5. Financial Integrity

Preserve Decimal(14,2) financial precision.

Preserve atomic transfers and audit records.

Do not alter opening balances or existing financial events merely to establish family membership.

## Requirements

AUTH-01: Existing ADMIN and FAMILY login remains functional.

AUTH-02: Roles enforce distinct permitted operations.

AUTH-03: Cross-family access is rejected for every financial read and write.

## Acceptance Criteria

1. Existing authenticated users retain access.
2. Unauthorized requests cannot read family financial records.
3. Unauthorized requests cannot mutate family financial records.
4. FAMILY cannot escalate to ADMIN.
5. Financial services derive family scope from the server.
6. Migration preserves existing users and financial history.
7. Automated authorization and isolation tests pass.

## Execution Policy

Use GSD-Core to research and plan this phase.

Implementation agents may modify code only under an approved phase plan.

Execute work on the isolated phase branch.

Use a pull request before merging to main.

Review migration safety and authorization tests before approval.

Do not modify the production database during planning.

## Out of Scope

- Rebuilding the dashboard.
- Implementing financial entry forms.
- Importing WhatsApp records.
- Debt management.
- Multi-family onboarding.
- Production data migration during this planning task.

## Next Action

Generate the GSD-Core implementation plans for Phase 1, reusing the existing architecture and tests.
