import { type RoadmapPayload, type RoadmapTask, type RoadmapConfidence, type StatusTone } from "@/types/pm";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { Panel } from "./Panel";

/** Lane accent colours, cycled by index. */
const LANE_BAR = [
  "bg-status-info text-white",
  "bg-status-success text-white",
  "bg-status-warning text-foreground",
  "bg-accent text-accent-foreground",
];
const CONF_TONE: Record<RoadmapConfidence, StatusTone> = { High: "success", Medium: "warning", Low: "neutral" };

const tip = (t: RoadmapTask) => {
  const weeks = `Week ${t.startWeek} to Week ${t.endWeek}`;
  if (t.startDate && t.endDate) return `${t.startDate} to ${t.endDate}  (${weeks})`;
  if (t.startDate) return `From ${t.startDate}  (${weeks})`;
  return weeks;
};

/**
 * /roadmap : a Now/Next/Later (or quarterly) roadmap. The buckets are the primary
 * content - initiatives with theme, confidence, and optional size. Hard commitments,
 * a capacity flag, and an update-mode changes list frame them, and an optional
 * week timeline (Gantt bars) visualises the horizon below.
 */
export function RoadmapView({ payload }: { payload: RoadmapPayload }) {
  const weeks = Math.max(1, payload.weeks);
  const weekCols = Array.from({ length: weeks }, (_, i) => i + 1);
  const gridCols = `minmax(120px,1.4fr) repeat(${weeks}, minmax(28px,1fr))`;
  const laneColor = (lane: string) => LANE_BAR[payload.lanes.indexOf(lane) % LANE_BAR.length] ?? LANE_BAR[0];
  const cellLine = (w: number) => cn("h-6 self-stretch", w > 1 && "border-l border-dashed border-border");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">{payload.goal}</p>
        {(() => {
          const parts = [
            payload.horizon && `Horizon: ${payload.horizon}`,
            payload.confidence,
            payload.nextReview && `next review: ${payload.nextReview}`,
          ].filter(Boolean);
          return parts.length ? <p className="text-sm text-muted-foreground">{parts.join(" - ")}</p> : null;
        })()}
      </div>

      {payload.changesSince && payload.changesSince.changes.length > 0 && (
        <div className="rounded-lg border border-status-info/40 bg-status-info-bg px-3 py-2 text-sm text-status-info">
          <p className="text-[11px] font-semibold uppercase tracking-wide">Changes since {payload.changesSince.date}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">{payload.changesSince.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      )}

      {payload.capacityFlag && (
        <div className="rounded-lg border border-status-warning/40 bg-status-warning-bg px-3 py-2 text-sm text-status-warning">{payload.capacityFlag}</div>
      )}

      {payload.hardCommitments && payload.hardCommitments.length > 0 && (
        <Table caption="Hard commitments" head={["Commitment", "Fixed date", "Sits in"]}>
          {payload.hardCommitments.map((c, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2 font-medium">{c.commitment}</td>
              <td className="px-3 py-2 whitespace-nowrap">{c.date}</td>
              <td className="px-3 py-2 text-muted-foreground">{c.sitsIn}</td>
            </tr>
          ))}
        </Table>
      )}

      {/* Now / Next / Later buckets - the roadmap's core */}
      {payload.buckets?.map((b) => (
        <div key={b.name} className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <p className="border-b border-border px-3 py-2 text-sm font-semibold">
            {b.name}
            {b.span && <span className="ml-1.5 font-normal text-muted-foreground">({b.span})</span>}
          </p>
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5 font-medium">Initiative</th>
                <th className="px-3 py-1.5 font-medium">Theme</th>
                <th className="px-3 py-1.5 font-medium">Notes</th>
                <th className="px-3 py-1.5 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {b.items.map((it, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2">
                    <span className="font-medium">{it.initiative}</span>
                    {it.size && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{it.size}</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{it.theme ?? "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{it.note ?? "-"}</td>
                  <td className="px-3 py-2"><StatusBadge tone={CONF_TONE[it.confidence]}>{it.confidence}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Optional horizon timeline (Gantt bars) */}
      {payload.tasks.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card p-3 shadow-card">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
          <div className="min-w-[460px]">
            <div className="grid items-end gap-0 border-b border-dashed border-border pb-2" style={{ gridTemplateColumns: gridCols }}>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Item</span>
              {weekCols.map((w) => (
                <span key={w} className={cn("text-center text-[10px] text-muted-foreground", w > 1 && "border-l border-dashed border-border")}>W{w}</span>
              ))}
            </div>
            {payload.lanes.map((lane, li) => {
              const tasks = payload.tasks.filter((t) => t.lane === lane);
              if (!tasks.length) return null;
              return (
                <div key={lane} className={cn(li > 0 && "border-t border-dashed border-border")}>
                  <p className="px-0 pb-1 pt-2 text-xs font-semibold">{lane}</p>
                  {tasks.map((t, i) => (
                    <div key={i} className="grid items-center gap-0 border-b border-dotted border-border/60 py-0.5 last:border-0" style={{ gridTemplateColumns: gridCols }}>
                      <span className="truncate pr-2 text-xs" title={t.name}>{t.name}</span>
                      {weekCols.map((w) => {
                        const inBar = w >= t.startWeek && w <= t.endWeek;
                        return (
                          <div key={w} className={cn(cellLine(w), "flex items-center")}>
                            {inBar && (
                              <div
                                title={`${t.name} - ${tip(t)}`}
                                className={cn("h-3.5 w-full cursor-default", laneColor(lane), w === t.startWeek && "rounded-l-full", w === t.endWeek && "rounded-r-full")}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {payload.dependencies && payload.dependencies.length > 0 && <ListPanel title="Dependencies & sequencing" items={payload.dependencies} />}
      {payload.notNow && payload.notNow.length > 0 && <ListPanel title="Out of scope / not now" items={payload.notNow} />}
      {payload.assumptions && payload.assumptions.length > 0 && <ListPanel title="Assumptions" items={payload.assumptions} />}
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <Panel title={title}>
      <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((r, i) => <li key={i}>{r}</li>)}</ul>
    </Panel>
  );
}

function Table({ caption, head, children }: { caption: string; head: string[]; children: React.ReactNode }) {
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
