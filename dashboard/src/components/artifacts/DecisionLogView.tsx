import { useState } from "react";
import {
  type DecisionLogPayload, type DecisionLogEntry, type ChangeStatus, type StatusTone,
} from "@/types/pm";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

const STATUS_TONE: Record<ChangeStatus, StatusTone> = {
  Proposed: "info",
  "Under Review": "warning",
  Approved: "success",
  Rejected: "danger",
  Superseded: "neutral",
};
const STATUSES: ChangeStatus[] = ["Proposed", "Under Review", "Approved", "Rejected", "Superseded"];

const DETAIL_FIELDS: { key: keyof DecisionLogEntry; label: string }[] = [
  { key: "originalPlan", label: "Original plan" },
  { key: "revisedPlan", label: "Revised plan" },
  { key: "reason", label: "Reason" },
  { key: "changeProposedBy", label: "Proposed by" },
  { key: "deliveryImpact", label: "Delivery impact" },
  { key: "technicalImpact", label: "Technical impact" },
  { key: "productOwnerImpact", label: "Product owner impact" },
  { key: "costImpact", label: "Cost impact" },
];

/** /decision-log : a running register - slim index table plus a detail block per
 *  decision, with supersede links, a discussed-not-decided note, and a sign-off nudge. */
export function DecisionLogView({ payload }: { payload: DecisionLogPayload }) {
  const [filter, setFilter] = useState<ChangeStatus | null>(null);
  const entries = filter ? payload.entries.filter((e) => e.changeStatus === filter) : payload.entries;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Decision Log - {payload.project}</p>
        <p className="text-sm text-muted-foreground">
          {payload.version && `Version ${payload.version}`}
          {payload.lastUpdated && ` - updated ${payload.lastUpdated}`}
          {payload.preparedBy && ` - prepared by ${payload.preparedBy}`}
        </p>
      </div>

      {payload.signOffNudge && (
        <div className="rounded-lg border border-status-warning/40 bg-status-warning-bg px-3 py-2 text-sm text-status-warning">
          {payload.signOffNudge}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => {
          const active = filter === s;
          const count = payload.entries.filter((e) => e.changeStatus === s).length;
          if (count === 0 && !active) return null;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(active ? null : s)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                active ? "border-foreground bg-muted ring-1 ring-foreground/20" : "border-border bg-card hover:bg-muted",
              )}
            >
              <StatusBadge tone={STATUS_TONE[s]}>{count}</StatusBadge>
              <span className={active ? "font-medium text-foreground" : "text-muted-foreground"}>{s}</span>
            </button>
          );
        })}
        {filter && (
          <button type="button" onClick={() => setFilter(null)} className="text-xs text-muted-foreground underline underline-offset-2">
            Clear
          </button>
        )}
      </div>

      {/* Index - the 60-second scan */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Area</th>
              <th className="px-3 py-2 font-medium">Decision</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Approved by</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id ?? e.title} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-muted-foreground">{e.id ?? "-"}</td>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{e.date ?? "-"}</td>
                <td className="px-3 py-2 font-medium">{e.area}</td>
                <td className="px-3 py-2">{e.title ?? e.revisedPlan}</td>
                <td className="px-3 py-2"><StatusBadge tone={STATUS_TONE[e.changeStatus]}>{e.changeStatus}</StatusBadge></td>
                <td className="px-3 py-2 text-muted-foreground">{e.changeApprovedBy}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No {filter} decisions.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail block per decision */}
      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id ?? e.title} className="rounded-xl border border-border bg-card p-3.5 shadow-card">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">
                <span className="mr-2 font-mono text-xs text-muted-foreground">{e.id}</span>
                {e.title ?? e.revisedPlan}
              </p>
              <span className="flex shrink-0 items-center gap-2">
                {e.supersedes && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Supersedes {e.supersedes}</span>}
                <StatusBadge tone={STATUS_TONE[e.changeStatus]}>{e.changeStatus}</StatusBadge>
              </span>
            </div>
            <dl className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
              {DETAIL_FIELDS.map((f) => (
                <div key={f.key} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm">{(e[f.key] as string) || "-"}</dd>
                </div>
              ))}
            </dl>
            {e.followUps && (
              <p className="mt-2 rounded-lg border border-status-info/40 bg-status-info-bg px-2.5 py-1.5 text-xs text-status-info">
                <span className="font-semibold uppercase tracking-wide">Follow-ups</span> - {e.followUps}
              </p>
            )}
          </div>
        ))}
      </div>

      {payload.discussedNotDecided && payload.discussedNotDecided.length > 0 && !filter && (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-3">
          <p className="mb-1 text-sm font-semibold">Discussed, not decided</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {payload.discussedNotDecided.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
