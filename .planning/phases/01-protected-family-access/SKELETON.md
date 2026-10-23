# Walking Skeleton — Family Finance

**Phase:** 1  
**Generated:** 2026-10-23

## Capability Proven End-to-End

An existing ADMIN or FAMILY user signs in through the existing `/login` page, Auth.js reads the user from PostgreSQL, and the authenticated request reaches the existing `/dashboard` shell after the server guard rechecks that the user is active. A failed credential attempt writes the existing lockout counter to the same isolated test database.

The current dashboard still contains demonstration figures. They are not presented as real family balances. Phase 1 adds a narrow server-derived family access path; it does not rebuild the dashboard or add financial entry forms.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Existing Next.js App Router with TypeScript | The application scaffold and protected dashboard route already exist. |
| Data layer | PostgreSQL with Prisma 7 and `@prisma/adapter-pg` | Existing finance services, schema, migrations, and PostgreSQL tests use this stack. |
| Auth | Existing Auth.js Credentials provider, bcrypt verification, JWT session, and server-side `requireUser` guard | Preserves validated login behavior and checks active-user state on the server. |
| Deployment target | Existing Coolify production deployment; local development for this phase | Production deployment is unchanged; the plan uses a documented local full-stack route. |
| Directory layout | Existing `src/app`, `src/components`, `src/lib`, `prisma`, and `tests` layout | Reuses current feature boundaries and test patterns. |
| Family model | `Family` aggregate with canonical `FamilyMembership` from the first migration | Supports the first operational family and leaves room for future multi-family membership without onboarding multiple families now. |

## Stack Touched in Phase 1

- [x] Project scaffold (existing Next.js, build, lint, and Node test runner)
- [x] Routing — existing `/login` and protected `/dashboard` routes
- [ ] Database — Wave 0 verifies the existing auth read/write path against `TEST_DATABASE_URL`; the migration and family-scoped finance reads are planned for Wave 1 and Wave 2
- [ ] UI — Wave 0 verifies the existing interactive login form; no finance form or dashboard rebuild is added
- [x] Deployment — local full-stack run is documented below; no production deployment is part of this phase

## Local Full-Stack Run

1. Set `TEST_DATABASE_URL` to a dedicated disposable PostgreSQL database and verify it differs from all application and production database URLs.
2. During Wave 0, apply only the current pre-family migrations through the guarded test-database command, run the credential tracer, and seed the marked legacy fixture for the later backfill check.
3. For local app execution only, set `DATABASE_URL` to the same disposable test database in the current PowerShell process; do not change a persistent `.env` value.
4. After the Wave 1 decision checkpoint and migration review, apply the new additive migration and run the schema-drift check against that same verified disposable database.
5. Run `npm run dev`, open `http://localhost:3000/login`, submit the test credentials, and confirm the existing `/dashboard` shell loads after the server-side active-user guard.
6. Submit one invalid password and verify the existing error message and `failedLoginAttempts` write against the disposable database.

The current UI does not yet render persisted financial figures. The Wave 1 tracer and Wave 2 read coverage prove server-derived family scope through the existing service layer without treating demonstration dashboard data as real.

## Out of Scope (Deferred to Later Slices)

- Public registration, password recovery, or replacement of the existing Auth.js flow
- Dashboard redesign and financial entry forms
- Multi-family onboarding; the canonical membership model is prepared now, while onboarding remains after Phases 2–5
- Production migration or any production database access during planning or testing
- Debt management and WhatsApp or statement imports

## Subsequent Slice Plan

- Phase 2: administrators configure accounts and categories for the first family.
- Phase 3: family members record financial movements and transfers.
- Phase 4: the family reads persisted history, balances, and summaries.
- Phase 5: reconciliation and the complete mobile workflow.
