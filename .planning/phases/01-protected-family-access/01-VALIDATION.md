---
phase: "01"
slug: "protected-family-access"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-23"
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js test runner via `tsx` |
| **Config file** | None; `package.json` script discovers `tests/*.test.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run lint && npm run typecheck && npm test` |
| **Estimated runtime** | ~30 seconds, measured again during execution |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run lint && npm run typecheck && npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds for the quick suite

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-02 | 01 | 0 | AUTH-01 | T-01-01 | Existing ADMIN and FAMILY credential behavior remains intact; inactive and locked users are rejected and failed attempts persist only through the isolated test client. | PostgreSQL integration | `node --import tsx --test tests/auth-skeleton.test.ts` | ❌ planned | ⬜ pending |
| 01-01-03 | 01 | 0 | AUTH-03 | T-01-01 | Two-family fixture descriptors use distinct identifiers without requiring the not-yet-created Prisma family models. | unit | `node --import tsx --test tests/family-isolation-fixture.test.ts` | ❌ planned | ⬜ pending |
| 01-02-03 | 02 | 1 | AUTH-03 | T-01-05, T-01-06 | The inaugural-family migration preserves legacy fingerprints and a user from family A cannot read family B's accounts. | PostgreSQL integration | `node --import tsx --test tests/family-isolation.test.ts tests/family-migration.test.ts` | ❌ planned | ⬜ pending |
| 01-03-03 | 03 | 2 | AUTH-01, AUTH-02, AUTH-03 | T-01-07, T-01-08 | Finance reads remain family-scoped for ADMIN and FAMILY; inactive users and users without membership receive no finance scope. | unit + PostgreSQL integration | `node --import tsx --test tests/finance-authorization.test.ts tests/family-isolation.test.ts` | ❌ planned | ⬜ pending |
| 01-04-03 | 04 | 3 | AUTH-02, AUTH-03 | T-01-09, T-01-10 | Catalog, movement, transfer, reference, and audit writes reject cross-family access and remain atomic on rollback. | PostgreSQL integration | `node --import tsx --test tests/family-isolation.test.ts tests/finance-postgres.test.ts` | ❌ planned | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Confirm the disposable, non-production `TEST_DATABASE_URL` at blocking checkpoint `01-01-01` before any database command.
- [ ] Add the isolated credentials integration test in `01-01-02` and the pure two-family descriptor plus pre-family migration fixture in `01-01-03`.
- [ ] Provide an isolated PostgreSQL database through `TEST_DATABASE_URL` before any database-backed phase test; Docker Compose was unavailable during research.
- [ ] Defer family-owned Prisma fixture writes and cross-family database assertions until the schema and migration are approved in Wave 1.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Production migration approval and backup/deployment procedure | AUTH-03 | Requires an approved operational backup and deployment decision; production migration is out of scope for planning. | Review the additive migration, legacy-row counts, rollback path, and approved backup in the deployment process. Do not connect to or modify the production database during planning or phase execution. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter after validation

**Approval:** pending
