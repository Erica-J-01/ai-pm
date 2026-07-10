# REFERENCE - decoding-pm-intake-requirements

This file contains reference material to support the skill defined in SKILL.md.
Claude reads this file only when additional examples or context are needed.
The classification table and routing live in SKILL.md.

---

## Worked Example

### Input (Raw Stakeholder Message)
> Slack DM from Priya (client account manager), received 9 July:
>
> "Hey, the CEO wants the onboarding fixed. Customers are complaining it's too slow and confusing. Can we get something done by end of month? Also maybe add a progress bar. Let me know."

---

### Output

## Requirement Intake Summary

**Requester & Source:**
Priya, client account manager, via Slack DM on 9 July. She is relaying the ask - the CEO is the cited authority, not the sender.

**Request Summary:**
The CEO wants the customer onboarding flow improved for speed and clarity, with a potential progress bar addition, by end of month.

**Likely Business Goal:**
Improve customer activation and reduce early churn by fixing a friction point in the onboarding experience.

**Primary User / Stakeholder Need:**
New customers are struggling to complete onboarding - likely leading to drop-off. The CEO wants a visible fix quickly to address complaints.

**What Is Clear:**
- There is an existing onboarding flow with known user complaints
- Speed and confusion are the two cited problems
- A progress bar has been suggested as a possible solution

**Missing Information:**
- What specific steps in onboarding are causing drop-off or confusion? *(ask requester)*
- What does "slow" mean - technically slow (load times) or cognitively slow (too many steps)? *(ask requester)*
- How many customers are affected and how is this being measured? *(ask requester)*
- Is the progress bar a requirement or a suggestion? *(ask requester)*
- What does success look like - completion rate, time-to-complete, CSAT? *(ask requester)*
- Who owns the current onboarding flow - product, engineering, or CX? *(check internally)*
- Has any user research or session recording been done? *(check internally)*

**Risks / Concerns:**
- Unrealistic timeline: end-of-month may not allow for proper discovery and delivery
- Solution proposed before problem is fully understood (progress bar framing)
- No success metric defined - hard to know if the fix worked
- "CEO wants it" pressure may skip necessary validation steps
- Scope is undefined - "fix onboarding" could mean 1 screen or a full redesign

**Urgency:**
End of month stated. Reads as negotiable - phrased as "can we get something done by", with no contractual or compliance driver cited. Confirm what is behind the date.

**Impact on Current Work:**
Not checked - no project context on file for this client. If onboarding scope is already in an active SOW, re-classify as Likely Change Request.

**Intake Classification:**
Needs Clarification

**Recommended Next Step:**
Run a 30-minute discovery call with the product owner and one CX rep to identify the top 2-3 specific friction points, agree on a success metric, and validate whether the deadline is realistic before any scoping begins.

---

## Common Trigger Inputs

Use this skill when messages resemble any of the following:

| Input Type | Example |
|---|---|
| Urgent executive ask | "CEO wants onboarding fixed by Friday." |
| Vague feature request | "Can we add multi-language support?" |
| Client forwarded message | "See below - client wants AI dashboard by next month." |
| Underdefined need | "Need better reporting urgently." |
| Ambiguous scope | "Customer asked for API integration." |
| Workshop output | "Notes from yesterday's session - lots of ideas, nothing decided." |
| Partial requirement | "We need something for mobile. Not sure what exactly." |
