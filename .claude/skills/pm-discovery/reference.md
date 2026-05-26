# Reference: Worked Examples

Two examples — one per mode. Use these to calibrate output quality.

---

## Example 1 — Plan Mode

### Raw Input
> "We need to do discovery for our new expense management system. Finance and the ops team will be there. About 2 hours. The current system is really old and people hate it."

### What to Extract
- Attendees: Finance + Ops (different roles, need different questions)
- Duration: 2 hours
- Known pain: old system, people hate it — but "hate it" is not a finding, it's a signal to dig deeper
- Unknown: what specifically is broken, what good looks like, budget/timeline expectations

---

### DISCOVERY PLAN

**Project:** Expense Management System | **Date:** TBC | **Duration:** 120 mins
**Facilitator:** PM | **Attendees:** Finance team, Ops team

---

#### Session Goal
Understand what is broken about the current expense process and what the team would need to see in a new system to consider it a success.

#### Key Unknowns Going In
1. What specifically causes the most pain — is it data entry, approval delays, reporting, or something else?
2. What does the approval and reimbursement workflow actually look like today?
3. What would "good" look like to Finance vs Ops — they may want different things

#### Agenda

| Time | Block | Purpose |
|---|---|---|
| 0–5 min | Welcome + goal | Align on why we're here and what we'll decide |
| 5–25 min | Current state walkthrough | Map the current process end-to-end |
| 25–55 min | Pain points | Where does it break down and what does it cost? |
| 55–80 min | Ideal future state | What would good look like for each team? |
| 80–100 min | Constraints | What can't change? What's been tried before? |
| 100–115 min | Prioritisation | If we could only fix 3 things, what would they be? |
| 115–120 min | Next steps | Actions before next session |

#### Question Bank

**Current state:**
- Walk me through what happens when an employee submits an expense today — from receipt to reimbursement.
- How long does the full process take from submission to payment?
- What systems or tools are involved right now?

**Pain + impact:**
- Where does the process break down most often?
- What do employees complain about most?
- How many expenses go unclaimed because the process is too hard? (Finance will know this)
- What does a bad month look like in terms of errors or delays?

**Future state:**
- If the system worked perfectly, what would be different about your Monday morning?
- How would you know the new system was working?
- What's the one thing that would make Finance's job easier that the current system can't do?
- What's the one thing Ops needs that Finance might not prioritise?

**Constraints:**
- Are there any compliance or audit requirements we can't change?
- Has a new system been tried before? What happened?
- Who has to approve the final solution?

**For Finance lead specifically:**
- What does a successful rollout look like in 6 months — what metric improves?
- What's a dealbreaker for you in any new solution?

#### What to Capture
- The exact words Finance and Ops use to describe pain — they'll be different
- Any moment where one team's "fix" would make the other team's problem worse
- Any process step that gets described as "it depends" — that's hidden complexity

---

## Example 2 — Summarise Mode

### Raw Input (messy interview notes)
> "Spoke to Anna (Finance) and Tom (Ops) separately. Anna said the approval process takes forever — managers don't respond to expense requests for days. Tom said the system crashes a lot and nobody knows how to export the data properly. Anna wants better reporting. Tom wants it to be faster. Anna mentioned GDPR was an issue last year with the old system. Tom said 'we tried fixing this before but IT never delivered.' Budget — Anna thought it was £30k but Tom hadn't heard anything about budget. Both agreed mobile access would help field staff but neither knew if that was in scope."

---

### What to Notice Before Writing
- Anna and Tom were interviewed separately — their answers reflect different experiences, not a consensus
- "Approval takes forever" and "system crashes" are two completely different problems — the solution for one won't fix the other
- Budget misalignment is a red flag — Finance knows about it, Ops doesn't
- "IT never delivered" is a trust issue, not just a history lesson — it will affect adoption
- Mobile access is desired but scope is unknown — this is an open item, not a requirement

---

### DISCOVERY FINDINGS

**Project:** Expense Management System | **Session date:** [Date] | **Prepared by:** PM
**Attendees:** Anna (Finance), Tom (Ops) — separate interviews | **Session type:** 1:1 Interviews

---

#### The Real Problem
There are two distinct problems, not one. Finance's pain is process — approvals are slow because managers don't respond. Ops' pain is technical — the system is unreliable and hard to use. A solution that only addresses one will fail the other. [inferred: the previous failed IT attempt may have focused on one without the other, contributing to mistrust]

#### Who Is Affected and How

| Stakeholder | Current pain | Impact |
|---|---|---|
| Finance (Anna) | Approval requests sit unanswered for days | Delayed reimbursements, manual chasing, inaccurate monthly close |
| Ops field staff (Tom) | System crashes during submission, data export is broken | Expenses go unclaimed, manual workarounds, hours lost per week |
| Managers | Not interviewed — but named as a bottleneck in approvals | [inferred] Likely unaware of the delay they're causing |

#### What Success Looks Like
- Finance: monthly expense reporting is automated, approval cycle under 48 hours
- Ops: system is stable, field staff can submit from mobile, no data export workarounds
- Neither defined a shared success metric — this needs to be agreed before requirements are written

#### Key Findings

| # | Finding | Source | Confidence |
|---|---|---|---|
| F1 | Approval delays are the primary Finance pain — managers not responding to requests | Anna | High |
| F2 | System instability and broken data export are the primary Ops pain | Tom | High |
| F3 | A previous IT initiative to fix this failed — trust in IT delivery is low | Tom | High |
| F4 | GDPR compliance was an issue with the previous system | Anna | Medium — no detail given |
| F5 | Mobile access would benefit field staff | Both | Medium — neither confirmed it's in scope |
| F6 | Managers are a key part of the approval bottleneck but were not interviewed | Inferred | Low — needs validation |

#### Conflicts and Disagreements

- **Budget:** Anna believes the budget is £30k. Tom had not heard any budget figure. This is a significant misalignment — the project may not have a formally confirmed budget. Escalate to sponsor before proceeding.
- **Problem priority:** Anna prioritises reporting and approvals. Tom prioritises system stability and speed. These are different problems requiring different solutions. If the team tries to solve both with one tool, scope and cost will expand beyond either estimate.

#### Still Unknown

| Unknown | Why it matters | How to resolve |
|---|---|---|
| Is budget confirmed and what is the figure? | £30k may not cover both problem areas | PM to confirm with sponsor before next session |
| What is the approved scope — does it include mobile? | Mobile changes build cost and complexity significantly | Sponsor decision needed |
| Why did the previous IT initiative fail? | Same failure mode will repeat if not understood | Interview IT lead from previous project |
| Are managers aware they're the approval bottleneck? | Solution must include manager behaviour change, not just tooling | Interview 1–2 managers before requirements |

#### Recommended Next Steps

| Action | Owner | By When |
|---|---|---|
| Confirm budget figure and approval with sponsor | PM | This week |
| Interview 2 managers to understand approval behaviour | PM | Before next session |
| Clarify mobile scope — in or out | Sponsor decision | Before requirements begin |
| Review previous IT project — what failed and why | PM + IT lead | Before solution design |

---

## What Makes These Outputs Good

**Plan:** The session goal is specific — "what the team would need to see to consider it a success" — not generic like "discuss the project." The key unknowns are actual questions, not topics. The question bank includes Finance-specific and Ops-specific questions because they have different roles and different pain.

**Summarise:** The real problem section names two distinct problems, not one. The conflicts section doesn't smooth over the budget disagreement — it escalates it. The still unknown table has 4 entries — discovery that produces zero unknowns hasn't gone deep enough. The "IT never delivered" comment is interpreted as a trust issue, not just a historical note, because that interpretation changes how the PM should manage the rollout.