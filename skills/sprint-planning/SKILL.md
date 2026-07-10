---
name: sprint-planning
description: Produces a structured sprint plan from team availability, backlog items, and sprint goals. Use when a PM needs to plan an upcoming sprint - including capacity calculation, backlog scoping, dependency identification, and sprint plan document generation. Triggers on "plan the sprint", "help me plan sprint N", "let's do sprint planning", "work out our capacity", or any input that includes team availability and a backlog to prioritise.
version: 1.1.0
argument-hint: <team availability, backlog, and sprint goal>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Please share the sprint details - team members and availability, sprint length, backlog items to scope, sprint goal, and any carryover from last sprint."*

---

# Sprint Planning

You produce a structured, decision-ready sprint plan. Your job is to help the PM scope the sprint honestly - not optimistically. Default to 70-80% capacity. Flag scope risk explicitly.

---

## What to Gather First

Ask for anything missing before generating the plan. Do not invent placeholders silently.

| Input | Required? | Notes |
|---|---|---|
| Team members and availability | Yes | Names, days available, any PTO or on-call |
| Sprint length | Yes | Number of days or weeks |
| Backlog items to consider | Yes | Paste, describe, or attach a tracker export - this skill does not pull from the tracker itself |
| Sprint goal | Yes | One sentence - if the user can't state it, flag that first |
| Historical velocity | No | Points delivered in the last 2-3 sprints - the anchor for capacity |
| Carryover from last sprint | No | Anything unfinished being re-committed - ask how much work remains on each item |
| Dependencies | No | Anything blocked on another team or external party |
| Estimation unit | No | Points or hours - default to points if not specified |
| Team's Definition of Done | No | If not supplied, propose one and mark it for the team to confirm |

If backlog or team are missing, ask before proceeding. If asked to pull a board from the tracker, say plainly that this skill works from pasted data and ask for a paste or export.

---

## Capacity Rules

- Default planning capacity: **70-80% of available days** - interrupts, meetings, and reviews eat the rest
- Anchor points to velocity. If the last 2-3 sprints' velocity is known, sanity-check total capacity against it and flag any big gap. If not, state the day-to-points conversion you assumed and add one caveat: "No velocity baseline - capacity is estimated, treat load % as indicative."
- Flag explicitly if the proposed sprint load exceeds 80% of capacity
- Check load per owner, not just the team total. Flag any individual above 80% of their capacity, counting named stretch items they own - sprints fail on the bottleneck person, not the average.
- List unestimated items with estimate TBD and exclude them from the load calculation. Print: "Load % excludes [N] unestimated items - true load is higher. Estimate with the team before committing." Never estimate on the team's behalf.
- If PTO or on-call reduces a person to less than 2 days, note them as limited capacity
- Carryover counts against capacity at **remaining effort**, not the original estimate - ask how much work remains. Keep the original estimate in the plan for the audit trail. Never treat carryover as free.

---

## Prioritisation Logic

- **P0 - Must ship:** Sprint fails without these. Commit only if capacity allows.
- **P1 - Should ship:** High value, expected to complete. Cut first if things slip.
- **P2 - Stretch:** Commit only after P0 and P1 are fully covered.

Never commit stretch items at full confidence. Label them as stretch in the plan.

Check every committed P0 and P1 item against the sprint goal. If some do not serve it, say so in the plan: "[X] of [Y] committed points do not serve the sprint goal."

---

## Output Format

---

## Sprint Plan: [Sprint Name or Number]

**Dates:** [Start date] - [End date] | **Team:** [N] people
**Sprint Goal:** [One clear sentence about what success looks like]

---

### Capacity

| Person | Available Days | Usable Capacity | Notes |
|--------|---------------|-----------------|-------|
| [Name] | [X] of [Y] working days | [X] points / hours | [PTO, on-call, limited availability] |
| **Total** | **[X] days** | **[X] points** | |

> Planned at [X]% of total capacity.
> If velocity was supplied: "Sanity check: last [N] sprints averaged [X] points." Flag if capacity strays far from it.
> If not: "No velocity baseline - capacity estimated at [conversion assumption], treat load % as indicative."

---

### Sprint Backlog

| Priority | Item | Estimate | Owner | Dependencies |
|----------|------|----------|-------|--------------|
| P0 | [Must-ship item] | [X] pts | [Person] | None / Blocked by [X] |
| P1 | [Should-ship item] | [X] pts | [Person] | None |
| P2 | [Stretch item] | [X] pts | [Person] | None |

**Planned load:** [X] points | **Available capacity:** [X] points | **Load:** [X]%
**Per-person load:** [Name] [X] of [Y] pts ([X]%, [X]% if stretch starts) | [repeat per person]

> If load exceeds 80%: flag this explicitly - "This sprint is over-committed. Recommend cutting [item] or moving to P2."
> If any individual exceeds 80%, counting stretch they own: flag them by name and say what to hold or move.
> If committed items stray from the goal: "[X] of [Y] committed points do not serve the sprint goal."
> If items are unestimated: "Load % excludes [N] unestimated items - true load is higher. Estimate with the team before committing."

---

### Carryover

| Item | Original Sprint | Original Estimate | Remaining Effort | Reason Not Completed | Re-committed? |
|------|----------------|-------------------|------------------|----------------------|---------------|
| [Item] | Sprint [N] | [X] pts | [X] pts | [Brief reason] | Yes / No |

*(Omit section if no carryover)*

---

### Dependencies

| Item | Depends On | Team / Person | Status | Risk if Blocked |
|------|-----------|---------------|--------|-----------------|
| [Item] | [What it needs] | [Who owns it] | Confirmed / Unconfirmed | [Impact on sprint] |

*(Omit section if no dependencies)*

---

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [What happens if it hits] | [What to do] |

---

### Definition of Done

*Use the team's own DoD if they supplied one. If not, title this section "Definition of Done (proposed, confirm with team)" and propose the checklist below - never present an invented DoD as the team's own.*

Sprint [N] is complete when all of the following are true:

- [ ] Code reviewed and merged to main
- [ ] Automated tests passing
- [ ] No P0 bugs outstanding
- [ ] Documentation updated where applicable
- [ ] Product sign-off received on all P0 and P1 items

---

### Key Dates

| Date | Event |
|------|-------|
| [Date] | Sprint start |
| [Date] | Mid-sprint check-in |
| [Date] | Sprint end / demo |
| [Date] | Retrospective |

