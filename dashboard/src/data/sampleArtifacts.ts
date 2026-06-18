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

**Request Summary:** Enterprise clients discover failed payments reactively (via customer calls) rather than proactively. Sarah is asking for real-time payment failure notifications.

**Likely Business Goal:** Reduce client churn and support burden by giving enterprise customers visibility into payment failures before their end-customers complain.

**Primary Stakeholder Need:** Enterprise clients need to know about payment failures the moment they occur.

**What Is Clear**
- Trigger event: payment failure
- Audience: enterprise clients
- Deadline: 6 weeks (Salesforce conference)
- Budget: ~$80k

**Missing Information**
- Channels (email / SMS / webhook / in-app)?
- Events beyond failures (partial, reversals, retries)?
- Who receives the notification?
- Existing infra to build on?
- Is 6 weeks for MVP or full feature?

**Risks / Concerns**
- "Real-time" undefined (30s vs 5min)
- 6 weeks is aggressive
- $80k may not cover full scope

**Intake Classification:** New Feature - Medium/High complexity.

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
- Custom email templates

### Top Risks
| Risk | L | I | Response |
|---|---|---|---|
| Event streaming infra not in place | M | H | Spike in Week 1 |
| Scope expansion to more channels | H | M | Lock in charter |
| 6-week deadline for MVP only | H | H | Confirm with Sarah |

### Approvals
| Role | Name |
|---|---|
| Sponsor | Sarah Chen |
| Project Manager | |
| Tech Lead | Marcus Reid |`),

  discovery: exec("s-discovery", "discovery",
    `## Discovery Findings

**The Real Problem**
Enterprise clients have no proactive signal for payment failures, so they learn from their own customers. The root need is a timely, configurable alert, not a dashboard.

**What Success Looks Like**
Notification delivered within 60 seconds of a payment event, to the right account contacts.

**Key Findings**
- Kafka event layer already exists (reuse it)
- MVP = email plus in-app, and in-app is a stretch
- Recipients configured at account level, not per user

**Conflicts**
- Sarah wants webhooks soon, and engineering wants email-only for MVP

**Still Unknown**
- Email delivery failure handling (retry vs alert)
- Notification history retention`),

  "meeting-notes": exec("s-meeting", "meeting-notes",
    `## Meeting Minutes
**Date:** 2026-06-01 | **Attendees:** Sarah Chen, Marcus Reid, Priya Sharma, PM

**Summary**
Kick-off for real-time notifications. MVP = email plus in-app, Kafka event layer confirmed, and the 6-week deadline covers email only, with in-app a stretch.

**Decisions Made**
- MVP = email only, in-app stretch
- Recipients configurable at account level
- Events: payment failed, retried, resolved
- "Real-time" = within 60 seconds

**Action Items**
| Who | What | By When |
|---|---|---|
| Marcus | Confirm Kafka consumer for payment events | 2026-06-03 |
| PM | Update charter, circulate for sign-off | 2026-06-02 |
| Priya | Define QA approach for delivery testing | 2026-06-05 |

**Open Questions**
- Email delivery failure: retry or alert?
- Notification history view required?`),

  "tech-review": exec("s-tech", "tech-review",
    `## Technical Feasibility Review

**Plain-English Summary**
Kafka event bus to a new notification microservice, emails via SendGrid, Redis to prevent duplicate sends on replay, feature flag for per-client rollout.

**Delivery Implications**
- Timeline: 6 weeks feasible for email (Kafka already in place)
- Scope: Redis dedup adds ~3 days not in the original estimate
- Third-party: SendGrid API key needed in prod before Week 3

**Risks**
| # | Risk | L | I | Note |
|---|---|---|---|---|
| R1 | Redis not in prod stack | M | H | Blocks delivery if delayed |
| R2 | SendGrid rate limits at peak | L | M | Needs load test |

**Questions for Marcus**
1. Is Redis provisioned in prod?
2. SendGrid tier vs enterprise volume?
3. Feature flag vs account-settings interaction?

**Verdict: Feasible with conditions.** Resolve Redis provisioning before the Week 3 build start.`),

  prd: exec("s-prd", "prd",
    `## PRD - Finwave Real-Time Payment Notifications
**Version:** 1.0 | **Status:** Draft

### Goals & Success Metrics
| Goal | Metric | Target |
|---|---|---|
| Proactive failure notifications | Event-to-email time | < 60s |
| Reduce support tickets | Payment-confusion tickets | -40% in 60 days |
| Configurable recipients | Accounts configured | > 80% in 30 days |

### Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Email within 60s of payment_failed | Must |
| FR-02 | Email to all configured recipients | Must |
| FR-03 | Failed, retried, resolved events | Must |
| FR-04 | Dedupe on event replay (Redis) | Must |
| FR-05 | Admin add/remove recipients | Must |
| FR-06 | In-app centre, last 30 days | Could |

### Out of Scope
SMS / push, webhook delivery, end-user notifications, custom templates.`),

  stories: exec("s-stories", "stories", "## User Stories", {
    skill: "stories",
    epics: [
      { key: "NOTIF-1", name: "Payment Event Notification Engine", summary: "Consume events, send email, dedupe.", stories: [
        { key: "NOTIF-2", title: "Consume payment events from Kafka", points: 5, status: "In Progress" },
        { key: "NOTIF-3", title: "Send email via SendGrid", points: 5, status: "To Do" },
        { key: "NOTIF-4", title: "Recipient lookup service", points: 3, status: "To Do" },
        { key: "NOTIF-5", title: "Email templates", points: 2, status: "To Do" },
      ]},
      { key: "NOTIF-6", name: "Notification Recipient Management", summary: "Configure who receives notifications.", stories: [
        { key: "NOTIF-7", title: "Account settings screen", points: 3, status: "Backlog" },
      ]},
      { key: "NOTIF-9", name: "Notification History (stretch)", summary: "In-app centre, last 30 days.", stories: [
        { key: "NOTIF-10", title: "Notification history endpoint", points: 3, status: "Backlog" },
      ]},
    ],
  }),

  "sprint-sow": exec("s-sow", "sprint-sow",
    `## Sprint SOW - Sprint 1

**Sprint Goal:** Deliver a notification engine that sends emails within 60s of a payment event, with deduplication.

### Deliverables by Theme
**1. Event Consumption**
| Ticket | Deliverable | Assignee |
|---|---|---|
| NOTIF-2 | Kafka Consumer | Marcus |

**2. Email Delivery**
| Ticket | Deliverable | Assignee |
|---|---|---|
| NOTIF-3 | SendGrid Integration | Aiko |

### Out of Scope - Sprint 1
- Recipient management UI (NOTIF-7, Sprint 2)
- In-app centre (NOTIF-10, stretch)

### Definition of Done
- [ ] Code reviewed and merged to main
- [ ] Unit + integration tests passing in CI
- [ ] Email delivery confirmed in staging (3 event types)
- [ ] Redis dedup verified
- [ ] QA sign-off from Priya`),

  "sprint-planning": exec("s-plan", "sprint-planning", "## Sprint Planning", {
    skill: "sprint-planning",
    sprint: { number: 1, goal: "Ship the notification engine", startDate: "2026-06-09", endDate: "2026-06-20" },
    capacity: [
      { person: "Marcus", availableDays: 10, workingDays: 10, usableCapacity: 16, notes: "Full availability" },
      { person: "Aiko", availableDays: 9, workingDays: 10, usableCapacity: 14, notes: "1 day PTO" },
      { person: "Priya", availableDays: 10, workingDays: 10, usableCapacity: 0, notes: "QA, not story points" },
      { person: "Lin", availableDays: 5, workingDays: 10, usableCapacity: 6, notes: "50% allocated, FE only" },
    ],
    usableCapacity: 22,
    backlog: [
      { priority: "P0", item: "NOTIF-2 Kafka Consumer", estimate: 5, owner: "Marcus", dependencies: "Redis provisioned", isStretch: false },
      { priority: "P0", item: "NOTIF-3 SendGrid Integration", estimate: 5, owner: "Aiko", dependencies: "API key in prod", isStretch: false },
      { priority: "P1", item: "NOTIF-4 Recipient lookup", estimate: 3, owner: "Marcus", isStretch: false },
      { priority: "P1", item: "NOTIF-5 Email templates", estimate: 2, owner: "Aiko", dependencies: "Copy from Sarah", isStretch: false },
      { priority: "P2", item: "NOTIF-6 History endpoint", estimate: 3, owner: "Lin", isStretch: true },
    ],
    plannedLoad: 18,
    loadRatio: 18 / 22,
    capacityThreshold: { min: 0.7, max: 0.8 },
    overcommitted: true,
  }),

  "sprint-report": exec("s-report", "sprint-report", "## Sprint Report", {
    skill: "sprint-report",
    sprint: "Sprint 1 - Notifications",
    day: 7,
    totalDays: 10,
    status: "amber",
    confidence: 72,
    forecast: "4 of 5 items likely complete (NOTIF-6 at risk)",
    committed: 18,
    completed: 7,
    velocityTrend: [{ sprint: "Pre", points: 0 }, { sprint: "S1", points: 7 }],
    burndown: [
      { day: 0, remaining: 18, ideal: 18 }, { day: 3, remaining: 16, ideal: 13 },
      { day: 5, remaining: 11, ideal: 9 }, { day: 7, remaining: 11, ideal: 5 },
    ],
    topRisks: ["NOTIF-6 blocked - Redis provisioned in wrong region", "NOTIF-4 not started, P1 with no buffer", "QA staging readiness for NOTIF-2 regression"],
  }),

  "decision-log": exec("s-decision", "decision-log", "## Decision Log", {
    skill: "decision-log",
    project: "Finwave Real-Time Notifications",
    preparedBy: "PM",
    entries: [
      {
        area: "Scope",
        originalPlan: "Webhook delivery in Phase 2 (post-MVP)",
        revisedPlan: "Webhook delivery moved into Sprint 2",
        reason: "Enterprise client request ahead of the Salesforce conference",
        changeProposedBy: "Sarah Chen",
        deliveryImpact: "Sprint 2 capacity reduced, and NOTIF-6 deferred to Sprint 3",
        technicalImpact: "New webhook service required in Sprint 2",
        productOwnerImpact: "Notification history de-prioritised to Sprint 3",
        costImpact: "Neutral - within $80k budget",
        changeStatus: "Approved",
        changeApprovedBy: "Sarah Chen",
      },
    ],
  }),

  "release-checklist": exec("s-release", "release-checklist", "## Release Checklist", {
    skill: "release-checklist",
    release: "Sprint 2 - Notifications v1 (email + webhooks)",
    releaseType: "planned",
    targetDate: "2026-07-03 18:00 AEST",
    categories: [
      { id: "feature-readiness", title: "Feature Readiness", items: [
        { ref: "F1", label: "All in-scope stories Done", status: "FAIL", note: "NOTIF-7, NOTIF-8 still In QA" },
      ]},
      { id: "testing", title: "Testing", items: [
        { ref: "T2", label: "QA sign-off", status: "FAIL", note: "Partial - webhooks outstanding" },
        { ref: "T5", label: "Load testing", status: "RISK", note: "SendGrid volume under peak unknown" },
      ]},
      { id: "operational-readiness", title: "Operational Readiness", items: [
        { ref: "O4", label: "Rollback plan reviewed", status: "UNCONFIRMED", note: "Exists but unreviewed" },
      ]},
      { id: "approvals", title: "Approvals", items: [
        { ref: "A1", label: "PM sign-off", status: "PASS" },
      ]},
    ],
    tally: { PASS: 1, FAIL: 2, RISK: 1, UNCONFIRMED: 1, "N/A": 0 },
    blockers: [
      { ref: "F1", label: "NOTIF-7, NOTIF-8 QA sign-off", owner: "Priya", due: "2026-07-03 16:00 AEST" },
      { ref: "O4", label: "Rollback runbook review", owner: "Marcus", due: "2026-07-02 EOD" },
    ],
    verdict: "CONDITIONAL GO",
    verdictRationale: "Proceed only when webhook QA sign-off and the rollback review land by their deadlines.",
  }),

  // Standalone skills kept available for the nav / Run-skill tab.
  roadmap: exec("s-roadmap", "roadmap", "## Roadmap", {
    skill: "roadmap",
    goal: "Protect enterprise retention with real-time notifications",
    horizon: "Next 8 weeks",
    weeks: 8,
    lanes: ["Sprint 1", "Sprint 2"],
    tasks: [
      { name: "Email notifications (MVP)", lane: "Sprint 1", startWeek: 1, endWeek: 3, startDate: "2026-06-09", endDate: "2026-06-27" },
      { name: "Recipient management", lane: "Sprint 1", startWeek: 3, endWeek: 4, startDate: "2026-06-23", endDate: "2026-07-04" },
      { name: "Webhook delivery", lane: "Sprint 2", startWeek: 5, endWeek: 6, startDate: "2026-07-07", endDate: "2026-07-18" },
      { name: "Notification history", lane: "Sprint 2", startWeek: 7, endWeek: 8, startDate: "2026-07-21", endDate: "2026-08-01" },
    ],
  }),

  "budget-tracker": exec("s-budget", "budget-tracker", "## Budget Tracker", {
    skill: "budget-tracker",
    project: "Finwave Notifications",
    verdict: "green",
    approved: 80000,
    spent: 54500,
    committed: 0,
    remaining: 25500,
    forecastAtCompletion: 54500,
    variance: 25500,
    timeElapsedPct: 0,
    scopeCompletePct: 0,
    developers: [
      { name: "Marcus (BE)", hours: 160, rate: 120, cost: 19200 },
      { name: "Aiko (BE)", hours: 150, rate: 110, cost: 16500 },
      { name: "Lin (FE)", hours: 80, rate: 100, cost: 8000 },
      { name: "Priya (QA)", hours: 120, rate: 90, cost: 10800 },
    ],
  }),
};
