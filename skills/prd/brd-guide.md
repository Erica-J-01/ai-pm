# BRD-Specific Guide

Read this when the document type is BRD. The core template is the same - these are the differences.

---

## When to Write a BRD Instead of a PRD

A BRD is the right choice when:
- The audience is primarily business stakeholders or a steering committee, not engineers
- The project involves procurement, vendor selection, or contractual requirements
- The outcome is a business change (process, policy, org structure) not just a product
- Formal sign-off from senior leadership or a board is required

A BRD focuses on **what the business needs to achieve** - not how the system should work. Technical details belong in a functional spec or PRD written later.

---

## Differences from PRD

### Add: Business Case Summary (after Purpose & Background)

This is the one section a BRD has that a PRD doesn't. It answers the question a sponsor always has: "Why are we spending money on this?"

```
### Business Case Summary

| Item | Detail |
|---|---|
| Problem cost | [What the current situation costs - time, money, risk] |
| Proposed investment | [Budget required] |
| Expected benefit | [Financial or operational return] |
| Payback period | [When investment is recovered] |
| Strategic alignment | [Which company objective this supports] |
```

Keep it to one table and 2-3 sentences max. If the numbers don't stack up, say so - a BRD that hides a weak business case creates bigger problems later.

---

### Language Differences

BRDs use more formal, outcome-driven language than PRDs:

| PRD language | BRD equivalent |
|---|---|
| "A user must be able to..." | "The system shall enable [business capability] so that [business outcome]" |
| "The dashboard loads in 2 seconds" | "The solution shall meet the performance standards defined in Appendix A" |
| "Out of scope: mobile app" | "The following are explicitly excluded from this requirement: [item]" |

---

### Requirements Format for BRD

BRDs state business requirements - not features. Each requirement should describe a **business capability or outcome**, not a system behaviour.

**Wrong (feature, not business requirement):**
"The system must have a CSV export button."

**Right (business requirement):**
"Finance administrators must be able to extract monthly transaction data in a machine-readable format to support GL reconciliation without manual re-entry."

The technical solution (CSV export button) follows from the business requirement - it doesn't replace it.

---

### Formal Traceability

BRDs often need to trace requirements to business objectives. Add a traceability column if the project has formal governance:

| ID | Requirement | Business Objective | Priority |
|---|---|---|---|
| BR-01 | [Requirement] | [Which objective it supports] | Must/Should/Could |

---

### Sign-off - BRD Is More Formal

BRD sign-off typically requires more senior stakeholders and a formal status:

| Role | Name | Organisation | Status | Date |
|---|---|---|---|---|
| Executive Sponsor | | | Formally approved | |
| Business Owner | | | Formally approved | |
| Finance / Procurement | | | Formally approved | |
| IT / Technical Authority | | | Technically endorsed | |

"Formally approved" means the person has read and accepted the document as a basis for proceeding. This is different from "reviewed" - make the distinction clear.

---

## What a BRD Does Not Contain

- UI wireframes or screen designs
- Technical architecture decisions
- Sprint plans or delivery timelines
- Code or data schemas

If any of these appear in a BRD, they're in the wrong document. The BRD defines what the business needs - separate documents define how it will be built.