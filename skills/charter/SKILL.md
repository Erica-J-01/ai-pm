---
name: project-charter
description: Turns a project brief, intake summary, or rough idea into a complete, sponsor-ready project charter. Use whenever someone says "write the charter", "start a new project", "formalise this project", "we need a charter", "draft the project document", or pastes a brief and needs it turned into an official document. Also triggers after an intake summary is complete and the next step is formal authorisation. A charter is the document that officially starts a project - without it, the PM has no authority to act and the team has no agreed scope. Use this skill early, before any planning begins.
version: 1.1.0
argument-hint: <project brief or intake summary>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided above, check the active `clients/CLIENT/PROJECT/project-artefacts/` folder for a recent intake summary or risk scan before asking. Use the newest as the primary input, tell the user which file you used, and ask only for whichever of the five required inputs is still missing. If nothing is found, ask: "Please share the project brief or intake summary - project name, problem, sponsor, timeline, and budget if known."*

---

# What to Gather First

A charter needs at least these five things. If fewer than three are provided, ask before writing:

| Input | Why it matters |
|---|---|
| Project name + one-line description | Anchors everything else |
| Business problem being solved | Without this, the purpose section is meaningless |
| Sponsor (person with budget authority) | No sponsor = no authorisation |
| Rough timeline or deadline | Shapes scope and constraints |
| Budget range | Even a ballpark - needed for the budget section |

If the user says "just assume" - do so, mark every assumption `[assumed]`, and list them all at the bottom.

Scope boundaries you derive rather than extract - typical for out-of-scope items - are proposals, not facts. Tag each one `[proposed - confirm]` and list it in the Assumptions Log alongside the `[assumed]` items. Never present an invented boundary as something the client agreed to.

---

# Output Template

Use this structure exactly.

If a charter already exists in the active project's artefacts, do not regenerate from scratch. Read it, reissue with the version bumped, and add a one-line "Changes since vN" note under the header.

---

## PROJECT CHARTER

**Project:** [Name]
**Date:** [Today] | **Version:** [1.0 for a new charter, or bumped when re-baselining]
**Prepared by:** [PM name or role]

---

### 1. Purpose
[2-3 sentences. What problem does this solve? What gets better when it's done? Focus on the business pain, not the solution.]

### 2. Objectives
What success looks like - specific enough to verify:
- [Objective 1]
- [Objective 2]
- [Objective 3]

### 3. Scope

**In scope:**
- [What will be delivered]

**Out of scope:**
- [What will NOT be delivered - at least 2 items. Tag any boundary not stated in the input `[proposed - confirm]`]

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

### 6. Governance

| Item | Detail |
|---|---|
| Decision authority | [Sponsor] - final call on scope, budget, and timeline |
| Change approval | Material changes to scope, budget, or timeline need sponsor sign-off, recorded via `/decision-log` |
| Reporting cadence | [What the sponsor receives and how often - e.g. weekly one-page status update] |

### 7. Timeline

| Milestone | Target Date |
|---|---|
| Project start | [Date] |
| [Key milestone] | [Date] |
| Go-live / delivery | [Date] |

### 8. Budget

| Item | Amount |
|---|---|
| Estimated delivery cost | [Amount or range] |
| Contingency (10-15%) | [Amount] |
| Commercial basis | [Fixed price / T&M / internal cost - tag `[assumed]` if the brief is silent] |
| Includes / excludes | [e.g. whether licences, hosting, and third-party costs are in - tag `[assumed]` if silent] |
| Budget owner | [Name / role] |

### 9. Top Risks

| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| [Specific risk event] | H/M/L | H/M/L | Mitigate / Accept / Escalate |

Keep to 3 risks maximum. These are headline risks only - a full risk scan is a separate step.

### 10. Constraints & Assumptions

**Constraints** (fixed - cannot change):
- [e.g. Must go live before Q4 regulatory deadline]

**Assumptions** (believed to be true - must be validated):
- [assumed] [e.g. Dev team available from Month 1]

**Client-side dependencies** (what the sponsor's organisation must supply - these are obligations the signature covers, not assumptions):

| Dependency | Needed by | Owner |
|---|---|---|
| [e.g. API access to the core system] | [Date or phase] | [Client-side role] |

### 11. Approvals

| Role | Name | Date | Signature |
|---|---|---|---|
| Sponsor | | | |
| Project Manager | | | |
| [Other approver] | | | |

---

### Assumptions Log
All `[assumed]` and `[proposed - confirm]` items from above - the sponsor should confirm or correct each before sign-off:

| Assumption | Why assumed | Who should confirm |
|---|---|---|
| [assumed item] | [Reason] | [Role] |

