/**
 * Generates rich, table-based markdown from a structured SkillExecution payload,
 * suitable for publishing to Confluence (or any markdown-aware destination).
 *
 * Falls back to execution.markdown for skills without a structured payload.
 */
import type {
  SkillExecution,
  ArtifactPayload,
  RiskScanPayload,
  ReleaseChecklistPayload,
  DecisionLogPayload,
  SprintPlanPayload,
  SprintReportPayload,
  BudgetTrackerPayload,
  RoadmapPayload,
  StoriesPayload,
  BacklogEstimate,
  DocPayload,
} from "@/types/pm";
import { sprintLoadBreakdown } from "@/lib/sprint";

/* ── helpers ───────────────────────────────────────────────────────────── */

/** Build a pipe-delimited markdown table. */
function table(headers: string[], rows: unknown[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(cell).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}`;
}

/** Escape pipe characters so they don't break table cells. */
function cell(v: unknown): string {
  return String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ") || "-";
}

/** A bulleted block under a bold label, or empty when the list is empty. */
function bulletBlock(label: string, items?: string[]): string {
  return items && items.length ? `**${label}**\n${items.map((x) => `- ${x}`).join("\n")}\n\n` : "";
}

const PRIORITY_LABEL: Record<string, string> = {
  "act-now": "Act Now", monitor: "Monitor", contingency: "Contingency", log: "Log",
};
// Plain text RAG - no emoji (house style, and emoji paste badly into steering packs).
const RAG_LABEL: Record<string, string> = { red: "Red", amber: "Amber", green: "Green" };
const sizeLabel = (e: BacklogEstimate) => (typeof e === "number" ? `${e}` : e);
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const signedMoney = (n: number) => `${n < 0 ? "-" : "+"}${money(Math.abs(n))}`;
const MODEL_LABEL: Record<string, string> = { "fixed-price": "Fixed price", "time-and-materials": "T&M", retainer: "Retainer" };

/* ── per-skill renderers ───────────────────────────────────────────────── */

function renderRiskScan(p: RiskScanPayload): string {
  let md = `# Risk Scan\n\n`;
  md += `**Project:** ${p.project} | **Phase:** ${p.phase} | **Verdict:** ${RAG_LABEL[p.verdict] ?? p.verdict}\n\n`;
  if (p.recommendation) md += `**Recommendation:** ${p.recommendation}\n\n`;
  md += `## Risk Register\n\n`;
  md += table(
    ["Ref", "Risk", "Category", "Likelihood", "Impact", "Detectability", "Velocity", "Priority", "Owner", "Response"],
    p.register.map((r) => [
      r.ref, r.risk, r.category, r.likelihood, r.impact,
      r.detectability, r.velocity, PRIORITY_LABEL[r.priority] ?? r.priority, r.owner, r.response,
    ]),
  );
  md += "\n\n";
  if (p.topRisksDetail?.length) {
    md += `## Top Risks - Detail\n\n`;
    md += table(
      ["Ref", "Risk", "Root cause", "Why exposed", "Trigger signal", "Exposure", "Action"],
      p.topRisksDetail.map((r) => [r.ref, r.name, r.rootCause, r.whyExposed, r.triggerSignal, r.exposure, r.action]),
    );
    md += "\n\n";
  }
  if (p.mitigationActions?.length) {
    md += `## Mitigation Next Actions\n\n`;
    md += table(["Ref", "Action"], p.mitigationActions.map((m) => [m.ref, m.action]));
    md += "\n\n";
  }
  if (p.validationExperiments?.length) {
    md += `## Validation Experiments\n\n`;
    md += table(["Ref", "Experiment", "Testing", "Learning", "By"], p.validationExperiments.map((e) => [e.ref, e.experiment, e.testing, e.learning, e.by]));
    md += "\n\n";
  }
  if (p.decisionsNeeded?.length) {
    md += `## Decisions Needed\n\n`;
    md += table(["Decision", "Owner", "By", "Impact if delayed"], p.decisionsNeeded.map((d) => [d.decision, d.owner, d.by, d.impactIfDelayed]));
    md += "\n\n";
  }
  if (p.assumptions?.length) {
    md += `## Key Assumptions\n\n`;
    md += table(["Assumption", "Confidence", "Risk if wrong"], p.assumptions.map((a) => [a.assumption, a.confidence, a.riskIfWrong]));
    md += "\n\n";
  }
  if (p.notAssessed && (p.notAssessed.critical.length || p.notAssessed.secondary.length)) {
    md += `## Not Assessed\n\n`;
    md += bulletBlock("Critical", p.notAssessed.critical) + bulletBlock("Secondary", p.notAssessed.secondary);
  }
  if (p.stakeholderSummary) md += `## Stakeholder Summary\n\n${p.stakeholderSummary}\n\n`;
  if (p.prioritisationReasoning) md += `## Prioritisation Reasoning\n\n${p.prioritisationReasoning}\n\n`;
  md += bulletBlock("Conditions", p.conditions);
  if (p.changesSinceLastScan) {
    const c = p.changesSinceLastScan;
    md += `## Changes Since Last Scan\n\n`;
    md += bulletBlock("Added", c.added) + bulletBlock("Escalated", c.escalated)
      + bulletBlock("De-escalated", c.deEscalated) + bulletBlock("Closed", c.closed);
    if (c.nextReview) md += `**Next review:** ${c.nextReview}\n\n`;
  }
  return md;
}

function renderReleaseChecklist(p: ReleaseChecklistPayload): string {
  let md = `# Release Checklist\n\n`;
  md += `**Release:** ${p.release} | **Type:** ${p.releaseType}`;
  if (p.targetDate) md += ` | **Target date:** ${p.targetDate}`;
  md += `\n\n**Verdict:** ${p.verdict} - ${p.verdictRationale}\n\n`;

  if (p.delta?.length) {
    md += `## Since Last Assessment\n\n`;
    md += table(["Ref", "Item", "Was", "Now", "What changed"], p.delta.map((d) => [d.ref, d.item, d.was, d.now, d.change]));
    md += "\n\n";
    if (p.verdictMovement) md += `${p.verdictMovement}\n\n`;
  }

  md += `## Summary\n\n`;
  md += table(["PASS", "FAIL", "RISK", "UNCONFIRMED", "N/A"], [[p.tally.PASS, p.tally.FAIL, p.tally.RISK, p.tally.UNCONFIRMED, p.tally["N/A"]].map(String)]);
  md += "\n\n";

  if (p.blockers.length) {
    md += `## Blockers\n\n`;
    md += table(["Ref", "Item", "Owner", "Due"], p.blockers.map((b) => [b.ref, b.label, b.owner, b.due ?? "-"]));
    md += "\n\n";
  }
  if (p.conditions?.length) {
    md += `## Conditions\n\n`;
    md += table(["Ref", "Item", "Owner", "Due"], p.conditions.map((c) => [c.ref, c.label, c.owner, c.due ?? "-"]));
    md += "\n\n";
  }
  if (p.chaseList?.length) {
    md += `## Confirmation Chase List\n\n`;
    for (const g of p.chaseList) {
      md += `**${g.owner}**\n${g.questions.map((q) => `- ${q.ref} ${q.question}${q.leadTime ? " (lead time)" : ""}`).join("\n")}\n\n`;
    }
  }
  for (const cat of p.categories) {
    if (!cat.items.length) continue;
    md += `## ${cat.title}\n\n`;
    md += table(["Ref", "Item", "Status", "Owner", "Note"], cat.items.map((i) => [i.ref, i.label, i.status, i.owner ?? "-", i.note ?? ""]));
    md += "\n\n";
  }
  if (p.pathToGo) {
    md += `## Path to GO\n\n`;
    md += bulletBlock("Resolvable before the date", p.pathToGo.resolvable);
    md += bulletBlock("Descope options", p.pathToGo.descopeOptions);
    md += `**Reduced release:** ${p.pathToGo.reducedRelease}\n\n`;
    md += `**Verdict under reduced scope:** ${p.pathToGo.verdictUnderReducedScope}\n\n`;
  }
  return md;
}

function renderDecisionLog(p: DecisionLogPayload): string {
  let md = `# Decision Log\n\n`;
  const meta = [p.version && `Version ${p.version}`, p.lastUpdated && `updated ${p.lastUpdated}`, p.preparedBy && `prepared by ${p.preparedBy}`].filter(Boolean);
  md += `**Project:** ${p.project}${meta.length ? ` | ${meta.join(" | ")}` : ""}\n\n`;
  if (p.signOffNudge) md += `> ${p.signOffNudge}\n\n`;

  md += `## Index\n\n`;
  md += table(
    ["ID", "Date", "Area", "Decision", "Status", "Approved By"],
    p.entries.map((e) => [e.id ?? "-", e.date ?? "-", e.area, e.title ?? e.revisedPlan, e.changeStatus, e.changeApprovedBy]),
  );
  md += "\n\n";

  for (const e of p.entries) {
    md += `## ${e.id ? `${e.id} - ` : ""}${e.title ?? e.revisedPlan}\n\n`;
    md += table(["Field", "Value"], [
      ["Original plan", e.originalPlan], ["Revised plan", e.revisedPlan], ["Reason", e.reason],
      ["Proposed by", e.changeProposedBy], ["Delivery impact", e.deliveryImpact], ["Technical impact", e.technicalImpact],
      ["Product owner impact", e.productOwnerImpact], ["Cost impact", e.costImpact], ["Status", e.changeStatus], ["Approved by", e.changeApprovedBy],
      ...(e.supersedes ? [["Supersedes", e.supersedes]] : []),
      ...(e.followUps ? [["Follow-ups", e.followUps]] : []),
    ]);
    md += "\n\n";
  }
  md += bulletBlock("Discussed, not decided", p.discussedNotDecided);
  return md;
}

function renderSprintPlan(p: SprintPlanPayload): string {
  let md = `# Sprint Planning - ${p.sprint.name ?? `Sprint ${p.sprint.number}`}\n\n`;
  md += `**Goal:** ${p.sprint.goal}\n\n`;
  if (p.sprint.startDate || p.sprint.endDate) md += `**Dates:** ${p.sprint.startDate ?? "?"} to ${p.sprint.endDate ?? "?"}\n\n`;
  const loadPct = Math.round(p.loadRatio * 100);
  md += `**Usable capacity:** ${p.usableCapacity} pts | **Planned load:** ${p.plannedLoad} pts | **Load:** ${loadPct}%${p.overcommitted ? " (over-committed)" : ""}\n\n`;
  if (p.velocity) md += `**Velocity anchor:** last ${p.velocity.sprints} sprints averaged ${p.velocity.averagePoints} points\n\n`;

  md += `## Team Capacity\n\n`;
  md += table(["Person", "Available Days", "Usable Capacity (pts)", "Notes"], p.capacity.map((c) => [c.person, `${c.availableDays} of ${c.workingDays}`, c.usableCapacity, c.notes ?? ""]));
  md += "\n\n";

  const load = sprintLoadBreakdown(p.capacity, p.backlog);
  md += `## Per-person Load\n\n`;
  md += table(["Person", "Committed", "With stretch", "Load %"], load.perPerson.map((x) => [x.person, x.committed, x.withStretch, x.capacity > 0 ? `${x.pct}%${x.stretchPct > x.pct ? ` (${x.stretchPct}% with stretch)` : ""}` : "over capacity"]));
  md += "\n\n";

  md += `## Backlog\n\n`;
  md += table(["Priority", "Item", "Estimate", "Owner", "Dependencies", "Stretch"], p.backlog.map((b) => [b.priority, b.item, sizeLabel(b.estimate), b.owner, b.dependencies ?? "", b.isStretch ? "Yes" : "No"]));
  md += "\n\n";

  if (p.carryover?.length) {
    md += `## Carryover\n\n`;
    md += table(["Item", "Original", "Est", "Remaining", "Reason", "Re-committed"], p.carryover.map((c) => [c.item, c.originalSprint, c.originalEstimate, c.remainingEffort, c.reason, c.reCommitted ? "Yes" : "No"]));
    md += "\n\n";
  }
  if (p.dependencies?.length) {
    md += `## Dependencies\n\n`;
    md += table(["Item", "Depends on", "Owner", "Status", "Risk if blocked"], p.dependencies.map((d) => [d.item, d.dependsOn, d.owner, d.status, d.riskIfBlocked]));
    md += "\n\n";
  }
  if (p.risks?.length) {
    md += `## Risks\n\n`;
    md += table(["Risk", "Impact", "Mitigation"], p.risks.map((r) => [r.risk, r.impact, r.mitigation]));
    md += "\n\n";
  }
  if (p.definitionOfDone?.items.length) {
    md += `## Definition of Done${p.definitionOfDone.proposed ? " (proposed, confirm with team)" : ""}\n\n`;
    md += p.definitionOfDone.items.map((x) => `- ${x}`).join("\n") + "\n\n";
  }
  if (p.keyDates?.length) {
    md += `## Key Dates\n\n`;
    md += table(["Date", "Event"], p.keyDates.map((k) => [k.date, k.event]));
    md += "\n";
  }
  return md;
}

function renderSprintReport(p: SprintReportPayload): string {
  let md = `# Sprint Report - ${p.sprint}\n\n`;
  const conf = p.confidence != null ? `${p.confidence}%` : "Not assessable";
  md += `**${p.closed ? "Close-out" : `Day ${p.day} / ${p.totalDays}`}** | **Status:** ${RAG_LABEL[p.status] ?? p.status} | **Confidence:** ${conf}`;
  if (p.riskLevel) md += ` | **Risk:** ${p.riskLevel}`;
  md += `\n\n**${p.closed ? "Actuals" : "Forecast"}:** ${p.forecast}\n\n`;
  if (p.velocityAssessment) md += `**Velocity:** committed ${p.committed}${p.trailingAverage != null ? ` vs ~${p.trailingAverage} trailing average` : ""} - ${p.velocityAssessment.replace("-", " ")}\n\n`;
  if (p.goalStatus) md += `**Sprint goal:** ${p.goal ?? "not stated in input"} - ${p.goalStatus.replace("-", " ")}\n\n`;
  if (p.movement) md += `**Since last report:** ${p.movement}\n\n`;

  md += `## Progress\n\n`;
  md += table(["Metric", "Value"], [["Committed", p.committed], ["Completed", p.completed], ["Remaining", Math.max(0, p.committed - p.completed)]].map(([k, v]) => [String(k), String(v)]));
  md += "\n\n";

  if (p.summary) md += `## Summary\n\n${p.summary}\n\n`;
  if (p.priorities?.length) md += `## Priorities\n\n${p.priorities.map((x) => `- ${x}`).join("\n")}\n\n`;
  if (p.topRisks?.length) md += `## Top Risks\n\n${p.topRisks.map((x) => `- ${x}`).join("\n")}\n\n`;
  if (p.actionsToday?.length) md += `## Actions Today\n\n${p.actionsToday.map((x) => `- ${x}`).join("\n")}\n\n`;
  if (p.standupQuestions?.length) md += `## Questions for Standup\n\n${p.standupQuestions.map((x) => `- ${x}`).join("\n")}\n\n`;
  if (p.carryover?.length) md += `## Carry-over and Next Sprint\n\n${p.carryover.map((x) => `- ${x}`).join("\n")}\n\n`;
  if (p.nextSprintImplications) md += `## Next Sprint Implications\n\n${p.nextSprintImplications}\n\n`;
  if (p.velocityTrend?.length) {
    md += `## Velocity Trend\n\n`;
    md += table(["Sprint", "Points"], p.velocityTrend.map((v) => [v.sprint, v.points]));
    md += "\n\n";
  }
  if (p.leadershipUpdate) md += `## Leadership Update\n\n${p.leadershipUpdate}\n`;
  return md;
}

function renderBudgetTracker(p: BudgetTrackerPayload): string {
  let md = `# Budget Tracker\n\n`;
  md += `**Project:** ${p.project} | **Verdict:** ${RAG_LABEL[p.verdict] ?? p.verdict}`;
  if (p.commercialModel) md += ` | **Model:** ${MODEL_LABEL[p.commercialModel] ?? p.commercialModel}`;
  md += `\n\n`;
  if (p.verdictRule) md += `**Verdict rule:** ${p.verdictRule}\n\n`;
  if (p.movement) md += `**Since last report:** ${p.movement}\n\n`;

  md += `## Summary\n\n`;
  const rows: string[][] = [];
  if (p.approvedChanges != null) {
    rows.push(["Original budget", money(p.originalBudget ?? 0)]);
    rows.push(["Approved changes", `${money(p.approvedChanges)}${p.approvedChangesRef ? ` (${p.approvedChangesRef})` : ""}`]);
    rows.push(["Current baseline", money(p.approved)]);
  } else {
    rows.push(["Approved budget", money(p.approved)]);
  }
  rows.push(["Spent to date", `${money(p.spent)}${p.spentCaveat ? ` (${p.spentCaveat})` : ""}`]);
  rows.push(["Committed (unbilled)", money(p.committed)]);
  rows.push(["Remaining", money(p.remaining)]);
  if (p.scopeCompletePct || p.timeElapsedPct) rows.push(["Work complete", `${p.scopeCompletePct}% scope / ${p.timeElapsedPct}% time`]);
  rows.push(["Forecast at completion", `${money(p.forecastAtCompletion)}${p.forecastMethod ? ` (${p.forecastMethod})` : ""}`]);
  // Show both forecasts when they materially diverge (matches the on-screen view).
  if (p.runRateForecast != null && p.scopeForecast != null && Math.abs(p.runRateForecast - p.scopeForecast) > p.approved * 0.02) {
    rows.push(["Run-rate forecast", money(p.runRateForecast)]);
    rows.push(["Scope-based forecast", money(p.scopeForecast)]);
  }
  rows.push(["Variance vs baseline", signedMoney(p.variance)]);
  md += table(["Metric", "Value"], rows);
  md += "\n\n";
  if (p.forecastAssumptions) md += `${p.forecastAssumptions}\n\n`;
  if (p.knownOneOffs?.length) md += `**Known one-offs:** ${p.knownOneOffs.map((o) => `${o.item} (${money(o.amount)})`).join(", ")}\n\n`;
  if (p.avgBurnPerPeriod != null) {
    md += `## Burn Rate\n\n- ${money(p.avgBurnPerPeriod)} per ${p.burnPeriodLabel ?? "period"}\n`;
    if (p.exhaustionDate) md += `- Budget exhausts ${p.exhaustionDate}${p.plannedEnd ? ` vs planned end ${p.plannedEnd}` : ""}\n`;
    md += "\n";
  }
  if (p.developers?.length) {
    md += `## Developer Cost Breakdown\n\n`;
    md += table(["Name", "Hours", "Rate ($/hr)", "Cost"], p.developers.map((d) => [d.name, d.hours, `$${d.rate}`, money(d.cost)]));
    md += "\n\n";
  }
  if (p.varianceDrivers?.length) {
    md += `## Variance Drivers\n\n`;
    md += table(["Driver", "Effect", "Note"], p.varianceDrivers.map((v) => [v.driver, v.effect, v.note ?? "-"]));
    md += "\n\n";
  }
  if (p.actions?.length) {
    md += `## Actions\n\n`;
    md += table(["Action", "Owner", "By When"], p.actions.map((a) => [a.action, a.owner, a.by ?? "-"]));
    md += "\n";
  }
  return md;
}

function renderRoadmap(p: RoadmapPayload): string {
  let md = `# Roadmap\n\n`;
  const meta = [`**Goal:** ${p.goal}`, p.horizon && `**Horizon:** ${p.horizon}`, p.confidence && `**Confidence:** ${p.confidence}`, p.nextReview && `**Next review:** ${p.nextReview}`].filter(Boolean);
  md += `${meta.join(" | ")}\n\n`;

  if (p.changesSince?.changes.length) {
    md += `## Changes since ${p.changesSince.date}\n\n${p.changesSince.changes.map((c) => `- ${c}`).join("\n")}\n\n`;
  }
  if (p.hardCommitments?.length) {
    md += `## Hard Commitments\n\n`;
    md += table(["Commitment", "Fixed date", "Sits in"], p.hardCommitments.map((c) => [c.commitment, c.date, c.sitsIn]));
    md += "\n\n";
  }
  if (p.capacityFlag) md += `> ${p.capacityFlag}\n\n`;

  for (const b of p.buckets ?? []) {
    md += `## ${b.name}${b.span ? ` (${b.span})` : ""}\n\n`;
    md += table(["Initiative", "Theme", "Notes", "Confidence", "Size"], b.items.map((it) => [it.initiative, it.theme ?? "-", it.note ?? "-", it.confidence, it.size ?? "-"]));
    md += "\n\n";
  }
  md += bulletBlock("Dependencies & Sequencing", p.dependencies);
  md += bulletBlock("Out of Scope / Not Now", p.notNow);
  md += bulletBlock("Assumptions", p.assumptions);
  if (p.tasks.length) {
    md += `## Timeline\n\n`;
    md += table(["Lane", "Item", "Start Week", "End Week", "Start Date", "End Date"], p.tasks.map((t) => [t.lane, t.name, t.startWeek, t.endWeek, t.startDate ?? "-", t.endDate ?? "-"]));
    md += "\n";
  }
  return md;
}

function renderStories(p: StoriesPayload): string {
  let md = `# User Stories\n\n`;
  if (p.coverageNote) md += `**Requirement coverage:** ${p.coverageNote}\n\n`;
  for (const epic of p.epics) {
    md += `## ${epic.key ? `${epic.key} - ` : ""}${epic.name}\n\n`;
    if (epic.summary) md += `${epic.summary}\n\n`;
    if (!epic.stories.length) { md += "_No stories yet._\n\n"; continue; }
    md += table(
      ["Story", "Priority", "Size", "Linked req", "As a", "I want to", "So that", "Status", "Acceptance Criteria"],
      epic.stories.map((s) => [
        s.title, s.priority ?? "-", s.points ?? "-", s.linkedRequirement ?? "-",
        s.asA ?? "-", s.iWant ?? "-", s.soThat ?? "-", s.status ?? "-", (s.acceptanceCriteria ?? []).join("; ") || "-",
      ]),
    );
    md += "\n\n";
  }
  return md;
}

function renderDoc(p: DocPayload): string {
  let md = "";
  if (p.status) md += `**Status:** ${p.status.label}\n\n`;
  for (const section of p.sections) {
    if (section.heading) md += `## ${section.heading}\n\n`;
    switch (section.kind) {
      case "fields":
        md += table(["Field", "Value"], (section.pairs ?? []).map((pair) => [pair.label, pair.value]));
        md += "\n\n";
        break;
      case "text":
        md += `${section.body ?? ""}\n\n`;
        break;
      case "bullets":
        md += (section.items ?? []).map((i) => `- ${i}`).join("\n") + "\n\n";
        break;
      case "rows":
        if (section.columns?.length && section.rows?.length) { md += table(section.columns, section.rows); md += "\n\n"; }
        break;
      case "tags":
        md += (section.items ?? []).join(", ") + "\n\n";
        break;
    }
  }
  return md;
}

/* ── public entry point ────────────────────────────────────────────────── */

export function generatePublishMarkdown(execution: SkillExecution): string {
  const { payload, markdown } = execution;
  if (!payload) return markdown;
  const rendered = renderPayload(payload);
  // If the renderer produced something meaningful, use it, otherwise fall back.
  return rendered.trim() ? rendered : markdown;
}

function renderPayload(p: ArtifactPayload): string {
  switch (p.skill) {
    case "risk-scan":         return renderRiskScan(p as RiskScanPayload);
    case "release-checklist": return renderReleaseChecklist(p as ReleaseChecklistPayload);
    case "decision-log":      return renderDecisionLog(p as DecisionLogPayload);
    case "sprint-planning":   return renderSprintPlan(p as SprintPlanPayload);
    case "sprint-report":     return renderSprintReport(p as SprintReportPayload);
    case "budget-tracker":    return renderBudgetTracker(p as BudgetTrackerPayload);
    case "roadmap":           return renderRoadmap(p as RoadmapPayload);
    case "stories":           return renderStories(p as StoriesPayload);
    default:                  return renderDoc(p as DocPayload);
  }
}
