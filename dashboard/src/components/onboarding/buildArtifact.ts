import type {
  SkillExecution, SkillId, RagStatus, Priority, HML, Detectability, Velocity,
  RiskScanPayload, RiskEntry, RiskMatrixPoint, RiskAssumption, RiskDecision, Recommendation,
  RiskDetailEntry, RiskExperiment, RiskChanges,
  StoriesPayload,
  ReleaseChecklistPayload, ReleaseCategory, ReleaseCategoryId, ChecklistItem, ChecklistStatus, ChecklistTally, ReleaseVerdict, ChaseGroup, PathToGo,
  SprintPlanPayload, BacklogItem, BacklogPriority, BacklogEstimate, CapacityRow,
  SprintCarryover, SprintDependency, SprintRisk, SprintKeyDate,
  RoadmapPayload, RoadmapTask, RoadmapItem, RoadmapBucket, RoadmapCommitment, RoadmapConfidence, RoadmapSize,
  BudgetTrackerPayload, BudgetDeveloper, CommercialModel,
  DecisionLogPayload, DecisionLogEntry, ChangeStatus,
  SprintReportPayload, GoalStatus, RiskLevel,
  DocPayload, DocSection, DocSkill,
} from "@/types/pm";
import type { EpicGroup, ListField, OnbStep, Row, ScalarField, StepValues } from "./steps";
import { loadStatus, assessVelocity } from "@/lib/sprint";
import { budgetVerdict } from "@/lib/budget";

const GOAL_STATUS_MAP: Record<string, GoalStatus> = {
  "On track": "on-track", "At risk": "at-risk", "Missed": "missed", "Not stated": "not-stated",
};

const rows = (values: StepValues, name: string): Row[] => (Array.isArray(values[name]) ? (values[name] as Row[]) : []);
const str = (values: StepValues, name: string): string => (typeof values[name] === "string" ? (values[name] as string) : "");
const tags = (values: StepValues, name: string): string[] => (Array.isArray(values[name]) ? (values[name] as string[]) : []);
const epicGroups = (values: StepValues, name: string): EpicGroup[] => (Array.isArray(values[name]) ? (values[name] as EpicGroup[]) : []);

const COORD: Record<string, number> = { H: 80, M: 50, L: 20 };
const PRIORITY_FROM_LABEL: Record<string, Priority> = {
  "Act now": "act-now", Monitor: "monitor", Contingency: "contingency", Log: "log",
};

function derivePriority(l: string, i: string): Priority {
  if (l === "H" && i === "H") return "act-now";
  if (i === "H") return "contingency";
  if (l === "H") return "monitor";
  return "log";
}

/**
 * Stub extras so the three risk-scan levels each render the sections the skill
 * specifies: mid-level adds Key Assumptions + Stakeholder Summary; detailed adds
 * Prioritisation Reasoning on top. The view (RiskScanView) gates these by level.
 */
const RISK_STUB_EXTRAS: {
  recommendation: Recommendation;
  conditions: string[];
  assumptions: RiskAssumption[];
  topRisksDetail: RiskDetailEntry[];
  mitigationActions: { ref: string; action: string }[];
  validationExperiments: RiskExperiment[];
  changesSinceLastScan: RiskChanges;
  decisionsNeeded: RiskDecision[];
  stakeholderSummary: string;
  prioritisationReasoning: string;
  notAssessed: { critical: string[]; secondary: string[] };
} = {
  recommendation: "Proceed with Conditions",
  conditions: [
    "Confirm the third-party integration spec before sprint 1.",
    "Name an owner for data migration sign-off.",
  ],
  assumptions: [
    { assumption: "The current team stays intact through delivery.", confidence: "Medium", riskIfWrong: "Re-planning and onboarding cost a sprint." },
    { assumption: "Third-party API limits are sufficient for launch volume.", confidence: "Low", riskIfWrong: "Throttling forces a redesign of the sync layer." },
    { assumption: "No regulatory review is required before go-live.", confidence: "Medium", riskIfWrong: "Launch slips pending compliance sign-off." },
    { assumption: "Stakeholders are available for weekly decision points.", confidence: "High", riskIfWrong: "Decisions stall and block dependent work." },
    { assumption: "Existing data is clean enough to migrate as-is.", confidence: "Low", riskIfWrong: "Migration needs a cleansing phase, adding scope." },
  ],
  topRisksDetail: [
    {
      ref: "R1", name: "Third-party integration fails late",
      rootCause: "The vendor integration spec is unconfirmed and access is documentation-only so far.",
      whyExposed: "The booking flow cannot function without the vendor API, and it sits on the critical path to launch.",
      triggerSignal: "Sandbox credentials still not issued by the end of sprint 1.",
      exposure: "~2-3 weeks of slip if it fails during integration testing.",
      action: "Delivery Lead confirms the integration spec and sandbox access with the vendor by end of week 1.",
    },
    {
      ref: "R2", name: "Data migration compounds silently until cutover",
      rootCause: "No migration approach has been signed off and data cleanliness is unverified.",
      whyExposed: "Legacy data feeds the new system directly, so hidden quality issues only surface at cutover.",
      triggerSignal: "First trial migration returns a high row-rejection rate.",
      exposure: "~15% of remaining budget if a cleansing phase is needed.",
      action: "Tech Lead runs a trial migration on a data sample by sprint 1.",
    },
  ],
  mitigationActions: [
    { ref: "R3", action: "QA lead front-loads a test plan so QA is not compressed into the last two days." },
    { ref: "R4", action: "PM books a performance and load test window before UAT." },
  ],
  validationExperiments: [
    { ref: "R1", experiment: "Time-boxed spike against the vendor sandbox.", testing: "Whether the documented API supports the booking payload at expected volume.", learning: "Confirms or kills the integration approach before sprint 1 commits to it.", by: "End of week 1" },
    { ref: "R2", experiment: "Trial migration of a 5% data sample.", testing: "How clean the legacy data actually is.", learning: "Sizes the cleansing effort, if any, before it is on the critical path.", by: "Sprint 1" },
  ],
  changesSinceLastScan: {
    added: ["R4 - performance and load profile not yet tested."],
    escalated: ["R1 - vendor sandbox access still not issued, now on the critical path."],
    deEscalated: ["R5 - staging environment stabilised after two clean sprints."],
    closed: ["R6 - contract sign-off received."],
    nextReview: "Start of sprint 2",
  },
  decisionsNeeded: [
    { decision: "Confirm launch scope (MVP vs full).", owner: "Product Sponsor", by: "End of week 1", impactIfDelayed: "Sprint planning cannot finalise." },
    { decision: "Approve the third-party vendor contract.", owner: "Procurement", by: "Before sprint 1", impactIfDelayed: "Integration work cannot start." },
    { decision: "Sign off the data migration approach.", owner: "Tech Lead", by: "Sprint 1", impactIfDelayed: "Migration risk stays unmitigated." },
    { decision: "Agree the rollback plan for launch.", owner: "Delivery Lead", by: "Pre-launch", impactIfDelayed: "Go/no-go cannot be assessed." },
    { decision: "Confirm support coverage for launch week.", owner: "Ops Manager", by: "Pre-launch", impactIfDelayed: "Incident response is unclear." },
  ],
  stakeholderSummary:
    "We are at risk of a delayed launch driven by unconfirmed third-party integration and data migration scope. The trade-off for leadership is holding the date for full scope versus shipping a reduced MVP on time. The single most important next action is to lock the vendor integration spec this week.",
  prioritisationReasoning:
    "Top risks are ranked above their raw likelihood and impact because detectability and velocity elevate them: the integration failure is hard to detect until late and moves fast once triggered, while the migration risk compounds silently until cutover. Risks that are easy to detect or slow to materialise rank lower even at comparable impact.",
  notAssessed: {
    critical: [
      "Production load profile - no performance or load testing has been scoped yet.",
      "Security review of the data-handling path - not yet booked.",
    ],
    secondary: [
      "Third-party vendor SLAs under failure conditions.",
      "Long-term support and on-call ownership after launch.",
    ],
  },
};

function buildRiskScan(values: StepValues): RiskScanPayload {
  const register: RiskEntry[] = rows(values, "risks")
    .filter((r) => r.risk?.trim())
    .map((r, idx) => {
      const likelihood = (r.likelihood || "M") as HML;
      const impact = (r.impact || "M") as HML;
      const priority = PRIORITY_FROM_LABEL[r.priority ?? ""] ?? derivePriority(likelihood, impact);
      return {
        ref: `R${idx + 1}`, risk: r.risk ?? "",
        category: (r.category || "Delivery") as RiskEntry["category"],
        likelihood, impact,
        detectability: (r.detectability || "Moderate") as Detectability,
        velocity: (r.velocity || "Medium") as Velocity,
        priority, owner: r.owner?.trim() || "Unassigned",
        response: (r.response || "Mitigate") as RiskEntry["response"],
        proximity: (r.proximity || undefined) as RiskEntry["proximity"],
        triggerSignal: r.triggerSignal?.trim() || undefined,
      };
    });
  const matrix: RiskMatrixPoint[] = register.map((e) => ({
    ref: e.ref, x: COORD[e.likelihood] ?? 50, y: COORD[e.impact] ?? 50, priority: e.priority,
  }));
  const verdict: RagStatus = register.some((e) => e.priority === "act-now")
    ? "red" : register.some((e) => e.priority !== "log") ? "amber" : "green";
  return {
    skill: "risk-scan", project: "This project", phase: "pre-project", depth: "medium",
    verdict, register, matrix, ...RISK_STUB_EXTRAS,
  };
}

function buildStories(values: StepValues): StoriesPayload {
  const epics = epicGroups(values, "epics")
    .filter((g) => g.name?.trim() || (g.stories ?? []).length)
    .map((g) => ({
      name: g.name || "Epic", summary: "",
      stories: (g.stories ?? [])
        .filter((s) => s.title?.trim())
        .map((s) => ({
          title: s.title ?? "",
          priority: s.priority || undefined,
          linkedRequirement: s.linkedRequirement?.trim() || undefined,
          asA: s.asA?.trim() || undefined,
          iWant: s.iWant?.trim() || undefined,
          soThat: s.soThat?.trim() || undefined,
          points: s.points === "TBD" ? "TBD" : (s.points ? Number(s.points) : undefined),
          status: s.status || undefined,
          acceptanceCriteria: (s.criteria ?? "").split("\n").map((x) => x.trim()).filter(Boolean),
        })),
    }));
  return { skill: "stories", epics };
}

const CAT_ID: Record<string, ReleaseCategoryId> = {
  "Feature Readiness": "feature-readiness", "Testing": "testing", "Operational Readiness": "operational-readiness",
  "Communications": "communications", "Dependencies": "dependencies", "Approvals": "approvals", "Post-Release Readiness": "post-release-readiness",
  "Hotfix": "hotfix",
};

/** Path-to-GO decision aid shown on the form path for any non-GO verdict. */
const RELEASE_PATH_TO_GO: PathToGo = {
  resolvable: [
    "Webhook QA sign-off - Priya can close it if the fixes land by 16:00.",
    "Rollback runbook review - a 30-minute review with the tech lead.",
  ],
  descopeOptions: ["Ship email notifications only and hold webhooks behind a disabled flag."],
  reducedRelease: "Email notifications for all three event types, no webhooks.",
  verdictUnderReducedScope: "GO - the descoped release carries no open FAILs.",
};

function buildRelease(values: StepValues): ReleaseChecklistPayload {
  const tally: ChecklistTally = { PASS: 0, FAIL: 0, RISK: 0, UNCONFIRMED: 0, "N/A": 0 };
  const byCat = new Map<string, ChecklistItem[]>();
  const blockers: { ref: string; label: string; owner: string; due?: string }[] = [];
  const conditions: { ref: string; label: string; owner: string; due?: string }[] = [];
  const chaseByOwner = new Map<string, { ref: string; question: string; leadTime?: boolean }[]>();
  rows(values, "items").filter((r) => r.item?.trim()).forEach((r, idx) => {
    const ref = `I${idx + 1}`;
    const owner = r.owner?.trim() || "PM";
    const due = r.due?.trim() || undefined;
    const acceptedBy = r.acceptedBy?.trim() || undefined;
    let status = (r.status || "UNCONFIRMED") as ChecklistStatus;
    let note = r.note?.trim() || undefined;
    // A FAIL accepted in writing converts to RISK and moves to Conditions.
    if (status === "FAIL" && acceptedBy) {
      status = "RISK";
      note = note ? `${note} (accepted by ${acceptedBy})` : `Accepted by ${acceptedBy}`;
    }
    tally[status]++;
    const cat = r.category || "Feature Readiness";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push({ ref, label: r.item ?? "", status, note, owner, acceptedBy });
    if (status === "FAIL" || status === "UNCONFIRMED") blockers.push({ ref, label: r.item ?? "", owner, due });
    if (status === "RISK") conditions.push({ ref, label: r.item ?? "", owner, due });
    if (status === "UNCONFIRMED") {
      if (!chaseByOwner.has(owner)) chaseByOwner.set(owner, []);
      chaseByOwner.get(owner)!.push({ ref, question: r.item ?? "", leadTime: /legal|security|complian|vendor|third-party/i.test(r.item ?? "") });
    }
  });
  const categories: ReleaseCategory[] = [...byCat.entries()].map(([title, items]) => ({
    id: CAT_ID[title] ?? "feature-readiness", title, items,
  }));
  const chaseList: ChaseGroup[] = [...chaseByOwner.entries()].map(([owner, questions]) => ({ owner, questions }));
  const verdict: ReleaseVerdict = tally.FAIL > 0 ? "NO-GO" : (tally.RISK > 0 || tally.UNCONFIRMED > 0) ? "CONDITIONAL GO" : "GO";
  const releaseType = (str(values, "releaseType") || "planned") as ReleaseChecklistPayload["releaseType"];
  return {
    skill: "release-checklist", release: str(values, "release") || "This release", releaseType,
    targetDate: str(values, "targetDate") || undefined, categories, tally, blockers,
    conditions: conditions.length ? conditions : undefined,
    chaseList: chaseList.length ? chaseList : undefined,
    pathToGo: verdict === "GO" ? undefined : RELEASE_PATH_TO_GO,
    verdict,
    verdictRationale: verdict === "GO" ? "All checks passed."
      : verdict === "NO-GO" ? "Resolve the failing items before shipping."
      : "Clear the open risks and unconfirmed items first.",
  };
}

/**
 * Stub extras so the form path renders the sections the plan skill produces
 * beyond the core capacity/backlog maths - carryover, a dependencies table,
 * risks, a proposed DoD, and key dates. The seeded sample carries its own.
 */
const SPRINT_STUB_EXTRAS: {
  carryover: SprintCarryover[];
  dependencies: SprintDependency[];
  risks: SprintRisk[];
  definitionOfDone: { proposed: boolean; items: string[] };
  keyDates: SprintKeyDate[];
} = {
  carryover: [
    { item: "NOTIF-1 Auth bug fix", originalSprint: "Sprint 0", originalEstimate: "2 pts", remainingEffort: "2 pts - never started", reason: "Blocked - infra had not provisioned the service", reCommitted: true },
  ],
  dependencies: [
    { item: "NOTIF-3 SendGrid integration", dependsOn: "Production API key", owner: "Infra team", status: "Unconfirmed", riskIfBlocked: "Email path cannot ship and the sprint goal fails" },
  ],
  risks: [
    { risk: "SendGrid key not issued by Day 1", impact: "Email delivery blocked, sprint goal at risk", mitigation: "Confirm with infra before sprint start. Fall back to a sandbox key for testing." },
    { risk: "QA depends on both P0 items landing mid-sprint", impact: "Limited buffer if either P0 slips", mitigation: "Flag at the mid-sprint check-in. If a P0 is late, redirect QA to unit coverage." },
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
};

function buildSprintPlan(values: StepValues): SprintPlanPayload {
  const capacity: CapacityRow[] = rows(values, "team")
    .filter((t) => t.person?.trim())
    .map((t) => {
      const avail = Number(t.availableDays) || 0;
      return {
        person: (t.person ?? "").trim(), availableDays: avail, workingDays: Number(t.workingDays) || avail,
        usableCapacity: Number(t.points) || 0, notes: t.notes?.trim() || undefined,
      };
    });
  const usableCapacity = capacity.reduce((s, c) => s + c.usableCapacity, 0);
  const backlog: BacklogItem[] = rows(values, "backlog")
    .filter((r) => r.item?.trim())
    .map((r) => {
      const priority = (r.priority || "P1") as BacklogPriority;
      return {
        priority, item: r.item ?? "",
        estimate: r.points === "TBD" ? "TBD" : (Number(r.points) || 0),
        owner: r.owner?.trim() || "Team",
        dependencies: r.dependencies?.trim() || undefined,
        isStretch: priority === "P2",
        servesGoal: r.servesGoal === "No" ? false : undefined,
      };
    });
  const numEst = (e: BacklogEstimate) => (typeof e === "number" ? e : 0);
  // Committed = P0 + P1, TBD excluded (never estimate on the team's behalf).
  const plannedLoad = backlog.filter((b) => b.priority !== "P2").reduce((s, b) => s + numEst(b.estimate), 0);
  const load = loadStatus(usableCapacity, plannedLoad); // single source for the 80% overcommit rule
  const velPoints = Number(str(values, "velocityPoints")) || 0;
  const velSprints = Number(str(values, "velocitySprints")) || 0;
  const velocity = velPoints > 0 ? { averagePoints: velPoints, sprints: velSprints || 3 } : undefined;
  return {
    skill: "sprint-planning",
    sprint: {
      number: 1,
      name: str(values, "sprintName") || undefined,
      goal: str(values, "sprintGoal") || "Sprint goal",
      startDate: str(values, "startDate") || undefined,
      endDate: str(values, "endDate") || undefined,
    },
    capacity, usableCapacity, backlog, plannedLoad, loadRatio: load.ratio,
    capacityThreshold: { min: 0.7, max: 0.8 }, overcommitted: load.overcommitted,
    velocity, ...SPRINT_STUB_EXTRAS,
  };
}

/**
 * Stub extras so the form path renders the roadmap sections beyond the buckets -
 * hard commitments, the update-mode changes list, a capacity flag, dependencies,
 * parked items, and assumptions. The seeded sample carries its own.
 */
const ROADMAP_STUB_EXTRAS: {
  hardCommitments: RoadmapCommitment[];
  changesSince: { date: string; changes: string[] };
  capacityFlag: string;
  dependencies: string[];
  notNow: string[];
  assumptions: string[];
} = {
  hardCommitments: [{ commitment: "Salesforce conference demo", date: "2026-07-13", sitsIn: "Now" }],
  changesSince: {
    date: "2026-06-01",
    changes: [
      "Webhook delivery moved Later to Next - enterprise client request.",
      "In-app notification centre parked - no clear demand yet.",
    ],
  },
  capacityFlag: "Now holds three initiatives for a team of three, which is at the edge. Confirm recipient management can start before pulling in more.",
  dependencies: [
    "Webhook delivery depends on the email engine shipping first.",
    "Recipient management depends on the account-settings API.",
  ],
  notNow: ["SMS and push channels - parked until email adoption is proven."],
  assumptions: [
    "[assumed] The team stays at three engineers through the horizon.",
    "[assumed] No regulatory review is required before launch.",
  ],
};

const RM_BUCKET_ORDER = ["Now", "Next", "Later"];
const RM_SPAN: Record<string, string> = { Now: "roughly this quarter", Next: "the following quarter", Later: "beyond that" };

function buildRoadmap(values: StepValues): RoadmapPayload {
  // Weeks are entered manually (no fixed cap), clamped to a sane 1..52 so a
  // stray large value cannot blow up the timeline grid. Per-item start/end weeks
  // below are clamped into this range.
  const weeks = Math.min(52, Math.max(1, Number(str(values, "weeks")) || 8));
  const tasks: RoadmapTask[] = rows(values, "tasks")
    .filter((t) => t.name?.trim())
    .map((t) => {
      const s = Math.min(weeks, Math.max(1, Number(t.startWeek) || 1));
      const e = Math.min(weeks, Math.max(s, Number(t.endWeek) || s));
      return {
        name: t.name ?? "", lane: t.lane?.trim() || "Lane", startWeek: s, endWeek: e,
        startDate: t.startDate?.trim() || undefined, endDate: t.endDate?.trim() || undefined,
      };
    });
  const lanes = [...new Set(tasks.map((t) => t.lane))];

  // Group the initiative rows into Now / Next / Later buckets, in that order.
  const byBucket = new Map<string, RoadmapItem[]>();
  rows(values, "items").filter((r) => r.initiative?.trim()).forEach((r) => {
    const bucket = r.bucket || "Now";
    if (!byBucket.has(bucket)) byBucket.set(bucket, []);
    byBucket.get(bucket)!.push({
      initiative: r.initiative ?? "",
      theme: r.theme?.trim() || undefined,
      note: r.note?.trim() || undefined,
      confidence: (r.confidence || "Medium") as RoadmapConfidence,
      size: (r.size || undefined) as RoadmapSize | undefined,
    });
  });
  const buckets: RoadmapBucket[] = RM_BUCKET_ORDER
    .filter((b) => byBucket.has(b))
    .map((b) => ({ name: b, span: RM_SPAN[b], items: byBucket.get(b)! }));

  return {
    skill: "roadmap",
    goal: str(values, "goal") || "Roadmap",
    horizon: str(values, "horizon"),
    confidence: str(values, "confidence") || "Near-term firm, later directional",
    nextReview: str(values, "nextReview") || undefined,
    buckets: buckets.length ? buckets : undefined,
    weeks, lanes, tasks,
    ...ROADMAP_STUB_EXTRAS,
  };
}

/**
 * Stub extras so the form path renders the narrative budget sections beyond the
 * computed baseline/forecast/verdict - the invoice-lag caveat, forecast
 * assumptions, known one-offs, burn rate, the movement line, variance drivers,
 * and actions. The seeded sample carries its own.
 */
const BUDGET_STUB_EXTRAS = {
  spentCaveat: "Finance extract trails invoicing by about two weeks, so spend to date may be understated.",
  forecastAssumptions: "Assumes the current team and burn rate hold, plus the known one-off below.",
  knownOneOffs: [{ item: "SendGrid annual licence", amount: 3000 }],
  avgBurnPerPeriod: 13625,
  burnPeriodLabel: "sprint",
  exhaustionDate: "2026-08-15",
  movement: "Forecast moved $54.5k to the current figure, verdict held, burn per sprint up slightly.",
  varianceDrivers: [
    { driver: "SendGrid licence one-off", effect: "+$3k", note: "Annual renewal due before launch" },
    { driver: "Scope-based projection ahead of plan", effect: "watch", note: "Spend is running ahead of scope completed" },
  ],
};

function buildBudget(values: StepValues): BudgetTrackerPayload {
  const originalBudget = Number(str(values, "budget")) || 0;
  const approvedChanges = Number(str(values, "approvedChanges")) || 0;
  const baseline = originalBudget + approvedChanges;
  const developers: BudgetDeveloper[] = rows(values, "developers")
    .filter((d) => d.name?.trim())
    .map((d) => {
      const hours = Number(d.hours) || 0;
      const rate = Number(d.rate) || 0;
      return { name: d.name ?? "", hours, rate, cost: hours * rate };
    });
  const spent = developers.reduce((s, d) => s + d.cost, 0);
  const committed = Number(str(values, "committed")) || 0;
  const scopePct = Number(str(values, "scopeComplete")) || 0;
  const timePct = Number(str(values, "timeElapsed")) || 0;
  const oneOffs = BUDGET_STUB_EXTRAS.knownOneOffs;
  const oneOffTotal = oneOffs.reduce((s, o) => s + o.amount, 0);
  // Run-rate = spend + committed + known one-offs; scope-based = spend / % scope complete.
  const runRateForecast = spent + committed + oneOffTotal;
  const scopeForecast = scopePct > 0 ? Math.round(spent / (scopePct / 100)) : undefined;
  const forecastAtCompletion = scopeForecast != null ? Math.max(scopeForecast, runRateForecast) : runRateForecast;
  const forecastMethod: "run-rate" | "scope-based" = scopeForecast != null && scopeForecast >= runRateForecast ? "scope-based" : "run-rate";
  const { verdict, rule } = budgetVerdict(baseline, forecastAtCompletion);
  const commercialModel = (str(values, "commercialModel") || undefined) as CommercialModel | undefined;
  // Actions are worded to the commercial model (numbers are identical across models).
  const overshoot = forecastAtCompletion > baseline;
  const actions = overshoot
    ? [{
        action: commercialModel === "fixed-price"
          ? "Escalate the margin risk internally with the account lead and open a scope conversation"
          : commercialModel === "retainer"
          ? "Review utilisation against scope with the sponsor"
          : "Have the sponsor conversation early and raise a change order if scope grew",
        owner: "PM", by: "This week",
      }]
    : [{ action: "No action needed, continue monitoring burn each sprint", owner: "PM", by: "Next report" }];
  return {
    skill: "budget-tracker", project: str(values, "project") || "This project", verdict, verdictRule: rule, commercialModel,
    originalBudget, approvedChanges: approvedChanges || undefined, approvedChangesRef: str(values, "approvedChangesRef") || undefined,
    approved: baseline, spent, spentCaveat: BUDGET_STUB_EXTRAS.spentCaveat, committed, remaining: baseline - spent,
    forecastAtCompletion, forecastMethod, runRateForecast, scopeForecast, forecastAssumptions: BUDGET_STUB_EXTRAS.forecastAssumptions, knownOneOffs: oneOffs,
    variance: baseline - forecastAtCompletion, timeElapsedPct: timePct, scopeCompletePct: scopePct,
    plannedStart: str(values, "plannedStart") || undefined, plannedEnd: str(values, "plannedEnd") || undefined,
    avgBurnPerPeriod: BUDGET_STUB_EXTRAS.avgBurnPerPeriod, burnPeriodLabel: BUDGET_STUB_EXTRAS.burnPeriodLabel, exhaustionDate: BUDGET_STUB_EXTRAS.exhaustionDate,
    movement: BUDGET_STUB_EXTRAS.movement, varianceDrivers: BUDGET_STUB_EXTRAS.varianceDrivers, actions,
    developers,
  };
}

function buildDecisionLog(values: StepValues): DecisionLogPayload {
  const entries: DecisionLogEntry[] = rows(values, "entries")
    .filter((r) => (r.originalPlan?.trim() || r.revisedPlan?.trim()))
    .map((r, idx) => ({
      id: `D-${String(idx + 1).padStart(3, "0")}`,
      date: r.date?.trim() || "[TBC]",
      title: r.title?.trim() || (r.revisedPlan?.trim() || "Decision").slice(0, 60),
      area: (r.area || "Scope") as DecisionLogEntry["area"],
      originalPlan: r.originalPlan || "-",
      revisedPlan: r.revisedPlan || "-",
      reason: r.reason || "-",
      changeProposedBy: r.changeProposedBy?.trim() || "-",
      deliveryImpact: r.deliveryImpact?.trim() || "-",
      technicalImpact: r.technicalImpact?.trim() || "-",
      productOwnerImpact: r.productOwnerImpact?.trim() || "-",
      costImpact: r.costImpact?.trim() || "-",
      changeStatus: (r.changeStatus || "Proposed") as ChangeStatus,
      changeApprovedBy: r.changeApprovedBy?.trim() || "[TBC]",
      supersedes: r.supersedes?.trim() || undefined,
      followUps: r.followUps?.trim() || undefined,
    }));
  // A decision that is not yet approved, or approved with no named approver, needs sign-off.
  const needsSignOff = entries.filter((e) =>
    e.changeStatus === "Proposed" || e.changeStatus === "Under Review" ||
    (e.changeStatus === "Approved" && e.changeApprovedBy === "[TBC]"));
  const signOffNudge = needsSignOff.length
    ? `${needsSignOff.map((e) => e.id).join(", ")} still ${needsSignOff.length > 1 ? "need" : "needs"} sign-off - name an approver and I can draft the approval ask.`
    : undefined;
  const discussed = rows(values, "discussed").map((r) => r.item).filter(Boolean) as string[];
  return {
    skill: "decision-log",
    project: str(values, "project") || "This project",
    preparedBy: str(values, "preparedBy") || undefined,
    version: str(values, "version") || undefined,
    entries,
    discussedNotDecided: discussed.length ? discussed : undefined,
    signOffNudge,
  };
}

function buildSprintReport(values: StepValues): SprintReportPayload {
  const committed = Number(str(values, "committed")) || 0;
  const completed = Number(str(values, "completed")) || 0;
  const totalDays = Number(str(values, "totalDays")) || 10;
  const day = Math.min(totalDays, Number(str(values, "day")) || 0);
  const closed = str(values, "mode") === "Closed";
  const status = (str(values, "status") || "amber") as RagStatus;
  // Blank or non-numeric confidence means not assessable - never a fabricated 0% or NaN.
  const confRaw = str(values, "confidence").trim();
  const confNum = Number(confRaw);
  const confidence = confRaw && Number.isFinite(confNum) ? confNum : undefined;
  const riskLevel = (str(values, "riskLevel") || undefined) as RiskLevel | undefined;
  const topRisks = rows(values, "topRisks").map((r) => r.risk).filter(Boolean) as string[];
  const remaining = Math.max(0, committed - completed);
  const burndown = [
    { day: 0, remaining: committed, ideal: committed },
    { day, remaining, ideal: Math.round(committed * (1 - day / Math.max(1, totalDays))) },
  ];
  const history = rows(values, "velocityHistory")
    .filter((r) => r.sprint?.trim() || r.points)
    .map((r) => ({ sprint: r.sprint?.trim() || "Sprint", points: Number(r.points) || 0 }));
  const velocityTrend = [...history, { sprint: "Now", points: completed }];
  // Assess on the exact mean, round only for display, so the band verdict is not flipped by rounding.
  const exactAverage = history.length ? history.reduce((s, h) => s + h.points, 0) / history.length : undefined;
  const trailingAverage = exactAverage != null ? Math.round(exactAverage * 10) / 10 : undefined;
  const velocityAssessment = exactAverage != null ? assessVelocity(committed, exactAverage) : undefined;
  const goal = str(values, "goal").trim() || undefined;
  const goalStatus: GoalStatus = goal ? (GOAL_STATUS_MAP[str(values, "goalStatus")] ?? "on-track") : "not-stated";
  const list = (name: string) => rows(values, name).map((r) => r.item).filter(Boolean) as string[];
  return {
    skill: "sprint-report", sprint: str(values, "sprint") || "Sprint", day, totalDays, closed, status,
    confidence, riskLevel, forecast: str(values, "forecast"), committed, completed,
    goal, goalStatus, trailingAverage, velocityAssessment, velocityTrend, burndown, topRisks,
    summary: str(values, "summary") || undefined,
    movement: str(values, "movement") || undefined,
    priorities: list("priorities"),
    actionsToday: closed ? undefined : list("actionsToday"),
    standupQuestions: closed ? undefined : list("standup"),
    carryover: closed ? list("carryover") : undefined,
    nextSprintImplications: closed ? (str(values, "nextSprintImplications") || undefined) : undefined,
    leadershipUpdate: str(values, "leadershipUpdate") || undefined,
  };
}

/**
 * Generic document builder: turns a text skill's schema + values into titled
 * card sections (DocumentView renders them). Scalars become a label/value grid,
 * textareas become paragraphs, single-field lists become bullets, multi-field
 * lists become tables, and tags become chips.
 */
function buildDoc(step: OnbStep, values: StepValues): DocPayload {
  const sections: DocSection[] = [];
  let pending: { label: string; value: string }[] = [];
  let status: DocPayload["status"];
  const flush = () => { if (pending.length) { sections.push({ kind: "fields", pairs: pending }); pending = []; } };

  for (const f of step.fields) {
    if (f.kind === "text" || f.kind === "select") {
      const v = str(values, f.name).trim();
      if (!v) continue;
      // previousStatus is consumed by the status banner (the trend), not rendered as a field.
      if (step.id === "stakeholder-update" && f.name === "previousStatus") continue;
      if (step.id === "stakeholder-update" && f.name === "status") {
        const RANK: Record<string, number> = { "On track": 0, "At risk": 1, "Off track": 2 };
        const prev = str(values, "previousStatus").trim();
        let label = v;
        if (prev && prev !== v && RANK[v] != null && RANK[prev] != null) {
          label = `${v}, ${RANK[v] > RANK[prev] ? "down from" : "up from"} ${prev}`;
        } else if (prev && prev === v) {
          label = `${v}, held`;
        }
        status = { label, tone: v === "On track" ? "success" : v === "Off track" ? "danger" : "warning" };
        continue;
      }
      pending.push({ label: f.label, value: v });
    } else if (f.kind === "textarea") {
      const v = str(values, f.name).trim();
      if (!v) continue;
      flush();
      sections.push({ kind: "text", heading: f.label, body: v });
    } else if (f.kind === "tags") {
      const arr = tags(values, f.name);
      if (!arr.length) continue;
      flush();
      sections.push({ kind: "tags", heading: f.label, items: arr });
    } else if (f.kind === "list") {
      const lf = f as ListField;
      const list = rows(values, f.name).filter((r) => Object.values(r).some((x) => String(x ?? "").trim()));
      if (!list.length) continue;
      flush();
      if (lf.itemFields.length === 1) {
        const key = lf.itemFields[0]?.name;
        if (key) sections.push({ kind: "bullets", heading: f.label, items: list.map((r) => r[key] ?? "").filter(Boolean) });
      } else {
        sections.push({
          kind: "rows", heading: f.label,
          columns: lf.itemFields.map((itf: ScalarField) => itf.label),
          rows: list.map((r) => lf.itemFields.map((itf: ScalarField) => r[itf.name] ?? "")),
        });
      }
    }
  }
  flush();
  return { skill: step.id as DocSkill, status, sections };
}

/** Markdown fallback for steps without a bespoke visual view. */
function buildMarkdown(step: OnbStep, values: StepValues): string {
  let md = `## ${step.title}\n\n`;
  for (const f of step.fields) {
    if (f.kind === "epics") {
      md += `**${f.label}**\n\n`;
      for (const e of epicGroups(values, f.name)) {
        md += `### ${e.name || "Epic"}\n`;
        for (const s of e.stories ?? []) {
          if (!s.title?.trim()) continue;
          md += `- **${s.title}**${s.points ? ` (${s.points})` : ""}${s.status ? ` [${s.status}]` : ""}\n`;
          if (s.asA || s.iWant || s.soThat) md += `  As a ${s.asA || "user"}, I want to ${s.iWant || s.title}${s.soThat ? `, so that ${s.soThat}` : ""}\n`;
          for (const c of (s.criteria ?? "").split("\n").map((x) => x.trim()).filter(Boolean)) md += `  - ${c}\n`;
        }
        md += "\n";
      }
    } else if (f.kind === "tags") {
      md += `**${f.label}:** ${tags(values, f.name).join(", ") || "-"}\n\n`;
    } else if (f.kind === "list") {
      md += `**${f.label}**\n\n`;
      for (const row of rows(values, f.name)) {
        const cells = f.itemFields.map((itf) => row[itf.name]).filter(Boolean);
        if (cells.length) md += `- ${cells.join(" - ")}\n`;
      }
      md += "\n";
    } else {
      md += `**${f.label}:** ${str(values, f.name) || "-"}\n\n`;
    }
  }
  return md;
}

/** True when every field is blank - the section is empty / skipped. */
function valuesEmpty(step: OnbStep, values: StepValues): boolean {
  return step.fields.every((f) => {
    const v = values[f.name];
    if (f.kind === "list") return !(Array.isArray(v) && (v as Row[]).some((r) => Object.values(r).some((x) => String(x ?? "").trim())));
    if (f.kind === "epics") return !(Array.isArray(v) && (v as EpicGroup[]).some((e) => (e.name ?? "").trim() || (e.stories ?? []).some((s) => Object.values(s).some((x) => String(x ?? "").trim()))));
    if (f.kind === "tags") return !(Array.isArray(v) && (v as string[]).length > 0);
    return !String(v ?? "").trim();
  });
}

/** Build a live artifact for a step from its current structured values. */
export function buildExecution(step: OnbStep, values: StepValues, clientId: string, projectId: string): SkillExecution {
  const request = { skill: step.id as SkillId, clientId, projectId, input: "" };
  // Empty section -> no markdown, no payload, so the canvas shows a clean
  // empty state instead of bare headers and zeroed charts.
  if (valuesEmpty(step, values)) {
    return { id: `onb-${step.id}`, request, status: "complete", markdown: "" };
  }
  const wrap = (payload?: SkillExecution["payload"]): SkillExecution => ({
    id: `onb-${step.id}`,
    request,
    status: "complete",
    markdown: buildMarkdown(step, values),
    payload,
  });
  switch (step.id) {
    case "risk-scan": return wrap(buildRiskScan(values));
    case "stories": return wrap(buildStories(values));
    case "release-checklist": return wrap(buildRelease(values));
    case "sprint-planning": return wrap(buildSprintPlan(values));
    case "roadmap": return wrap(buildRoadmap(values));
    case "budget-tracker": return wrap(buildBudget(values));
    case "decision-log": return wrap(buildDecisionLog(values));
    case "sprint-report": return wrap(buildSprintReport(values));
    default: return wrap(buildDoc(step, values));
  }
}
