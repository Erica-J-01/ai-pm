---
name: pm-prd
description: Writes a Product Requirements Document (PRD) or Business Requirements Document (BRD) from discovery findings, a project brief, or raw stakeholder input. Use whenever someone says "write the PRD", "write the BRD", "document the requirements", "we need a requirements document", "turn this into a spec", or has completed discovery and needs requirements formally documented before build begins. A PRD defines what to build and why — from the product/user perspective. A BRD defines what the business needs the solution to achieve — from the business/stakeholder perspective. Both serve the same purpose: give the team a single agreed source of truth so everyone builds the same thing. Use this skill after discovery, before user stories or design begins.
tools: []
---

# PRD vs BRD — Which One?

| | PRD | BRD |
|---|---|---|
| **Focus** | Product and user — what it does and for whom | Business — what it must achieve and why |
| **Audience** | Product, design, engineering | Sponsors, business stakeholders, procurement |
| **Tone** | User-centric, functional | Formal, outcome-driven |
| **Use when** | Building a product or feature | Business change, system procurement, internal projects |

If unclear, ask: "Is this primarily for the engineering/product team (PRD) or for business stakeholders and sign-off (BRD)?" Default to PRD for product/tech projects, BRD for business change or procurement.

Both share the same core structure — the BRD reference file has the differences called out.

---

# What to Gather First

| Input | Required? | Why |
|---|---|---|
| Project name + goal | Yes | Anchors the whole document |
| Discovery findings or brief | Yes | Without this, requirements are invented not elicited |
| Target users / stakeholders | Yes | Requirements without a user are just features |
| Known constraints | No | Technical, budget, regulatory — shapes what's feasible |
| Out-of-scope items | No | Explicitly excluding items prevents scope creep |

If discovery findings aren't available, ask: "Has discovery been done? If not, requirements written now will likely change — consider running discovery first."

---

# What Good Requirements Look Like

A requirement answers: **who** needs **what** and **why**. If any of those three are missing, it's not a requirement — it's a wish.

**Wrong:** "The system should be fast."
**Right:** "The dashboard must load in under 2 seconds for users on a standard corporate network, so the ops team can check status during live incidents without delay."

**Wrong:** "Admin users need reporting."
**Right:** "Finance admins must be able to export a monthly expense report as CSV, including all transactions, approvers, and amounts, so they can reconcile against the GL without manual data entry."

Every requirement must be testable — if you can't write a test for it, it's not specific enough.

---

# Workflow

1. Read all input fully before writing anything
2. Identify the document type — PRD or BRD
3. Separate functional requirements (what it does) from non-functional (how well it does it)
4. Mark anything inferred or assumed as `[assumed]` — never invent requirements
5. Flag any requirement that cannot be tested as incomplete
6. Write the sign-off section last — it makes the document feel real and actionable

For BRD-specific guidance — read `brd-guide.md`.
For a full worked example — read `reference.md`.

---

# Output Template

Use this structure. PRD and BRD share the same template — BRD adds a Business Case Summary section (see reference).

---

## [PRD / BRD] — [Project Name]

**Version:** 1.0 | **Date:** [Today] | **Author:** [PM name or role]
**Status:** Draft / Under Review / Approved
**Approvers:** [Names or roles who must sign off]

---

### 1. Purpose & Background
[2–3 sentences. Why does this project exist? What problem does it solve? What triggered it?]

### 2. Goals & Success Metrics

| Goal | Success Metric | Target |
|---|---|---|
| [What we want to achieve] | [How we'll measure it] | [The number or threshold] |

Goals without metrics are wishes. Every goal needs at least one measurable outcome.

### 3. Users & Stakeholders

| Role | Description | Primary need |
|---|---|---|
| [User type] | [Who they are] | [What they need from this solution] |

### 4. Assumptions & Constraints

**Assumptions** (believed true — must be validated before build):
- [assumed] [Statement]

**Constraints** (fixed — cannot change):
- [e.g. Must comply with GDPR]
- [e.g. Must integrate with existing Salesforce instance]

### 5. Functional Requirements

Group by feature area or user journey. Number every requirement — it makes review and traceability easier.

#### [Feature Area 1]

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-01 | [Who can do what, under what conditions, to what outcome] | Must / Should / Could | [Any clarification] |
| FR-02 | | | |

**Priority guide (MoSCoW):**
- **Must** — without this, the product fails. Non-negotiable.
- **Should** — high value, include if possible. Workaround exists.
- **Could** — nice to have. Cut first if time or budget is tight.
- *(Won't = out of scope — list in section 7)*

### 6. Non-Functional Requirements

| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-01 | Performance | [e.g. Page load time] | [e.g. < 2 seconds] |
| NFR-02 | Security | [e.g. Authentication] | [e.g. MFA required for admin roles] |
| NFR-03 | Accessibility | [e.g. WCAG compliance] | [e.g. WCAG 2.1 AA] |
| NFR-04 | Availability | [e.g. Uptime] | [e.g. 99.5% during business hours] |

### 7. Out of Scope
Explicitly stating what is NOT included is as important as what is. Every item here is a conversation that happened upfront.

- [Item explicitly excluded]
- [Item explicitly excluded]

### 8. Dependencies

| Dependency | Type | Owner | Status |
|---|---|---|---|
| [e.g. Salesforce API access] | Technical | IT | Confirmed / Pending / Blocked |

### 9. Open Questions
Requirements that cannot be finalised until these are answered:

| # | Question | Who Can Answer | By When |
|---|---|---|---|
| Q1 | [Unresolved question affecting requirements] | [Role] | [Date] |

### 10. Sign-off

| Role | Name | Status | Date |
|---|---|---|---|
| Product Owner / Sponsor | | Approved / Changes requested | |
| Tech Lead | | Approved / Changes requested | |
| [Other stakeholder] | | | |

---

# Quality Check

- [ ] Every requirement has a who, what, and why
- [ ] Every requirement is testable — if you can't write a test for it, rewrite it
- [ ] Every goal has a measurable metric and target
- [ ] Out of scope has at least 2 named items
- [ ] Non-functional requirements have specific targets — not "fast" or "secure"
- [ ] All `[assumed]` items are flagged
- [ ] Open questions table exists — zero open questions at this stage is a red flag
- [ ] Sign-off table has named approvers, not just roles

---

# Reference Files

- `reference.md` — Full worked example: brief → complete PRD. Read when input is thin or requirements are hard to separate from solutions.
- `brd-guide.md` — BRD-specific differences: business case summary, formal language, procurement context. Read when document type is BRD.