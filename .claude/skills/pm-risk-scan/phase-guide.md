# Phase Risk Guide

Read this when the current phase is Testing or Deployment, or when a project is transitioning between phases and risks from the previous phase may still be active.

---

## Discovery Phase — What to Watch For

The risk in Discovery is almost never technical. It's about whether the team is solving the right problem.

**High-frequency risks:**
- Problem definition is too broad or politically shaped — the team is solving the symptom, not the cause
- Key stakeholders haven't been consulted — their constraints will surface later as blockers
- Business case assumptions are untested — "we assume X customers will pay Y" with no validation
- Success metrics aren't defined — the project will complete but no one will agree if it succeeded
- Scope is framed around a solution ("build a dashboard") before the problem is understood

**What good looks like at Discovery gate:**
- Problem statement that two people would describe identically
- At least one stakeholder from each affected group has been interviewed
- Success metrics are agreed and measurable
- Top 3 assumptions have been identified and ranked by risk

---

## Design Phase — What to Watch For

Design is where scope quietly expands and technical decisions get deferred that shouldn't be.

**High-frequency risks:**
- "We'll figure that out in development" — decisions deferred from Design become the most expensive problems in Development
- Acceptance criteria not defined — the team will build to a moving target
- Scope expanding through design iterations without change control
- Technical approach chosen for familiarity, not fit — this is the phase where architecture decisions lock in
- External dependencies (APIs, data sources, third-party tools) assumed to be stable without confirmation

**What good looks like at Design gate:**
- Every major feature has agreed acceptance criteria
- Technical approach has been validated for the hardest requirement, not just the average one
- Out-of-scope items are documented and agreed — not just mentally noted
- Any dependency on external systems has a named owner who has confirmed availability

---

## Development Phase — What to Watch For

Development risks are mostly about pace, integration, and creeping debt.

**High-frequency risks:**
- Velocity lower than estimated — teams consistently overestimate what they can deliver per sprint
- Integration failures emerge late — two components work in isolation but not together
- Technical debt accumulating silently — pressure to hit sprint goals leads to shortcuts that compound
- Scope additions from stakeholders who "just need one small thing"
- Key developer dependency — one person holds too much critical knowledge

**What good looks like at Development gate:**
- Burn-down or velocity is tracking within 15% of estimate
- Integration testing is happening continuously, not saved for the end
- A technical debt log exists and is reviewed at sprint planning
- Change control is being enforced — no informal adds

**Phase transition risk:** Risks flagged in Design that were "deferred" often materialise in Development. Explicitly check whether any Design-phase amber risks have now become red.

---

## Testing Phase — What to Watch For

Testing phase risks are dominated by defect rate, environment stability, and sign-off delays.

**High-frequency risks:**
- Defect rate higher than forecast — common causes are insufficient unit test coverage in Development or integration not tested early enough
- Test environment instability — flaky environments generate false failures and waste test time
- UAT delayed by stakeholders who are unavailable or unprepared
- Test coverage gaps — happy path tested thoroughly, edge cases and failure modes not
- Regression risk from late-stage changes — fixes in Testing often introduce new defects

**What good looks like at Testing gate:**
- Defect severity distribution is clear — critical and high defects trending toward zero
- UAT participants are confirmed, briefed, and available
- A go/no-go criteria for Testing exit is agreed before Testing begins, not at the end

**Phase transition risk:** Development risks that weren't fully resolved — particularly integration risks and technical debt — will manifest in Testing as defects. Check whether any Development-phase amber risks have become Testing-phase red risks.

---

## Deployment Phase — What to Watch For

Deployment risks are about operational readiness, rollback safety, and communication timing.

**High-frequency risks:**
- No tested rollback plan — if deployment fails, the team doesn't know how to recover
- Operations/support team not trained — the product goes live but the people who maintain it don't know how it works
- Stakeholder communication not sequenced — users find out about the change through the system, not through a planned comms sequence
- Data migration errors — production data behaves differently from test data at scale
- Cutover window too short — a deployment that takes longer than the maintenance window leaves systems in an inconsistent state

**What good looks like at Deployment gate:**
- Rollback procedure is documented and has been tested in a staging environment
- Support team has been trained and has access to runbooks
- Comms plan is approved — who gets told what, when, and through which channel
- Go/no-go criteria for the cutover are agreed and owned by a named decision-maker

**Phase transition risk:** Risks from Testing that were accepted (not resolved) carry forward into Deployment. List these explicitly so the deployment team knows what they're inheriting.

---

## Cross-Phase Risks — Never Fully Resolved

These risk types recur across all phases. Don't assume they were resolved because they were flagged earlier.

**Stakeholder alignment** — sponsors change, priorities shift, and people who were supportive in Discovery can become blockers in Deployment. Reassess at every gate.

**Scope creep** — formally controlled scope still drifts informally. Check at every phase whether what's being built still matches what was agreed.

**Resource availability** — people promised at planning time are not always available at execution time. Verify actual availability at the start of each phase, not just at project initiation.

**Assumption validity** — assumptions that were reasonable in Discovery may no longer be true in Development. Explicitly check the top 5 assumptions at each phase gate.