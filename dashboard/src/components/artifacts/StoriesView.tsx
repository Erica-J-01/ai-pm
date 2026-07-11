import { type StoriesPayload, type StoryItem } from "@/types/pm";
import { StatusBadge } from "./StatusBadge";
import { Panel } from "./Panel";

const PRIORITY_TONE: Record<string, "danger" | "warning" | "neutral"> = {
  Must: "danger", Should: "warning", Could: "neutral",
};

const sizeLabel = (p: StoryItem["points"]) =>
  p == null ? "-" : typeof p === "number" ? `${p} pts` : p;

/** /stories : epics with nested user stories (As a / I want / So that + AC),
 *  a per-epic summary table, and a requirement-coverage note. */
export function StoriesView({ payload }: { payload: StoriesPayload }) {
  return (
    <div className="space-y-3">
      {payload.coverageNote && (
        <div className="rounded-lg border border-status-info/40 bg-status-info-bg px-3 py-2 text-xs text-status-info">
          <span className="font-semibold uppercase tracking-wide">Requirement coverage</span> - {payload.coverageNote}
        </div>
      )}

      {payload.epics.map((epic) => (
        <Panel key={epic.name} title={`${epic.key ? `${epic.key} ` : ""}${epic.name}`}>
          {epic.summary && <p className="mb-2 text-sm text-muted-foreground">{epic.summary}</p>}
          <ul className="space-y-2">
            {epic.stories.map((s, i) => {
              const story = s.asA || s.iWant || s.soThat
                ? `As a ${s.asA ?? "user"}, I want to ${s.iWant ?? s.title}${s.soThat ? `, so that ${s.soThat}` : ""}`
                : null;
              return (
                <li key={i} className="rounded-md border border-border bg-background/60 px-3 py-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 font-medium">
                      {s.key && <span className="mr-2 font-mono text-xs text-muted-foreground">{s.key}</span>}
                      {s.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {s.priority && <StatusBadge tone={PRIORITY_TONE[s.priority] ?? "neutral"}>{s.priority}</StatusBadge>}
                      {s.points != null && <span className="text-xs text-muted-foreground">{sizeLabel(s.points)}</span>}
                      {s.status && <StatusBadge tone="neutral">{s.status}</StatusBadge>}
                    </span>
                  </div>
                  {story && <p className="mt-0.5 text-xs italic text-muted-foreground">{story}</p>}
                  {s.linkedRequirement && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Linked requirement: <span className="font-mono">{s.linkedRequirement}</span></p>
                  )}
                  {s.acceptanceCriteria && s.acceptanceCriteria.length > 0 && (
                    <div className="mt-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Acceptance criteria</p>
                      <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-xs">
                        {s.acceptanceCriteria.map((c, j) => <li key={j}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Per-epic summary table - the 60-second scan */}
          <div className="mt-3 overflow-x-auto">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
            <table className="w-full text-xs">
              <thead className="border-b border-border text-left uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-1 font-medium">ID</th>
                  <th className="px-2 py-1 font-medium">Title</th>
                  <th className="px-2 py-1 font-medium">Priority</th>
                  <th className="px-2 py-1 font-medium">Size</th>
                  <th className="px-2 py-1 font-medium">Linked req</th>
                </tr>
              </thead>
              <tbody>
                {epic.stories.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-2 py-1 font-mono text-muted-foreground">{s.key ?? "-"}</td>
                    <td className="px-2 py-1">{s.title}</td>
                    <td className="px-2 py-1">{s.priority ?? "-"}</td>
                    <td className="px-2 py-1 text-muted-foreground">{sizeLabel(s.points)}</td>
                    <td className="px-2 py-1 font-mono text-muted-foreground">{s.linkedRequirement ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
    </div>
  );
}
