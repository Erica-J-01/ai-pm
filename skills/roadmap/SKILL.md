---
name: roadmap
description: Builds or updates a product or delivery roadmap from a charter, PRD, backlog, or stakeholder priorities. Use whenever someone says "build a roadmap", "what's our roadmap", "plan the next quarter", "now/next/later", or wants initiatives sequenced into themes and time horizons with dependencies and confidence. Produces a Now/Next/Later or quarterly roadmap - not a sprint plan.
version: 3.0.0
argument-hint: <charter, PRD, backlog, or priority list>
allowed-tools: Read
---

## Input

$ARGUMENTS

---

# Roadmap

A roadmap communicates intent and sequence, not commitments to dates for distant work. Near-term is firm; far-term is directional. Be honest about both.

---

## Step 1 — Validate the Input

Before generating anything, check what was provided.

**If no input was provided at all**, ask:
> "What should the roadmap cover? Paste the charter, PRD, backlog, or initiative list. I'll also need: the business/user outcome you're building toward, a rough time horizon or launch target, and your 2–4 delivery themes (if known)."

**If input was provided**, identify its type:
- Charter, PRD, or backlog → proceed to Step 2.
- Risk register, meeting notes, or status report → say: *"This looks like a [risk scan / meeting notes / status update] rather than a charter or backlog. I'll infer the feature roadmap from it, but you should validate the initiative list before sharing this externally."* Then proceed, flagging all inferred items in Assumptions.
- Unclear or mixed → extract what you can and flag gaps explicitly.

---

## Step 2 — Pre-Generation Interview

Gather these inputs **before** producing any roadmap output. If any are missing from the provided material, ask for them as a single grouped question — do not ask one at a time.

| Input | Required? | If missing |
|---|---|---|
| Business / user outcome | Yes | Ask: "What does success look like for users or the business?" |
| Time horizon or launch target | Yes | Ask: "What's the rough target — a date, a quarter, or a sprint count?" |
| Delivery themes | Recommended | Ask: "What are your 2–4 delivery themes? (e.g. Data Integration, Auth, Analytics, UX)" — or offer to infer them |
| What's already shipped | No | Ask if it's a mid-project roadmap: "What's already live or completed?" |
| Active risks or blockers | No | Ask: "Do you have a risk scan? I'll flag blockers against roadmap items." |
| Capacity / constraints | No | Ask if a launch date is firm: "Any hard constraints — team size, fixed deadlines, external dependencies?" |
| Existing roadmap | No | If supplied, or one exists in `project-artefacts/`, treat the run as an update (see Step 4) |

Only ask for what's genuinely missing. If the input material answers a question, do not ask it again.

---

## Step 3 — Classify Initiatives

Before filling the roadmap buckets, filter the input:

- **Include:** Customer/user-facing capabilities, architectural foundations, and integrations that unlock features.
- **Exclude:** Sprint tasks, access requests, process steps (go/no-go gates, UAT runs), internal tooling, and risk mitigations. These belong in a sprint plan, release checklist, or risk register — not the roadmap.

If you had to exclude items that the user may expect to see, note them briefly under Out of Scope.

---

## Step 4 — Define Themes

If themes were not provided, infer 2–4 from the initiative list and state them explicitly at the top of the roadmap. Every initiative maps to exactly one theme. Themes make the roadmap scannable — without them it's just a list.

**Build vs update.** If the user supplies an existing roadmap, or one already exists in the active project's `project-artefacts/` folder, treat the run as an update. Open the output with a short **Changes since [date of prior roadmap]** section listing every item that moved bucket, was added, or was parked, each with a one-line reason. Then give the full refreshed roadmap.

**Capacity sanity check.** If team size or capacity is known and the Now bucket obviously exceeds it (e.g. eight parallel initiatives for four people), state the mismatch in one line and ask which items move to Next before finalising. No capacity arithmetic or per-person maths - that belongs to /sprint-planning.

---

## Output Template

### [Product / Project] Roadmap
**Date:** [Today] | **Horizon:** [e.g. Q3 2026 / next 3 sprints / target launch: DD MMM YYYY] | **Format:** Now / Next / Later | **Next review:** [date or trigger, e.g. post-Q2 close]

#### Changes since [date of prior roadmap]
*(Update runs only — omit when building from scratch.)*
- [Initiative] moved [Next → Now] — [one-line reason]
- [Initiative] added to [bucket] — [one-line reason]
- [Initiative] parked — [one-line reason]

#### Roadmap Goal
[One sentence: the user or business outcome this roadmap is sequenced to achieve. Not a delivery milestone — an outcome.]

#### Hard Commitments
*(Only dates stated in the input — never infer one. Omit this section if there are none.)*
| Commitment | Fixed date | Sits in |
|---|---|---|
| [e.g. compliance deadline] | [Stated date] | [Now/Next] |

#### Themes
[Theme 1] | [Theme 2] | [Theme 3] | [Theme 4]

---

#### Shipped (if applicable)
| Initiative | Theme | Completed |
|---|---|---|
| [Name] | [Theme] | [Sprint / date] |

---

#### Now — committed (in progress or next up)
*Scope and timing are defined and resourced.*

| Initiative | Theme | Why now | Confidence |
|---|---|---|---|
| [Name] | [Theme] | [Priority driver or dependency unblocked] | High |

---

#### Next — planned (sequenced, not yet committed)
*Understood and estimated, but not yet in a sprint. Timing shifts if Now slips.*

| Initiative | Theme | Depends on | Confidence |
|---|---|---|---|
| [Name] | [Theme] | [Now item it follows] | Medium |

---

#### Later — directional (under consideration)
*Intent is set; scope and timing are not. Includes post-launch phase and next major bets.*

| Initiative | Theme | What must be true first | Confidence |
|---|---|---|---|
| [Name] | [Theme] | [Condition or predecessor] | Low |

*(For a quarterly view, replace the three buckets with Q1 / Q2 / Q3 columns and keep the same fields. If the input carries any effort signal - backlog estimates, an SOW, stated gut-feel - add a rough **Size** column (S/M/L) to each bucket table. If it carries none, omit the column rather than invent values.)*

---

#### Dependencies & Sequencing
- [Initiative A] must precede [Initiative B] because [reason].
- [External dependency]: [what the team is waiting on and from whom].

#### Active Blockers (if a risk scan was provided or blockers are evident)
| Blocker | Affects | Status | Owner |
|---|---|---|---|
| [Name] | [Initiative] | [Active / Monitoring] | [Name or TBD] |

#### Out of Scope / Not Now
- [Item] — [reason: deferred, separate workstream, post-launch, etc.]

#### Assumptions
- [assumed] [Anything inferred about scope, capacity, or timing — especially if input was not a charter or PRD]

---

## Confidence Definitions

Apply these consistently across all three buckets:

| Level | Meaning |
|---|---|
| **High** | Scope defined, resourced, no unresolved blockers |
| **Medium** | Scope understood, not yet committed; timing may shift if upstream items slip |
| **Low** | Direction set; scope, timing, and resourcing are open |

Do not assign High confidence to any initiative with an active critical blocker, unresolved dependency, or undefined scope.

---

## After Generating

1. If open questions remain (launch date unknown, themes unconfirmed, blockers unowned), list them after the roadmap under **"Before this roadmap is firm"** — no more than 3, each with a named owner or ask.
2. Follow the **Saving Artefacts** rules in `.claude/CLAUDE.md`. Default local path: `clients/CLIENT/project-artefacts/YYYY-MM-DD-roadmap.md`.
3. If priorities shifted to produce this roadmap, suggest a `/decision-log` entry — on an update run, the Changes since section gives that entry its content.
4. Suggest `/risk-scan` if active blockers are present and no risk register exists yet.
