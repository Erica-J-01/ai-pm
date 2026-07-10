---
name: discovery-workshop
description: Plans and documents discovery workshops and stakeholder interviews for new projects. Use whenever a PM needs to prepare for or capture output from a discovery session - including when someone says "plan a discovery workshop", "run discovery on this", "I need to interview stakeholders", "help me structure discovery", "summarise what came out of the discovery session", or shares raw notes from a workshop or interview and needs them turned into structured findings. Discovery is where projects are made or broken - the goal is to understand the real problem before anyone commits to a solution. Use this skill before requirements are written and before any build begins.
version: 1.1.0
argument-hint: <project context or workshop notes>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Are you planning a discovery session or summarising one that's already happened? Then share the project context or raw notes."*

---

# What This Skill Does

Two modes - tell Claude which one you need:

| Mode | When to use | Output |
|---|---|---|
| **Plan** | Before the session - need an agenda, questions, or interview guide | Workshop plan + question set |
| **Summarise** | After the session - have raw notes, transcript, or bullet dump | Structured findings document |

If it's unclear, ask: "Do you need help planning the session or summarising what came out of it?"

---

# What to Gather First

| Input | Plan mode | Summarise mode |
|---|---|---|
| Project name + brief description | Yes | Yes |
| Who will attend / was interviewed | Yes | Yes |
| What is already known | Helpful | Helpful |
| Raw notes / transcript | No | Yes |
| Duration available | Yes | No |

If raw notes are provided, go straight to Summarise mode. Don't ask for more than what's needed.

---

# Mode 1 - Plan

## Output Template - Workshop Plan

---

### DISCOVERY PLAN

**Project:** [Name] | **Date:** [Session date or TBC] | **Duration:** [e.g. 90 mins]
**Facilitator:** [PM or name] | **Attendees:** [Roles or names]
**Missing voices:** [Roles the problem plausibly touches who are not in the room, and which findings will be second-hand as a result - e.g. "No expense-submitting employee attending - submission pain findings will be second-hand"]

---

#### Session Goal
[One sentence: what must we know by the end of this session that we don't know now?]

#### Key Unknowns Going In
The questions this session must answer:
1. [Unknown 1 - most critical]
2. [Unknown 2]
3. [Unknown 3]

#### Before the Session, Please Bring
Data the Key Unknowns depend on - volumes, cycle times, error rates, cost figures. 2-4 items, sent as a pre-read ask. No homework essays.
- [Attendee or role]: [specific number or data item]

#### Agenda

| Time | Block | Purpose |
|---|---|---|
| 0-5 min | Welcome + context | Align everyone on why we're here |
| 5-20 min | Current state | Understand the problem as it exists today |
| 20-45 min | Pain points + impact | Dig into what's broken and who it hurts |
| 45-65 min | Ideal future state | What does good look like? |
| 65-80 min | Constraints + risks | What could stop us? |
| 80-90 min | Next steps | Who does what before the next session |

*Adjust timing for your actual duration. For interviews (1:1), drop the welcome block and spend more time on pain points.*

#### Question Bank

**Current state:**
- Walk me through what happens today when [the problem occurs].
- How often does this happen? Who is affected?
- What do you do to work around it?

**Pain + impact:**
- What's the biggest frustration with the current situation?
- What happens if this doesn't get fixed? What does it cost the business?
- Who feels this pain most acutely?

**Future state:**
- If this was solved perfectly, what would be different about your day?
- How would you know the solution was working?
- What's the minimum that would make a real difference?

**Constraints:**
- What can't we change, even if we wanted to?
- Has this been tried before? What happened?
- Who needs to approve any change?

**For sponsors only:**
- What does success look like in 12 months?
- What would make you pull the plug on this project?
- What's the budget and timeline you have in mind?

**Only if the input arrived solution-first** (e.g. "we need a new expense system", "we need an app") - test the solution against the problem:
- What problem does [the named solution] solve, in your words?
- What else was considered and why was it rejected?
- If [the solution] were impossible, what would you do instead?

#### What to Capture During the Session
- Exact quotes - the words people use reveal what they actually care about
- Disagreements between attendees - these are hidden risks
- Anything said with strong emotion - frustration, excitement, fear
- Items that get deferred with "we'll figure that out later"

---

# Mode 2 - Summarise

**Multiple sessions:** if the notes span more than one session, or a findings doc already exists for this project, consolidate into one document - do not produce a fresh doc per session. List every date and type in the header, note which session each finding came from in the Source column, raise confidence where separate sessions agree, and route contradictions between sessions to Conflicts and Disagreements.

## Output Template - Findings Summary

---

### DISCOVERY FINDINGS

**Project:** [Name] | **Session date(s):** [Date or dates] | **Prepared by:** [PM]
**Attendees:** [Roles or names] | **Session type(s):** Workshop / Interview

---

#### The Real Problem
[2-3 sentences. What is the root cause? This may differ from what was stated at the start of the session. If it does, say so explicitly.]

#### Who Is Affected and How

| Stakeholder | Current pain | Impact |
|---|---|---|
| [Role] | [What they experience] | [What it costs them - time, money, quality] |

#### What Success Looks Like
[What did attendees say good looks like? Be specific - "faster" is not a success criterion, "onboarding completed in 1 day instead of 5" is.]

#### Key Findings

| # | Finding | Source | Confidence |
|---|---|---|---|
| F1 | [Specific insight] | [Who said it / observed] | High / Medium / Low |

*Confidence = High if stated directly, Medium if inferred, Low if contradicted by someone else.*

*If the notes record no speaker, set Source to "session notes - unattributed" and cap confidence at Medium. Never assign a statement to a named attendee unless the notes do.*

#### Conflicts and Disagreements
[What did different attendees disagree on? These are not problems to smooth over - they are the most important things to resolve before requirements are written.]

- [Person A] believes [X]. [Person B] believes [Y]. Unresolved.

#### Still Unknown
What the session did not answer - these become the agenda for the next session or the open items in the requirements:

| Unknown | Why it matters | How to resolve |
|---|---|---|
| [Question] | [What depends on the answer] | [Next step] |

#### Recommended Next Steps

| Action | Owner | By When |
|---|---|---|
| [Specific next action] | [Role] | [Date] |

#### Readiness Verdict

> **[Ready / Not ready]** for charter and requirements. [If not ready, name the exact blocking items - pull them straight from Still Unknown and Conflicts, no new analysis.]

---

## Internal vs Playback Version

The findings doc above is the candid internal version - named sources, budget misalignments, trust issues and all. That is the default. If the user picks a shared destination at the save confirmation (Confluence, Notion, client email), offer a playback version before publishing: roll attribution up to role level (Finance, Ops), and remove politically sensitive comments tied to named individuals. Ask once, at the save step that already exists - not earlier.

