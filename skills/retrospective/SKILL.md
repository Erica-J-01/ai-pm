---
name: retrospective
description: Facilitates a sprint or project retrospective and turns raw retro input into a structured, action-oriented retro document. Use whenever someone says "run a retro", "sprint retrospective", "what went well / what didn't", "let's reflect on the sprint", or pastes raw retro notes that need structuring into themes and owned action items. Standalone - runs after a sprint or release, does not chain into build skills.
version: 1.2.0
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
| Prior retro actions | No | Were last retro's actions done? Also used to spot recurring themes |

---

# Mode 1 - Facilitate

Pick the format for the room, not by habit:

- Routine sprint: Start/Stop/Continue is the default.
- Missed goal, incident, or visible team tension: open with a blameless timeline of what happened and consider collecting input anonymously before discussion.
- Remote team: silent writing in a shared board before anyone speaks.

Adjust the agenda below to match - do not walk into a tense room with the standard cheerful sequence.

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

**Works from whatever retro input you paste.** Synthesise does not assume a live retro was facilitated. A survey export, a chat log, ticket comments, or a plain list of what went well and what did not are all valid input. Structure whatever is provided and never invent reflections the team did not give.

Before writing the summary:

- **Depersonalise.** Rewrite person-directed notes as process or system themes ("Dave broke the build twice" becomes "build broke twice - no pre-merge check"). Never attribute a comment to a named individual anywhere in the artefact. If a note is a people or conduct issue rather than a process one, exclude it and flag it to the PM as "handle 1:1, not in this document".
- **Check prior retros.** If retro files exist for the active project (`clients/CLIENT/sprint-artefacts/*-retro.md`), read the most recent one or two. Tag any theme that also appeared there as **Recurring** in the What Didn't table. A recurring theme paired with a repeated failed action in Prior Actions Review is systemic - say so and suggest `/risk-scan` or `/decision-log`.
- **Cap actions at 3.** Up to 5 only with a stated reason. Remaining candidates go under *Parked - revisit if it recurs* so nothing is silently dropped.

## Output Template - Retro Summary

### SPRINT RETRO - [Sprint / Period]
**Date:** [Today] | **Attendees:** [Roles] | **Sprint outcome:** [Met / Partially met / Missed goal]
**Sprint facts:** [Committed vs done, carryover, incidents - omit if no metrics were given]

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
| 1 | [Theme - add "(Recurring)" if it appeared in a prior retro] | [Specific, blameless] | [Cost to team/delivery] |

*Where a sprint fact supports a theme, cite the number in What happened or Impact.*

#### Action Items
| # | Action | Owner | By When | Addresses |
|---|---|---|---|---|
| 1 | [Concrete, testable change] | [Person] | [Date] | [Theme #] |

> Each action has one owner and a date. "Communicate better" is not an action - "Post the deploy plan in #releases by Wed standup" is.

If the input doesn't give an owner or date for an action, do not fabricate one. Assign the most likely owner from context and mark it `[confirm]`, or use `[Owner TBC]` / `[Date TBC]`, and flag that each must be assigned before the actions are finalised (at the retro if there is one, otherwise by the PM).

If a theme is outside the team's control (client behaviour, staffing, budget), do not write it as a team-owned action with a date. Prefix the Action cell with **Escalation:**, default the owner to the PM, and point to `/stakeholder-update` or `/risk-scan` as the follow-on.

*Parked - revisit if it recurs:* [remaining action candidates, one line each - omit if none]

#### Sentiment
[One line: team morale and any signal worth watching.]

---

## After Generating

Follow the **Saving Artefacts** rules in `.claude/claude.md`. Default local path: `clients/CLIENT/sprint-artefacts/YYYY-MM-DD-sprint-N-retro.md`. Then suggest carrying the action items into the next `/sprint-planning`.
