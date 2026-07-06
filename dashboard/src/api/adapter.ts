import type { ArtifactPayload, DocSection, DocSkill, SkillId, StatusTone } from "@/types/pm";

/**
 * Best-effort markdown -> typed payload adapter.
 *
 * The real backend SHOULD return a typed `payload` directly alongside the
 * markdown. This adapter is the fallback for endpoints that only emit markdown
 * (the live Claude orchestrator): it parses the markdown of the nine document
 * skills into structured `DocSection`s so they render as polished cards
 * (DocumentView) instead of raw markdown.
 *
 * Visual skills (risk-scan, sprint-planning, roadmap, ...) have bespoke views
 * driven by data the markdown can't reliably reconstruct, so they return
 * `undefined` here and fall back to the markdown renderer - which is
 * always safe.
 */

const DOC_SKILLS = new Set<DocSkill>([
  "triage", "charter", "discovery", "prd", "sprint-sow",
  "meeting-notes", "tech-review", "retrospective", "stakeholder-update",
]);

export function adaptArtifact(skill: SkillId, markdown: string): ArtifactPayload | undefined {
  if (DOC_SKILLS.has(skill as DocSkill)) {
    return adaptDoc(skill as DocSkill, markdown);
  }
  return undefined;
}

/* ── markdown -> DocPayload ──────────────────────────────────────────── */

function adaptDoc(skill: DocSkill, markdown: string): ArtifactPayload | undefined {
  const sections = parseSections(markdown);
  if (sections.length === 0) return undefined; // nothing parsed - render markdown instead
  const status = skill === "stakeholder-update" ? deriveStatus(sections) : undefined;
  return { skill, sections, ...(status ? { status } : {}) };
}

interface RawSection {
  heading?: string;
  lines: string[];
}

/** Split markdown into heading-delimited sections, then classify each body. */
function parseSections(markdown: string): DocSection[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const raw: RawSection[] = [];
  let current: RawSection = { lines: [] };

  for (const line of lines) {
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const hashes = h[1] ?? "";
      const rest = h[2] ?? "";
      // H1 is the document title - drop it, but keep H2+ as section boundaries.
      if (hashes.length === 1 && raw.length === 0 && current.lines.every((l) => !l.trim())) {
        current = { lines: [] };
        continue;
      }
      if (current.heading !== undefined || current.lines.some((l) => l.trim())) raw.push(current);
      current = { heading: clean(rest) || undefined, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.heading !== undefined || current.lines.some((l) => l.trim())) raw.push(current);

  return raw.flatMap(sectionToBlocks);
}

/** A heading + its body may contain several blocks (paragraph, table, list). */
function sectionToBlocks(sec: RawSection): DocSection[] {
  const blocks = groupBlocks(sec.lines);
  if (blocks.length === 0) {
    return sec.heading ? [{ kind: "text", heading: sec.heading, body: "" }] : [];
  }
  // The heading attaches to the first block; later blocks inherit it for context.
  return blocks.map((b, i) => ({ ...b, heading: i === 0 ? sec.heading : b.heading ?? sec.heading }));
}

type Kind = "table" | "list" | "text";

function lineKind(line: string): Kind | "blank" {
  if (!line.trim()) return "blank";
  if (/^\s*\|.*\|\s*$/.test(line)) return "table";
  if (/^\s*([-*+]\s+|\d+[.)]\s+)/.test(line)) return "list";
  return "text";
}

/** Group consecutive same-kind lines into blocks, splitting paragraphs on blanks. */
function groupBlocks(lines: string[]): DocSection[] {
  const out: DocSection[] = [];
  let buf: string[] = [];
  let kind: Kind | null = null;

  const flush = () => {
    if (buf.length) out.push(...emitBlock(kind!, buf));
    buf = [];
    kind = null;
  };

  for (const line of lines) {
    const k = lineKind(line);
    if (k === "blank") {
      if (kind === "text") flush(); // blank ends a paragraph but not a table/list
      else if (kind) buf.push(line);
      continue;
    }
    if (kind && k !== kind) flush();
    kind = k;
    buf.push(line);
  }
  flush();
  return out;
}

function emitBlock(kind: Kind, lines: string[]): DocSection[] {
  if (kind === "table") return [parseTable(lines)].filter(Boolean) as DocSection[];

  if (kind === "list") {
    const items = lines
      .map((l) => l.replace(/^\s*([-*+]|\d+[.)])\s+/, "").trim())
      .filter(Boolean);
    const fields = items.map(parseField);
    if (items.length > 0 && fields.every(Boolean)) {
      return [{ kind: "fields", pairs: fields as { label: string; value: string }[] }];
    }
    return [{ kind: "bullets", items: items.map(clean) }];
  }

  // text: a label/value paragraph becomes fields, otherwise prose.
  const nonBlank = lines.filter((l) => l.trim());
  const fields = nonBlank.map(parseField);
  if (nonBlank.length > 0 && fields.every(Boolean)) {
    return [{ kind: "fields", pairs: fields as { label: string; value: string }[] }];
  }
  const body = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return body ? [{ kind: "text", body: clean(body) }] : [];
}

function parseTable(lines: string[]): DocSection | null {
  const rows = lines
    .filter((l) => l.trim())
    .map((l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => clean(c)));
  if (rows.length < 1) return null;
  const columns = rows[0];
  // Drop the GFM separator row (---, :--:, etc.) if present.
  const body = rows.slice(1).filter((r) => !r.every((c) => /^:?-{1,}:?$/.test(c) || c === ""));
  return { kind: "rows", columns, rows: body };
}

/** Recognise `**Label:** value`, `**Label**: value`, or `Label: value`. */
function parseField(line: string): { label: string; value: string } | null {
  const s = line.trim();
  let m = /^\*\*(.+?):\*\*\s*(.+)$/.exec(s) || /^\*\*(.+?)\*\*\s*:\s*(.+)$/.exec(s);
  if (!m) {
    const plain = /^([A-Za-z][A-Za-z0-9 /&()'.-]{0,38}):\s+(\S.*)$/.exec(s);
    if (plain && !/https?:$/.test(plain[1] ?? "")) m = plain;
  }
  if (!m) return null;
  const label = clean(m[1] ?? "");
  const value = clean(m[2] ?? "");
  if (!label || !value) return null;
  return { label, value };
}

/** Strip surface markdown markers and collapse whitespace. */
function clean(s: string): string {
  return s
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^\s*#+\s*/, "")
    .trim();
}

/** stakeholder-update: surface a RAG banner if the doc declares one. */
function deriveStatus(sections: DocSection[]): { label: string; tone: StatusTone } | undefined {
  const TONE: Record<string, StatusTone> = { green: "success", amber: "warning", red: "danger" };
  for (const s of sections) {
    for (const p of s.pairs ?? []) {
      if (!/status|rag|health/i.test(p.label)) continue;
      const hit = /\b(green|amber|red)\b/i.exec(p.value);
      if (hit) {
        const word = hit[1] ?? "";
        const tone = TONE[word.toLowerCase()];
        if (tone) return { label: `${word.toUpperCase()} - ${p.value}`.slice(0, 60), tone };
      }
    }
  }
  return undefined;
}
