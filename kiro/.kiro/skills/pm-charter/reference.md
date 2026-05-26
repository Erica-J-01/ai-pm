# Reference: Worked Example

Use this to calibrate output quality — especially for thin or ambiguous inputs where assumptions are needed.

---

## Raw Input

> "We need to build a client reporting portal for our finance clients. They keep emailing us for updates and it's taking too much time. Sarah from IT said her team can help. We want it done by end of year. Budget is around £80k I think — not fully confirmed. Can you write the charter?"

---

## What to Extract vs Assume

| Item | Source | Status |
|---|---|---|
| Project name | Not stated | [assumed] "Client Reporting Portal" |
| Business problem | Stated — clients emailing for updates, taking too much time | Stated |
| Sponsor | Not named — "Sarah from IT" is a resource, not a sponsor | [assumed] — flag as TBC |
| Timeline | "End of year" | Stated — needs a hard date |
| Budget | "Around £80k I think — not fully confirmed" | [assumed] — mark as unconfirmed |

---

## Correct Output

---

## PROJECT CHARTER

**Project:** Client Reporting Portal
**Date:** [Today] | **Version:** 1.0
**Prepared by:** [PM]

---

### 1. Purpose

Finance clients are currently requesting updates via email, creating significant manual workload for the team and causing delays in client communication. This project will build a self-service reporting portal giving clients direct, real-time access to their reports — reducing email volume and improving client experience.

### 2. Objectives

- Reduce client update emails by at least 70% within 60 days of go-live
- Give clients 24/7 self-service access to their current reports
- Free up [X] hours per week currently spent on manual update requests

### 3. Scope

**In scope:**
- Web-based portal accessible to finance clients
- Automated report generation and delivery
- Client login and access management
- Basic audit trail of client report views

**Out of scope:**
- Mobile app (web browser on mobile only)
- Integration with third-party accounting platforms
- Real-time data feeds — reports will refresh on a scheduled basis
- White-labelling or custom branding per client

### 4. Deliverables

| Deliverable | What it is | Due |
|---|---|---|
| Portal (MVP) | Working web portal with login and report access | [Month 3] |
| Admin interface | Internal tool for managing client access | [Month 3] |
| UAT sign-off | Client acceptance testing completed | [Month 4] |
| Go-live | Portal live for all finance clients | [End of year] |

### 5. Stakeholders

| Name / Role | Responsibility |
|---|---|
| TBC — Sponsor needed | Final decisions, budget sign-off |
| Sarah (IT) | Technical delivery lead |
| PM | Day-to-day delivery, stakeholder coordination |
| Finance clients (sample group) | UAT participants |

### 6. Timeline

| Milestone | Target Date |
|---|---|
| Project start | [ASAP — confirm with sponsor] |
| Discovery complete | [Month 1] |
| Build complete | [Month 3] |
| UAT complete | [Month 4] |
| Go-live | [31 Dec or agreed date] |

### 7. Budget

| Item | Amount |
|---|---|
| Estimated delivery cost | £80,000 [assumed — unconfirmed] |
| Contingency (10%) | £8,000 |
| Budget owner | TBC — confirm with sponsor |

### 8. Top Risks

| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| Budget is not formally approved, blocking procurement and resourcing | H | H | Escalate — confirm with sponsor before work begins |
| No named sponsor means decisions stall and the project loses authority | H | H | Escalate — sponsor must be identified before kickoff |
| "End of year" deadline is fixed but scope has not been validated against timeline | M | H | Mitigate — run a scoping session in Week 1 to confirm feasibility |

### 9. Constraints & Assumptions

**Constraints:**
- Delivery must be complete by end of calendar year
- Must use existing IT infrastructure (per Sarah's team involvement)

**Assumptions:**
- [assumed] Project name is "Client Reporting Portal" — confirm with sponsor
- [assumed] Budget is approximately £80k — input described this as unconfirmed
- [assumed] Sarah's IT team has capacity to deliver — "said she can help" is not a formal commitment
- [assumed] Sponsor exists but was not named — project cannot proceed without one

### 10. Approvals

| Role | Name | Date | Signature |
|---|---|---|---|
| Sponsor | TBC | | |
| Project Manager | | | |

---

### Assumptions Log

| Assumption | Why assumed | Who should confirm |
|---|---|---|
| Project name: "Client Reporting Portal" | Not stated in brief | Sponsor |
| Budget ~£80k | Stated as approximate and unconfirmed | Finance / Sponsor |
| IT team availability | Informal offer only — not a commitment | Sarah's manager / IT Director |
| Sponsor exists but unnamed | Projects require a named budget owner | Requesting stakeholder |

---

## Why This Output Is Good

**The purpose section focuses on the problem, not the solution.** "Email volume is high" is the problem. "Portal" is the solution. The purpose section names the pain first, then explains what the project does about it. A sponsor reading this immediately understands why this project exists.

**Out of scope has 4 named items.** "Mobile app", "third-party integrations", "real-time feeds", "white-labelling" — these aren't obvious, but naming them prevents scope creep later. Every out-of-scope item is a conversation that happened upfront rather than a surprise mid-build.

**The missing sponsor is the top 2 risks.** The brief mentioned Sarah from IT — that's a resource, not a sponsor. An experienced PM spots this immediately. The risk log flags it as High/High and escalates it, because a project without a named sponsor has no authority to spend the budget or make decisions.

**"Around £80k I think — not fully confirmed" becomes `[assumed]` everywhere it appears.** In the budget table, in the assumptions log, and in the risk log. A sponsor who signs this charter knows exactly what they're signing off on and what needs confirming.

**Objectives are measurable.** "Reduce client update emails by 70%" not "improve client communication." The PM can walk into a review 60 days post-launch and verify whether it was achieved.