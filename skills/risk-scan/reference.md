# Reference: Worked Example

Use this to calibrate output quality - especially for scoring detectability, velocity, and trigger signals, which are where most risk analyses fall short. The example below follows the SKILL.md output template exactly, at Medium depth, on a first run (no prior scan exists, so there is no Changes Since Last Scan block).

---

## Input

**Project context:** AI-powered resume screening tool for a recruitment platform.
**Phase:** Development
**Constraints:** Tight deadline, limited ML expertise
**Recent changes:** Client requested additional scoring features mid-sprint
**Key interview answers:** Sprints are 2 weeks. The team sized the new scoring features at roughly 8 days. No prior risk scan exists. The batched owner question at finalisation confirmed Dana Reid (PM) as owner of the red risk.

---

## Correct Output

---

## RISK ANALYSIS

**Project:** Resume Screening Tool | **Phase:** Development | **Date:** [Today]

**Depth:** Medium | **Recent changes assessed:** Yes

---

### Overall Verdict

Risk Level: 🔴 High

Recommendation: Proceed with Conditions

Conditions:
- A formal change request on the mid-sprint scoring features goes to the client this week.
- The ML validation spike runs before any further build commits to the current approach.

Two compounding risks make this project's posture red: limited ML expertise against a tight deadline, made worse by a mid-sprint scope addition. The accuracy risk is hard to detect until late in the build cycle - and fast to escalate when it does.

---

### Key Assumptions

| Assumption | Confidence | Risk if Wrong |
|---|---|---|
| The client's 80% accuracy threshold is fixed and will be tested at UAT | High | A softer threshold would lower R1's priority - confirm before the spike |
| The team can deliver the original scope within the deadline | Medium | The timeline was tight before the added features - any slippage compounds R2 |
| The training dataset reflects real applicant volume and variety | Low | Unrepresentative data is a primary cause of model underperformance - currently in Not Assessed |

---

### Top Risk Snapshot

1. New scoring features added mid-sprint cause timeline overrun without scope adjustment (R2)
2. ML model fails to meet the client accuracy threshold, triggering UAT rejection and retraining (R1)
3. Limited ML expertise creates rework in architecture decisions (R3)

---

### Risk Register

| # | Risk | Category | Likelihood | Impact | Priority | Detectability | Velocity | Response | Owner | Proximity |
|---|---|---|---|---|---|---|---|---|---|---|
| R1 | ML model fails to meet client accuracy threshold, triggering UAT rejection and retraining | Technical | M | H | 🟡 | Hard | Fast | Mitigate | Tech Lead | Month 1 |
| R2 | New scoring features added mid-sprint cause timeline overrun without scope adjustment | Delivery | H | H | 🔴 | Easy | Medium | Escalate | Dana Reid (PM) | Week 1-2 |
| R3 | Limited ML expertise means architecture decisions are made without sufficient depth, creating rework later | Technical | M | M | 🟡 | Moderate | Slow | Mitigate | Tech Lead | Month 1 |
| R4 | Client adds further feature requests, compounding the scope already added this sprint | Stakeholder | M | M | 🟡 | Easy | Slow | Mitigate | PM | Ongoing |

---

### Mitigation Next Actions

- R1: Tech Lead to run a feasibility spike on a representative sample dataset within 3 days - below 75% baseline accuracy means engaging an external ML advisor before the full model build.
- R3: Tech Lead to book an external review of the model architecture before the next sprint locks it in.
- R4: PM to restate the change-control route to the client alongside the R2 change request this week.

---

### Top Risks - Detail

**R2 - New scoring features cause timeline overrun**

- Root cause: The request arrived mid-sprint with no formal change control, so new scope is being absorbed into a fixed timeline by default.
- Why exposed: The team is already on a tight deadline, and absorbing scope silently is the path of least resistance - it reliably causes overruns that surface weeks later.
- Trigger signal: Sprint velocity drops below 70% of planned by mid-sprint, or a team member flags that the scoring features cannot be completed within the current sprint.
- Exposure: ~2 weeks of slippage - the features are sized at roughly 8 days against 2-week sprints, so absorbing them costs close to a full sprint.
- Action: Dana Reid to raise a formal change request with the client by end of day - extend the timeline, reduce other scope, or defer the features. Sponsor to decide by end of week. Do not absorb silently.

---

### Validation Experiments

| Risk | Experiment | What We're Testing | Expected Learning | By |
|---|---|---|---|---|
| R1 | Spike on a representative sample dataset | Whether the model can reach 80%+ accuracy with the current team and expanded feature set | Baseline accuracy estimate - go/no-go on an external ML advisor | End of Day 3 |

---

### Stakeholder Summary

> "We are at risk of delivering late and below the client's accuracy bar because scope grew mid-sprint while ML capability stayed flat. The trade-off leadership must make: extend the timeline, trade out scope, or fund external ML expertise - absorbing all three pressures silently is the one option that reliably fails. The single most important next action is the sponsor's decision on the change request this week."

---

### Decisions Needed

| Decision | Owner | By | Impact if Delayed |
|---|---|---|---|
| Accept, defer, or trade out the new scoring features - they cannot be absorbed into the current sprint without consequence | Sponsor + Client | End of this week | Every sprint of delay converts R2 from a forecast overrun into an actual one |
| Go/no-go on engaging an external ML advisor - depends on spike results | Sponsor | End of Day 4 | Retraining after a failed evaluation costs weeks against a fixed deadline |

---

### Not Assessed

**Critical Unknowns**
- Training data quality - the quality and representativeness of the training dataset was not mentioned. Poor training data is a primary cause of ML model underperformance.

**Secondary Unknowns**
- Integration risk - how the screening tool connects to the broader recruitment platform was not described. Assess before the integration sprint begins.

---

### Optional Next Step

This analysis can be visualised as an executive dashboard showing:

- Risk Heatmap (Likelihood × Impact)
- Risk Timeline (Urgency View)
- Risk Category Distribution
- Executive Summary Cards

> Would you like me to create this dashboard?

---

## Scoring Rationale - Why These Scores

**R2 is 🔴 despite R1 being the "bigger" risk.** R2 is red because it's already happening - scope changed mid-sprint without change control. The impact is high and the likelihood is high (teams almost never self-correct on this without a formal process). R1 is amber because the outcome is still uncertain - the model *might* hit the threshold. R2 is not uncertain: scope grew, timeline didn't.

**R1 is Hard detectability.** Model accuracy against the full feature set can't be measured until the training pipeline is substantially complete. There are no leading indicators in week 1. The spike experiment exists precisely to move this from Hard to Easy detectability before it's too late to change course.

**R1 is Fast velocity.** Once a model evaluation fails, the team must stop, diagnose, and retrain - each cycle takes days. On a tight deadline, two failed cycles is a project-level crisis. Fast velocity is warranted even though the risk itself is currently amber.

**R4 (further client requests) is Slow velocity.** Unlike R2, which has already happened, R4 is prospective. If it materialises, the PM has lead time to raise change control before the sprint is committed. Slow velocity is correct - it won't escalate instantly.

**Only R2 is expanded in Top Risks Detail.** It is the only red risk, so the detail rule stops there. R1, R3, and R4 are Mitigate risks, so each carries a one-line entry in Mitigation Next Actions instead - no risk with a Mitigate response goes without an action.

**R2's owner is a name, not a role.** Red risks need a person who is personally accountable. The name came from the single batched owner question at finalisation. Roles remain fine for amber and green risks (R1, R3, R4).

**R2's Exposure line is grounded, not guessed.** The ~2 weeks figure comes directly from interview answers (8-day feature sizing against 2-week sprints). R1 carries no Exposure line because nothing in the input or interview supports an estimate - omit the line silently rather than printing a disclaimer.

**The "absorbed scope" anti-pattern.** The most important thing this example encodes: when a client adds scope and nobody formally responds, the team absorbs it silently and the PM discovers the overrun three weeks later. The trigger signal for R2 exists precisely so the PM catches it at mid-sprint, not at retrospective.
