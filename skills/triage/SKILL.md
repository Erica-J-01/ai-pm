---
name: intake-triage
description: Converts vague, messy, or incomplete client and stakeholder requests into structured PM-ready intake summaries with risks, gaps, and next steps. Triggers on raw client messages, unclear feature requests, forwarded emails, stakeholder asks without context, or any input needing PM triage before discovery or planning.
version: 1.1.0
argument-hint: <raw message or request>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Please paste the raw message, email, or request you'd like me to triage."*

---

# Triage Rules

- **Check current work first.** If the active client/project is known, read `clients/CLIENT/PROJECT/context.md` before classifying and use it to fill **Impact on Current Work**. If no context file exists, write "Not checked - no project context on file". Never guess what scope is in flight.
- **Multiple asks.** If the input contains distinct separable asks, itemise them and classify each one. Keep shared fields (Requester & Source, Risks) common only where they genuinely apply to every ask.
- **Send-ready questions.** In **Missing Information**, tag each gap *(ask requester)* or *(check internally)* so the requester-facing subset can be pasted into a reply as-is.

## Intake Classification

Classification is readiness-only. Urgency is a property of the request, not a readiness state - record it in the **Urgency** field, never as the classification.

| Classification | When to Use |
|---|---|
| Ready for Discovery | Problem and stakeholders are clear, missing only solution details |
| Needs Clarification | Core ask is too vague to scope or estimate |
| Likely Change Request | Resembles scope already in progress or delivered |
| Needs Technical Review | Feasibility or architecture concerns block PM decisions |
| Low Priority / Unclear Value | No clear business goal |

## Routing

This skill handles intake only. After classifying, route:

| Classification | Next step |
|---|---|
| Ready for Discovery | `/discovery` |
| Needs Clarification | Send the *(ask requester)* questions, then re-triage |
| Likely Change Request | `/decision-log` |
| Needs Technical Review | `/tech-review` |

Later stages: requirements → `/prd`, story breakdown → `/stories`, sprint scoping and estimation → `/sprint-planning`.

---

# Output Format

## Requirement Intake Summary

**Requester & Source:**
*One line: who sent it, their role, the channel, date received. Note when the sender is relaying someone else's authority.*

**Request Summary:**
...

**Likely Business Goal:**
...

**Primary User / Stakeholder Need:**
...

**What Is Clear:**
- ...

**Missing Information:**
- ... *(ask requester)*
- ... *(check internally)*

**Risks / Concerns:**
- ...

**Urgency:**
*One line: the stated deadline and whether it reads as real or negotiable.*

**Impact on Current Work:**
*One of: new scope / change request against in-flight SOW / duplicate of existing scope / standalone. Based on the project's `context.md`. If none exists, say the check could not be run.*

**Intake Classification:**
...

**Recommended Next Step:**
...
