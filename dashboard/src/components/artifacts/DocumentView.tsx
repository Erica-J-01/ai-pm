import { type DocPayload, type DocSection } from "@/types/pm";
import { StatusBadge } from "./StatusBadge";
import { Panel } from "./Panel";

/**
 * Generic document artifact view (triage, charter, discovery, PRD, sprint SOW,
 * meeting notes, tech review, retro, stakeholder update). Renders structured
 * sections as cards - the same polished style as the stories view - instead of
 * plain markdown.
 */
export function DocumentView({ payload }: { payload: DocPayload }) {
  return (
    <div className="space-y-4">
      {payload.status && (
        <div className="flex justify-end">
          <StatusBadge tone={payload.status.tone}>{payload.status.label}</StatusBadge>
        </div>
      )}
      {payload.sections.map((s, i) => <Section key={i} section={s} />)}
    </div>
  );
}

function Section({ section: s }: { section: DocSection }) {
  if (s.kind === "fields") {
    return (
      <div className="rounded-xl border border-border bg-card p-3.5 shadow-card">
        {s.heading && <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.heading}</p>}
        <dl className="grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
          {s.pairs?.map((p, i) => (
            <div key={i} className="min-w-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{p.label}</dt>
              <dd className="text-sm">{p.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (s.kind === "text") {
    return (
      <div className="rounded-xl border border-border bg-card p-3.5 shadow-card">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.heading}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{s.body}</p>
      </div>
    );
  }

  if (s.kind === "tags") {
    return (
      <Panel title={s.heading ?? ""}>
        <div className="flex flex-wrap gap-1.5">
          {s.items?.map((t, i) => (
            <span key={i} className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs">{t}</span>
          ))}
        </div>
      </Panel>
    );
  }

  if (s.kind === "bullets") {
    return (
      <Panel title={s.heading ?? ""}>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {s.items?.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </Panel>
    );
  }

  if (s.kind === "rows") {
    return (
      <Panel title={s.heading ?? ""}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>{s.columns?.map((c, i) => <th key={i} className="px-2 py-1.5 font-medium">{c}</th>)}</tr>
            </thead>
            <tbody>
              {s.rows?.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50 last:border-0">
                  {row.map((cell, ci) => <td key={ci} className="px-2 py-1.5 align-top">{cell || "-"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    );
  }

  return null;
}
