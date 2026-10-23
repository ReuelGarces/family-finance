<!-- GSD:project-start source:PROJECT.md -->

## Project

**Family Finance**

O Family Finance é uma aplicação web de gestão financeira familiar para ajudar uma família a sair de registros financeiros dispersos e entender, com confiança, o dinheiro disponível, as receitas, as despesas e os compromissos. A interface será especialmente simples e responsiva para uso pelos pais em celulares, enquanto o administrador acompanha os dados, orienta o planejamento e trata inconsistências.

**Core Value:** A família consegue registrar movimentações reais com facilidade e confiar que cada saldo e resumo representa o histórico financeiro auditável.

### Constraints

- **Tecnologia**: Evoluir a aplicação Next.js/TypeScript com Prisma e PostgreSQL existentes — preservar a infraestrutura e evitar reconstruir componentes que já funcionam.
- **Integridade financeira**: Usar precisão monetária e regras explícitas; transferências não podem inflar receitas ou despesas — os saldos devem permanecer reconciliáveis.
- **Rastreabilidade**: Divergências e correções precisam deixar histórico auditável — não sobrescrever silenciosamente lançamentos financeiros anteriores.
- **Segurança**: Proteger dados por autenticação, autorização e isolamento de família — a informação é privada e pode se expandir para múltiplas famílias no futuro.
- **Experiência**: Priorizar fluxos responsivos, simples e com poucas interações em celulares — os usuários familiares podem ter pouca familiaridade tecnológica.
- **Entrega**: Avançar em etapas com critérios de aceitação e validação antes da próxima etapa — o trabalho deve reutilizar a base atual.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.9 - application, domain services, tests, Prisma configuration, and seed in `src/`, `tests/`, and `prisma/`
- CSS - Tailwind/PostCSS styling in `src/app/globals.css`
- SQL - PostgreSQL migrations in `prisma/migrations/`
- Shell - container startup orchestration in `scripts/start.sh`

## Runtime

- Node.js 24 or newer, declared in `package.json` and used by `Dockerfile` and `.github/workflows/ci.yml`
- npm
- Lockfile: present (`package-lock.json`)

## Frameworks

- Next.js 16.4.2 - React App Router application and server routes in `src/app/`
- React 19.3.1 / React DOM 19.3.1 - UI components in `src/components/` and `src/app/`
- Auth.js / NextAuth 5.0.0-beta.32 - credential authentication in `src/auth.ts`
- Prisma 7.10.1 - PostgreSQL schema, migrations, generated client, and data access in `prisma/` and `src/lib/prisma.ts`
- Node test runner with `tsx` - tests under `tests/`, invoked by `npm test`
- TypeScript 5.9.0 - strict type checking through `tsconfig.json`
- ESLint 10.13.0 with `eslint.config.mjs` - linting via `npm run lint`
- Tailwind CSS 4.3.3 and `@tailwindcss/postcss` - styling build through `postcss.config.mjs`
- Next Turbopack - development server via `npm run dev`

## Key Dependencies

- `@prisma/client` 7.10.1 and `@prisma/adapter-pg` 7.10.1 - typed PostgreSQL persistence in `src/lib/prisma.ts`
- `pg` 8.23.1 - PostgreSQL driver used by Prisma adapter
- `next-auth` 5.0.0-beta.32 - session and credentials flow in `src/auth.ts`
- `bcryptjs` 3.0.3 - password hashing and verification in `src/auth.ts` and `prisma/seed.ts`
- `zod` 4.6.7 - credential and domain input validation in `src/lib/auth/schema.ts` and `src/lib/finance/validation.ts`
- `dotenv` 18.0.8 - loads local environment configuration in `prisma.config.ts` and `prisma/seed.ts`
- `recharts` 3.10.1 - dashboard charts in `src/components/dashboard/overview-charts.tsx`
- `lucide-react` 1.59.0 - interface icons in UI components

## Configuration

- Runtime configuration is supplied through environment variables; `.env.example` exists and `.env` is gitignored. Do not commit credentials.
- `DATABASE_URL` is required by `prisma.config.ts` and `src/lib/prisma.ts`; authentication and initial-account variables are consumed by `src/auth.ts` and `prisma/seed.ts`.
- `next.config.ts` enables standalone output.
- `tsconfig.json` enables strict TypeScript and `@/*` to `src/*` path aliases.
- `Dockerfile` performs a multi-stage npm install, Prisma generation, Next build, and production standalone image.
- `prisma.config.ts` defines schema, migration path, and seed command.

## Platform Requirements

- Node.js 24+, npm, and Docker Compose with PostgreSQL 17; see `README.md`.
- Node 24 Alpine container from `Dockerfile`, PostgreSQL 17 service/volume from `docker-compose.yml`, or a private PostgreSQL endpoint on Coolify as documented in `README.md`.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Use lowercase kebab case for React components, such as `src/components/auth/login-form.tsx` and `src/components/dashboard/sign-out-button.tsx`.
- Use lowercase names for domain modules, with grouped services under `src/lib/finance/services/`.
- Test files use the feature prefix followed by `.test.ts`, for example `tests/finance-money.test.ts`.
- Use camelCase for functions and exported service operations, such as `calculateAccountBalance` in `src/lib/finance/money.ts` and `createTransfer` in `src/lib/finance/services/transfers.ts`.
- Use `assert...` for authorization and invariant checks, such as `assertCanReadFinance` in `src/lib/finance/authorization.ts`.
- Use `parse...` for input conversion and validation helpers, such as `parseDateOnly` in `src/lib/finance/validation.ts`.
- Use camelCase for local values and parameters.
- Use descriptive domain names (`accountId`, `referenceDate`, `transfersOut`) rather than abbreviations, as shown in `src/lib/finance/services/queries.ts`.
- Use UPPER_SNAKE_CASE for module constants, such as `MONEY_PATTERN` in `src/lib/finance/money.ts`.
- Use PascalCase for exported types (`FinanceActor`, `DecimalInput`) in `src/lib/finance/types.ts` and `src/lib/finance/money.ts`.
- Use string literal unions for domain roles, statuses, and operation types, as in `src/lib/finance/authorization.ts` and `prisma/schema.prisma`.
- Use `type` declarations for structural data and `interface` only where framework augmentation requires it, as in `src/types/next-auth.d.ts`.

## Code Style

- TypeScript and TSX use double quotes, semicolons, trailing commas, and two space indentation, consistent across `src/lib/finance/money.ts` and `tests/finance-money.test.ts`.
- Keep JSX props and imported icons readable across multiple lines, as in `src/components/dashboard/overview.tsx`.
- No Prettier configuration is present; preserve the established ESLint and TypeScript style manually.
- Run ESLint through `npm run lint` using `eslint.config.mjs`.
- The config combines `@eslint/js` recommended rules with `typescript-eslint` recommended rules and ignores `.next/**`, `node_modules/**`, `src/generated/**`, and `next-env.d.ts`.
- Keep strict TypeScript compatibility with `tsconfig.json`, which enables `strict`, `isolatedModules`, and `noEmit`.

## Import Organization

- Use `@/*` for `src/*`, configured in `tsconfig.json`; examples include `@/lib/prisma` and `@/generated/prisma/client`.
- Prefer aliases across application layers and relative imports for nearby finance modules, as in `src/lib/finance/services/transfers.ts`.

## Error Handling

- Validate untrusted inputs with Zod schemas in `src/lib/finance/validation.ts` before service operations persist data.
- Throw domain-specific errors from `src/lib/finance/errors.ts` for authorization, not-found, and conflict conditions.
- Use `try/finally` for integration tests that create database records, ensuring cleanup and `$disconnect()` in `tests/finance-postgres.test.ts`.
- Preserve transactional consistency by wrapping multi-step writes and audit records in `prisma.$transaction`, as in `src/lib/finance/services/transfers.ts`.

## Logging

- No application logging framework or logging wrapper is detected.
- Domain services return values or throw typed errors; they do not log normal control flow. Follow `src/lib/finance/services/queries.ts` for this behavior.

## Comments

- Comments are sparse; encode business rules in names, schemas, and explicit checks. Keep comments for non-obvious domain constraints, as documented in `docs/financial-domain.md`.
- No consistent JSDoc/TSDoc usage is detected. Prefer explicit types and focused helper names.

## Function Design

- Keep pure calculations small and composable, as in `src/lib/finance/money.ts`.
- Service functions may coordinate authorization, validation, Prisma persistence, and audit recording, as in `src/lib/finance/services/transactions.ts`.
- Accept `unknown` at service boundaries and parse it with a Zod schema (`src/lib/finance/services/accounts.ts`).
- Use object parameters for multi-field calculations and query options (`src/lib/finance/money.ts`, `src/lib/finance/services/queries.ts`).
- Return typed domain or Prisma records from services; return formatted strings for money at presentation boundaries using `decimalToString` in `src/lib/finance/money.ts`.
- Use `undefined` for optional filters and `null` for nullable persisted fields, matching Prisma query construction in `src/lib/finance/services/queries.ts`.

## Module Design

- Export public domain operations as named exports, for example `src/lib/finance/services/index.ts` and `src/lib/finance/index.ts`.
- Keep implementation helpers private unless another module needs them.
- Barrel modules exist for finance services and the finance domain (`src/lib/finance/services/index.ts`, `src/lib/finance/index.ts`); add public exports there when extending the API.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App Router | Public pages, authenticated dashboard layouts, API handlers | `src/app` |
| Authentication | Auth.js credentials provider, JWT session callbacks | `src/auth.ts` |
| Auth guards | Resolve active users and enforce ADMIN/FAMILY access | `src/lib/auth/guards.ts` |
| Finance domain | Validation, policy checks, money conversion, auditing, service operations | `src/lib/finance` |
| Persistence | Singleton Prisma client using PostgreSQL adapter | `src/lib/prisma.ts` |
| Presentation | Login and dashboard components, charts and sample overview data | `src/components` |
| Database model | Users, audit logs, accounts, categories, transactions, transfers | `prisma/schema.prisma` |

## Pattern Overview

- Server components and route handlers call authentication and persistence directly.
- Finance mutations are service functions that validate input, authorize the actor, execute a Prisma transaction, and append an audit record.
- PostgreSQL schema and migrations are the source of persistence structure; decimal values remain Prisma `Decimal` until formatted.

## Layers

- Purpose: Render login/dashboard pages and expose health/Auth.js endpoints.
- Location: `src/app`, `src/components`
- Contains: App Router pages, layouts, route handlers, client UI components.
- Depends on: Auth guards, dashboard data, formatting helpers.
- Used by: Browser requests to the Next.js server.
- Purpose: Authenticate credentials and enforce active-user and role policies.
- Location: `src/auth.ts`, `src/lib/auth`, `src/lib/finance/authorization.ts`
- Contains: Credentials parsing, bcrypt checks, JWT enrichment, redirects, finance actor policy functions.
- Depends on: Prisma and Auth.js.
- Used by: Dashboard layout and finance services.
- Purpose: Own financial commands and queries with validation, reference checks, cancellation rules, and audit events.
- Location: `src/lib/finance/services`
- Contains: Account/category management, transaction/transfer operations, read queries, reference validation.
- Depends on: `src/lib/finance/validation.ts`, `src/lib/finance/authorization.ts`, `src/lib/finance/audit.ts`, Prisma.
- Used by: Future server actions/API/UI callers; current dashboard remains demonstrative.
- Purpose: Provide the generated Prisma client and relational schema.
- Location: `src/lib/prisma.ts`, `prisma/schema.prisma`, `prisma/migrations`
- Contains: PostgreSQL adapter setup, models, indexes, migration history, seed.
- Depends on: `DATABASE_URL` and PostgreSQL.
- Used by: Auth, health endpoint, finance services, seed.

## Data Flow

### Primary Request Path

### Health Check Flow

## Key Abstractions

- Purpose: Encapsulate command/query workflows and transaction boundaries.
- Examples: `src/lib/finance/services/accounts.ts`, `src/lib/finance/services/transactions.ts`, `src/lib/finance/services/transfers.ts`.
- Pattern: Require user/admin, parse Zod input, authorize, persist atomically, audit.
- Purpose: Represent the authenticated user for domain authorization.
- Examples: `src/lib/finance/types.ts`, `src/lib/finance/authorization.ts`.
- Pattern: Convert Auth user to `{ id, role }` and apply explicit policy assertions.

## Entry Points

## Architectural Constraints

- **Runtime:** Next.js server code uses Node.js; finance service modules explicitly import `server-only`.
- **Global state:** `src/lib/prisma.ts` caches Prisma in `globalThis` outside production to avoid development connection churn.
- **Data integrity:** Financial references use restrictive deletes and service-level reference validation; mutations and audits share a Prisma transaction.
- **Module boundaries:** `@/*` resolves to `src/*`; generated Prisma output is under `src/generated/prisma` and excluded from normal source mapping.

## Anti-Patterns

### Bypassing finance services

### Treating dashboard sample values as persistence

## Error Handling

- `FinanceNotFoundError` and `FinanceConflictError` are thrown by service operations (`src/lib/finance/errors.ts`).
- Prisma mutations are wrapped in `$transaction` with audit writes.
- Auth failures return `null` from credentials authorization and redirect through guards.

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `$gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `$gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `$gsd-debug` for investigation and bug fixing
- `$gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `$gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
