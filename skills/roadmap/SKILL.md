---
name: roadmap
description: Builds or updates a product or delivery roadmap from a charter, PRD, backlog, or stakeholder priorities. Use whenever someone says "build a roadmap", "what's our roadmap", "plan the next quarter", "now/next/later", or wants initiatives sequenced into themes and time horizons with dependencies and confidence. Produces a Now/Next/Later or quarterly roadmap - not a sprint plan.
version: 1.1.0
argument-hint: <charter, PRD, backlog, or priority list>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "What should the roadmap cover - paste the charter, PRD, or initiative list. Do you want Now/Next/Later or a quarterly view, and over what horizon?"*

---

# Roadmap

A roadmap communicates intent and sequence, not commitments to dates for distant work. Be honest about confidence - near-term is firm, far-term is directional.

## What to Gather First

| Input | Required? | Notes |
|---|---|---|
| Initiatives / themes | Yes | What could be built |
| Goals / priorities | Yes | What matters most and why |
| Horizon + format | No | Now/Next/Later (default) or quarterly |
| Capacity / constraints | No | Team size, fixed deadlines |
| Dependencies | No | What must precede what |
| Existing roadmap | No | Triggers update mode (see below) |

If priorities aren't given, ask what the top business goal is - a roadmap without a priority signal is just a list.

**Build vs update.** If the user supplies an existing roadmap, or one already exists in the active project's `project-artefacts/` folder, treat the run as an update. Open the output with a short **Changes since [date of prior roadmap]** section listing every item that moved bucket, was added, or was parked, each with a one-line reason. Then give the full refreshed roadmap.

**Capacity sanity check.** If team size or capacity is known and the Now bucket obviously exceeds it (e.g. eight parallel initiatives for four people), state the mismatch in one line and ask which items move to Next before finalising. No capacity arithmetic or per-person maths - that belongs to /sprint-planning.

---

## Output Template

### [Product / Project] Roadmap
**Date:** [Today] | **Horizon:** [e.g. next 2 quarters] | **Confidence:** Near-term firm, later directional | **Next review:** [date or trigger, e.g. post-Q2 close]

#### Changes since [date of prior roadmap]
*(Update runs only - omit when building from scratch.)*
- [Initiative] moved [Next → Now] - [one-line reason]
- [Initiative] added to [bucket] - [one-line reason]
- [Initiative] parked - [one-line reason]

#### Roadmap Goal
[One sentence: the outcome this roadmap is sequenced to achieve.]

#### Hard Commitments
*(Only dates stated in the input - never infer one. Omit this section if there are none.)*
| Commitment | Fixed date | Sits in |
|---|---|---|
| [e.g. compliance deadline] | [Stated date] | [Now/Next] |

#### Now / Next / Later
*Approximate spans, derived from the stated horizon - e.g. for a two-quarter horizon: Now is roughly this quarter, Next the following quarter, Later beyond that.*

**Now (committed - in progress or next up)**
| Initiative | Theme | Why now | Confidence |
|---|---|---|---|
| [Name] | [Theme] | [Priority driver] | High |

**Next (planned - sequenced, not yet committed)**
| Initiative | Theme | Depends on | Confidence |
|---|---|---|---|
| [Name] | [Theme] | [Now item] | Medium |

**Later (directional - under consideration)**
| Initiative | Theme | Open question | Confidence |
|---|---|---|---|
| [Name] | [Theme] | [What must be true] | Low |

*(For a quarterly view, replace the three buckets with Q1 / Q2 / Q3 columns and keep the same fields. If the input carries any effort signal - backlog estimates, an SOW, stated gut-feel - add a rough **Size** column (S/M/L) to each bucket table. If it carries none, omit the column rather than invent values.)*

#### Dependencies & Sequencing
- [Initiative X must precede Initiative Y because …]

#### Out of Scope / Not Now
- [Explicitly parked - with the reason]

#### Assumptions
- [assumed] [Anything inferred about capacity, priority, or timing]

---

## After Generating

Follow the **Saving Artefacts** rules in `.claude/claude.md`. Default local path: `clients/CLIENT/project-artefacts/YYYY-MM-DD-roadmap.md`. If priorities shifted to produce this, suggest a `/decision-log` entry - on an update run, the Changes since section gives that entry its content.
