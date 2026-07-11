import { type ReactNode } from "react";

/** Titled card wrapper shared by the chart-based artifact views. */
export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      {title && <p className="border-b border-border px-3 py-2 text-sm font-semibold">{title}</p>}
      <div className="p-3">{children}</div>
    </div>
  );
}

/** Titled bullet-list card. */
export function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <Panel title={title}>
      <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((r, i) => <li key={i}>{r}</li>)}</ul>
    </Panel>
  );
}

/** Table wrapped in a titled card, shared by the chart views. */
export function TableCard({ caption, head, children }: { caption: string; head: string[]; children: ReactNode }) {
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
