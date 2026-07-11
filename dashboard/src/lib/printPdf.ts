import type { DocPayload, DocSection } from "@/types/pm";

/**
 * Print-to-PDF for artefacts (used by the onboarding brief so it can be emailed
 * to a new joiner). Builds a clean, self-contained HTML document and opens it in
 * a new window with the browser's print dialog, where "Save as PDF" is the
 * standard destination. Dependency-free - no PDF library in the bundle.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const cell = (s: string): string => esc(s || "-");

/** Render a structured DocPayload (triage, onboarding, etc.) to print HTML. */
export function docPayloadToHtml(title: string, payload: DocPayload): string {
  const parts: string[] = [`<h1>${esc(title)}</h1>`];
  if (payload.status) parts.push(`<p class="status">${esc(payload.status.label)}</p>`);

  for (const s of payload.sections) parts.push(sectionToHtml(s));
  return parts.join("\n");
}

function sectionToHtml(s: DocSection): string {
  const heading = s.heading ? `<h2>${esc(s.heading)}</h2>` : "";
  if (s.kind === "fields") {
    const rows = (s.pairs ?? [])
      .map((p) => `<tr><th>${esc(p.label)}</th><td>${cell(p.value)}</td></tr>`)
      .join("");
    return `${heading}<table class="kv"><tbody>${rows}</tbody></table>`;
  }
  if (s.kind === "text") {
    return `${heading}<p>${esc(s.body ?? "")}</p>`;
  }
  if (s.kind === "bullets") {
    const items = (s.items ?? []).map((t) => `<li>${esc(t)}</li>`).join("");
    return `${heading}<ul>${items}</ul>`;
  }
  if (s.kind === "tags") {
    const tags = (s.items ?? []).map((t) => `<span class="tag">${esc(t)}</span>`).join(" ");
    return `${heading}<p class="tags">${tags}</p>`;
  }
  if (s.kind === "rows") {
    const head = (s.columns ?? []).map((c) => `<th>${esc(c)}</th>`).join("");
    const body = (s.rows ?? [])
      .map((row) => `<tr>${row.map((c) => `<td>${cell(c)}</td>`).join("")}</tr>`)
      .join("");
    return `${heading}<table class="grid"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }
  return heading;
}

/** Fallback for non-structured artefacts: the publish markdown in a mono block. */
export function markdownToHtml(title: string, markdown: string): string {
  return `<h1>${esc(title)}</h1><pre class="md">${esc(markdown)}</pre>`;
}

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body { font: 14px/1.55 -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 40px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #555; margin: 22px 0 6px; }
  p { margin: 0 0 8px; }
  .status { display: inline-block; font-weight: 600; border: 1px solid #999; border-radius: 999px; padding: 2px 10px; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 8px; }
  table.kv th { text-align: left; width: 34%; vertical-align: top; color: #555; font-weight: 600; padding: 4px 8px 4px 0; }
  table.kv td { vertical-align: top; padding: 4px 0; }
  table.grid th { text-align: left; border-bottom: 1px solid #ccc; padding: 5px 6px; font-size: 12px; color: #555; }
  table.grid td { border-bottom: 1px solid #eee; padding: 5px 6px; vertical-align: top; }
  .tag { display: inline-block; border: 1px solid #ccc; border-radius: 999px; padding: 1px 8px; margin: 0 2px 2px 0; font-size: 12px; }
  pre.md { white-space: pre-wrap; font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace; }
  @media print { body { margin: 0; } }
`;

/** Wrap section/markdown body into a full, standalone printable HTML document. */
export function buildPrintDocument(title: string, payload?: DocPayload, markdown = ""): string {
  const body = payload ? docPayloadToHtml(title, payload) : markdownToHtml(title, markdown);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${PRINT_CSS}</style></head><body>${body}</body></html>`;
}

/**
 * Open the artefact as a printable document in a new window and trigger the
 * print dialog. Returns false if the browser blocked the popup so the caller can
 * surface it. The `open`/`write`/`print` calls are the reason this is not a pure
 * function and is kept out of the HTML builders above (which are unit-tested).
 */
export function openPrintable(title: string, payload?: DocPayload, markdown = ""): boolean {
  const html = buildPrintDocument(title, payload, markdown);
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // Let the new document lay out before invoking print.
  setTimeout(() => win.print(), 300);
  return true;
}
