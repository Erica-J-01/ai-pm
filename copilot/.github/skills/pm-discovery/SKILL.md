---
name: pm-discovery
description: Plans and documents discovery workshops and stakeholder interviews for new projects. Use whenever a PM needs to prepare for or capture output from a discovery session — including when someone says "plan a discovery workshop", "run discovery on this", "I need to interview stakeholders", "help me structure discovery", "summarise what came out of the discovery session", or shares raw notes from a workshop or interview and needs them turned into structured findings. Discovery is where projects are made or broken — the goal is to understand the real problem before anyone commits to a solution. Use this skill before requirements are written and before any build begins.
tools: []
---

# What This Skill Does

Two modes — tell Claude which one you need:

| Mode | When to use | Output |
|---|---|---|
| **Plan** | Before the session — need an agenda, questions, or interview guide | Workshop plan + question set |
| **Summarise** | After the session — have raw notes, transcript, or bullet dump | Structured findings document |

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

# Mode 1 — Plan

## What Good Discovery Looks Like

Discovery answers three questions before requirements are written:
1. What problem are we actually solving? (not just the one stated)
2. Who is affected, and how?
3. What does success look like to the people who matter?

A workshop that skips these produces requirements nobody needed.

## Workflow

1. Read the project brief and what's already known
2. Identify the 3–5 most important unknowns — what must be true for the project to succeed?
3. Group attendees by role — sponsors need different questions than end users
4. Build the agenda around unknowns, not topics
5. Prepare probing follow-up questions — the first answer is rarely the real one

## Output Template — Workshop Plan

---

### DISCOVERY PLAN

**Project:** [Name] | **Date:** [Session date or TBC] | **Duration:** [e.g. 90 mins]
**Facilitator:** [PM or name] | **Attendees:** [Roles or names]

---

#### Session Goal
[One sentence: what must we know by the end of this session that we don't know now?]

#### Key Unknowns Going In
The questions this session must answer:
1. [Unknown 1 — most critical]
2. [Unknown 2]
3. [Unknown 3]

#### Agenda

| Time | Block | Purpose |
|---|---|---|
| 0–5 min | Welcome + context | Align everyone on why we're here |
| 5–20 min | Current state | Understand the problem as it exists today |
| 20–45 min | Pain points + impact | Dig into what's broken and who it hurts |
| 45–65 min | Ideal future state | What does good look like? |
| 65–80 min | Constraints + risks | What could stop us? |
| 80–90 min | Next steps | Who does what before the next session |

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

#### What to Capture During the Session
- Exact quotes — the words people use reveal what they actually care about
- Disagreements between attendees — these are hidden risks
- Anything said with strong emotion — frustration, excitement, fear
- Items that get deferred with "we'll figure that out later"

---

# Mode 2 — Summarise

## What Good Findings Look Like

Raw notes contain everything. A good summary contains only what matters:
- The real problem (which may differ from the stated problem)
- Who is affected and how
- What success looks like
- What the team disagrees on
- What's still unknown

A summary that just restates the notes hasn't added value. The PM's job is to interpret, not transcribe.

## Workflow

1. Read all notes fully before writing anything
2. Separate facts (stated) from inferences (read between the lines) — label inferences `[inferred]`
3. Look for the gap between what people said and what they meant
4. Identify conflicts between what different attendees said
5. Surface the unknowns that the session didn't resolve — these become the next step

## Output Template — Findings Summary

---

### DISCOVERY FINDINGS

**Project:** [Name] | **Session date:** [Date] | **Prepared by:** [PM]
**Attendees:** [Roles or names] | **Session type:** Workshop / Interview

---

#### The Real Problem
[2–3 sentences. What is the root cause? This may differ from what was stated at the start of the session. If it does, say so explicitly.]

#### Who Is Affected and How

| Stakeholder | Current pain | Impact |
|---|---|---|
| [Role] | [What they experience] | [What it costs them — time, money, quality] |

#### What Success Looks Like
[What did attendees say good looks like? Be specific — "faster" is not a success criterion, "onboarding completed in 1 day instead of 5" is.]

#### Key Findings

| # | Finding | Source | Confidence |
|---|---|---|---|
| F1 | [Specific insight] | [Who said it / observed] | High / Medium / Low |

*Confidence = High if stated directly, Medium if inferred, Low if contradicted by someone else.*

#### Conflicts and Disagreements
[What did different attendees disagree on? These are not problems to smooth over — they are the most important things to resolve before requirements are written.]

- [Person A] believes [X]. [Person B] believes [Y]. Unresolved.

#### Still Unknown
What the session did not answer — these become the agenda for the next session or the open items in the requirements:

| Unknown | Why it matters | How to resolve |
|---|---|---|
| [Question] | [What depends on the answer] | [Next step] |

#### Recommended Next Steps

| Action | Owner | By When |
|---|---|---|
| [Specific next action] | [Role] | [Date] |

---

# Format Anchor

**Wrong (finding):** "Stakeholders want better reporting."
**Right (finding):** "The ops team manually exports 3 spreadsheets every Monday morning to produce a report that the finance team reads on Tuesday. This takes 4 hours and the data is 24 hours old by the time it's read."

**Wrong (unknown):** "Requirements need clarification."
**Right (unknown):** "It's unclear whether the new system needs to integrate with the legacy CRM or replace it. The answer changes the build cost by an estimated £40k and 3 months."

---

# Quality Check

**Plan mode:**
- [ ] Session goal is one sentence and specific — not "discuss the project"
- [ ] Key unknowns are listed — not topics, but actual questions that need answers
- [ ] Questions include follow-ups that go beyond the surface answer
- [ ] "What would make you pull the plug" is included for sponsor sessions

**Summarise mode:**
- [ ] Real problem section may differ from stated problem — if it does, say so
- [ ] All findings are specific and evidence-based — no vague generalisations
- [ ] Conflicts between attendees are named, not smoothed over
- [ ] Still Unknown table has at least 1 entry — if zero unknowns came out of discovery, something is wrong
- [ ] `[inferred]` label used wherever the PM is reading between the lines

---

# Reference Files

- `references/REFERENCE.md` — Worked examples for both modes: a messy brief turned into a workshop plan, and raw interview notes turned into a findings summary.