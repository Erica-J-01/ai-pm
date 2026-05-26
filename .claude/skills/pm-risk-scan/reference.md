# Reference: Worked Example

Use this to calibrate output quality — especially for scoring detectability, velocity, and trigger signals, which are where most risk analyses fall short.

---

## Input

**Project context:** AI-powered resume screening tool for a recruitment platform.
**Phase:** Development
**Constraints:** Tight deadline, limited ML expertise
**Recent changes:** Client requested additional scoring features mid-sprint

---

## Correct Output

---

## RISK ANALYSIS

**Project:** Resume Screening Tool | **Phase:** Development | **Date:** [Today]
**Depth:** Medium | **Recent changes assessed:** Yes

---

### Overall Verdict

🔴 **High**

Two compounding risks make this project's posture red: limited ML expertise against a tight deadline, made worse by a mid-sprint scope addition. The accuracy risk is hard to detect until late in the build cycle — and fast to escalate when it does. The team needs a validation spike this week before any further build commits to the current approach.

---

### Risk Register

| # | Risk | Category | Likelihood | Impact | Priority | Detectability | Velocity | Response | Owner | Proximity |
|---|---|---|---|---|---|---|---|---|---|---|
| R1 | ML model fails to meet client accuracy threshold, triggering UAT rejection and retraining | Technical | M | H | 🟡 | Hard | Fast | Mitigate | Tech Lead | Month 1 |
| R2 | New scoring features added mid-sprint cause timeline overrun without scope adjustment | Delivery | H | H | 🔴 | Easy | Medium | Escalate | PM + Sponsor | Week 1–2 |
| R3 | Limited ML expertise means architecture decisions are made without sufficient depth, creating rework later | Technical | M | M | 🟡 | Moderate | Slow | Mitigate | Tech Lead | Month 1 |
| R4 | Client adds further feature requests, compounding the scope already added this sprint | Stakeholder | M | M | 🟡 | Easy | Slow | Mitigate | PM | Ongoing |

---

### Top Risks — Detail

**R2 — New scoring features cause timeline overrun**
*What could happen:* Additional scoring features added mid-sprint are absorbed into the current timeline without scope adjustment — the team delivers less than planned or ships late.
*Why exposed:* The request came in mid-sprint with no formal change control. The team is already under a tight deadline. Absorbing new scope without removing existing scope or extending timeline is the default path of least resistance — and it reliably causes overruns.
*Trigger signal:* Sprint velocity drops below 70% of planned by mid-sprint, or a team member flags that the scoring features can't be completed within the current sprint.
*Velocity:* Medium — the overrun compounds sprint by sprint. It won't be obvious in week 1 but will be visible and critical by week 3.
*Risk score:* High likelihood, high impact — the scope has already changed, the timeline hasn't.
*Action:* PM to raise a formal change request with the client by end of day. Options: extend timeline, reduce other scope, or defer the scoring features to a later sprint. Sponsor to decide by [date] — do not absorb silently.

---

**R1 — ML model fails accuracy threshold**
*What could happen:* The model ships below the agreed accuracy threshold, triggering rejection at UAT and requiring retraining — a multi-week delay mid-development.
*Why exposed:* The team has limited ML expertise, and the new scoring features increase model complexity without extending the timeline. The full feature set hasn't been validated against the accuracy requirement.
*Trigger signal:* Accuracy falls below 80% on the validation dataset during the first full model evaluation run.
*Velocity:* Fast — a failed model evaluation cascades into retraining cycles that compound quickly against a fixed deadline.
*Risk score:* Medium likelihood but high impact and hard to detect until late — warrants early validation before further build commitment.
*Action:* Tech Lead to run a feasibility spike on a representative sample dataset within 3 days. If baseline accuracy is below 75%, engage an external ML advisor before the full model build begins.

---

### Validation Experiments

| Risk | Experiment | What We're Testing | Expected Learning | By |
|---|---|---|---|---|
| ML accuracy (R1) | Spike on sample dataset | Whether the model can reach 80%+ accuracy with current team and expanded feature set | Baseline accuracy estimate — go/no-go on external ML advisor | End of Day 3 |

---

### Stakeholder Summary

> "We are at risk of a timeline overrun due to new scoring features being added mid-sprint without a corresponding scope or timeline adjustment. Recommended action: raise a formal change request today — the PM needs a sponsor decision on scope trade-offs by end of week."

> "We are at risk of the ML model failing to meet the client's accuracy requirement due to limited internal ML expertise and increased feature complexity. Recommended action: run a validation spike on a sample dataset this week before the full model build locks in."

---

### Decisions Needed

| Decision | Owner | By |
|---|---|---|
| Accept, defer, or trade out the new scoring features — cannot absorb into current sprint without consequence | Sponsor + Client | End of this week |
| Go/no-go on engaging an external ML advisor — depends on spike results | Tech Lead → PM → Sponsor | End of Day 4 |

---

### Not Assessed

- **Integration risk** — how the screening tool connects to the broader recruitment platform was not described. This should be assessed before the integration sprint begins.
- **Data quality** — the quality and representativeness of the training dataset was not mentioned. Poor training data is a primary cause of ML model underperformance.

---

## Scoring Rationale — Why These Scores

**R2 is 🔴 despite R1 being the "bigger" risk.** R2 is red because it's already happening — scope changed mid-sprint without change control. The impact is high and the likelihood is high (teams almost never self-correct on this without a formal process). R1 is amber because the outcome is still uncertain — the model *might* hit the threshold. R2 is not uncertain: scope grew, timeline didn't.

**R1 is Hard detectability.** Model accuracy against the full feature set can't be measured until the training pipeline is substantially complete. There are no leading indicators in week 1. The spike experiment exists precisely to move this from Hard to Easy detectability before it's too late to change course.

**R1 is Fast velocity.** Once a model evaluation fails, the team must stop, diagnose, and retrain — each cycle takes days. On a tight deadline, two failed cycles is a project-level crisis. Fast velocity is warranted even though the risk itself is currently amber.

**R4 (further client requests) is Slow velocity.** Unlike R2, which has already happened, R4 is prospective. If it materialises, the PM has lead time to raise change control before the sprint is committed. Slow velocity is correct — it won't escalate instantly.

**The "absorbed scope" anti-pattern.** The most important thing this example encodes: when a client adds scope and nobody formally responds, the team absorbs it silently and the PM discovers the overrun three weeks later. The trigger signal for R2 exists precisely so the PM catches it at mid-sprint, not at retrospective.