# REFERENCE — decoding-pm-intake-requirements

This file contains reference material to support the skill defined in SKILL.md.
Claude reads this file only when additional examples or context are needed.

---

## Worked Example

### Input (Raw Stakeholder Message)
> "Hey, the CEO wants the onboarding fixed. Customers are complaining it's too slow and confusing. Can we get something done by end of month? Also maybe add a progress bar. Let me know."

---

### Output

## Requirement Intake Summary

**Request Summary:**
The CEO wants the customer onboarding flow improved for speed and clarity, with a potential progress bar addition, by end of month.

**Likely Business Goal:**
Improve customer activation and reduce early churn by fixing a friction point in the onboarding experience.

**Primary User / Stakeholder Need:**
New customers are struggling to complete onboarding — likely leading to drop-off. The CEO wants a visible fix quickly to address complaints.

**What Is Clear:**
- There is an existing onboarding flow with known user complaints
- Speed and confusion are the two cited problems
- A progress bar has been suggested as a possible solution
- End-of-month is the stated deadline

**Missing Information:**
- What specific steps in onboarding are causing drop-off or confusion?
- What does "slow" mean — technically slow (load times) or cognitively slow (too many steps)?
- How many customers are affected and how is this being measured?
- Who owns the current onboarding flow — product, engineering, or CX?
- Is the progress bar a requirement or a suggestion?
- What does success look like — completion rate, time-to-complete, CSAT?
- Has any user research or session recording been done?

**Risks / Concerns:**
- Unrealistic timeline: end-of-month may not allow for proper discovery and delivery
- Solution proposed before problem is fully understood (progress bar framing)
- No success metric defined — hard to know if the fix worked
- "CEO wants it" pressure may skip necessary validation steps
- Scope is undefined — "fix onboarding" could mean 1 screen or a full redesign

**Intake Classification:**
Needs Clarification

**Recommended Next Step:**
Run a 30-minute discovery call with the product owner and one CX rep to identify the top 2–3 specific friction points, agree on a success metric, and validate whether the deadline is realistic before any scoping begins.

---

## Common Trigger Inputs

Use this skill when messages resemble any of the following:

| Input Type | Example |
|---|---|
| Urgent executive ask | "CEO wants onboarding fixed by Friday." |
| Vague feature request | "Can we add multi-language support?" |
| Client forwarded message | "See below — client wants AI dashboard by next month." |
| Underdefined need | "Need better reporting urgently." |
| Ambiguous scope | "Customer asked for API integration." |
| Workshop output | "Notes from yesterday's session — lots of ideas, nothing decided." |
| Partial requirement | "We need something for mobile. Not sure what exactly." |

---

## Intake Classification Guide

| Classification | When to Use |
|---|---|
| Ready for Discovery | Problem and stakeholders are clear; missing only solution details |
| Needs Clarification | Core ask is too vague to scope or estimate |
| Likely Change Request | Resembles scope already in progress or delivered |
| Needs Technical Review | Feasibility or architecture concerns block PM decisions |
| Low Priority / Unclear Value | No clear business goal or urgency |
| Urgent Business Request | Time-sensitive with commercial or compliance implications |

---

## Boundaries

This skill handles **intake only**. Once clarified, route to:
- **User story writing** → dedicated story-writing skill
- **Solution architecture** → technical design skill
- **Sprint planning** → planning skill
- **Estimation** → estimation skill
- **PRD creation** → documentation skill
