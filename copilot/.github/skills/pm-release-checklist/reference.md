# Reference — release-checklist

Use this to calibrate output quality — especially for verdict scoring, handling partial information, and writing clear blocker summaries.

---

## Input

**Project:** Finflow SaaS Platform
**Release name:** Sprint 22 Release — Invoicing v2
**Release type:** Planned sprint release
**Target date:** Friday 30 May 2026, 6:00 PM AEST
**Features included:**
- Recurring invoice scheduling (FIN-441, FIN-442, FIN-443)
- PDF export for invoices (FIN-451)
- Invoice status webhook notifications (FIN-461)
- Bug fix: invoice total rounding error on multi-currency (FIN-470)

**Team:**
- PM: Erica J
- Tech lead: Marcus R
- QA lead: Priya S
- DevOps: Tom W

**Additional context:**
- QA sign-off received for FIN-441, FIN-442, FIN-451, FIN-470. FIN-443 (scheduling edge cases) and FIN-461 (webhook retry logic) are still in QA.
- Rollback plan exists in Notion but has not been reviewed by Marcus.
- Customer comms draft is ready but hasn't been reviewed by marketing.
- No load testing done — invoice scheduling runs background jobs that could spike CPU.
- Legal has not been consulted. Feature touches payment data storage.

---

## Output

## Release Go / No-Go Checklist

**Release:** Sprint 22 — Invoicing v2
**Release type:** Planned sprint release
**Target date:** Friday 30 May 2026, 6:00 PM AEST
**Features included:** FIN-441, FIN-442, FIN-443, FIN-451, FIN-461, FIN-470
**Assessed by:** Erica J
**Date of assessment:** 2026-05-25

---

### Checklist

#### 1. Feature Readiness

| # | Item | Status | Notes |
|---|---|---|---|
| F1 | All in-scope stories marked Done in Jira | FAIL | FIN-443 and FIN-461 still in QA — not marked Done |
| F2 | No in-progress or blocked tickets in scope | FAIL | FIN-443 and FIN-461 are in progress |
| F3 | Code merged to release branch, build passing | UNCONFIRMED | Not confirmed — check with Marcus |
| F4 | Feature flags configured correctly | UNCONFIRMED | No information provided on feature flag state |
| F5 | Database migrations reviewed and reversible | UNCONFIRMED | Not mentioned — confirm with Marcus |
| F6 | API breaking changes versioned or communicated | N/A | No breaking API changes in this release |

#### 2. Testing

| # | Item | Status | Notes |
|---|---|---|---|
| T1 | Unit and integration tests passing in CI | UNCONFIRMED | Not confirmed — check CI pipeline status |
| T2 | QA sign-off confirmed — Priya S | FAIL | QA sign-off received for FIN-441, FIN-442, FIN-451, FIN-470 only. FIN-443 and FIN-461 outstanding. |
| T3 | Regression suite run against release candidate | UNCONFIRMED | Not mentioned — confirm with Priya |
| T4 | Edge cases and error states verified | RISK | FIN-443 scheduling edge cases are the specific items still in QA |
| T5 | Performance testing completed | FAIL | No load testing done. Invoice scheduling runs background jobs — CPU spike risk is unvalidated. |
| T6 | Security review completed | UNCONFIRMED | Feature touches payment data storage — legal not consulted (see A5) |
| T7 | Staging validation completed | UNCONFIRMED | Not confirmed — confirm with Marcus and Priya |

#### 3. Operational Readiness

| # | Item | Status | Notes |
|---|---|---|---|
| O1 | Monitoring and alerting in place for new functionality | UNCONFIRMED | Background job monitoring for invoice scheduling not confirmed |
| O2 | Error rate and latency baselines documented | UNCONFIRMED | Not mentioned |
| O3 | Runbook exists for this release | RISK | Runbook exists in Notion but has not been reviewed by Marcus |
| O4 | Rollback plan documented and reviewed | FAIL | Rollback plan not reviewed by tech lead — unreviewed rollback is not a rollback plan |
| O5 | Database rollback confirmed | UNCONFIRMED | Not mentioned — confirm with Marcus |
| O6 | On-call confirmed for release window + 24 hours | UNCONFIRMED | Not confirmed |
| O7 | Infrastructure scaled for increased load | FAIL | Background jobs could spike CPU — no load testing, no confirmation of scaling |

#### 4. Communications

| # | Item | Status | Notes |
|---|---|---|---|
| C1 | Internal release notes written and shared | UNCONFIRMED | Not mentioned |
| C2 | Support team briefed | UNCONFIRMED | Not mentioned — invoicing changes will generate support queries |
| C3 | Customer comms drafted | RISK | Draft ready but not reviewed by marketing |
| C4 | Affected customers notified (breaking change) | N/A | No breaking changes in this release |
| C5 | Stakeholders and sponsors notified of release date | UNCONFIRMED | Not confirmed |
| C6 | Marketing / growth aligned | UNCONFIRMED | Customer comms draft unreviewed — marketing sign-off outstanding |

#### 5. Dependencies

| # | Item | Status | Notes |
|---|---|---|---|
| D1 | Third-party APIs verified as operational | UNCONFIRMED | Not mentioned — confirm if any payment API dependencies |
| D2 | External vendor changes confirmed and tested | N/A | No external vendor changes in scope |
| D3 | Cross-team dependencies signed off | UNCONFIRMED | Not mentioned |
| D4 | Environment variables and config deployed to prod | UNCONFIRMED | Not confirmed — background job config must be deployed before scheduling works |
| D5 | Infrastructure changes pre-staged | UNCONFIRMED | Not confirmed |

#### 6. Approvals

| # | Item | Status | Notes |
|---|---|---|---|
| A1 | PM sign-off | PASS | Erica J |
| A2 | Tech lead sign-off — Marcus R | UNCONFIRMED | Not yet confirmed |
| A3 | QA lead sign-off — Priya S | FAIL | Partial only — FIN-443 and FIN-461 outstanding |
| A4 | Product owner / sponsor sign-off | UNCONFIRMED | Not mentioned |
| A5 | Legal / compliance sign-off | FAIL | Feature touches payment data storage. Legal has not been consulted. This is a blocker. |
| A6 | Security sign-off | UNCONFIRMED | Linked to legal gap above — security review not confirmed |

#### 7. Post-Release Readiness

| # | Item | Status | Notes |
|---|---|---|---|
| P1 | Success metrics defined | UNCONFIRMED | Not mentioned — what does a successful Invoicing v2 release look like in the data? |
| P2 | Monitoring check scheduled (30 min, 2 hr, 24 hr) | UNCONFIRMED | Not confirmed |
| P3 | Post-release review scheduled | UNCONFIRMED | Not confirmed |
| P4 | Known issues / deferred items ticketed | UNCONFIRMED | Not mentioned |

---

### Summary

| Category | PASS | FAIL | RISK | UNCONFIRMED | N/A |
|---|---|---|---|---|---|
| Feature Readiness | 0 | 2 | 0 | 3 | 1 |
| Testing | 0 | 3 | 1 | 3 | 0 |
| Operational Readiness | 0 | 3 | 1 | 3 | 0 |
| Communications | 0 | 0 | 1 | 4 | 1 |
| Dependencies | 0 | 0 | 0 | 4 | 1 |
| Approvals | 1 | 3 | 0 | 2 | 0 |
| Post-Release Readiness | 0 | 0 | 0 | 4 | 0 |
| **Total** | **1** | **11** | **3** | **23** | **3** |

---

### Blockers

Items that must be resolved before this release can proceed.

- **F1 / F2 — FIN-443 and FIN-461 not complete** — QA still in progress. Owner: Priya S. Must be resolved before release window opens.
- **T2 — QA sign-off incomplete** — FIN-443 (scheduling edge cases) and FIN-461 (webhook retry logic) have no QA sign-off. Owner: Priya S.
- **T5 — No load testing completed** — Background job CPU spike risk is unvalidated. Owner: Tom W. Must run load test or explicitly accept risk before GO.
- **O4 — Rollback plan not reviewed by tech lead** — An unreviewed rollback plan is not a rollback plan. Owner: Marcus R. Must review and sign off before release.
- **O7 — Infrastructure scaling unconfirmed** — Background jobs could spike CPU under load. Owner: Tom W. Confirm scaling or link to load test result.
- **A3 — QA lead sign-off incomplete** — Only partial sign-off received. Full sign-off required before GO. Owner: Priya S.
- **A5 — Legal not consulted** — Feature touches payment data storage. Legal / compliance sign-off is required. Owner: Erica J (PM action — initiate legal review immediately). This cannot be deferred post-release.

---

### Verdict

> **NO-GO**

This release has 11 FAIL items and 23 UNCONFIRMED items. The release is not ready to ship on Friday 30 May. The two critical paths are: (1) QA sign-off on FIN-443 and FIN-461 must be completed, and (2) legal must be consulted on payment data storage before code goes to production. Recommend a 48-hour hold to resolve the blockers — reschedule to Monday 2 June 2026 at the earliest, pending blocker resolution.
