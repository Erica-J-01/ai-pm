import { type ReactNode } from "react";
import {
  Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { type BudgetTrackerPayload, type RagStatus, type CommercialModel, type StatusTone } from "@/types/pm";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { Panel } from "./Panel";

const RAG_TONE: Record<RagStatus, StatusTone> = { red: "danger", amber: "warning", green: "success" };
const RAG_LABEL: Record<RagStatus, string> = { red: "Over / at risk", amber: "Watch", green: "On budget" };
const MODEL_LABEL: Record<CommercialModel, string> = { "fixed-price": "Fixed price", "time-and-materials": "T&M", retainer: "Retainer" };
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

/** /budget-tracker : baseline split, forecast at completion (run-rate vs scope-based),
 *  a RAG verdict with the rule that fired, burn/exhaustion, variance drivers, and actions. */
export function BudgetTrackerView({ payload }: { payload: BudgetTrackerPayload }) {
  const devs = payload.developers ?? [];
  const over = payload.spent > payload.approved;
  const pct = payload.approved > 0 ? Math.min(100, (payload.spent / payload.approved) * 100) : 0;
  const variancePct = payload.approved > 0 ? Math.round((payload.variance / payload.approved) * 100) : 0;
  const showBothForecasts = payload.runRateForecast != null && payload.scopeForecast != null
    && Math.abs(payload.runRateForecast - payload.scopeForecast) > payload.approved * 0.02;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Budget - {payload.project}</p>
          <p className="text-xs text-muted-foreground">
            {devs.length} contributor{devs.length === 1 ? "" : "s"}
            {payload.commercialModel && ` - ${MODEL_LABEL[payload.commercialModel]}`}
          </p>
        </div>
        <StatusBadge tone={RAG_TONE[payload.verdict]}>{RAG_LABEL[payload.verdict]}</StatusBadge>
      </div>

      {payload.verdictRule && <p className="text-xs text-muted-foreground">Verdict rule: {payload.verdictRule}</p>}
      {payload.movement && (
        <p className="rounded-lg border border-status-info/40 bg-status-info-bg px-3 py-2 text-xs text-status-info">
          <span className="font-semibold uppercase tracking-wide">Since last report</span> - {payload.movement}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Current baseline" value={money(payload.approved)} />
        <Metric label="Spent" value={money(payload.spent)} />
        <Metric label={over ? "Over by" : "Remaining"} value={money(Math.abs(payload.remaining))} tone={over ? "danger" : "success"} />
      </div>

      {/* Spent vs baseline bar */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-card">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Spent {money(payload.spent)}</span>
          <span>Baseline {money(payload.approved)}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", over ? "bg-status-danger" : "bg-status-info")} style={{ width: `${pct}%` }} />
        </div>
        {payload.spentCaveat && <p className="mt-1.5 text-[11px] text-muted-foreground">{payload.spentCaveat}</p>}
      </div>

      {/* Baseline and forecast */}
      <Panel title="Baseline & forecast">
        <dl className="grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2">
          {payload.approvedChanges != null ? (
            <>
              <KV label="Original budget" value={money(payload.originalBudget ?? 0)} />
              <KV label="Approved changes" value={`${money(payload.approvedChanges)}${payload.approvedChangesRef ? ` (${payload.approvedChangesRef})` : ""}`} />
              <KV label="Current baseline" value={money(payload.approved)} />
            </>
          ) : (
            <KV label="Approved budget" value={money(payload.approved)} />
          )}
          <KV label="Committed (unbilled)" value={money(payload.committed)} />
          <KV label="Forecast at completion" value={`${money(payload.forecastAtCompletion)}${payload.forecastMethod ? ` (${payload.forecastMethod})` : ""}`} />
          {showBothForecasts && <KV label="Run-rate forecast" value={money(payload.runRateForecast!)} />}
          {showBothForecasts && <KV label="Scope-based forecast" value={money(payload.scopeForecast!)} />}
          <KV label="Variance vs baseline" value={`${payload.variance < 0 ? "-" : "+"}${money(Math.abs(payload.variance))} (${variancePct}%)`} />
          {(payload.scopeCompletePct > 0 || payload.timeElapsedPct > 0) && (
            <KV label="Work complete" value={`${payload.scopeCompletePct}% scope / ${payload.timeElapsedPct}% time`} />
          )}
        </dl>
        {payload.forecastAssumptions && <p className="mt-2 text-xs text-muted-foreground">{payload.forecastAssumptions}</p>}
        {payload.knownOneOffs && payload.knownOneOffs.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Known one-offs: {payload.knownOneOffs.map((o) => `${o.item} (${money(o.amount)})`).join(", ")}
          </p>
        )}
      </Panel>

      {payload.avgBurnPerPeriod != null && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Burn rate</p>
          <p className="mt-0.5">
            {money(payload.avgBurnPerPeriod)} per {payload.burnPeriodLabel ?? "period"}
            {payload.exhaustionDate && ` - budget exhausts ${payload.exhaustionDate}${payload.plannedEnd ? ` vs planned end ${payload.plannedEnd}` : ""}`}
          </p>
        </div>
      )}

      {devs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Developer</th>
                <th className="px-3 py-2 text-right">Hours</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {devs.map((d, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{d.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.hours}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(d.rate)}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{money(d.cost)}</td>
                </tr>
              ))}
              <tr className="bg-muted/40">
                <td className="px-3 py-2 font-semibold">Total</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{devs.reduce((s, d) => s + d.hours, 0)}</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{money(payload.spent)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {payload.varianceDrivers && payload.varianceDrivers.length > 0 && (
        <SmallTable caption="Variance drivers" head={["Driver", "Effect", "Note"]}>
          {payload.varianceDrivers.map((d, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2 font-medium">{d.driver}</td>
              <td className="px-3 py-2 tabular-nums">{d.effect}</td>
              <td className="px-3 py-2 text-muted-foreground">{d.note ?? "-"}</td>
            </tr>
          ))}
        </SmallTable>
      )}

      {payload.actions && payload.actions.length > 0 && (
        <SmallTable caption="Actions" head={["Action", "Owner", "By when"]}>
          {payload.actions.map((a, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2">{a.action}</td>
              <td className="px-3 py-2 text-muted-foreground">{a.owner}</td>
              <td className="px-3 py-2 text-muted-foreground">{a.by ?? "-"}</td>
            </tr>
          ))}
        </SmallTable>
      )}

      {payload.burn && payload.burn.length > 0 && (
        <Panel title="Burn rate (cumulative vs budget)">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={payload.burn} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Area type="monotone" dataKey="cumulative" name="Spent" stroke="hsl(var(--status-info))" fill="hsl(var(--status-info) / 0.18)" strokeWidth={2} />
              <Line type="monotone" dataKey="budgetLine" name="Budget" stroke="hsl(var(--status-danger))" strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: StatusTone }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      {tone ? <StatusBadge tone={tone} className="mt-1">{value}</StatusBadge> : <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>}
    </div>
  );
}

function SmallTable({ caption, head, children }: { caption: string; head: string[]; children: ReactNode }) {
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
