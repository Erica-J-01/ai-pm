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
  DocPayload,
} from "@/types/pm";

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

const PRIORITY_LABEL: Record<string, string> = {
  "act-now": "Act Now", monitor: "Monitor", contingency: "Contingency", log: "Log",
};
const RAG_LABEL: Record<string, string> = { red: "🔴 Red", amber: "🟡 Amber", green: "🟢 Green" };

/* ── per-skill renderers ───────────────────────────────────────────────── */

function renderRiskScan(p: RiskScanPayload): string {
  let md = `# Risk Scan\n\n`;
  md += `**Project:** ${p.project} | **Phase:** ${p.phase} | **Verdict:** ${RAG_LABEL[p.verdict] ?? p.verdict}\n\n`;
  md += `## Risk Register\n\n`;
  md += table(
    ["Ref", "Risk", "Category", "Likelihood", "Impact", "Detectability", "Velocity", "Priority", "Owner", "Response"],
    p.register.map((r) => [
      r.ref, r.risk, r.category, r.likelihood, r.impact,
      r.detectability, r.velocity, PRIORITY_LABEL[r.priority] ?? r.priority,
      r.owner, r.response,
    ]),
  );
  return md + "\n";
}

function renderReleaseChecklist(p: ReleaseChecklistPayload): string {
  let md = `# Release Checklist\n\n`;
  md += `**Release:** ${p.release} | **Type:** ${p.releaseType}`;
  if (p.targetDate) md += ` | **Target date:** ${p.targetDate}`;
  md += `\n\n`;
  md += `**Verdict:** ${p.verdict} - ${p.verdictRationale}\n\n`;

  // Summary tally
  md += `## Summary\n\n`;
  md += table(
    ["PASS", "FAIL", "RISK", "UNCONFIRMED", "N/A"],
    [[p.tally.PASS, p.tally.FAIL, p.tally.RISK, p.tally.UNCONFIRMED, p.tally["N/A"]].map(String)],
  );
  md += "\n\n";

  // Blockers
  if (p.blockers.length) {
    md += `## Blockers\n\n`;
    md += table(
      ["Ref", "Item", "Owner", "Due"],
      p.blockers.map((b) => [b.ref, b.label, b.owner, b.due ?? "-"]),
    );
    md += "\n\n";
  }

  // Per-category checklist
  for (const cat of p.categories) {
    if (!cat.items.length) continue;
    md += `## ${cat.title}\n\n`;
    md += table(
      ["Ref", "Item", "Status", "Note"],
      cat.items.map((i) => [i.ref, i.label, i.status, i.note ?? ""]),
    );
    md += "\n\n";
  }
  return md;
}

function renderDecisionLog(p: DecisionLogPayload): string {
  let md = `# Decision Log\n\n`;
  md += `**Project:** ${p.project}\n\n`;
  md += table(
    ["Area", "Original Plan", "Revised Plan", "Reason", "Proposed By", "Delivery Impact", "Technical Impact", "PO Impact", "Cost Impact", "Status", "Approved By"],
    p.entries.map((e) => [
      e.area, e.originalPlan, e.revisedPlan, e.reason,
      e.changeProposedBy, e.deliveryImpact, e.technicalImpact,
      e.productOwnerImpact, e.costImpact, e.changeStatus, e.changeApprovedBy,
    ]),
  );
  return md + "\n";
}

function renderSprintPlan(p: SprintPlanPayload): string {
  let md = `# Sprint Planning\n\n`;
  md += `**Sprint:** ${p.sprint.number} - ${p.sprint.goal}\n\n`;
  if (p.sprint.startDate || p.sprint.endDate) {
    md += `**Dates:** ${p.sprint.startDate ?? "?"} → ${p.sprint.endDate ?? "?"}\n\n`;
  }
  const loadPct = Math.round(p.loadRatio * 100);
  md += `**Usable capacity:** ${p.usableCapacity} pts | **Planned load:** ${p.plannedLoad} pts | **Load ratio:** ${loadPct}%`;
  if (p.overcommitted) md += ` ⚠️ Overcommitted`;
  md += "\n\n";

  md += `## Team Capacity\n\n`;
  md += table(
    ["Person", "Available Days", "Usable Capacity (pts)", "Notes"],
    p.capacity.map((c) => [c.person, c.availableDays, c.usableCapacity, c.notes ?? ""]),
  );
  md += "\n\n";

  md += `## Backlog\n\n`;
  md += table(
    ["Priority", "Item", "Estimate (pts)", "Owner", "Dependencies", "Stretch"],
    p.backlog.map((b) => [b.priority, b.item, b.estimate, b.owner, b.dependencies ?? "", b.isStretch ? "Yes" : "No"]),
  );
  return md + "\n";
}

function renderSprintReport(p: SprintReportPayload): string {
  let md = `# Sprint Report - ${p.sprint}\n\n`;
  md += `**Day:** ${p.day} / ${p.totalDays} | **Status:** ${RAG_LABEL[p.status] ?? p.status} | **Confidence:** ${p.confidence}%\n\n`;
  md += `**Forecast:** ${p.forecast}\n\n`;

  md += `## Progress\n\n`;
  md += table(
    ["Metric", "Value"],
    [
      ["Committed", p.committed],
      ["Completed", p.completed],
      ["Remaining", Math.max(0, p.committed - p.completed)],
    ].map(([k, v]) => [String(k), String(v)]),
  );
  md += "\n\n";

  if (p.summary) { md += `## Summary\n\n${p.summary}\n\n`; }
  if (p.priorities?.length) {
    md += `## Priorities\n\n${p.priorities.map((x) => `- ${x}`).join("\n")}\n\n`;
  }
  if (p.actionsToday?.length) {
    md += `## Actions Today\n\n${p.actionsToday.map((x) => `- ${x}`).join("\n")}\n\n`;
  }
  if (p.topRisks?.length) {
    md += `## Top Risks\n\n${p.topRisks.map((x) => `- ${x}`).join("\n")}\n\n`;
  }
  if (p.velocityTrend?.length) {
    md += `## Velocity Trend\n\n`;
    md += table(["Sprint", "Points"], p.velocityTrend.map((v) => [v.sprint, v.points]));
    md += "\n";
  }
  return md;
}

function renderBudgetTracker(p: BudgetTrackerPayload): string {
  let md = `# Budget Tracker\n\n`;
  md += `**Project:** ${p.project} | **Verdict:** ${RAG_LABEL[p.verdict] ?? p.verdict}\n\n`;

  md += `## Budget Summary\n\n`;
  md += table(
    ["Metric", "Amount"],
    [
      ["Approved", `$${p.approved.toLocaleString()}`],
      ["Spent", `$${p.spent.toLocaleString()}`],
      ["Committed", `$${p.committed.toLocaleString()}`],
      ["Remaining", `$${p.remaining.toLocaleString()}`],
      ["Forecast at Completion", `$${p.forecastAtCompletion.toLocaleString()}`],
      ["Variance", `$${p.variance.toLocaleString()}`],
    ].map(([k, v]) => [String(k), String(v)]),
  );
  md += "\n\n";

  if (p.developers?.length) {
    md += `## Developer Cost Breakdown\n\n`;
    md += table(
      ["Name", "Hours", "Rate ($/hr)", "Cost"],
      p.developers.map((d) => [d.name, d.hours, `$${d.rate}`, `$${d.cost.toLocaleString()}`]),
    );
    md += "\n";
  }
  return md;
}

function renderRoadmap(p: RoadmapPayload): string {
  let md = `# Roadmap\n\n`;
  md += `**Goal:** ${p.goal}`;
  if (p.horizon) md += ` | **Horizon:** ${p.horizon}`;
  md += `\n\n`;

  md += table(
    ["Lane", "Task", "Start Week", "End Week", "Start Date", "End Date"],
    p.tasks.map((t) => [t.lane, t.name, t.startWeek, t.endWeek, t.startDate ?? "-", t.endDate ?? "-"]),
  );
  return md + "\n";
}

function renderStories(p: StoriesPayload): string {
  let md = `# User Stories\n\n`;
  for (const epic of p.epics) {
    md += `## ${epic.name}\n\n`;
    if (epic.summary) md += `${epic.summary}\n\n`;
    if (!epic.stories.length) { md += "_No stories yet._\n\n"; continue; }

    md += table(
      ["Story", "As a…", "I want to…", "So that…", "Points", "Acceptance Criteria"],
      epic.stories.map((s) => [
        s.title,
        s.asA ?? "-",
        s.iWant ?? "-",
        s.soThat ?? "-",
        s.points ?? "-",
        (s.acceptanceCriteria ?? []).join("; ") || "-",
      ]),
    );
    md += "\n\n";
  }
  return md;
}

function renderDoc(p: DocPayload): string {
  let md = "";
  if (p.status) {
    md += `**Status:** ${p.status.label}\n\n`;
  }
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
        if (section.columns?.length && section.rows?.length) {
          md += table(section.columns, section.rows);
          md += "\n\n";
        }
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
  // If the renderer produced something meaningful, use it; otherwise fall back.
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
