import { describe, it, expect } from "vitest";
import { docPayloadToHtml, markdownToHtml, buildPrintDocument } from "@/lib/printPdf";
import type { DocPayload } from "@/types/pm";

const payload: DocPayload = {
  skill: "onboarding",
  status: { label: "Internal only", tone: "neutral" },
  sections: [
    { kind: "fields", heading: "At a glance", pairs: [{ label: "Client", value: "FinWave" }, { label: "Phase", value: "" }] },
    { kind: "text", heading: "Summary", body: "Real-time payment alerts <for> enterprise clients." },
    { kind: "bullets", heading: "Where we are", items: ["Sprint 3 - AMBER", "Forecast: on track"] },
    { kind: "rows", heading: "Who's who", columns: ["Name", "Owns"], rows: [["Sarah", "Sponsor"], ["Marcus", "Tech"]] },
    { kind: "tags", heading: "Read first", items: ["Charter", "PRD"] },
  ],
};

describe("docPayloadToHtml", () => {
  const html = docPayloadToHtml("Onboarding Brief", payload);

  it("renders the title and status", () => {
    expect(html).toContain("<h1>Onboarding Brief</h1>");
    expect(html).toContain("Internal only");
  });

  it("renders each section kind", () => {
    expect(html).toContain("<table class=\"kv\">");
    expect(html).toContain("<ul>");
    expect(html).toContain("<table class=\"grid\">");
    expect(html).toContain("class=\"tag\"");
  });

  it("fills empty cells with a dash", () => {
    // the empty Phase value becomes "-"
    expect(html).toContain("<td>-</td>");
  });

  it("escapes HTML so pasted content cannot inject markup", () => {
    expect(html).toContain("&lt;for&gt;");
    expect(html).not.toContain("<for>");
  });
});

describe("markdownToHtml", () => {
  it("escapes the markdown into a mono block", () => {
    const html = markdownToHtml("Sprint Report", "# Heading\n<script>alert(1)</script>");
    expect(html).toContain("<pre class=\"md\">");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("buildPrintDocument", () => {
  it("wraps a payload in a full HTML document", () => {
    const doc = buildPrintDocument("Onboarding Brief", payload);
    expect(doc.startsWith("<!doctype html>")).toBe(true);
    expect(doc).toContain("<title>Onboarding Brief</title>");
    expect(doc).toContain("<h1>Onboarding Brief</h1>");
  });

  it("falls back to the markdown block when no payload is given", () => {
    const doc = buildPrintDocument("Sprint Report", undefined, "# Status\nGreen");
    expect(doc).toContain("<pre class=\"md\">");
    expect(doc).toContain("# Status");
  });
});
