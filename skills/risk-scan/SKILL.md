---
name: risk-scan
description: Identifies, evaluates, and recommends mitigation strategies for project risks across any phase of delivery. Use whenever a PM needs continuous risk discovery or decision support - including when someone says "analyse the risks on this project", "do a full risk analysis", "we need a risk review", "what risks should I be tracking right now", "update the risk picture", or shares project context and wants a structured risk assessment. It runs at any depth, from a fast initial pre-screen right after triage (Low depth) through to ongoing risk discovery across all project phases (Discovery through Deployment), adjusting depth to how much time the PM has. Use it at any phase gate, after significant scope changes, or when the risk landscape feels unclear.

version: 1.1.0
argument-hint: <project context, phase, and known risks>
allowed-tools: Read, Bash(ls:*), Bash(find:*)
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Please share the project context - name, phase, timeline, known risks, and any recent changes."*

---

# Step 1: Run the Pre-Scan Interview

Before writing any analysis, read `skills/risk-scan/intake.md` and follow the interview protocol exactly.

- Scan the input for signals listed in intake.md to determine which conditional questions apply
- Skip any question the input already answers, and record the source of that answer
- Scale the interview to depth: at Low depth ask only Q1 and Q13 (a request for a quick scan already answers Q2)
- Ask **one question at a time** - present the question, offer the suggested answers, wait for the response, then move to the next
- Batch repeats: for Q5 and Q11, list every named dependency or integration in one question with the status options and let the PM answer per line
- In an interactive run, do not proceed to analysis until Q13 (the open risk question) has been answered
- **Non-interactive runs:** when risk-scan runs inside an orchestrated `/pm` chain straight after triage, ask nothing - analyse what the input provides and record every unanswered area in Not Assessed

---

# Step 2: Check for a Prior Scan

Before writing, look for a previous risk scan in the active project's artefact folder (`clients/CLIENT/PROJECT/project-artefacts/`) and open risks in that project's `context.md`.

- If neither exists, this is a first run. Proceed as normal, numbering from R1, and omit the Changes Since Last Scan block.
- If a prior scan or open risks exist, carry the prior R-numbers forward for risks still open. Never reuse a closed risk's ID. Number new risks from the highest ID ever used, plus one.
- On a re-scan, include the **Changes Since Last Scan** block and set a next-review date.

---

# Step 3: Read the Phase Guide and Calibrate

Read `skills/risk-scan/phase-guide.md` for the phase established in Q1 (or taken from the input in a non-interactive run), plus the phase-transition notes adjacent to it. Use it as a discovery checklist to catch that phase's high-frequency risks - it is not content to copy into the output.

Then read `skills/risk-scan/reference.md` once to calibrate scoring, trigger signals, and section formats before writing.

---

# Risk Discovery Guidance

Identify risks across multiple dimensions.

Consider:

- Product value
- Customer adoption
- Delivery execution
- Technical architecture
- Security & privacy
- Compliance & legal
- Operational readiness
- Stakeholder alignment
- External dependencies
- Budget and commercial viability

Avoid concentrating all risks in one category unless evidence strongly supports it.

For early-stage initiatives, ensure at least one risk is considered from:

- Product/Customer
- Delivery/Technical
- Business/Compliance

If insufficient information exists to assess an area, record it in Not Assessed rather than assuming.

---

# Depth

| Depth | When | Risks | Sections to include |
|---|---|---|---|
| Low | "quick", "brief", initial pre-screen after triage | 3-5 | Overall Verdict, Top Risk Snapshot, Risk Register, Mitigation Next Actions, Not Assessed |
| Medium | default | 5-8 | Full output including Top Risk Snapshot and Key Assumptions |
| High | "thorough", "board report" | 8-12 | Full output including Top Risk Snapshot, Key Assumptions, and Prioritisation Reasoning |

Changes Since Last Scan applies at every depth whenever a prior scan exists. Validation Experiments is optional at Medium and High.

Use Low depth as a fast pre-screen. Prefer Medium for most reviews. Reserve High for major investments, board discussions, regulatory reviews, or critical phase gates.

---

# Scoring

Score every risk across four dimensions.

**Likelihood:** H = more likely than not / M = possible / L = unlikely but real

**Impact:** H = project fails, launch blocked, major rework, regulatory exposure, or significant customer impact / M = delay, cost increase, reduced adoption, or operational burden / L = minor inconvenience

**Detectability:** Easy = clear leading indicators / Moderate = needs active monitoring / Hard = little or no warning before it triggers

**Velocity:** Fast = escalates in hours / Medium = days / Slow = weeks

**Priority from Likelihood × Impact:**

| | High Impact | Low Impact |
|---|---|---|
| High Likelihood | 🔴 Act now | 🟡 Monitor actively |
| Low Likelihood | 🟡 Prepare contingency | 🟢 Log and revisit |

Every Hard-detectability risk requires a trigger signal.

**Response types:** Mitigate / Transfer / Avoid / Accept / Escalate

A risk must be written as an event and consequence, not a topic.

Good:
- Third-party API rate limits prevent transaction processing during peak demand.

Bad:
- API risk
- Performance
- Dependencies

---

# Quality Checks

Before finalising the report:

- Every risk must be specific to the project context.
- Avoid generic risks that could apply to any project.
- Every 🔴 risk must have a named owner - an actual person, not a role. Take the name from context.md, the input, or interview answers. If no name is known, ask once at finalisation with a single question covering all red risks. Roles are acceptable for 🟡 and 🟢 risks.
- Every Hard-detectability risk must include a trigger signal.
- Decisions Needed should only include items requiring authority beyond the PM.
- Include product, customer, and adoption risks where relevant.
- If a major risk area cannot be evaluated, record it in Not Assessed.
- Prefer fewer high-quality risks over many generic risks.
- No information should be repeated across sections. The Register holds scores and ownership. Top Risks Detail adds root cause, why exposed, trigger signal, exposure, and action - nothing the register already holds. Stakeholder Summary synthesises themes rather than individual risks. Key Assumptions must be distinct from risks in the register.

Do not generate more than:
- 5 assumptions
- 8 risks (Medium)
- 12 risks (High)
- 5 decisions
- 5 unknowns

---

# Output Format

## RISK ANALYSIS

**Project:** [Name] | **Phase:** [Phase] | **Date:** [Today]

**Depth:** Low / Medium / High | **Recent changes assessed:** Yes / No

---

### Overall Verdict

Risk Level: 🔴 High / 🟡 Medium / 🟢 Low

Recommendation:
- Proceed
- Proceed with Conditions
- Escalate
- Pause


Conditions:
[List only for Proceed with Conditions]

[2-3 sentences covering dominant risk theme, project health, and rationale.]

---

### Changes Since Last Scan
*(Re-scans only - omit on a first run)*

- **New:** R[N] - [one-line reason]
- **Escalated:** R[N] - [one-line reason]
- **De-escalated:** R[N] - [one-line reason]
- **Closed:** R[N] - [one-line reason]

Next review: [date]

---

### Key Assumptions
*(Medium/High depth only)*

| Assumption | Confidence | Risk if Wrong |
|---|---|---|
| [Statement] | High/Medium/Low | [Consequence] |

Maximum 5 assumptions.

---

### Top Risk Snapshot
*(All depths)*

1. [Most significant risk]
2. [Second most significant risk]
3. [Third most significant risk]

Maximum 3 items.

---

### Risk Register

| # | Risk | Category | Likelihood | Impact | Priority | Detectability | Velocity | Response | Owner | Proximity |
|---|---|---|---|---|---|---|---|---|---|---|
| R1 | [Event - not a label] | Product/Customer/Adoption/Delivery/Technical/Security/Compliance/Operational/Dependency/Stakeholder/Business | H/M/L | H/M/L | 🔴/🟡/🟢 | Easy/Moderate/Hard | Fast/Medium/Slow | [Type] | [Name for 🔴 / Role] | [Week 1-2 / Month 1 / Later] |

---

### Mitigation Next Actions

One line per risk whose Response is Mitigate and which is not expanded in Top Risks Detail. Escalate risks surface in Decisions Needed. Risks with any other response need no action line.

- R[N]: [Who does what by when]

---

### Top Risks - Detail
*(Every 🔴 risk. If none, the top 2 🟡)*

Expand only on what the register table cannot hold. Do not restate the risk description, scores, or owner - those are already in the table.

**R[N] - [Short name]**

- Root cause: [Underlying reason this risk exists]
- Why exposed: [What in this specific project creates the exposure]
- Trigger signal: [Observable event that confirms the risk is materialising]
- Exposure: [Rough order of magnitude in delivery terms, e.g. ~2-4 weeks or ~15% of remaining budget. Include only when timeline or burn answers genuinely support an estimate - otherwise omit this line silently.]
- Action: [Who does what by when]

---

### Validation Experiments
*(Optional, Medium/High depth - include when a cheap test can convert the scariest unknown into evidence)*

| Risk | Experiment | What We're Testing | Expected Learning | By |
|---|---|---|---|---|
| R[N] | [Cheap test] | [The uncertainty it resolves] | [What the result decides] | [Date] |

Maximum 3 experiments.

---

### Stakeholder Summary
*(Medium/High depth only)*

> "We are at risk of [outcome] due to [cause]. Recommended action: [next step]."

Write as an executive paragraph covering: dominant risk theme, key trade-off leadership must make, and the single most important next action. Do not re-list individual risks by name or restate register content - synthesise only.

---

### Prioritisation Reasoning
*(High depth only)*

Explain why top risks are ranked as they are, especially where detectability or velocity elevates priority.

---

### Decisions Needed

| Decision | Owner | By | Impact if Delayed |
|---|---|---|---|
| [Requires authority above PM] | [Role] | [Date] | [Delivery / Cost / Compliance / Launch impact] |

---

### Not Assessed

Rank unknowns by potential impact.

**Critical Unknowns**
- [Area and reason]

**Secondary Unknowns**
- [Area and reason]

---

### Optional Next Step

This analysis can be visualised as an executive dashboard showing:

- Risk Heatmap (Likelihood × Impact)
- Risk Timeline (Urgency View)
- Risk Category Distribution
- Executive Summary Cards

> Would you like me to create this dashboard?

If the user agrees, invoke the `visualisation` skill using the completed risk analysis as input.