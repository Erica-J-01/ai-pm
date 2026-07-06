---
name: retrospective
description: Facilitates a sprint or project retrospective and turns raw retro input into a structured, action-oriented retro document. Use whenever someone says "run a retro", "sprint retrospective", "what went well / what didn't", "let's reflect on the sprint", or pastes raw retro notes that need structuring into themes and owned action items. Standalone - runs after a sprint or release, does not chain into build skills.
version: 1.0.0
argument-hint: <sprint name + retro notes, or "plan a retro">
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Are you planning a retro or writing one up? For a write-up, paste the team's notes (what went well, what didn't, ideas). For planning, tell me the sprint and team size."*

---

# Retrospective

Two modes - infer from the input, or ask:

| Mode | When | Output |
|---|---|---|
| **Facilitate** | Before the session - need a format and prompts | Retro plan + prompts |
| **Synthesise** | After - have raw notes | Structured retro with owned actions |

If raw notes are present, go straight to Synthesise.

---

## What to Gather First

| Input | Required? | Notes |
|---|---|---|
| Sprint / period | Yes | Anchors the retro |
| Raw notes or themes | Yes (Synthesise) | What the team said |
| Sprint metrics | No | Velocity, carryover, incidents - adds evidence |
| Prior retro actions | No | Were last retro's actions done? |

---

# Mode 1 - Facilitate

## Output Template - Retro Plan

### RETRO PLAN - [Sprint / Period]
**Duration:** [e.g. 60 min] | **Team:** [N] | **Format:** [Start/Stop/Continue, 4Ls, Sailboat]

**Goal:** Surface what to change next sprint - not to assign blame.

**Agenda**
| Time | Block | Purpose |
|---|---|---|
| 0-5 | Set the stage | Restate sprint goal + outcome |
| 5-10 | Review last retro's actions | Did we do them? |
| 10-30 | Gather (silent then share) | What went well / what didn't |
| 30-45 | Group + vote | Cluster themes, dot-vote top 3 |
| 45-58 | Actions | One owned action per top theme |
| 58-60 | Close | Confirm owners and check-in date |

**Prompts**
- What should we keep doing because it worked?
- What slowed us down or frustrated us?
- What surprised us?
- If we ran the sprint again, what's the one thing we'd change?

---

# Mode 2 - Synthesise

## Output Template - Retro Summary

### SPRINT RETRO - [Sprint / Period]
**Date:** [Today] | **Attendees:** [Roles] | **Sprint outcome:** [Met / Partially met / Missed goal]

#### Prior Actions Review
| Last Retro Action | Owner | Done? |
|---|---|---|
| [Action] | [Who] | Yes / No / Partial |

*(Omit if first retro.)*

#### What Went Well
- [Specific thing - why it helped]

#### What Didn't
| # | Theme | What happened | Impact |
|---|---|---|---|
| 1 | [Theme] | [Specific, blameless] | [Cost to team/delivery] |

#### Action Items
| # | Action | Owner | By When | Addresses |
|---|---|---|---|---|
| 1 | [Concrete, testable change] | [Person] | [Date] | [Theme #] |

> Each action has one owner and a date. "Communicate better" is not an action - "Post the deploy plan in #releases by Wed standup" is.

If the input doesn't give an owner or date for an action, do not fabricate one. Assign the most likely owner from context and mark it `[confirm at retro]`, or use `[Owner TBC]` / `[Date TBC]`, and flag that each must be set before the retro closes.

#### Sentiment
[One line: team morale and any signal worth watching.]

---

## After Generating

Follow the **Saving Artefacts** rules in `.claude/claude.md`. Default local path: `clients/CLIENT/sprint-artefacts/YYYY-MM-DD-sprint-N-retro.md`. Then suggest carrying the action items into the next `/sprint-planning`.
