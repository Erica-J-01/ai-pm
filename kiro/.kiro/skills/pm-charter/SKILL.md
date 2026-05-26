---
name: pm-charter
description: Turns a project brief, intake summary, or rough idea into a complete, sponsor-ready project charter. Use whenever someone says "write the charter", "start a new project", "formalise this project", "we need a charter", "draft the project document", or pastes a brief and needs it turned into an official document. Also triggers after an intake summary is complete and the next step is formal authorisation. A charter is the document that officially starts a project — without it, the PM has no authority to act and the team has no agreed scope. Use this skill early, before any planning begins.
tools: []
---

# What to Gather First

A charter needs at least these five things. If fewer than three are provided, ask before writing:

| Input | Why it matters |
|---|---|
| Project name + one-line description | Anchors everything else |
| Business problem being solved | Without this, the purpose section is meaningless |
| Sponsor (person with budget authority) | No sponsor = no authorisation |
| Rough timeline or deadline | Shapes scope and constraints |
| Budget range | Even a ballpark — needed for the budget section |

If the user says "just assume" — do so, mark every assumption `[assumed]`, and list them all at the bottom.

---

# Workflow

1. Read the full input before writing anything
2. Extract stated facts only — never invent, only infer when necessary and label it `[assumed]`
3. Write sections in order — each one feeds the next
4. Keep every section tight — a charter is a decision document, not a report
5. List all `[assumed]` items at the bottom so the sponsor can challenge them

A good charter fits on 1–2 pages. If a section is getting long, cut it — detail belongs in the plan, not the charter.

---

# Format Anchor

**Wrong:** "We will leverage synergies across the organisation to deliver transformative value."
**Right:** "Customers currently wait 3 days for onboarding. This project reduces that to same-day."

**Wrong (scope):** Leave out-of-scope blank or write "TBD"
**Right:** At least 2 explicit out-of-scope items — if you can't name them, the scope isn't clear enough yet

---

# Output Template

Use this structure exactly.

---

## PROJECT CHARTER

**Project:** [Name]
**Date:** [Today] | **Version:** 1.0
**Prepared by:** [PM name or role]

---

### 1. Purpose
[2–3 sentences. What problem does this solve? What gets better when it's done? Focus on the business pain, not the solution.]

### 2. Objectives
What success looks like — specific enough to verify:
- [Objective 1]
- [Objective 2]
- [Objective 3]

### 3. Scope

**In scope:**
- [What will be delivered]

**Out of scope:**
- [What will NOT be delivered — at least 2 items]

### 4. Deliverables

| Deliverable | What it is | Due |
|---|---|---|
| [Name] | [Brief description] | [Date or phase] |

### 5. Stakeholders

| Name / Role | Responsibility |
|---|---|
| [Sponsor] | Final decisions, budget authority |
| [PM] | Day-to-day delivery |
| [Others] | [Their role] |

### 6. Timeline

| Milestone | Target Date |
|---|---|
| Project start | [Date] |
| [Key milestone] | [Date] |
| Go-live / delivery | [Date] |

### 7. Budget

| Item | Amount |
|---|---|
| Estimated delivery cost | [Amount or range] |
| Contingency (10–15%) | [Amount] |
| Budget owner | [Name / role] |

### 8. Top Risks

| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| [Specific risk event] | H/M/L | H/M/L | Mitigate / Accept / Escalate |

Keep to 3 risks maximum. These are headline risks only — a full risk scan is a separate step.

### 9. Constraints & Assumptions

**Constraints** (fixed — cannot change):
- [e.g. Must go live before Q4 regulatory deadline]

**Assumptions** (believed to be true — must be validated):
- [assumed] [e.g. Dev team available from Month 1]

### 10. Approvals

| Role | Name | Date | Signature |
|---|---|---|---|
| Sponsor | | | |
| Project Manager | | | |
| [Other approver] | | | |

---

### Assumptions Log
All `[assumed]` items from above — the sponsor should confirm or correct each before sign-off:

| Assumption | Why assumed | Who should confirm |
|---|---|---|
| [assumed item] | [Reason] | [Role] |

---

# Quality Check

- [ ] Purpose focuses on the problem, not the solution
- [ ] Every objective is specific enough to verify when done
- [ ] Out of scope has at least 2 named items
- [ ] Every `[assumed]` item appears in the Assumptions Log
- [ ] Budget has a contingency figure
- [ ] Risks are written as events, not labels ("Vendor delays" not "Vendor risk")
- [ ] Approvals table has at least the Sponsor row
- [ ] Nothing is left blank — use "TBC — confirm before sign-off" if genuinely unknown

---

# Reference Files

- `references/REFERENCE.md` — Full worked example: messy brief → complete charter. Read when input is thin, ambiguous, or the scope is hard to bound.