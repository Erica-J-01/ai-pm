# Reference: Worked Example

Use this to calibrate output quality - especially for translating raw Jira data into plain-English PM judgements rather than restating numbers.

## Calibrating Confidence and RAG

- Anchor the confidence percentage to the points realistically completable in the remaining days, based on historical velocity or this sprint's throughput. Then discount for unmitigated blockers and for work that is dev-done but untested.
- Tie the RAG status to it. Green means on plan with no high risk. Amber means recoverable slippage or one high risk. Red means the plan is not achievable without a scope or timeline change.
- These are heuristics for producing a defensible, repeatable number - not a scoring framework.

---

## Input

> Sprint 12 - Day 6 of 10
>
> Committed: 42 points across 14 stories
> Completed: 18 points (6 stories Done)
> In Progress: 12 points (4 stories)
> To Do: 12 points (4 stories)
> Blocked: 8 points (2 stories - both blocked on API keys from a third-party vendor)
>
> Scope added mid-sprint: 2 stories (6 points) added on Day 3 - both assigned to the same developer
> Bugs raised this sprint: 3 (1 critical, 2 minor)
> Velocity last 3 sprints: 38, 35, 40 points
>
> Team: 4 developers, 1 QA. QA has not started testing - waiting for stories to clear In Progress.

---

## Correct Output

---

# Executive Summary

Sprint 12 is at significant risk of not completing to plan. The 42-point commitment was already above the team's trailing average, two blocked stories are holding 19% of committed points, and a QA bottleneck is building as work accumulates without being tested. With 4 days remaining, the team needs to unblock the vendor dependency today or formally defer those stories to Sprint 13.

---

# Delivery Status

- **Status:** Red
- **Sprint Confidence:** 55%
- **Forecast:** 9-10 of 14 stories likely complete
- **Velocity:** committed 42 vs ~38 trailing average - over-committed by roughly 10%
- **Sprint goal:** not stated in input
- **Risk:** High

---

# Top 3 PM Priorities

1. Chase the third-party vendor for API keys today - both blocked stories need this to move, and at 8 points they represent nearly a fifth of the sprint commitment.
2. Get QA started on the 6 completed stories immediately - waiting until all dev work is done will compress testing into the last 2 days and increase defect risk.
3. Decide now whether the 2 mid-sprint additions stay in scope - adding 6 points on Day 3 without removing anything is the most likely cause of a miss.

---

# Main Risks

1. **Blocked stories may not unblock in time.** If the vendor doesn't respond by end of Day 7, those 8 points cannot realistically complete. Deferring is safer than hoping.
2. **QA compression.** With 6 stories ready to test and no testing started, QA is heading into a crunch. The critical bug raised this sprint has not been verified fixed.
3. **Scope add without trade-off.** The 2 stories added on Day 3 sit with one developer who already had assignments. That person is likely overloaded.

---

# Actions Today

1. PM to contact vendor directly for API key ETA - do not wait for the developer to chase.
2. QA to begin testing the 6 completed stories today, prioritising the critical bug fix first.
3. PM to review the 2 mid-sprint additions with the team lead - confirm they stay in or formally defer one to Sprint 13.

---

# Questions for Standup

1. What is the current vendor ETA for the API keys - and who last chased them?
2. Can QA begin testing the completed stories today, or is there an environment issue blocking that?
3. Is the developer assigned to the mid-sprint additions on track, or is that work at risk?

---

# Leadership Update

Sprint 12 is tracking behind plan due to a third-party vendor dependency blocking two stories and a QA bottleneck forming in the second half of the sprint. The team is focused on unblocking these today, and a scope trade-off decision may be needed by end of week to keep the committed delivery achievable.

---

## Why This Output Is Good

**Numbers are translated, not repeated.** "8 points blocked" becomes "19% of committed scope held by one vendor dependency." A sponsor doesn't need to know the point count - they need to know the business impact.

**The over-commitment is named.** Committing 42 points against a 38/35/40 history was a roughly 10% stretch before anything went wrong. Naming it separates a planning error from an execution problem, and it answers the sponsor question "can we trust the next sprint plan?"

**The QA bottleneck is named explicitly.** Raw Jira data shows QA hasn't started. The output names what will happen if that continues: testing compressed into 2 days, defect risk increases. That's a decision the PM needs to make today, not at the sprint review.

**Confidence is derived, not guessed.** At the current rate of 3 points a day, roughly 30 of 42 points complete by Day 10 - and 8 of the outstanding points are blocked with no ETA, while none of the done work is tested. Anchoring to remaining throughput and then discounting for the blocker and the untested work lands at 55%, a number the PM can defend if it moves next week. Hiding this until Day 9 is worse than naming it on Day 6.

**The sprint goal gap is surfaced, not papered over.** The input never stated a sprint goal, so the report says "not stated in input" rather than inventing one. A near-green forecast can still hide a failed goal - the demo-able stories may be exactly the ones that miss - so the absence is worth flagging.

**Actions are specific and owned.** "PM to contact vendor directly" - not "escalate the blocker." A standup action with no owner is not an action.
