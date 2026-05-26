---
name: pm-risk-scan
description: Identifies, evaluates, and recommends mitigation strategies for project risks across any phase of delivery. Use whenever a PM needs continuous risk discovery or decision support — including when someone says "analyse the risks on this project", "do a full risk analysis", "we need a risk review", "what risks should I be tracking right now", "update the risk picture", or shares project context and wants a structured risk assessment. Unlike the initial pre-screen (pm-initial-risk-scan), this skill is designed for ongoing use across all project phases — Discovery through Deployment — and adjusts depth based on how much time the PM has. Use it at any phase gate, after significant scope changes, or when the risk landscape feels unclear.
tools: []
---

# Before Starting — What to Gather

Extract or ask for these before writing anything:

| Input | Required? | Why |
|---|---|---|
| Project context | Yes | Scope, timeline, stakeholders, goals — without this, risks are generic |
| Current phase | Yes | Risk profile changes by phase — see phase table below |
| Known constraints | No | Fixed deadlines, budget caps — these turn risks into near-certainties |
| Recent changes | No | Scope, team, or requirement changes are a primary risk source |
| Depth needed | No | Default Medium — see depth table below |

If project context or current phase is missing, ask before proceeding.

---

# Phase → Risk Focus

Apply the right lens for the current phase. Risks amber in an earlier phase can be red now — flag it.

| Phase | What to focus on |
|---|---|
| Discovery | Problem clarity, stakeholder coverage, untested assumptions, shaky business case |
| Design | Scope expansion, deferred decisions, unvalidated tech approach, missing acceptance criteria |
| Development | Delivery pace, integration failures, technical debt, dependency slippage |
| Testing | Defect rate, environment stability, UAT availability, coverage gaps |
| Deployment | Rollback readiness, ops training, comms sequencing, data migration |

For Testing and Deployment in detail — read `references/PHASE-GUIDE.md`.

---

# Depth

| Depth | When | Risks | Sections to include |
|---|---|---|---|
| Low | "quick", "brief" | 3–5 | Risk register + verdict only |
| Medium | default | 5–8 | Full output except Prioritisation Reasoning |
| High | "thorough", "board report" | 8–12 | Full output including Prioritisation Reasoning |

---

# Scoring

Score every risk across four dimensions — each one changes the response, not just the priority colour.

**Likelihood:** H = more likely than not / M = possible / L = unlikely but real

**Impact:** H = project fails or major rework / M = delay or cost increase / L = minor inconvenience

**Detectability:** Easy = clear leading indicators / Moderate = needs active monitoring / Hard = little or no warning before it triggers

**Velocity:** Fast = escalates in hours / Medium = days / Slow = weeks

**Priority from Likelihood × Impact:**

| | High Impact | Low Impact |
|---|---|---|
| **High Likelihood** | 🔴 Act now | 🟡 Monitor actively |
| **Low Likelihood** | 🟡 Prepare contingency | 🟢 Log and revisit |

Every Hard-detectability risk needs a **trigger signal** — a specific observable event that tells you the risk has activated. Without one, nobody knows when to act.

**Response types:** Mitigate / Transfer / Avoid / Accept / Escalate. "Monitor" alone is not a response.

---

# Workflow

1. Read full input once — identify R1 (the single biggest threat given the current phase) then work outward
2. Check recent changes explicitly — they are disproportionately high risk and often missed
3. Score each risk across all four dimensions — don't default everything to Medium
4. Assign a trigger signal to every Hard-detectability risk
5. Assign an owner to every risk — no owner means no one is watching it
6. Flag high-uncertainty, high-impact risks for validation experiments
7. Write the stakeholder summary and overall verdict last — they must reflect the honest log

For format examples and calibration — read `references/REFERENCE.md`.

---

# Output Format

---

## RISK ANALYSIS

**Project:** [Name] | **Phase:** [Phase] | **Date:** [Today]
**Depth:** Low / Medium / High | **Recent changes assessed:** Yes / No

---

### Overall Verdict

🔴 High / 🟡 Medium / 🟢 Low

[2–3 sentences: dominant risk theme, whether the project is healthy for its current phase, what needs to change if not.]

---

### Risk Register

| # | Risk | Category | Likelihood | Impact | Priority | Detectability | Velocity | Response | Owner | Proximity |
|---|---|---|---|---|---|---|---|---|---|---|
| R1 | [Event — not a label] | Delivery/Technical/Stakeholder/Business | H/M/L | H/M/L | 🔴/🟡/🟢 | Easy/Moderate/Hard | Fast/Medium/Slow | [Type] | [Role] | [Week 1–2/Month 1/Later] |

---

### Top Risks — Detail
This should be in table format. 
*(every 🔴 risk; if none, top 2 🟡)*

**R[N] — [Name]**
*What could happen:* [Specific bad outcome]
*Why exposed:* [What makes this real for this project]
*Trigger signal:* [Observable event that confirms the risk has activated — required for Hard detectability]
*Velocity:* [How fast it escalates and why]
*Risk score:* [Qualitative one-liner]
*Action:* [Who does what by when]

---

### Validation Experiments
*(Medium/High depth only — High-impact risks where the outcome is genuinely uncertain)*

| Risk | Experiment | What We're Testing | Expected Learning | By |
|---|---|---|---|---|
| [Name] | Spike/Prototype/Pilot/Data pull | [Assumption being tested] | [What we'll know] | [Hard date] |

---

### Stakeholder Summary
*(Medium/High depth — written for sponsor, not PM)*

> "We are at risk of [outcome] due to [cause]. Recommended action: [next step]."

One line per top risk. Plain language. No jargon.

---

### Prioritisation Reasoning
*(High depth only)*

Explain why top risks are ranked as they are — especially where velocity or detectability overrides a lower probability score.

---

### Decisions Needed

| Decision | Owner | By |
|---|---|---|
| [Requires authority above PM] | [Role] | [Date] |

---

### Not Assessed

- [Area — why it couldn't be evaluated from available information]

---

# Quality Check

- [ ] Phase reflected in risk focus and proximity scores
- [ ] Recent changes explicitly assessed
- [ ] Every risk is a specific event, not a category label
- [ ] All four attributes scored per risk
- [ ] Hard-detectability risks have trigger signals
- [ ] Every risk has an owner
- [ ] Depth respected — correct sections included/omitted
- [ ] Stakeholder summary uses "at risk of X due to Y" format
- [ ] Decisions table contains only items needing authority above PM
- [ ] Verdict honestly reflects the register

---

# Reference Files

- `references/REFERENCE.md` — Full worked example with scoring rationale. Read when calibrating output quality or unsure how to score a specific risk type.
- `references/PHASE-GUIDE.md` — Detailed risk patterns per phase. Read for Testing or Deployment phases, or when a project is transitioning and prior-phase risks may still be active.