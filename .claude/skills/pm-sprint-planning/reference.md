# Reference: Worked Example

Use this to calibrate output quality — especially for capacity calculation, P0/P1/P2 scoping, overcommitment detection, and dependency flagging.

---

## Input

> Sprint 3 — Client Dashboard
> Goal: Ship the client dashboard with live data so finance admins can self-serve their monthly reports.
> Dates: 2 June – 13 June 2026
>
> Team:
> - Alice Tan — Frontend Engineer — 8 days available (full sprint)
> - Ben Okafor — Backend Engineer — 7 days available (1 day PTO 6 June)
> - Priya Sharma — QA — 6 days available (part-time, 3 days/week)
>
> Backlog:
> - PROJ-12: Dashboard UI — data table, filters, date range picker (3 pts) — Alice
> - PROJ-13: Live data API endpoint with caching (5 pts) — Ben
> - PROJ-14: CSV export (2 pts) — Alice
> - PROJ-15: Email notifications on report ready (3 pts) — Ben — stretch
> - PROJ-16: QA end-to-end test plan (2 pts) — Priya
>
> Carryover: PROJ-11 Auth bug fix (2 pts) — was blocked by infra last sprint, now unblocked — Ben
>
> Dependencies: PROJ-13 depends on infra team provisioning the read replica by 3 June (not yet confirmed).

---

## Output

## Sprint Plan: Sprint 3 — Client Dashboard

**Dates:** 2 June – 13 June 2026 | **Team:** 3 people
**Sprint Goal:** Ship the client dashboard with live data so finance admins can self-serve their monthly reports.

---

### Capacity

| Person | Available Days | Usable Capacity | Notes |
|--------|---------------|-----------------|-------|
| Alice Tan | 10 of 10 | 12 points | Full sprint, FE |
| Ben Okafor | 9 of 10 | 11 points | 1 day PTO 6 June, BE |
| Priya Sharma | 6 of 10 | 7 points | Part-time 3 days/week, QA |
| **Total** | **25 days** | **30 points** | |

> Planned at 73% of total capacity.

---

### Sprint Backlog

| Priority | Item | Estimate | Owner | Dependencies |
|----------|------|----------|-------|--------------|
| P0 | PROJ-11: Auth bug fix (carryover) | 2 pts | Ben | None — infra unblocked |
| P0 | PROJ-12: Dashboard UI | 3 pts | Alice | None |
| P0 | PROJ-13: Live data API with caching | 5 pts | Ben | Read replica from infra — **unconfirmed** |
| P1 | PROJ-14: CSV export | 2 pts | Alice | PROJ-12 complete |
| P1 | PROJ-16: QA end-to-end test plan | 2 pts | Priya | PROJ-12, PROJ-13 complete |
| P2 | PROJ-15: Email notifications | 3 pts | Ben | PROJ-13 complete |

**Planned load:** 17 points | **Available capacity:** 30 points | **Load:** 57%

---

### Carryover

| Item | Original Sprint | Reason Not Completed | Re-committed? |
|------|----------------|----------------------|---------------|
| PROJ-11: Auth bug fix | Sprint 2 | Blocked — infra had not provisioned required service | Yes — blocker now resolved |

---

### Dependencies

| Item | Depends On | Team / Person | Status | Risk if Blocked |
|------|-----------|---------------|--------|-----------------|
| PROJ-13: Live data API | Read replica provisioning | Infra team | **Unconfirmed** | P0 item cannot start — cascades to PROJ-14 and PROJ-16 |

---

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Infra read replica not provisioned by Day 1 | PROJ-13 blocked — dashboard has no live data, sprint goal fails | Confirm with infra lead by 29 May. If unconfirmed by sprint start, descope PROJ-13 and replace with mock data fallback. |
| PROJ-16 QA depends on both P0 items completing mid-sprint | Priya has limited buffer if either P0 slips | Flag at mid-sprint check-in on 6 June. If either P0 is delayed, defer PROJ-14 and redirect Priya to unit test coverage. |

---

### Definition of Done

Sprint 3 is complete when all of the following are true:

- [ ] Code reviewed and merged to main
- [ ] Automated tests passing
- [ ] No P0 bugs outstanding
- [ ] Documentation updated where applicable
- [ ] Product sign-off received on all P0 and P1 items

---

### Key Dates

| Date | Event |
|------|-------|
| 2 June | Sprint start |
| 6 June | Mid-sprint check-in |
| 13 June | Sprint end / demo |
| 16 June | Retrospective |

---

> **Leave buffer.** Plan to 70–80% capacity — interrupts will fill the rest.
> **One sprint goal.** If you can't state it in one sentence, the sprint is unfocused.
> **Name your stretch.** Know exactly what to cut if things run long.
> **Carry over honestly.** If something didn't ship last sprint, understand why before re-committing it.
