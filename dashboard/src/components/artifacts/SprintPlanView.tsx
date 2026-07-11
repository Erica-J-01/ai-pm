import { type ReactNode } from "react";
import { type SprintPlanPayload, type BacklogPriority, type BacklogEstimate, type StatusTone } from "@/types/pm";
import { cn } from "@/lib/utils";
import { sprintLoadBreakdown } from "@/lib/sprint";
import { StatusBadge } from "./StatusBadge";

const PRIO_TONE: Record<BacklogPriority, StatusTone> = { P0: "danger", P1: "warning", P2: "neutral" };

const sizeLabel = (e: BacklogEstimate) => (typeof e === "number" ? e : "TBD");

/** /sprint-planning : capacity, 70-80% target band, per-person load, overcommit and
 *  goal-alignment flags, backlog, carryover, dependencies, risks, DoD, key dates. */
export function SprintPlanView({ payload }: { payload: SprintPlanPayload }) {
  const pct = Math.round(payload.loadRatio * 100);

  // Derived once, from a single source, so every flag agrees with the backlog on screen.
  const { committedPts, unestimated, offGoalPts, perPerson, bottlenecks } =
    sprintLoadBreakdown(payload.capacity, payload.backlog);

  const velocityNote = payload.velocity
    ? `Sanity check: last ${payload.velocity.sprints} sprints averaged ${payload.velocity.averagePoints} points.`
    : "No velocity baseline - capacity is estimated, treat load % as indicative.";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{payload.sprint.name ?? `Sprint ${payload.sprint.number}`}</p>
          <p className="text-sm text-muted-foreground">{payload.sprint.goal}</p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {payload.sprint.startDate} - {payload.sprint.endDate} | {payload.capacity.length} people
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium">Committed load</span>
          <span className="tabular-nums">{payload.plannedLoad} / {payload.usableCapacity} pts ({pct}%)</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
          {/* 70-80% target band */}
          <div className="absolute inset-y-0" style={{ left: "70%", width: "10%", background: "hsl(var(--status-success) / 0.3)" }} />
          <div
            className={cn("h-full rounded-full transition-[width]", payload.overcommitted ? "bg-status-danger" : "bg-status-success")}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Target band 70-80% of usable capacity. {velocityNote}</p>
        {payload.overcommitted && (
          <Flag tone="danger">Over-committed at {pct}%. Recommend cutting a P1 or moving it to P2 stretch.</Flag>
        )}
        {bottlenecks.length > 0 && (
          <Flag tone="danger">
            {bottlenecks
              .map((b) =>
                b.capacity <= 0
                  ? `${b.person} has work assigned but no usable capacity`
                  : `${b.person} is at ${b.over ? `${b.pct}%` : `${b.stretchPct}% once stretch starts`}`,
              )
              .join(". ")}. Sprints fail on the bottleneck person - hold or move their stretch before pulling it in.
          </Flag>
        )}
        {offGoalPts > 0 && (
          <Flag tone="warning">{offGoalPts} of {committedPts} committed points do not serve the sprint goal.</Flag>
        )}
        {unestimated > 0 && (
          <Flag tone="warning">Load % excludes {unestimated} unestimated item{unestimated > 1 ? "s" : ""} - true load is higher. Estimate with the team before committing.</Flag>
        )}
      </div>

      <Table caption="Capacity" head={["Person", "Days", "Usable", "Notes"]}>
        {payload.capacity.map((c) => (
          <tr key={c.person} className="border-b border-border/60 last:border-0">
            <td className="px-3 py-2 font-medium">{c.person}</td>
            <td className="px-3 py-2 text-muted-foreground">{c.availableDays} of {c.workingDays}</td>
            <td className="px-3 py-2 tabular-nums">{c.usableCapacity} pts</td>
            <td className="px-3 py-2 text-muted-foreground">{c.notes ?? "-"}</td>
          </tr>
        ))}
      </Table>

      <Table caption="Per-person load" head={["Person", "Committed", "With stretch", "Load"]}>
        {perPerson.map((p) => (
          <tr key={p.person} className="border-b border-border/60 last:border-0">
            <td className="px-3 py-2 font-medium">{p.person}</td>
            <td className="px-3 py-2 tabular-nums">{p.committed} of {p.capacity} pts</td>
            <td className="px-3 py-2 tabular-nums text-muted-foreground">{p.withStretch > p.committed ? `${p.withStretch} pts` : "-"}</td>
            <td className="px-3 py-2">
              <span className={cn("tabular-nums", (p.over || p.overWithStretch) && "font-medium text-status-danger")}>
                {p.capacity <= 0
                  ? (p.committed || p.withStretch ? "over capacity" : "n/a")
                  : `${p.pct}%${p.stretchPct > p.pct ? ` (${p.stretchPct}% if stretch starts)` : ""}`}
              </span>
            </td>
          </tr>
        ))}
      </Table>

      <Table caption="Backlog" head={["Priority", "Item", "Est", "Owner", "Dependencies"]}>
        {payload.backlog.map((b, i) => (
          <tr key={i} className="border-b border-border/60 last:border-0">
            <td className="px-3 py-2 whitespace-nowrap">
              <StatusBadge tone={PRIO_TONE[b.priority]}>{b.priority}</StatusBadge>
              {b.isStretch && <span className="ml-1.5 text-xs text-muted-foreground">stretch</span>}
            </td>
            <td className="px-3 py-2">
              {b.item}
              {b.servesGoal === false && <span className="ml-1.5 rounded bg-status-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-status-warning">off goal</span>}
            </td>
            <td className="px-3 py-2 tabular-nums">{sizeLabel(b.estimate)}</td>
            <td className="px-3 py-2 text-muted-foreground">{b.owner}</td>
            <td className="px-3 py-2 text-muted-foreground">{b.dependencies ?? "-"}</td>
          </tr>
        ))}
      </Table>

      {payload.carryover && payload.carryover.length > 0 && (
        <Table caption="Carryover" head={["Item", "Original", "Est", "Remaining", "Reason", "Re-committed"]}>
          {payload.carryover.map((c, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2 font-medium">{c.item}</td>
              <td className="px-3 py-2 text-muted-foreground">{c.originalSprint}</td>
              <td className="px-3 py-2 tabular-nums">{c.originalEstimate}</td>
              <td className="px-3 py-2 tabular-nums">{c.remainingEffort}</td>
              <td className="px-3 py-2 text-muted-foreground">{c.reason}</td>
              <td className="px-3 py-2">{c.reCommitted ? "Yes" : "No"}</td>
            </tr>
          ))}
        </Table>
      )}

      {payload.dependencies && payload.dependencies.length > 0 && (
        <Table caption="Dependencies" head={["Item", "Depends on", "Owner", "Status", "Risk if blocked"]}>
          {payload.dependencies.map((d, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2 font-medium">{d.item}</td>
              <td className="px-3 py-2 text-muted-foreground">{d.dependsOn}</td>
              <td className="px-3 py-2 text-muted-foreground">{d.owner}</td>
              <td className="px-3 py-2">
                <StatusBadge tone={d.status === "Confirmed" ? "success" : "warning"}>{d.status}</StatusBadge>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{d.riskIfBlocked}</td>
            </tr>
          ))}
        </Table>
      )}

      {payload.risks && payload.risks.length > 0 && (
        <Table caption="Risks" head={["Risk", "Impact", "Mitigation"]}>
          {payload.risks.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2 font-medium">{r.risk}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.impact}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.mitigation}</td>
            </tr>
          ))}
        </Table>
      )}

      {payload.definitionOfDone && payload.definitionOfDone.items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <p className="border-b border-border px-3 py-2 text-sm font-semibold">
            Definition of Done{payload.definitionOfDone.proposed && <span className="ml-1.5 font-normal text-muted-foreground">(proposed - confirm with team)</span>}
          </p>
          <ul className="list-disc space-y-1 px-3 py-2 pl-8 text-sm">
            {payload.definitionOfDone.items.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}

      {payload.keyDates && payload.keyDates.length > 0 && (
        <Table caption="Key dates" head={["Date", "Event"]}>
          {payload.keyDates.map((k, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2 whitespace-nowrap font-medium">{k.date}</td>
              <td className="px-3 py-2 text-muted-foreground">{k.event}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function Flag({ tone, children }: { tone: "danger" | "warning"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mt-3 rounded-lg border px-3 py-2 text-sm",
        tone === "danger" ? "border-status-danger/30 bg-status-danger-bg text-status-danger" : "border-status-warning/30 bg-status-warning-bg text-status-warning",
      )}
    >
      {children}
    </div>
  );
}

function Table({ caption, head, children }: { caption: string; head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
      <p className="border-b border-border px-3 py-2 text-sm font-semibold">{caption}</p>
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
