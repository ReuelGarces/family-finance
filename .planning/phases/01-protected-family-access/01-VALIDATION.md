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

Task IDs below are provisional; the planner must align them with the final plan task IDs before planning is sealed.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | T-01-01 | Existing ADMIN and FAMILY credentials still produce a valid server-recognized session; inactive users are rejected. | integration | `npm test` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-02 | T-01-02 | FAMILY cannot manage the catalog or escalate role; permitted operations remain available. | unit | `npm test` | ✅ partial | ⬜ pending |
| 01-01-03 | 01 | 1 | AUTH-03 | T-01-03 | Reads, writes, references, summaries, transfers, and audit history cannot cross family scope. | unit + PostgreSQL integration | `npm test` with isolated `TEST_DATABASE_URL` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Add focused tests for the server-derived family scope through production finance-service entry points.
- [ ] Add two-family fixtures and cross-family read/write/reference/transfer/audit coverage, including `tests/family-isolation.test.ts` or the final plan's equivalent.
- [ ] Add or extend sign-in/session tests for existing ADMIN and FAMILY users and inactive-user rejection.
- [ ] Provide an isolated PostgreSQL database through `TEST_DATABASE_URL` before database-backed isolation tests; Docker Compose was unavailable during research.

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
