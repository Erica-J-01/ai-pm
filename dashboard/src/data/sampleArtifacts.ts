import type { ArtifactPayload, SkillExecution, SkillId } from "@/types/pm";

/** Wrap a typed payload (optional) as a completed execution for the demo canvas. */
function exec(id: string, skill: SkillId, markdown: string, payload?: ArtifactPayload): SkillExecution {
  return {
    id,
    request: { skill, clientId: "c-finwave", projectId: "p-notifications", input: "(sample)" },
    status: "complete",
    markdown,
    payload,
  };
}

/**
 * The Finwave "Real-Time Payment Notifications" end-to-end scenario, baked in.
 * Visual skills carry a typed payload (matrix / checklist / grid / charts);
 * the rest carry rich markdown. Used by the orchestrator run, the Run-skill
 * tab, and nav selection so the whole flow is demonstrable with no backend.
 */
export const SAMPLE_ARTIFACTS: Partial<Record<SkillId, SkillExecution>> = {
  triage: exec("s-triage", "triage",
    `## Triage - Requirement Intake Summary

**Requester & Source:** Sarah, client VP Product, via email on 12 May, relayed through the account manager. Sarah is the cited authority, not the sender.

**Request Summary:** Enterprise clients discover failed payments reactively (via customer calls) rather than proactively. Sarah is asking for real-time payment failure notifications.

**Likely Business Goal:** Reduce client churn and support burden by giving enterprise customers visibility into payment failures before their end-customers complain.

**Primary User / Stakeholder Need:** Enterprise clients need to know about payment failures the moment they occur.

**What Is Clear**
- Trigger event: payment failure
- Audience: enterprise clients
- Deadline: 6 weeks (Salesforce conference)
- Budget: ~$80k

**Missing Information**

| Question | For |
|---|---|
| Channels (email / SMS / webhook / in-app)? | Ask requester |
| Events beyond failures (partial, reversals, retries)? | Ask requester |
| Who receives the notification? | Ask requester |
| Existing infra to build on? | Check internally |
| Is 6 weeks for MVP or full feature? | Ask requester |

**Risks / Concerns**
- "Real-time" undefined (30s vs 5min)
- 6 weeks is aggressive
- $80k may not cover full scope

**Urgency:** 6 weeks tied to the Salesforce conference. Reads as a real external deadline - confirm the conference date is fixed.

**Impact on Current Work:** Not checked - no project context on file. If notifications are already in an active SOW, re-classify as Likely Change Request.

**Intake Classification:** Needs Clarification

**Recommended Next Step:** Run a discovery session with Sarah and the tech lead.`),

  "risk-scan": exec("s-risk", "risk-scan", "## Risk Scan", {
    skill: "risk-scan",
    project: "Finwave Real-Time Notifications",
    phase: "pre-project",
    depth: "medium",
    verdict: "red",
    recommendation: "Proceed with Conditions",
    conditions: [
      "Confirm event streaming infrastructure (Kafka consumer) is available before Week 3 build start",
      "Lock notification channel scope (email + in-app only) in writing with Sarah Chen before Sprint 1",
      "Budget approval for Redis and SendGrid secured before development begins",
    ],
    stakeholderSummary:
      "We are at risk of missing the 6-week Salesforce deadline due to unconfirmed infrastructure and an under-scoped budget. Recommended leadership action: lock scope to email-only MVP, spike Kafka readiness in Week 1, and get written sign-off from Sarah Chen on the channel list.",
    register: [
      { ref: "R1", risk: "6-week deadline unachievable if scope extends beyond email-only MVP", category: "Delivery", likelihood: "H", impact: "H", detectability: "Easy", velocity: "Fast", priority: "act-now", owner: "PM", response: "Mitigate", proximity: "Week 1-2" },
      { ref: "R2", risk: "Real-time event streaming requires Kafka consumer not yet confirmed in prod", category: "Technical", likelihood: "M", impact: "H", detectability: "Hard", velocity: "Fast", triggerSignal: "Spike in Week 1 shows no active Kafka consumer for payment events", priority: "act-now", owner: "Tech Lead", response: "Escalate", proximity: "Week 1-2" },
      { ref: "R3", risk: "Notification channel scope expands mid-sprint after stakeholder demos", category: "Stakeholder", likelihood: "H", impact: "M", detectability: "Moderate", velocity: "Medium", priority: "monitor", owner: "PM", response: "Mitigate", proximity: "Month 1" },
      { ref: "R4", risk: "$80k budget insufficient if webhook infrastructure is added in Sprint 2", category: "Business", likelihood: "M", impact: "H", detectability: "Moderate", velocity: "Slow", priority: "contingency", owner: "PM", response: "Transfer", proximity: "Month 1" },
      { ref: "R5", risk: "Per-client configuration complexity underestimated - recipient rules vary by enterprise", category: "Technical", likelihood: "M", impact: "M", detectability: "Moderate", velocity: "Slow", priority: "monitor", owner: "PM", response: "Mitigate", proximity: "Later" },
    ],
    matrix: [
      { ref: "R1", x: 80, y: 80, priority: "act-now" },
      { ref: "R2", x: 50, y: 80, priority: "act-now" },
      { ref: "R3", x: 80, y: 50, priority: "monitor" },
      { ref: "R4", x: 50, y: 80, priority: "contingency" },
      { ref: "R5", x: 50, y: 50, priority: "monitor" },
    ],
    assumptions: [
      { assumption: "Kafka event layer is already deployed and accessible in the production environment", confidence: "Medium", riskIfWrong: "Real-time delivery is blocked, and fallback to polling adds 3-5 days of rework" },
      { assumption: "Sarah Chen will approve email-only as the MVP channel without requiring webhooks", confidence: "Medium", riskIfWrong: "Scope expands to webhook delivery in Sprint 1, making the 6-week deadline impossible" },
      { assumption: "$80k budget is sufficient for email-only MVP with Redis dedup and SendGrid", confidence: "High", riskIfWrong: "Budget overrun requires sponsor approval and may delay Sprint 2 start" },
    ],
    decisionsNeeded: [
      { decision: "Lock MVP scope to email-only notifications - no webhooks in Sprint 1", owner: "Sarah Chen", by: "2026-06-10", impactIfDelayed: "Sprint 1 planning cannot be finalised, and the team risks building to the wrong scope" },
      { decision: "Confirm Kafka consumer availability in production before Week 3 build", owner: "Marcus Reid (Tech Lead)", by: "2026-06-13", impactIfDelayed: "R2 becomes a live blocker, and real-time delivery falls back to polling" },
    ],
    topRisksDetail: [
      { ref: "R1", name: "6-week deadline unachievable beyond email-only MVP", rootCause: "The deadline is fixed to the Salesforce conference while channel scope is not yet locked.", whyExposed: "Any channel added beyond email pushes the build past 6 weeks with no schedule slack.", triggerSignal: "Sarah requests webhooks or SMS during Sprint 1 demos.", exposure: "~2 weeks of slip per additional channel.", action: "PM locks email-only MVP in writing with Sarah Chen before Sprint 1." },
      { ref: "R2", name: "Kafka consumer for payment events unconfirmed in prod", rootCause: "Real-time delivery depends on a Kafka consumer that has not been verified in production.", whyExposed: "Without the event stream, delivery falls back to polling, which cannot meet the 60-second target.", triggerSignal: "Week 1 spike finds no active consumer for payment events.", exposure: "~3-5 days of rework to build a polling fallback.", action: "Tech Lead spikes Kafka readiness in Week 1 and escalates to infra if absent." },
    ],
    mitigationActions: [
      { ref: "R3", action: "PM records the agreed channel list in the charter so mid-sprint scope creep has a document to point at." },
      { ref: "R5", action: "Tech Lead spikes one enterprise's recipient rules before Sprint 2 to size the configuration work." },
    ],
    validationExperiments: [
      { ref: "R2", experiment: "One-day spike consuming a sample payment event from Kafka.", testing: "Whether a usable consumer exists in production today.", learning: "Confirms real-time is viable or forces the polling fallback decision now.", by: "End of Week 1" },
    ],
    changesSinceLastScan: {
      added: ["R5 - per-client configuration complexity surfaced during discovery."],
      escalated: ["R2 - Kafka consumer still unconfirmed as build start approaches."],
      nextReview: "Start of Sprint 1",
    },
  }),

  charter: exec("s-charter", "charter",
    `## Project Charter - Finwave Real-Time Payment Notifications
**Date:** 2026-05-29 | **Version:** 1.0

### Purpose
Enterprise clients discover payment failures reactively, causing churn and support overhead. This project delivers real-time payment event notifications so clients can act before their customers notice.

### Scope
**In scope**
- Email notifications for payment failure events
- In-app notification centre
- Configurable recipients per client account
- Failure, retry, resolution events

**Out of scope**
- SMS / push (post-MVP)
- Webhook delivery (Phase 2)
- End-user notifications
- Custom email templates [proposed - confirm]

### Governance
| Item | Detail |
|---|---|
| Decision authority | Sarah Chen - final call on scope, budget, and timeline |
| Change approval | Material scope, budget, or timeline changes need sponsor sign-off, recorded via /decision-log |
| Reporting cadence | Weekly one-page status update to the sponsor |

### Budget
| Item | Amount |
|---|---|
| Estimated delivery cost | $80k |
| Contingency (10-15%) | $10k |
| Commercial basis | Time and materials, invoiced monthly [assumed] |
| Includes / excludes | SendGrid and infra included, third-party licences excluded [assumed] |
| Budget owner | Sarah Chen |

### Top Risks
| Risk | L | I | Response |
|---|---|---|---|
| Event streaming infra not in place | M | H | Spike in Week 1 |
| Scope expansion to more channels | H | M | Lock in charter |
| 6-week deadline for MVP only | H | H | Confirm with Sarah |

### Client-side dependencies
| Dependency | Needed by | Owner |
|---|---|---|
| Access to the payment event stream (Kafka) | Week 1 | Client platform team |
| Enterprise recipient lists for configuration | Sprint 2 | Client account managers |

### Constraints & Assumptions
**Constraints**
- Must demo at the Salesforce conference on 13 July

**Assumptions**
- [assumed] Dev team of 4 is available from Month 1
- [assumed] Kafka event layer is already in production

### Approvals
| Role | Name |
|---|---|
| Sponsor | Sarah Chen |
| Project Manager | |
| Tech Lead | Marcus Reid |

### Assumptions Log
| Assumption | Why assumed | Who should confirm |
|---|---|---|
| Dev team of 4 available from Month 1 | Not stated in the brief | Sponsor |
| Kafka event layer already in production | Inferred from discovery | Tech Lead |
| End-user notifications out of scope | Derived boundary, not stated | Sponsor |
| Commercial basis is T&M | Brief was silent on commercials | Sponsor |`),

  discovery: exec("s-discovery", "discovery",
    `## Discovery Findings

### The Real Problem
Enterprise clients have no proactive signal for payment failures, so they learn from their own customers. The root need is a timely, configurable alert, not a dashboard.

### What Success Looks Like
Notification delivered within 60 seconds of a payment event, to the right account contacts.

### Who Is Affected and How

| Stakeholder | Current pain | Impact |
|---|---|---|
| Enterprise finance teams | Find out about failures from angry customers | Reputational hit and churn risk on high-value accounts |
| Finwave support | High volume of avoidable tickets | ~30% of inbound tickets are failure chasers |

### Key Findings

| # | Finding | Source | Confidence |
|---|---|---|---|
| F1 | Kafka event layer already exists and can be reused | Marcus (Tech Lead) | High |
| F2 | MVP is email plus in-app, and in-app is a stretch | Sarah (Sponsor) | High |
| F3 | Recipients configured at account level, not per user | session notes - unattributed | Medium |

### Conflicts
- Sarah wants webhooks soon, and engineering wants email-only for MVP

### Still Unknown
- Email delivery failure handling (retry vs alert)
- Notification history retention

### Recommended Next Steps

| Action | Owner | By When |
|---|---|---|
| Confirm Kafka consumer for payment events | Marcus | 2026-06-03 |
| Resolve the webhook-versus-email scope conflict | PM | 2026-06-02 |

### Readiness Verdict

> Not ready for charter and requirements. Blocked on the webhook-versus-email scope conflict and unconfirmed email failure handling. Resolve both before requirements are written.`),

  "meeting-notes": exec("s-meeting", "meeting-notes",
    `# Meeting Minutes - Notifications Kickoff

**Title:** Real-Time Notifications Kickoff
**Date:** 2026-06-01
**Attendees:** Sarah Chen (Sponsor), Marcus Reid (BE), Priya Sharma (QA), PM
**Duration:** 45 minutes

## Summary

Kick-off for real-time notifications. The MVP is email plus in-app, the Kafka event layer is confirmed, and the 6-week deadline covers email only, with in-app as a stretch.

## Key Discussion Points

- Scope - MVP is email notifications, in-app is a stretch behind the 6-week deadline.
- Event model - Payment failed, retried, and resolved events, consumed off the existing Kafka layer.
- Recipients - Configurable at the account level, not per user for the MVP.
- Real-time definition - Within 60 seconds of the payment event.

## Decisions Made

- MVP is email only, in-app a stretch
- Recipients configurable at account level
- Events covered: payment failed, retried, resolved
- "Real-time" means within 60 seconds

## Action Items

| Who | What | By When |
| --- | --- | --- |
| Marcus | Confirm the Kafka consumer for payment events | 2026-06-03 |
| PM | Update the charter and circulate for sign-off | 2026-06-02 |
| Priya | Define the QA approach for delivery testing | 2026-06-05 |
| Unassigned | Decide whether a notification history view is in MVP scope | TBD |

## Open Questions

- Email delivery failure - retry silently or alert the ops channel?
- Notification history view - required for MVP? (the unassigned action above)
- A speaker after the crosstalk was labelled "Speaker 4" (attribution unclear) - confirm who owns the SendGrid account.

## Want to dig deeper?

- What is the fallback if a payment event never reaches the Kafka consumer?
- Who signs off that "within 60 seconds" is the right SLA for enterprise clients?
- Does the in-app stretch need design input before Sprint 1 planning?`),

  "tech-review": exec("s-tech", "tech-review",
    `# Technical Feasibility Review

**Project:** Finwave Real-Time Notifications
**Document reviewed:** Notification service architecture proposal
**Document type:** Architecture proposal

## Feasibility Verdict

Feasible with conditions. Resolve Redis provisioning before the Week 3 build start.

## Plain-English Summary

A Kafka event bus feeds a new notification microservice that sends emails via SendGrid, with Redis preventing duplicate sends on event replay and a feature flag gating per-client rollout. It replaces the current manual notification process.

## Delivery Implications

- Timeline: 6 weeks is feasible for email, since Kafka is already in place
- Team: one backend engineer plus QA, no new skills required
- Scope: Redis dedup adds roughly 3 days not in the original estimate
- Third-party: a SendGrid production API key is needed before Week 3
- Operational: a new service to monitor and run on-call for

## Estimate Assessment

The SA's "6 weeks" covers build and unit test only. It excludes QA, UAT, environment setup, and production hardening. Basis is the SA's prior experience on a similar consumer, not a spike, so treat it as indicative.

## Cost / Commercial

SendGrid is usage-based and the current tier is unproven at enterprise volume, and Redis adds a managed-instance cost. The document is silent on both, so they are raised as SA questions rather than estimated here.

## Risks Surfaced

| Ref | Risk | Likelihood | Impact | Note |
| --- | --- | --- | --- | --- |
| R1 | Redis not in the production stack | M | H | Blocks delivery if provisioning slips past Week 3 |
| R2 | SendGrid rate limits at peak volume | L | M | Needs a load test the document does not mention |
| R3 | No rollback path for a bad notification batch | M | M | Not addressed in the document, a checked omission |

## Top Risk to Act On Now

R1 - confirm Redis is provisioned in production before the Week 3 build start, or the email path cannot ship.

## Dependencies

- Redis provisioned in the production stack before Week 3
- SendGrid production API key issued and the tier confirmed for peak volume

## Questions for the SA / Tech Lead

- Is Redis provisioned in production, and who owns it?
- What SendGrid tier is assumed, and does it cover enterprise peak volume?
- Is there a rollback plan if a bad batch of notifications is sent?
- Was data residency for notification payloads considered?

## Scope Implications

The Redis dedup and the rollback gap imply more work than the original estimate shows. Flag roughly 3 extra days at Sprint 1 planning and hold the in-app stretch until the email path is proven.`),

  "retrospective": exec("s-retro", "retrospective",
    `# Sprint Retro - Sprint 1

**Date:** 2026-06-20
**Attendees:** BE, QA, PM (roles, not names)
**Sprint outcome:** Partially met goal
**Sprint facts:** Committed 18 points, delivered 15, one carryover (NOTIF-6), zero incidents

## Prior Actions Review

| Last Retro Action | Owner | Done? |
| --- | --- | --- |
| Add a pre-merge build check | BE lead | No |
| Book QA staging a sprint ahead | QA | Yes |

## What Went Well

- Kafka consumer landed early, which unblocked the email path.
- Daily async standup kept the remote team aligned without a long call.

## What Didn't

| Ref | Theme | What happened | Impact |
| --- | --- | --- | --- |
| 1 | Build broke twice - no pre-merge check (Recurring) | The build failed after merges with no gate, twice in the sprint | Roughly half a day lost re-running CI, see sprint facts |
| 2 | Redis provisioned in the wrong region | NOTIF-6 blocked mid-sprint on an infra misconfiguration | One story carried over |
| 3 | Client sign-off slipped | The sponsor did not review the charter within the agreed window | Sprint 2 planning started without confirmed scope |

## Action Items

| Ref | Action | Owner | By When | Addresses |
| --- | --- | --- | --- | --- |
| 1 | Add a required pre-merge build check in CI | BE lead | Sprint 2 start | 1 |
| 2 | Add a Redis region check to the environment runbook | Infra | 2026-06-25 | 2 |
| 3 | Escalation: agree a 48-hour sponsor review SLA | PM | 2026-06-24 | 3 |

## Notes

- Theme 1 is Recurring and its prior action was not done, so it is systemic - consider /risk-scan.
- Action 3 is outside the team's control, so it is an escalation for the PM, see /stakeholder-update.

## Parked - revisit if it recurs

- Test data setup is manual and slow, raised but not prioritised this sprint.

## Sentiment

Morale is steady. The recurring build breakage is the main frustration to watch.`),

  "stakeholder-update": exec("s-stakeholder", "stakeholder-update",
    `# Finwave Notifications - Status Update, 2026-06-27

**Status:** AMBER, down from GREEN - webhook scope was added mid-sprint and one story slipped
**Headline:** The email MVP is on track for the 3 July launch, but the added webhook scope put Sprint 2 at risk. Recovery is to descope webhooks to a fast-follow. Ask: confirm the fast-follow date by 30 June.

## Progress since last update

- Promised the email engine to staging, delivered with all three event types sending.
- Promised recipient management, delivered behind a feature flag.
- Webhook delivery, added mid-sprint, is in progress and not yet on staging.

## Coming next

- Production launch of the email MVP on 3 July.
- Webhook delivery moved to a fast-follow the week of 14 July.

## Budget

Spend is $54.5k of the $80k budget, on trajectory. No change requested this period.

## Risks & issues

| Item | Impact | What we're doing |
| --- | --- | --- |
| Redis provisioned in the wrong region | Blocked NOTIF-6, now resolved | Fixed, and added a region check to the runbook |
| SendGrid tier unproven at peak | Possible throttling at enterprise volume | Load test booked before launch |

## Decisions / help needed

- Confirm the webhook fast-follow date - Sponsor - by 2026-06-30

## Key dates

- Email MVP launch: 3 July, held
- Webhook delivery: 14 July, was 3 July
- UAT sign-off: 1 July, held

## Next update

2026-07-04`),

  prd: exec("s-prd", "prd",
    `## PRD - Finwave Real-Time Payment Notifications
**Version:** 1.0 | **Status:** Draft

### Goals & Success Metrics
| Goal | Metric | Baseline | Target |
|---|---|---|---|
| Proactive failure notifications | Event-to-email time | No proactive alert today | < 60s |
| Reduce support tickets | Payment-confusion tickets | ~900 per month | -40% in 60 days |
| Configurable recipients | Accounts configured | 0 at launch | > 80% in 30 days |

### Key User Journeys

| Journey | Steps |
|---|---|
| Configure recipients | 1. Admin opens account settings. 2. Adds or edits the recipient list. 3. Saves, and the change takes effect on the next event. |
| Receive a failure alert | 1. A payment_failed event fires on Kafka. 2. The service emails the configured recipients within 60s. 3. The recipient opens the email and sees the failure detail and next step. |

### Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Email within 60s of payment_failed | Must |
| FR-02 | Email to all configured recipients | Must |
| FR-03 | Failed, retried, resolved events | Must |
| FR-04 | Dedupe on event replay (Redis) | Must |
| FR-05 | Admin add/remove recipients | Must |
| FR-06 | In-app centre, last 30 days | Could |

### Dependencies
| Dependency | Type | Owner | Status |
|---|---|---|---|
| Kafka payment topic | Internal platform | Platform | Confirmed |
| SendGrid prod API key | Third-party API | Infra | Pending |

### Out of Scope
SMS / push, webhook delivery, end-user notifications, custom templates.`),

  stories: exec("s-stories", "stories", "## User Stories", {
    skill: "stories",
    coverageNote: "PRD requirements FR-01 to FR-05 are all covered. No orphaned requirements. Email templates and history are design and stretch stories with no linked FR.",
    epics: [
      { key: "NOTIF-1", name: "Payment Event Notification Engine", summary: "Consume events, send email, dedupe.", stories: [
        { key: "NOTIF-2", title: "Consume payment events from Kafka", priority: "Must", linkedRequirement: "FR-01", points: 5, status: "In Progress" },
        { key: "NOTIF-3", title: "Send email via SendGrid", priority: "Must", linkedRequirement: "FR-03", points: "TBD", status: "To Do" },
        { key: "NOTIF-4", title: "Recipient lookup service", priority: "Must", linkedRequirement: "FR-02", points: 3, status: "To Do" },
        { key: "NOTIF-5", title: "Email templates", priority: "Should", linkedRequirement: "None", points: 2, status: "To Do" },
      ]},
      { key: "NOTIF-6", name: "Notification Recipient Management", summary: "Configure who receives notifications.", stories: [
        { key: "NOTIF-7", title: "Account settings screen", priority: "Must", linkedRequirement: "FR-05", points: 3, status: "Backlog" },
      ]},
      { key: "NOTIF-9", name: "Notification History (stretch)", summary: "In-app centre, last 30 days.", stories: [
        { key: "NOTIF-10", title: "Notification history endpoint", priority: "Could", linkedRequirement: "None", points: 3, status: "Backlog" },
      ]},
    ],
  }),

  "sprint-sow": exec("s-sow", "sprint-sow",
    `# Sprint SOW - Sprint 1

**Prepared By:** Nadia Rahman
**Date:** 2026-06-09
**Version:** 1.0
**Status:** Draft
**Link to the Jira Board:** https://finwave.atlassian.net/jira/software/projects/NOTIF/boards/12

## Sprint Goal

> Deliver a notification engine that sends emails within 60s of a payment event, with deduplication.

## Overview

Sprint 1 establishes the Kafka consumer, the SendGrid email path, and Redis deduplication. Recipient management and the in-app notification centre are out of scope for this sprint. This sprint is the foundation the recipient and history work in Sprint 2 depends on.

## Sprint Timeline

* Sprint Start: 2026-06-09
* Sprint End: 2026-06-20

## Sprint Team

| Team Member | Role | Assigned Tickets |
| --- | --- | --- |
| Marcus Webb | Backend Engineer | NOTIF-2, NOTIF-4 |
| Aiko Tanaka | Backend Engineer | NOTIF-3 |
| Priya Nair | QA Engineer | NOTIF-8 |

## Deliverables by Theme

Sprint 1 delivers 13 points across three themes.

### 1. Event Consumption

| Ticket | Deliverable | Description | Assignee | Estimate |
| --- | --- | --- | --- | --- |
| NOTIF-2 | Kafka Consumer | Consumes payment events off the Kafka topic and deduplicates them via Redis before they reach the email path. | Marcus Webb | 5 |

### 2. Email Delivery

| Ticket | Deliverable | Description | Assignee | Estimate |
| --- | --- | --- | --- | --- |
| NOTIF-3 | SendGrid Integration | Sends branded event emails through SendGrid with retry and bounce handling. | Aiko Tanaka | 5 |
| NOTIF-4 | Recipient Lookup Service | Resolves the account recipients for each payment event so the email path knows who to notify. | Marcus Webb | 3 |

### 3. Quality Assurance

| Ticket | Deliverable | Description | Assignee | Estimate |
| --- | --- | --- | --- | --- |
| NOTIF-8 | End-to-End Test Plan | Covers event consumption, dedup on replay, and email delivery across all three event types. Executed against staging before sprint review. | Priya Nair | - |

## Out of Scope - Sprint 1

* Recipient management UI - deferred to Sprint 2 (NOTIF-7)
* In-app notification centre - stretch, deferred to Sprint 2 (NOTIF-10)
* SMS and push channels - not yet prioritised

## Dependencies & Assumptions

* SendGrid production API key - owed by Infra, needed before sprint start
* Kafka payment topic access is confirmed and stable throughout the sprint
* Redis instance is provisioned in the same region as the consumer

## Definition of Done

- [ ] Code reviewed and merged to main
- [ ] Unit and integration tests passing in CI
- [ ] Email delivery confirmed in staging for all 3 event types
- [ ] Redis dedup verified - no duplicate sends on replay
- [ ] QA sign-off from Priya Nair

## Approval

Pending`),

  "sprint-planning": exec("s-plan", "sprint-planning", "## Sprint Planning", {
    skill: "sprint-planning",
    sprint: { number: 1, name: "Sprint 1 - Notifications", goal: "Ship the payment notification engine so clients are emailed within 60s of a payment event.", startDate: "2026-06-09", endDate: "2026-06-20" },
    capacity: [
      { person: "Marcus", availableDays: 8, workingDays: 10, usableCapacity: 13, notes: "Full sprint, BE" },
      { person: "Aiko", availableDays: 7, workingDays: 10, usableCapacity: 10, notes: "1 day PTO, BE" },
      { person: "Priya", availableDays: 6, workingDays: 10, usableCapacity: 8, notes: "Part-time, QA" },
    ],
    usableCapacity: 31,
    backlog: [
      { priority: "P0", item: "NOTIF-2 Kafka Consumer", estimate: 5, owner: "Marcus", dependencies: "Redis provisioned", isStretch: false },
      { priority: "P0", item: "NOTIF-3 SendGrid Integration", estimate: 5, owner: "Aiko", dependencies: "API key in prod - unconfirmed", isStretch: false },
      { priority: "P1", item: "NOTIF-4 Recipient lookup", estimate: 3, owner: "Marcus", isStretch: false },
      { priority: "P1", item: "NOTIF-5 Email templates", estimate: "TBD", owner: "Aiko", dependencies: "Copy from Sarah", isStretch: false },
      { priority: "P1", item: "NOTIF-8 QA test plan", estimate: 3, owner: "Priya", isStretch: false },
      { priority: "P1", item: "NOTIF-1 Auth bug fix (carryover)", estimate: 2, owner: "Aiko", isStretch: false, servesGoal: false },
      { priority: "P2", item: "NOTIF-6 History endpoint", estimate: 8, owner: "Aiko", isStretch: true },
    ],
    plannedLoad: 18,
    loadRatio: 18 / 31,
    capacityThreshold: { min: 0.7, max: 0.8 },
    overcommitted: false,
    velocity: { averagePoints: 20, sprints: 3 },
    carryover: [
      { item: "NOTIF-1 Auth bug fix", originalSprint: "Sprint 0", originalEstimate: "2 pts", remainingEffort: "2 pts - never started", reason: "Blocked - infra had not provisioned Redis", reCommitted: true },
    ],
    dependencies: [
      { item: "NOTIF-3 SendGrid integration", dependsOn: "Production API key", owner: "Infra team", status: "Unconfirmed", riskIfBlocked: "Email path cannot ship and the sprint goal fails" },
    ],
    risks: [
      { risk: "SendGrid key not issued by Day 1", impact: "Email delivery blocked, sprint goal at risk", mitigation: "Confirm with infra before sprint start. Fall back to a sandbox key for testing." },
      { risk: "QA depends on both P0 items landing mid-sprint", impact: "Priya has limited buffer if a P0 slips", mitigation: "Flag at the mid-sprint check-in. If a P0 is late, redirect Priya to unit coverage." },
    ],
    definitionOfDone: {
      proposed: true,
      items: [
        "Code reviewed and merged to main",
        "Automated tests passing",
        "No P0 bugs outstanding",
        "Documentation updated where applicable",
        "Product sign-off received on all P0 and P1 items",
      ],
    },
    keyDates: [
      { date: "2026-06-09", event: "Sprint start" },
      { date: "2026-06-13", event: "Mid-sprint check-in" },
      { date: "2026-06-20", event: "Sprint end / demo" },
      { date: "2026-06-23", event: "Retrospective" },
    ],
  }),

  "sprint-report": exec("s-report", "sprint-report", "## Sprint Report", {
    skill: "sprint-report",
    sprint: "Sprint 1 - Notifications",
    day: 10,
    totalDays: 10,
    closed: true,
    status: "amber",
    // confidence omitted - a closed sprint is not forecast, so the view shows "Not assessable"
    riskLevel: "Medium",
    forecast: "Delivered 15 of 18 committed points (4 of 5 stories). NOTIF-6 carried over.",
    committed: 18,
    completed: 15,
    goal: "Ship the email notification MVP for all three payment event types.",
    goalStatus: "missed",
    trailingAverage: 15,
    velocityAssessment: "over-committed",
    velocityTrend: [{ sprint: "S-2", points: 16 }, { sprint: "S-1", points: 14 }, { sprint: "Now", points: 15 }],
    burndown: [
      { day: 0, remaining: 18, ideal: 18 }, { day: 3, remaining: 15, ideal: 13 },
      { day: 7, remaining: 8, ideal: 5 }, { day: 10, remaining: 3, ideal: 0 },
    ],
    summary: "Sprint 1 shipped the core email path but missed the goal - NOTIF-6 slipped on an infra misconfiguration. Velocity held at 15 against a 15-point trailing average, so the 18-point commitment was a stretch from the start.",
    movement: "Closed amber. Confidence was 72% at Day 7 and NOTIF-6 did not recover.",
    priorities: ["Confirm the Redis region fix lands before Sprint 2 planning", "Re-baseline the Sprint 2 commitment against the 15-point trailing average"],
    topRisks: ["NOTIF-6 carried over - still blocked on the Redis region fix", "Commitment ran 20% above trailing velocity, a planning stretch to correct next sprint"],
    carryover: ["NOTIF-6 History endpoint (3 pts) - carries to Sprint 2, blocked on the Redis region fix"],
    nextSprintImplications: "Sprint 2 opens with 3 carried points plus the webhook scope add, so commit no more than 15 points until the region fix lands.",
    leadershipUpdate: "Sprint 1 shipped the email notification MVP. One stretch story slipped to Sprint 2 because of an infrastructure issue now being resolved.",
  }),

  "decision-log": exec("s-decision", "decision-log", "## Decision Log", {
    skill: "decision-log",
    project: "Finwave Real-Time Notifications",
    preparedBy: "PM",
    version: "1.3",
    lastUpdated: "2026-06-28",
    entries: [
      {
        id: "D-001", date: "2026-06-15", title: "Webhook delivery pulled into Sprint 2",
        area: "Scope",
        originalPlan: "Webhook delivery in Phase 2 (post-MVP)",
        revisedPlan: "Webhook delivery moved into Sprint 2",
        reason: "Enterprise client request ahead of the Salesforce conference",
        changeProposedBy: "Sarah Chen",
        deliveryImpact: "Sprint 2 capacity reduced, NOTIF-6 deferred to Sprint 3",
        technicalImpact: "New webhook service required in Sprint 2",
        productOwnerImpact: "Notification history de-prioritised to Sprint 3",
        costImpact: "Neutral - within $80k budget",
        changeStatus: "Superseded",
        changeApprovedBy: "Sarah Chen",
      },
      {
        id: "D-002", date: "2026-06-20", title: "Notification history deferred to Phase 2",
        area: "Scope",
        originalPlan: "Notification history in the launch scope",
        revisedPlan: "Notification history deferred to Phase 2",
        reason: "Protect the launch date after webhook scope was added",
        changeProposedBy: "PM",
        deliveryImpact: "Removes NOTIF-6 from the critical path",
        technicalImpact: "None",
        productOwnerImpact: "History drops off the launch roadmap",
        costImpact: "Neutral",
        changeStatus: "Under Review",
        changeApprovedBy: "[TBC]",
        followUps: "Needs a formal CR - outside the current SOW. The PRD is now stale.",
      },
      {
        id: "D-003", date: "2026-06-28", title: "Webhooks descoped to a post-launch fast-follow",
        area: "Scope",
        originalPlan: "Webhook delivery in Sprint 2 (per D-001)",
        revisedPlan: "Webhooks moved to a fast-follow release after launch",
        reason: "Sprint 2 could not absorb webhooks without slipping the launch (cutting QA was considered and rejected)",
        changeProposedBy: "PM",
        deliveryImpact: "Protects the launch date, webhooks land two weeks later",
        technicalImpact: "Webhook service built behind a disabled flag",
        productOwnerImpact: "Enterprise client notified of the fast-follow date",
        costImpact: "Neutral",
        changeStatus: "Approved",
        changeApprovedBy: "Sarah Chen",
        supersedes: "D-001",
      },
    ],
    discussedNotDecided: ["Adding SMS notifications - floated by Sarah, no decision taken"],
    signOffNudge: "D-002 still needs sign-off - name an approver and I can draft the approval ask.",
  }),

  "release-checklist": exec("s-release", "release-checklist", "## Release Checklist", {
    skill: "release-checklist",
    release: "Sprint 2 - Notifications v1 (email + webhooks)",
    releaseType: "planned",
    targetDate: "2026-07-03 18:00 AEST",
    categories: [
      { id: "feature-readiness", title: "Feature Readiness", items: [
        { ref: "F1", label: "All in-scope stories Done", status: "PASS", owner: "Priya", note: "NOTIF-7, NOTIF-8 cleared QA overnight" },
      ]},
      { id: "testing", title: "Testing", items: [
        { ref: "T2", label: "QA sign-off (webhooks)", status: "UNCONFIRMED", owner: "Priya", note: "Webhook path still in QA" },
        { ref: "T6", label: "Security review of webhook signing", status: "UNCONFIRMED", owner: "Sofia (Security)", note: "Touches auth" },
        { ref: "T5", label: "Load testing under peak", status: "RISK", owner: "Marcus", acceptedBy: "Sarah Chen", note: "SendGrid peak volume unproven (accepted by Sarah Chen)" },
      ]},
      { id: "operational-readiness", title: "Operational Readiness", items: [
        { ref: "O4", label: "Rollback plan reviewed", status: "UNCONFIRMED", owner: "Marcus", note: "Exists but unreviewed" },
        { ref: "O8", label: "Release window sane (Friday 18:00)", status: "RISK", owner: "Marcus", note: "Friday evening - on-call confirmed for the window and 24h after" },
        { ref: "O9", label: "Deploy owner named", status: "PASS", owner: "Marcus" },
        { ref: "O10", label: "Deploy sequence agreed (config, migration, code)", status: "PASS", owner: "Marcus" },
      ]},
      { id: "approvals", title: "Approvals", items: [
        { ref: "A1", label: "PM sign-off", status: "PASS", owner: "PM" },
      ]},
    ],
    tally: { PASS: 4, FAIL: 0, RISK: 2, UNCONFIRMED: 3, "N/A": 0 },
    blockers: [
      { ref: "T2", label: "Webhook QA sign-off", owner: "Priya", due: "2026-07-03 16:00 AEST" },
      { ref: "T6", label: "Security review of webhook signing", owner: "Sofia (Security)", due: "2026-07-02 EOD" },
      { ref: "O4", label: "Rollback runbook review", owner: "Marcus", due: "2026-07-02 EOD" },
    ],
    conditions: [
      { ref: "T5", label: "Load testing under peak (accepted by Sarah Chen)", owner: "Marcus", due: "Monitor first 24h" },
      { ref: "O8", label: "Friday 18:00 release window", owner: "Marcus", due: "On-call confirmed" },
    ],
    chaseList: [
      { owner: "Priya", questions: [{ ref: "T2", question: "Is webhook QA signed off?" }] },
      { owner: "Sofia (Security)", questions: [{ ref: "T6", question: "Is the webhook-signing security review complete?", leadTime: true }] },
      { owner: "Marcus", questions: [{ ref: "O4", question: "Has the rollback runbook been reviewed?" }] },
    ],
    delta: [
      { ref: "F1", item: "All in-scope stories Done", was: "FAIL", now: "PASS", change: "NOTIF-7 and NOTIF-8 cleared QA overnight" },
      { ref: "T5", item: "Load testing under peak", was: "FAIL", now: "RISK", change: "Accepted in writing by Sarah Chen, monitored post-release" },
      { ref: "O4", item: "Rollback plan reviewed", was: "UNCONFIRMED", now: "still open", change: "Review still not booked" },
    ],
    verdictMovement: "Changed from NO-GO to CONDITIONAL GO - the two blocking FAILs cleared or were accepted.",
    pathToGo: {
      resolvable: [
        "Webhook QA sign-off - Priya can close it if the fixes land by 16:00.",
        "Rollback runbook review - a 30-minute review with Marcus.",
      ],
      descopeOptions: ["Ship email notifications only and hold webhooks behind a disabled flag."],
      reducedRelease: "Email notifications for all three event types, webhooks deferred to next release.",
      verdictUnderReducedScope: "GO - the descoped release carries no open blockers.",
    },
    verdict: "CONDITIONAL GO",
    verdictRationale: "Proceed only when the three UNCONFIRMED items are answered and the two conditions hold their owners and deadlines.",
  }),

  // Standalone skills kept available for the nav / Run-skill tab.
  roadmap: exec("s-roadmap", "roadmap", "## Roadmap", {
    skill: "roadmap",
    goal: "Protect enterprise retention with real-time notifications",
    horizon: "Next 2 quarters",
    confidence: "Near-term firm, later directional",
    nextReview: "Post-Q2 close (2026-09-30)",
    hardCommitments: [
      { commitment: "Salesforce conference demo", date: "2026-07-13", sitsIn: "Now" },
    ],
    changesSince: {
      date: "2026-06-01",
      changes: [
        "Webhook delivery moved Later to Next - enterprise client request ahead of the conference.",
        "In-app notification centre parked - no clear demand signal yet.",
      ],
    },
    capacityFlag: "Now holds two initiatives for a team of three, which is comfortable. Adding webhooks to Now would push it over.",
    buckets: [
      { name: "Now", span: "roughly this quarter", items: [
        { initiative: "Email notification MVP", theme: "Retention", note: "Enterprise churn signal, top priority", confidence: "High", size: "M" },
        { initiative: "Recipient management", theme: "Retention", note: "Depends on the account-settings API", confidence: "High", size: "S" },
      ]},
      { name: "Next", span: "the following quarter", items: [
        { initiative: "Webhook delivery", theme: "Enterprise", note: "Depends on the email engine shipping first", confidence: "Medium", size: "M" },
      ]},
      { name: "Later", span: "beyond that", items: [
        { initiative: "In-app notification centre", theme: "Engagement", note: "Open question - is there demand?", confidence: "Low", size: "L" },
        { initiative: "SMS and push channels", theme: "Reach", note: "Under consideration once email adoption is proven", confidence: "Low" },
      ]},
    ],
    dependencies: [
      "Webhook delivery depends on the email engine shipping first.",
      "Recipient management depends on the account-settings API.",
    ],
    notNow: ["SMS and push channels are parked until email adoption is proven."],
    assumptions: [
      "[assumed] The team stays at three engineers through the horizon.",
      "[assumed] No regulatory review is required before launch.",
    ],
    weeks: 8,
    lanes: ["Now", "Next"],
    tasks: [
      { name: "Email notification MVP", lane: "Now", startWeek: 1, endWeek: 3, startDate: "2026-06-09", endDate: "2026-06-27" },
      { name: "Recipient management", lane: "Now", startWeek: 3, endWeek: 4, startDate: "2026-06-16", endDate: "2026-06-27" },
      { name: "Webhook delivery", lane: "Next", startWeek: 5, endWeek: 6, startDate: "2026-06-30", endDate: "2026-07-11" },
    ],
  }),

  "budget-tracker": exec("s-budget", "budget-tracker", "## Budget Tracker", {
    skill: "budget-tracker",
    project: "Finwave Notifications",
    verdict: "amber",
    verdictRule: "forecast 5-10% over baseline",
    commercialModel: "time-and-materials",
    originalBudget: 80000,
    approvedChanges: 5000,
    approvedChangesRef: "D-002",
    approved: 85000,
    spent: 54500,
    spentCaveat: "Finance extract trails invoicing by about two weeks, so spend to date may be understated.",
    committed: 4000,
    remaining: 30500,
    forecastAtCompletion: 90833,
    forecastMethod: "scope-based",
    runRateForecast: 61500,
    scopeForecast: 90833,
    forecastAssumptions: "Scope-based forecast drives the verdict, since spend is running ahead of scope completed. Assumes the SendGrid one-off below.",
    knownOneOffs: [{ item: "SendGrid annual licence", amount: 3000 }],
    variance: -5833,
    timeElapsedPct: 55,
    scopeCompletePct: 60,
    plannedStart: "2026-06-01",
    plannedEnd: "2026-07-25",
    avgBurnPerPeriod: 13625,
    burnPeriodLabel: "sprint",
    exhaustionDate: "2026-08-15",
    movement: "Forecast moved $88k to $91k, verdict held amber, burn per sprint up slightly.",
    varianceDrivers: [
      { driver: "Spend running ahead of scope completed", effect: "+$5.8k", note: "Scope-based forecast projects an overrun" },
      { driver: "SendGrid licence one-off", effect: "+$3k", note: "Annual renewal due before launch" },
    ],
    actions: [
      { action: "Have the sponsor conversation early and raise a change order if scope grew", owner: "PM", by: "This week" },
    ],
    developers: [
      { name: "Marcus (BE)", hours: 160, rate: 120, cost: 19200 },
      { name: "Aiko (BE)", hours: 150, rate: 110, cost: 16500 },
      { name: "Lin (FE)", hours: 80, rate: 100, cost: 8000 },
      { name: "Priya (QA)", hours: 120, rate: 90, cost: 10800 },
    ],
    burn: [
      { period: "S1", cumulative: 27000, budgetLine: 85000 },
      { period: "S2", cumulative: 54500, budgetLine: 85000 },
    ],
  }),

  onboarding: exec("s-onboarding", "onboarding",
    `# Onboarding Brief - Finwave Notifications for Backend Engineer

**Role:** Backend Engineer
**Client:** Finwave
**Current phase:** Delivery (Sprint 1)
**Distribution:** Internal - not for client distribution
**Handle with care:** Ask Sarah (account lead) before discussing the timeline history with the client.

## In One Paragraph

Finwave's enterprise clients discover failed payments reactively. This project builds real-time payment notifications (email first, in-app later) so clients are alerted within 60 seconds. It replaces the current manual process and protects enterprise retention ahead of the Salesforce conference.

## Where We Are Now

- Phase: Delivery, Sprint 1 of the notification engine.
- Status: Amber - NOTIF-6 blocked on a Redis region misconfiguration.
- Last artefact: Sprint 1 plan (2026-06-09).

## How We Work

- Ceremonies: daily async standup, 2-week sprints, review and retro on the last Friday.
- Comms: #finwave-notifications on Slack.
- Where the work lives: Jira NOTIF, Confluence FIN space, the finwave-notifications repo.

## Who's Who

| Name / Role | What they own | When to go to them |
| --- | --- | --- |
| Sarah Chen (Sponsor) | Budget and final calls | Escalations and scope changes |
| Marcus (Tech lead) | Architecture and the Kafka layer | Technical decisions |
| Priya (QA) | Test plan and sign-off | Quality and release gating |

## What to Read First

1. Charter - the why and scope - clients/finwave/notifications/2026-06-01-project-charter.md (2026-06-01)
2. PRD - what we are building - clients/finwave/notifications/2026-06-05-prd.md (2026-06-05, note: 2026-06-15 decision moved webhooks to a fast-follow)
3. Sprint 1 plan - clients/finwave/notifications/2026-06-09-sprint-1-plan.md (2026-06-09)

## Key Decisions Already Made

- MVP is email only, in-app is a stretch, so do not reopen the channel debate.
- Webhooks moved to a post-launch fast-follow (D-003).
- "Real-time" means within 60 seconds of the payment event.

## Live Risks & Open Questions

| Item | Why it matters |
| --- | --- |
| Redis provisioned in the wrong region (NOTIF-6) | Blocks the dedup path and the stretch story |
| SendGrid tier unproven at peak volume | Possible throttling at enterprise volume |

## Role-Specific Starting Points

- Start on NOTIF-4 (recipient lookup service), pair with Marcus.
- Local env - the Kafka consumer and a Redis instance, see the repo README.
- Confirm the Redis region fix owner before starting NOTIF-6.

## First-Week Checklist

- [ ] GitHub repo access - granted by Marcus
- [ ] Jira NOTIF board access - granted by PM
- [ ] Client VPN and staging access - granted by Finwave IT (lead time 3-5 days, request day one)
- [ ] Read the three docs above
- [ ] Intro to Sarah, Marcus, and Priya
- [ ] Shadow the Sprint 1 standup`),
};
