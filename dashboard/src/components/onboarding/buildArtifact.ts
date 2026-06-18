import type {
  SkillExecution, SkillId, RagStatus, Priority, HML, Detectability, Velocity,
  RiskScanPayload, RiskEntry, RiskMatrixPoint, RiskAssumption, RiskDecision, Recommendation,
  StoriesPayload,
  ReleaseChecklistPayload, ReleaseCategory, ReleaseCategoryId, ChecklistItem, ChecklistStatus, ChecklistTally, ReleaseVerdict,
  SprintPlanPayload, BacklogItem, BacklogPriority, CapacityRow,
  RoadmapPayload, RoadmapTask,
  BudgetTrackerPayload, BudgetDeveloper,
  DecisionLogPayload, DecisionLogEntry, ChangeStatus,
  SprintReportPayload,
  DocPayload, DocSection, DocSkill,
} from "@/types/pm";
import type { EpicGroup, ListField, OnbStep, Row, ScalarField, StepValues } from "./steps";

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
      const priority = PRIORITY_FROM_LABEL[r.priority] ?? derivePriority(likelihood, impact);
      return {
        ref: `R${idx + 1}`, risk: r.risk,
        category: (r.category || "Delivery") as RiskEntry["category"],
        likelihood, impact,
        detectability: (r.detectability || "Moderate") as Detectability,
        velocity: (r.velocity || "Medium") as Velocity,
        priority, owner: r.owner?.trim() || "Unassigned",
        response: (r.response || "Mitigate") as RiskEntry["response"],
        proximity: (r.proximity || undefined) as RiskEntry["proximity"],
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
          title: s.title,
          asA: s.asA?.trim() || undefined,
          iWant: s.iWant?.trim() || undefined,
          soThat: s.soThat?.trim() || undefined,
          points: s.points ? Number(s.points) : undefined,
          status: s.status || undefined,
          acceptanceCriteria: (s.criteria ?? "").split("\n").map((x) => x.trim()).filter(Boolean),
        })),
    }));
  return { skill: "stories", epics };
}

const CAT_ID: Record<string, ReleaseCategoryId> = {
  "Feature Readiness": "feature-readiness", "Testing": "testing", "Operational Readiness": "operational-readiness",
  "Communications": "communications", "Dependencies": "dependencies", "Approvals": "approvals", "Post-Release Readiness": "post-release-readiness",
};

function buildRelease(values: StepValues): ReleaseChecklistPayload {
  const tally: ChecklistTally = { PASS: 0, FAIL: 0, RISK: 0, UNCONFIRMED: 0, "N/A": 0 };
  const byCat = new Map<string, ChecklistItem[]>();
  const blockers: { ref: string; label: string; owner: string }[] = [];
  rows(values, "items").filter((r) => r.item?.trim()).forEach((r, idx) => {
    const status = (r.status || "UNCONFIRMED") as ChecklistStatus;
    tally[status]++;
    const cat = r.category || "Feature Readiness";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push({ ref: `I${idx + 1}`, label: r.item, status, note: r.note?.trim() || undefined });
    if (status === "FAIL" || status === "UNCONFIRMED") blockers.push({ ref: `I${idx + 1}`, label: r.item, owner: "PM" });
  });
  const categories: ReleaseCategory[] = [...byCat.entries()].map(([title, items]) => ({
    id: CAT_ID[title] ?? "feature-readiness", title, items,
  }));
  const verdict: ReleaseVerdict = tally.FAIL > 0 ? "NO-GO" : (tally.RISK > 0 || tally.UNCONFIRMED > 0) ? "CONDITIONAL GO" : "GO";
  const releaseType = (str(values, "releaseType") || "planned") as ReleaseChecklistPayload["releaseType"];
  return {
    skill: "release-checklist", release: str(values, "release") || "This release", releaseType,
    targetDate: str(values, "targetDate") || undefined, categories, tally, blockers, verdict,
    verdictRationale: verdict === "GO" ? "All checks passed."
      : verdict === "NO-GO" ? "Resolve the failing items before shipping."
      : "Clear the open risks / unconfirmed items first.",
  };
}

function buildSprintPlan(values: StepValues): SprintPlanPayload {
  const capacity: CapacityRow[] = rows(values, "team")
    .filter((t) => t.person?.trim())
    .map((t) => ({
      person: t.person, availableDays: Number(t.availableDays) || 0, workingDays: Number(t.availableDays) || 0,
      usableCapacity: Number(t.points) || 0, notes: t.notes?.trim() || undefined,
    }));
  const usableCapacity = capacity.reduce((s, c) => s + c.usableCapacity, 0);
  const backlog: BacklogItem[] = rows(values, "backlog")
    .filter((r) => r.item?.trim())
    .map((r) => ({
      priority: (r.priority || "P1") as BacklogPriority, item: r.item,
      estimate: Number(r.points) || 0, owner: r.owner?.trim() || "Team",
      dependencies: r.dependencies?.trim() || undefined, isStretch: r.priority === "P2",
    }));
  const plannedLoad = backlog.filter((b) => b.priority !== "P2").reduce((s, b) => s + b.estimate, 0);
  const loadRatio = usableCapacity > 0 ? plannedLoad / usableCapacity : 0;
  return {
    skill: "sprint-planning", sprint: { number: 1, goal: "Sprint 1" },
    capacity, usableCapacity, backlog, plannedLoad, loadRatio,
    capacityThreshold: { min: 0.7, max: 0.8 }, overcommitted: loadRatio > 0.8,
  };
}

function buildRoadmap(values: StepValues): RoadmapPayload {
  const weeks = Number(str(values, "weeks")) || 8;
  const tasks: RoadmapTask[] = rows(values, "tasks")
    .filter((t) => t.name?.trim())
    .map((t) => {
      const s = Math.min(weeks, Math.max(1, Number(t.startWeek) || 1));
      const e = Math.min(weeks, Math.max(s, Number(t.endWeek) || s));
      return {
        name: t.name, lane: t.lane?.trim() || "Lane", startWeek: s, endWeek: e,
        startDate: t.startDate?.trim() || undefined, endDate: t.endDate?.trim() || undefined,
      };
    });
  const lanes = [...new Set(tasks.map((t) => t.lane))];
  return { skill: "roadmap", goal: str(values, "goal") || "Roadmap", horizon: str(values, "horizon"), weeks, lanes, tasks };
}

function buildBudget(values: StepValues): BudgetTrackerPayload {
  const approved = Number(str(values, "budget")) || 0;
  const developers: BudgetDeveloper[] = rows(values, "developers")
    .filter((d) => d.name?.trim())
    .map((d) => {
      const hours = Number(d.hours) || 0;
      const rate = Number(d.rate) || 0;
      return { name: d.name, hours, rate, cost: hours * rate };
    });
  const spent = developers.reduce((s, d) => s + d.cost, 0);
  const remaining = approved - spent;
  const verdict: RagStatus = spent > approved ? "red" : spent > approved * 0.85 ? "amber" : "green";
  return {
    skill: "budget-tracker", project: str(values, "project") || "This project", verdict,
    approved, spent, committed: 0, remaining, forecastAtCompletion: spent, variance: remaining,
    timeElapsedPct: 0, scopeCompletePct: 0, developers,
  };
}

function buildDecisionLog(values: StepValues): DecisionLogPayload {
  const entries: DecisionLogEntry[] = rows(values, "entries")
    .filter((r) => (r.originalPlan?.trim() || r.revisedPlan?.trim()))
    .map((r) => ({
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
    }));
  return { skill: "decision-log", project: str(values, "project") || "This project", entries };
}

function buildSprintReport(values: StepValues): SprintReportPayload {
  const committed = Number(str(values, "committed")) || 0;
  const completed = Number(str(values, "completed")) || 0;
  const totalDays = Number(str(values, "totalDays")) || 10;
  const day = Math.min(totalDays, Number(str(values, "day")) || 0);
  const status = (str(values, "status") || "amber") as RagStatus;
  const confidence = Number(str(values, "confidence")) || 0;
  const topRisks = rows(values, "topRisks").map((r) => r.risk).filter(Boolean) as string[];
  const remaining = Math.max(0, committed - completed);
  const burndown = [
    { day: 0, remaining: committed, ideal: committed },
    { day, remaining, ideal: Math.round(committed * (1 - day / Math.max(1, totalDays))) },
  ];
  const velocityTrend = [{ sprint: "Prev", points: 0 }, { sprint: "Now", points: completed }];
  const list = (name: string) => rows(values, name).map((r) => r.item).filter(Boolean) as string[];
  return {
    skill: "sprint-report", sprint: str(values, "sprint") || "Sprint", day, totalDays, status, confidence,
    forecast: str(values, "forecast"), committed, completed, velocityTrend, burndown, topRisks,
    summary: str(values, "summary") || undefined,
    priorities: list("priorities"),
    actionsToday: list("actionsToday"),
    standupQuestions: list("standup"),
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
      if (step.id === "stakeholder-update" && f.name === "status") {
        status = { label: v, tone: v === "On track" ? "success" : v === "Off track" ? "danger" : "warning" };
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
        const key = lf.itemFields[0].name;
        sections.push({ kind: "bullets", heading: f.label, items: list.map((r) => r[key]).filter(Boolean) });
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
