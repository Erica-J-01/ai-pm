---
name: roadmap
description: Builds or updates a product or delivery roadmap from a charter, PRD, backlog, or stakeholder priorities. Use whenever someone says "build a roadmap", "what's our roadmap", "plan the next quarter", "now/next/later", or wants initiatives sequenced into themes and time horizons with dependencies and confidence. Produces a Now/Next/Later or quarterly roadmap - not a sprint plan.
version: 1.0.0
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

If priorities aren't given, ask what the top business goal is - a roadmap without a priority signal is just a list.

---

## Output Template

### [Product / Project] Roadmap
**Date:** [Today] | **Horizon:** [e.g. next 2 quarters] | **Confidence:** Near-term firm, later directional

#### Roadmap Goal
[One sentence: the outcome this roadmap is sequenced to achieve.]

#### Now / Next / Later

**🟢 Now (committed - in progress or next up)**
| Initiative | Theme | Why now | Confidence |
|---|---|---|---|
| [Name] | [Theme] | [Priority driver] | High |

**🟡 Next (planned - sequenced, not yet committed)**
| Initiative | Theme | Depends on | Confidence |
|---|---|---|---|
| [Name] | [Theme] | [Now item] | Medium |

**⚪ Later (directional - under consideration)**
| Initiative | Theme | Open question | Confidence |
|---|---|---|---|
| [Name] | [Theme] | [What must be true] | Low |

*(For a quarterly view, replace the three buckets with Q1 / Q2 / Q3 columns and keep the same fields.)*

#### Dependencies & Sequencing
- [Initiative X must precede Initiative Y because …]

#### Out of Scope / Not Now
- [Explicitly parked - with the reason]

#### Assumptions
- [assumed] [Anything inferred about capacity, priority, or timing]

---

## After Generating

Follow the **Saving Artefacts** rules in `.claude/claude.md`. Default local path: `clients/CLIENT/project-artefacts/YYYY-MM-DD-roadmap.md`. If priorities shifted to produce this, suggest a `/decision-log` entry.
