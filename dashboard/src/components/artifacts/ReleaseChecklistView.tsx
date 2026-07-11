import { useState } from "react";
import {
  type ReleaseChecklistPayload, type ReleaseVerdict, type ChecklistStatus, CHECKLIST_TONE,
} from "@/types/pm";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

const VERDICT_BANNER: Record<ReleaseVerdict, string> = {
  GO: "bg-status-success-bg text-status-success border-status-success/30",
  "NO-GO": "bg-status-danger-bg text-status-danger border-status-danger/30",
  "CONDITIONAL GO": "bg-status-warning-bg text-status-warning border-status-warning/30",
};

const TALLY_KEYS: ChecklistStatus[] = ["PASS", "RISK", "FAIL", "UNCONFIRMED", "N/A"];

/** /release-checklist : verdict banner, re-assessment delta, tally filter, blockers,
 *  conditions, the confirmation chase list, the 7 categories, and a path to GO. */
export function ReleaseChecklistView({ payload }: { payload: ReleaseChecklistPayload }) {
  const [filters, setFilters] = useState<ChecklistStatus[]>([]);
  const toggle = (k: ChecklistStatus) =>
    setFilters((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));
  const hasFilters = filters.length > 0;

  const categories = payload.categories
    .map((cat) => ({ ...cat, items: hasFilters ? cat.items.filter((i) => filters.includes(i.status)) : cat.items }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{payload.release}</p>
          <p className="text-xs capitalize text-muted-foreground">{payload.releaseType.replace("-", " ")} release</p>
        </div>
        {payload.targetDate && <p className="shrink-0 text-xs text-muted-foreground">Target: {payload.targetDate}</p>}
      </div>

      <div className={cn("rounded-xl border p-4 text-center", VERDICT_BANNER[payload.verdict])}>
        <p className="text-[11px] uppercase tracking-widest opacity-70">Verdict</p>
        <p className="text-2xl font-bold">{payload.verdict}</p>
        <p className="mt-1 text-sm opacity-80">{payload.verdictRationale}</p>
      </div>

      {/* Re-assessment delta - what moved since the last checklist */}
      {payload.delta && payload.delta.length > 0 && !hasFilters && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <p className="border-b border-border px-3 py-2 text-sm font-semibold">Since last assessment</p>
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-1.5 font-medium">#</th><th className="px-3 py-1.5 font-medium">Item</th><th className="px-3 py-1.5 font-medium">Was</th><th className="px-3 py-1.5 font-medium">Now</th><th className="px-3 py-1.5 font-medium">What changed</th></tr>
            </thead>
            <tbody>
              {payload.delta.map((d) => (
                <tr key={d.ref} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{d.ref}</td>
                  <td className="px-3 py-1.5">{d.item}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{d.was}</td>
                  <td className="px-3 py-1.5">{d.now}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{d.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payload.verdictMovement && <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">{payload.verdictMovement}</p>}
        </div>
      )}

      {/* Clickable tally - select multiple to filter the checklist below */}
      <div className="flex flex-wrap items-center gap-2">
        {TALLY_KEYS.map((k) => {
          const active = filters.includes(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(k)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                active ? "border-foreground bg-muted ring-1 ring-foreground/20" : "border-border bg-card hover:bg-muted",
              )}
            >
              <StatusBadge tone={CHECKLIST_TONE[k]}>{payload.tally[k]}</StatusBadge>
              <span className={active ? "font-medium text-foreground" : "text-muted-foreground"}>{k}</span>
            </button>
          );
        })}
        {hasFilters && (
          <button type="button" onClick={() => setFilters([])} className="text-xs text-muted-foreground underline underline-offset-2">
            Clear
          </button>
        )}
      </div>

      {payload.blockers.length > 0 && !hasFilters && (
        <ListCard tone="danger" title="Blockers">
          {payload.blockers.map((b) => (
            <li key={b.ref}>
              <span className="font-mono text-xs">{b.ref}</span> {b.label}{" "}
              <span className="text-muted-foreground">- {b.owner}{b.due ? `, by ${b.due}` : ""}</span>
            </li>
          ))}
        </ListCard>
      )}

      {payload.conditions && payload.conditions.length > 0 && !hasFilters && (
        <ListCard tone="warning" title="Conditions (each needs an owner and a deadline)">
          {payload.conditions.map((c) => (
            <li key={c.ref}>
              <span className="font-mono text-xs">{c.ref}</span> {c.label}{" "}
              <span className="text-muted-foreground">- {c.owner}{c.due ? `, ${c.due}` : ""}</span>
            </li>
          ))}
        </ListCard>
      )}

      {payload.chaseList && payload.chaseList.length > 0 && !hasFilters && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <p className="mb-2 text-sm font-semibold">Confirmation chase list</p>
          <div className="space-y-2.5">
            {payload.chaseList.map((g) => (
              <div key={g.owner}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.owner}</p>
                <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-sm">
                  {g.questions.map((q) => (
                    <li key={q.ref}>
                      <span className="font-mono text-xs text-muted-foreground">{q.ref}</span> {q.question}
                      {q.leadTime && <span className="ml-1.5 rounded bg-status-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-status-warning">lead time - days not minutes</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Answer these and the statuses and verdict update.</p>
        </div>
      )}

      {categories.length === 0 ? (
        <p className="rounded-lg border border-border bg-card px-3 py-6 text-center text-sm text-muted-foreground">
          No items match {filters.join(", ")}.
        </p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <p className="border-b border-border px-3 py-2 text-sm font-semibold">{cat.title}</p>
              <ul>
                {cat.items.map((item) => (
                  <li key={item.ref} className="flex items-start gap-3 border-b border-border/50 px-3 py-2 last:border-0">
                    <span className="mt-0.5 font-mono text-xs text-muted-foreground">{item.ref}</span>
                    <span className="flex-1 text-sm">
                      {item.label}
                      {item.owner && <span className="ml-1.5 text-xs text-muted-foreground">({item.owner})</span>}
                      {item.note && <span className="block text-xs text-muted-foreground">{item.note}</span>}
                    </span>
                    <StatusBadge tone={CHECKLIST_TONE[item.status]}>{item.status}</StatusBadge>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {payload.pathToGo && !hasFilters && (
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-card">
          <p className="mb-2 text-sm font-semibold">Path to GO</p>
          <dl className="space-y-2 text-sm">
            <PathRow label="Resolvable before the date">
              <ul className="list-disc space-y-0.5 pl-5">{payload.pathToGo.resolvable.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </PathRow>
            <PathRow label="Descope options">
              <ul className="list-disc space-y-0.5 pl-5">{payload.pathToGo.descopeOptions.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </PathRow>
            <PathRow label="Reduced release">{payload.pathToGo.reducedRelease}</PathRow>
            <PathRow label="Verdict under reduced scope">{payload.pathToGo.verdictUnderReducedScope}</PathRow>
          </dl>
        </div>
      )}
    </div>
  );
}

function ListCard({ tone, title, children }: { tone: "danger" | "warning"; title: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border p-3", tone === "danger" ? "border-status-danger/30 bg-status-danger-bg" : "border-status-warning/30 bg-status-warning-bg")}>
      <p className={cn("mb-1 text-sm font-semibold", tone === "danger" ? "text-status-danger" : "text-status-warning")}>{title}</p>
      <ul className="space-y-1 text-sm">{children}</ul>
    </div>
  );
}

function PathRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
