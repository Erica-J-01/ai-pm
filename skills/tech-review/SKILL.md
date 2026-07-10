---
name: technical-feasibility-review
description: Helps a PM interpret a technical brief, architecture document, or solution architect output. Translates technical complexity into delivery-relevant language, surfaces risks hidden in technical decisions, identifies the right questions to raise with the SA or tech lead, and produces a PM-ready feasibility summary. Use when you receive an SA proposal, system design doc, integration spec, or tech stack decision and need to understand what it means for scope, timeline, and risk before committing to a plan.
version: 1.1.0
argument-hint: <SA proposal, architecture doc, or integration spec>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Please paste the technical document, SA proposal, architecture brief, or integration spec you'd like reviewed. Include the project name and any known constraints (timeline, team size, budget)."*

---

## Review Rules

**Thin or fragmentary input.** If the document lacks estimates, scope boundaries, or dependency information, say what is missing. Fill each section only with what the document actually supports - write "not stated in the document" rather than inferring. Use the verdict **Cannot assess - missing information** and state what is needed to complete the review.

**Check what the document does NOT say.** SA documents omit as much as they state. Check for: security/compliance review, data privacy and residency, testing and environments, migration and rollback, monitoring and alerting, reversibility and vendor lock-in. Surface only the absences that genuinely matter for this delivery, as risks or SA questions - never as padding.

---

# Output Format

## Technical Feasibility Review

**Project:** [Name]
**Document reviewed:** [Type and title if known]
**Date:** [Today]

---

### Document Type
[Architecture proposal / Integration spec / Data model / Tech stack decision / Spike output / Mixed]

---

### Plain-English Summary
[3-5 sentences. No jargon. What is being built, how the parts connect, what it replaces or depends on.]

---

### Delivery Implications
- **Timeline:** ...
- **Estimate:** [What the stated effort figure includes and explicitly excludes (QA, UAT, environments, deployment, hardening), and its basis - spike, prior experience, or guess]
- **Team / skills:** ...
- **Scope:** ...
- **Third-party dependencies:** ...
- **Cost / commercial:** [Recurring, usage-based, or licensing costs the approach introduces, and whether the commercial model covers them. If the document is silent but such costs are plausible, raise an SA question - never invent figures]
- **Operational / maintenance:** ...

---

### Risks Surfaced

| # | Risk | Likelihood | Impact | Note |
|---|---|---|---|---|
| R1 | ... | H/M/L | H/M/L | [Why this matters for delivery] |

**Top risk to act on now:** [R1 name - one sentence on why it's the priority]

---

### Dependencies

- [Specific dependency - what must be true or done before this can proceed]

---

### Questions for the SA / Tech Lead

1. [Specific, answerable question - delivery-focused]
2. ...

---

### Scope Implications
[What the technical approach means for the roadmap, sprint plan, or stakeholder expectations. Flag anything that implies more work than currently visible.]

---

### Feasibility Verdict

**[Verdict]**

[One sentence: the single most important next action for the PM.]

*Use exactly one of these verdicts:*
- **Feasible** - the approach is sound and the current plan can absorb it as proposed.
- **Feasible with conditions** - the approach is sound but has named gaps. Always list the conditions.
- **Not feasible as proposed** - the approach cannot deliver within the stated constraints without material change.
- **Cannot assess - missing information** - the document lacks the substance to judge. State what is needed to complete the review.

