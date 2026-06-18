import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import { Sparkles } from "lucide-react";
import {
  type RiskScanPayload, type RiskEntry, type Priority, type HML, type StatusTone, type RagStatus,
  type RiskProximity, type RiskDepth,
  PRIORITY_TONE,
} from "@/types/pm";

/** Depth label + how many register rows each level shows (high-level shows fewest). */
const LEVEL_LABEL: Record<RiskDepth, string> = { low: "High-level", medium: "Mid-level", high: "Detailed" };
const LEVEL_CAP: Record<RiskDepth, number> = { low: 5, medium: 8, high: Infinity };
const LEVELS: { value: RiskDepth; label: string }[] = [
  { value: "low", label: "High-level" },
  { value: "medium", label: "Mid-level" },
  { value: "high", label: "Detailed" },
];
const SEG = "rounded px-2.5 py-1 text-xs font-medium transition-colors";
/** Priority order for the high-level Top Risk Snapshot (act-now first). */
const PRIORITY_RANK: Record<Priority, number> = { "act-now": 0, monitor: 1, contingency: 2, log: 3 };
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/store/workspace";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";

const PRIORITY_FILL: Record<Priority, string> = {
  "act-now":    "hsl(var(--status-danger))",
  monitor:      "hsl(var(--status-warning))",
  contingency:  "hsl(var(--status-warning))",
  log:          "hsl(var(--status-success))",
};
const PRIORITY_LABEL: Record<Priority, string> = {
  "act-now": "Act Now", monitor: "Monitor", contingency: "Contingency", log: "Log",
};
const PRIORITIES: Priority[] = ["act-now", "monitor", "contingency", "log"];
const HML_TONE: Record<HML, StatusTone> = { H: "danger", M: "warning", L: "neutral" };
const RAG_TONE: Record<RagStatus, StatusTone> = { red: "danger", amber: "warning", green: "success" };
const CONFIDENCE_TONE: Record<string, StatusTone> = { High: "success", Medium: "warning", Low: "danger" };
const PROXIMITY_ORDER: RiskProximity[] = ["Week 1-2", "Month 1", "Month 2-3", "Later"];
const PROXIMITY_LABEL: Record<RiskProximity, string> = {
  "Week 1-2":  "Immediate - Week 1-2",
  "Month 1":   "Near-term - Month 1",
  "Month 2-3": "Near-term - Month 2-3",
  "Later":     "Watch - Later",
};
const PROXIMITY_TONE: Record<RiskProximity, StatusTone> = {
  "Week 1-2":  "danger",
  "Month 1":   "warning",
  "Month 2-3": "warning",
  "Later":     "neutral",
};

/** /risk-scan: executive cards + heatmap + category chart + urgency timeline + register. */
export function RiskScanView({ payload }: { payload: RiskScanPayload }) {
  const ws = useWorkspace();
  // Was the visualisation generated during orchestration (or for a pre-built project)?
  const vizApproved = !!(ws.activeProjectId && ws.riskVizApproved[ws.activeProjectId]);
  const [pri, setPri] = useState<Priority | null>(null);
  const [showDash, setShowDash] = useState(vizApproved);
  useEffect(() => { if (vizApproved) setShowDash(true); }, [vizApproved]);

  // Effective depth is purely a display choice made on the artefact (the level
  // switcher below). It always defaults to high-level until the user changes it.
  // Higher-level scans show fewer rows; everything below derives from `scoped`.
  const level: RiskDepth = (ws.activeProjectId && ws.riskScanLevel[ws.activeProjectId]) || "low";
  const scoped = payload.register.slice(0, LEVEL_CAP[level]);
  const scopedRefs = new Set(scoped.map((r) => r.ref));
  const matrix = payload.matrix.filter((p) => scopedRefs.has(p.ref));
  const register = pri ? scoped.filter((r) => r.priority === pri) : scoped;

  // Sections per the skill: Top Risk Snapshot shows at all depths; assumptions +
  // summary for mid/detailed; prioritisation reasoning for detailed only.
  const showAssumptions = level !== "low";
  const showSummary = level !== "low";
  const showPrioritisation = level === "high";
  const topRisks = [...scoped]
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 3);

  const changeLevel = (lvl: RiskDepth) => {
    if (ws.activeProjectId) ws.setRiskScanLevel(ws.activeProjectId, lvl);
  };

  const generate = () => {
    setShowDash(true);
    if (ws.activeProjectId) ws.setRiskViz(ws.activeProjectId, true);
  };

  // Priority counts for summary cards
  const counts = { "act-now": 0, monitor: 0, contingency: 0, log: 0 } satisfies Record<Priority, number>;
  for (const r of scoped) counts[r.priority]++;

  // Category distribution for bar chart
  const catMap: Record<string, number> = {};
  for (const r of scoped) catMap[r.category] = (catMap[r.category] ?? 0) + 1;
  const categoryData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Timeline: group by proximity
  const proximityGroups: Partial<Record<RiskProximity, typeof payload.register>> = {};
  for (const r of scoped) {
    const key = (r.proximity ?? "Later") as RiskProximity;
    if (!proximityGroups[key]) proximityGroups[key] = [];
    proximityGroups[key]!.push(r);
  }
  const hasTimeline = scoped.some((r) => r.proximity);

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Risk Analysis - {payload.project}
          </p>
          <p className="text-sm text-muted-foreground">
            Phase: {payload.phase} · Depth: {LEVEL_LABEL[level]}
          </p>
          {payload.recommendation && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Recommendation: <span className="font-medium text-foreground">{payload.recommendation}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {vizApproved ? (
            <Button size="sm" variant="outline" onClick={() => setShowDash((v) => !v)}>
              {showDash ? "Hide dashboard" : "Show dashboard"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={generate}>
              <Sparkles className="h-3.5 w-3.5" /> Generate dashboard
            </Button>
          )}
          <StatusBadge tone={RAG_TONE[payload.verdict]}>{payload.verdict.toUpperCase()} RISK</StatusBadge>
        </div>
      </div>

      {/* ── Risk scan level switcher (regenerate at a different depth) ──── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Risk scan level:</span>
        <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="Change risk scan level">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => changeLevel(l.value)}
              aria-pressed={level === l.value}
              className={cn(SEG, level === l.value ? "bg-status-info-bg text-status-info" : "text-muted-foreground hover:bg-muted")}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conditions banner ──────────────────────────────────────── */}
      {payload.conditions && payload.conditions.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="mb-1 text-xs font-semibold text-amber-800 dark:text-amber-300">Conditions to proceed</p>
          <ul className="space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
            {payload.conditions.map((c, i) => <li key={i}>· {c}</li>)}
          </ul>
        </div>
      )}

      {/* ── Top Risk Snapshot (all depths) ─────────────────────────── */}
      {topRisks.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Risk Snapshot</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {topRisks.map((r) => (
              <li key={r.ref}>
                <span className="font-mono text-xs text-muted-foreground">{r.ref}</span> {r.risk}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Executive Summary Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard label="Act Now" count={counts["act-now"]} tone="danger" />
        <SummaryCard label="Monitor" count={counts.monitor + counts.contingency} tone="warning" />
        <SummaryCard label="Low Priority" count={counts.log} tone="success" />
        <SummaryCard
          label="Decisions Needed"
          count={payload.decisionsNeeded?.length ?? 0}
          tone={payload.decisionsNeeded?.length ? "danger" : "neutral"}
        />
      </div>

      {showDash && <ExecutiveDashboard register={scoped} />}

      {/* ── Heatmap + Category Distribution ───────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Heatmap */}
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Risk Heatmap - Likelihood × Impact</p>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
              <ReferenceArea x1={0} x2={50} y1={0} y2={50} fill="hsl(var(--heat-low))"  fillOpacity={0.55} />
              <ReferenceArea x1={50} x2={100} y1={0} y2={50} fill="hsl(var(--heat-mid))" fillOpacity={0.5} />
              <ReferenceArea x1={0} x2={50} y1={50} y2={100} fill="hsl(var(--heat-mid))" fillOpacity={0.5} />
              <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill="hsl(var(--heat-high))" fillOpacity={0.55} />
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number" dataKey="x" domain={[0, 100]} tickCount={6}
                tick={{ fontSize: 10 }}
                label={{ value: "Likelihood", position: "insideBottom", offset: -12, fontSize: 10 }}
              />
              <YAxis
                type="number" dataKey="y" domain={[0, 100]} tickCount={6}
                tick={{ fontSize: 10 }}
                label={{ value: "Impact", angle: -90, position: "insideLeft", fontSize: 10 }}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<MatrixTooltip />} />
              <Scatter data={matrix} isAnimationActive={false}>
                {matrix.map((p) => (
                  <Cell
                    key={p.ref}
                    fill={PRIORITY_FILL[p.priority]}
                    fillOpacity={pri && p.priority !== pri ? 0.15 : 1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Risk Category Distribution</p>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 4, right: 20, bottom: 4, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis
                  type="category" dataKey="name" width={88}
                  tick={{ fontSize: 10 }} tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.4 }}
                  content={<CategoryTooltip />}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {categoryData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.count >= 3
                          ? "hsl(var(--status-danger))"
                          : entry.count === 2
                          ? "hsl(var(--status-warning))"
                          : "hsl(var(--status-info))"
                      }
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="pt-4 text-center text-xs text-muted-foreground">No category data.</p>
          )}
        </div>
      </div>

      {/* ── Risk Timeline - Urgency View ───────────────────────────── */}
      {hasTimeline && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Risk Timeline - Urgency View</p>
          <div className="space-y-3">
            {PROXIMITY_ORDER.map((prox) => {
              const group = proximityGroups[prox];
              if (!group?.length) return null;
              return (
                <div key={prox}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <StatusBadge tone={PROXIMITY_TONE[prox]} className="text-[10px]">
                      {prox}
                    </StatusBadge>
                    <span className="text-xs text-muted-foreground">{PROXIMITY_LABEL[prox]}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.map((r) => (
                      <div
                        key={r.ref}
                        title={r.risk}
                        className={cn(
                          "flex max-w-[260px] items-center gap-1.5 rounded-lg border px-2 py-1",
                          r.priority === "act-now"
                            ? "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/30"
                            : r.priority === "log"
                            ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/30"
                            : "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/30"
                        )}
                      >
                        <span className="font-mono text-[10px] font-semibold shrink-0">{r.ref}</span>
                        <span className="truncate text-xs">{r.risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Priority filter chips ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {PRIORITIES.map((k) => {
          const active = pri === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              onClick={() => setPri(active ? null : k)}
              className="rounded-full transition-transform hover:-translate-y-0.5"
            >
              <StatusBadge
                tone={PRIORITY_TONE[k]}
                className={cn(active && "ring-2 ring-foreground/40", !active && "opacity-80")}
              >
                {PRIORITY_LABEL[k]}
              </StatusBadge>
            </button>
          );
        })}
        {pri && (
          <button
            type="button"
            onClick={() => setPri(null)}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Risk Register table ────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Ref</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">L</th>
              <th className="px-3 py-2">I</th>
              <th className="px-3 py-2">Detect</th>
              <th className="px-3 py-2">Velocity</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Response</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Proximity</th>
            </tr>
          </thead>
          <tbody>
            {register.map((r) => (
              <tr key={r.ref} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{r.ref}</td>
                <td className="px-3 py-2">{r.risk}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.category}</td>
                <td className="px-3 py-2"><StatusBadge tone={HML_TONE[r.likelihood]}>{r.likelihood}</StatusBadge></td>
                <td className="px-3 py-2"><StatusBadge tone={HML_TONE[r.impact]}>{r.impact}</StatusBadge></td>
                <td className="px-3 py-2 text-muted-foreground">{r.detectability}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.velocity}</td>
                <td className="px-3 py-2"><StatusBadge tone={PRIORITY_TONE[r.priority]}>{PRIORITY_LABEL[r.priority]}</StatusBadge></td>
                <td className="px-3 py-2 text-muted-foreground">{r.response}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.owner}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {r.proximity
                    ? <StatusBadge tone={PROXIMITY_TONE[r.proximity]} className="text-[10px]">{r.proximity}</StatusBadge>
                    : <span className="text-muted-foreground/50">-</span>}
                </td>
              </tr>
            ))}
            {register.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">
                  No risks at this priority.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Key Assumptions (mid-level + detailed) ─────────────────── */}
      {showAssumptions && payload.assumptions && payload.assumptions.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key Assumptions</p>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Assumption</th>
                <th className="px-3 py-2 whitespace-nowrap">Confidence</th>
                <th className="px-3 py-2 whitespace-nowrap">Risk if Wrong</th>
              </tr>
            </thead>
            <tbody>
              {payload.assumptions.map((a, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{a.assumption}</td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={CONFIDENCE_TONE[a.confidence]}>{a.confidence}</StatusBadge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{a.riskIfWrong}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Decisions Needed ──────────────────────────────────────── */}
      {payload.decisionsNeeded && payload.decisionsNeeded.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Decisions Needed</p>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Decision</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">By</th>
                <th className="px-3 py-2 whitespace-nowrap">Impact if Delayed</th>
              </tr>
            </thead>
            <tbody>
              {payload.decisionsNeeded.map((d, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{d.decision}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{d.owner}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{d.by}</td>
                  <td className="px-3 py-2 text-muted-foreground">{d.impactIfDelayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Stakeholder Summary (mid-level + detailed) ─────────────── */}
      {showSummary && payload.stakeholderSummary && (
        <blockquote className="rounded-lg border-l-4 border-primary/40 bg-muted/40 px-4 py-3 text-sm italic text-muted-foreground">
          {payload.stakeholderSummary}
        </blockquote>
      )}

      {/* ── Prioritisation Reasoning (detailed depth only) ─────────── */}
      {showPrioritisation && payload.prioritisationReasoning && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prioritisation Reasoning</p>
          <p className="text-sm text-muted-foreground">{payload.prioritisationReasoning}</p>
        </div>
      )}

      {/* ── Not Assessed (all levels) ──────────────────────────────── */}
      {payload.notAssessed && (payload.notAssessed.critical.length > 0 || payload.notAssessed.secondary.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Not Assessed</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {payload.notAssessed.critical.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-status-danger">Critical unknowns</p>
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                  {payload.notAssessed.critical.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
              </div>
            )}
            {payload.notAssessed.secondary.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Secondary unknowns</p>
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                  {payload.notAssessed.secondary.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── visualisation skill: executive dashboard from the risk register ── */

const RAG_OF: Record<Priority, RagStatus> = { "act-now": "red", monitor: "amber", contingency: "amber", log: "green" };

function countBy(arr: RiskEntry[], key: (r: RiskEntry) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const r of arr) { const k = (key(r) || "-").trim() || "-"; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function ExecutiveDashboard({ register }: { register: RiskEntry[] }) {
  const total = register.length;
  const reds = register.filter((r) => RAG_OF[r.priority] === "red").length;
  const ambers = register.filter((r) => RAG_OF[r.priority] === "amber").length;
  const greens = register.filter((r) => RAG_OF[r.priority] === "green").length;
  const byCat = countBy(register, (r) => r.category);
  const byOwner = countBy(register, (r) => r.owner);
  const PROX_ORDER = ["Week 1-2", "Month 1", "Month 2-3", "Later"];
  const timeline = PROX_ORDER.map((p) => [p, register.filter((r) => (r.proximity ?? "Later") === p).length] as [string, number]);
  const topCat = byCat[0]?.[0] ?? "-";

  return (
    <div className="space-y-3 rounded-xl border border-accent/40 bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Executive dashboard</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Total" value={total} />
        <Stat label="Red" value={reds} tone="danger" />
        <Stat label="Amber" value={ambers} tone="warning" />
        <Stat label="Green" value={greens} tone="success" />
        <Stat label="Top category" value={topCat} />
      </div>

      <Distribution title="Risk timeline (by proximity)" data={timeline} total={total} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Distribution title="Category distribution" data={byCat} total={total} />
        <Distribution title="Ownership distribution" data={byOwner} total={total} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: StatusTone }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      {tone ? (
        <StatusBadge tone={tone} className="mt-1 text-sm">{value}</StatusBadge>
      ) : (
        <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
      )}
    </div>
  );
}

function Distribution({ title, data, total }: { title: string; data: [string, number][]; total: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-medium">{title}</p>
      <div className="space-y-1.5">
        {data.map(([label, n]) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate text-muted-foreground" title={label}>{label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-status-info" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
            </div>
            <span className="w-4 shrink-0 text-right tabular-nums">{n}</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-xs text-muted-foreground">No data.</p>}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function SummaryCard({ label, count, tone }: { label: string; count: number; tone: StatusTone }) {
  const colours: Record<StatusTone, string> = {
    danger:  "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/30",
    warning: "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/30",
    success: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/30",
    info:    "border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/30",
    neutral: "border-border bg-muted/40",
    na:      "border-border bg-muted/40",
  };
  const textColours: Record<StatusTone, string> = {
    danger:  "text-red-700 dark:text-red-400",
    warning: "text-amber-700 dark:text-amber-400",
    success: "text-emerald-700 dark:text-emerald-400",
    info:    "text-blue-700 dark:text-blue-400",
    neutral: "text-foreground",
    na:      "text-muted-foreground",
  };
  return (
    <div className={cn("rounded-xl border px-3 py-2.5", colours[tone])}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", textColours[tone])}>{count}</p>
    </div>
  );
}

interface MatrixTooltipProps {
  active?: boolean;
  payload?: { payload: { ref: string; x: number; y: number } }[];
}
function MatrixTooltip({ active, payload }: MatrixTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-pop">
      <p className="font-mono font-semibold">{p.ref}</p>
      <p className="text-muted-foreground">Likelihood {p.x} · Impact {p.y}</p>
    </div>
  );
}

interface CategoryTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}
function CategoryTooltip({ active, payload, label }: CategoryTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-pop">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} risk{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
}
