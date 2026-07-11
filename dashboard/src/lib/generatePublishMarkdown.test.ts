import { describe, it, expect } from "vitest";
import { generatePublishMarkdown } from "@/lib/generatePublishMarkdown";
import type { SkillExecution, RiskScanPayload, SprintPlanPayload, StoriesPayload, ReleaseChecklistPayload, DecisionLogPayload, BudgetTrackerPayload, RoadmapPayload, SprintReportPayload, DocPayload } from "@/types/pm";
import { SAMPLE_ARTIFACTS } from "@/data/sampleArtifacts";

/* ── factory helpers ─────────────────────────────────────────────────── */

function exec(payload?: SkillExecution["payload"], markdown = "fallback markdown"): SkillExecution {
  return {
    id: "test",
    request: { skill: payload?.skill ?? "triage", clientId: "c1", projectId: "p1", input: "" },
    status: "complete",
    markdown,
    payload,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   FALLBACK - no structured payload
   ═══════════════════════════════════════════════════════════════════════ */

describe("fallback (no payload)", () => {
  it("returns execution.markdown when payload is absent", () => {
    expect(generatePublishMarkdown(exec(undefined, "my markdown"))).toBe("my markdown");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   RISK SCAN
   ═══════════════════════════════════════════════════════════════════════ */

const RISK_PAYLOAD: RiskScanPayload = {
  skill: "risk-scan", project: "Finwave", phase: "development", depth: "medium", verdict: "red",
  register: [{
    ref: "R1", risk: "Deadline risk", category: "Delivery",
    likelihood: "H", impact: "H", detectability: "Easy", velocity: "Fast",
    priority: "act-now", owner: "PM", response: "Mitigate",
  }],
  matrix: [{ ref: "R1", x: 80, y: 80, priority: "act-now" }],
};

describe("generatePublishMarkdown - risk-scan", () => {
  it("includes a # Risk Scan heading", () => {
    expect(generatePublishMarkdown(exec(RISK_PAYLOAD))).toContain("# Risk Scan");
  });
  it("renders a markdown table with the correct column headers", () => {
    const md = generatePublishMarkdown(exec(RISK_PAYLOAD));
    expect(md).toContain("| Ref |");
    expect(md).toContain("| Risk |");
    expect(md).toContain("| Category |");
    expect(md).toContain("| Priority |");
    expect(md).toContain("| Owner |");
    expect(md).toContain("| Response |");
  });
  it("includes the risk entry data", () => {
    const md = generatePublishMarkdown(exec(RISK_PAYLOAD));
    expect(md).toContain("R1");
    expect(md).toContain("Deadline risk");
    expect(md).toContain("Act Now");
    expect(md).toContain("PM");
    expect(md).toContain("Mitigate");
  });
  it("includes the verdict", () => {
    expect(generatePublishMarkdown(exec(RISK_PAYLOAD))).toContain("Red");
  });
  it("does NOT use flat dash-separated format (old buildMarkdown output)", () => {
    const md = generatePublishMarkdown(exec(RISK_PAYLOAD));
    expect(md).not.toMatch(/Deadline risk - Delivery - H - H/);
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   SPRINT PLANNING
   ═══════════════════════════════════════════════════════════════════════ */

const SPRINT_PAYLOAD: SprintPlanPayload = {
  skill: "sprint-planning",
  sprint: { number: 3, goal: "Ship notifications" },
  capacity: [{ person: "Alice", availableDays: 5, workingDays: 5, usableCapacity: 8 }],
  usableCapacity: 8, backlog: [{ priority: "P0", item: "Auth", estimate: 3, owner: "Alice", isStretch: false }],
  plannedLoad: 3, loadRatio: 0.375, capacityThreshold: { min: 0.7, max: 0.8 }, overcommitted: false,
};

describe("generatePublishMarkdown - sprint-planning", () => {
  it("includes sprint number and goal", () => {
    const md = generatePublishMarkdown(exec(SPRINT_PAYLOAD));
    expect(md).toContain("Sprint");
    expect(md).toContain("Ship notifications");
  });
  it("renders Team Capacity table", () => {
    const md = generatePublishMarkdown(exec(SPRINT_PAYLOAD));
    expect(md).toContain("Team Capacity");
    expect(md).toContain("Alice");
    expect(md).toContain("| Person |");
  });
  it("renders Backlog table with priority", () => {
    const md = generatePublishMarkdown(exec(SPRINT_PAYLOAD));
    expect(md).toContain("Backlog");
    expect(md).toContain("P0");
    expect(md).toContain("Auth");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   USER STORIES
   ═══════════════════════════════════════════════════════════════════════ */

const STORIES_PAYLOAD: StoriesPayload = {
  skill: "stories",
  epics: [{
    key: "E1", name: "Auth Epic", summary: "Login & registration",
    stories: [{
      title: "Login flow",
      asA: "user", iWant: "log in", soThat: "I can access my account",
      acceptanceCriteria: ["Valid credentials → success", "Invalid → error message"],
      points: 3,
    }],
  }],
};

describe("generatePublishMarkdown - stories", () => {
  it("renders each epic as a ## heading", () => {
    expect(generatePublishMarkdown(exec(STORIES_PAYLOAD))).toMatch(/## (E1 - )?Auth Epic/);
  });
  it("renders stories as a table", () => {
    const md = generatePublishMarkdown(exec(STORIES_PAYLOAD));
    expect(md).toContain("Login flow");
    expect(md).toContain("| Story |");
  });
  it("includes acceptance criteria in table cell", () => {
    expect(generatePublishMarkdown(exec(STORIES_PAYLOAD))).toContain("Valid credentials");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   RELEASE CHECKLIST
   ═══════════════════════════════════════════════════════════════════════ */

const CHECKLIST_PAYLOAD: ReleaseChecklistPayload = {
  skill: "release-checklist", release: "v2.0", releaseType: "planned",
  categories: [{
    id: "testing", title: "Testing",
    items: [{ ref: "T1", label: "Regression suite", status: "PASS" }],
  }],
  tally: { PASS: 1, FAIL: 0, RISK: 0, UNCONFIRMED: 0, "N/A": 0 },
  blockers: [], verdict: "GO", verdictRationale: "All checks passed.",
};

describe("generatePublishMarkdown - release-checklist", () => {
  it("includes the verdict", () => {
    expect(generatePublishMarkdown(exec(CHECKLIST_PAYLOAD))).toContain("GO");
  });
  it("renders the tally table", () => {
    const md = generatePublishMarkdown(exec(CHECKLIST_PAYLOAD));
    expect(md).toContain("| PASS |");
    expect(md).toContain("| 1 |");
  });
  it("renders per-category item tables", () => {
    const md = generatePublishMarkdown(exec(CHECKLIST_PAYLOAD));
    expect(md).toContain("## Testing");
    expect(md).toContain("Regression suite");
    expect(md).toContain("PASS");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   DECISION LOG
   ═══════════════════════════════════════════════════════════════════════ */

const DECISION_PAYLOAD: DecisionLogPayload = {
  skill: "decision-log", project: "Finwave",
  entries: [{
    area: "Scope", originalPlan: "Build v1", revisedPlan: "Build v2", reason: "Business change",
    changeProposedBy: "PM", deliveryImpact: "+2w", technicalImpact: "None",
    productOwnerImpact: "Delay", costImpact: "+$5k", changeStatus: "Approved", changeApprovedBy: "CTO",
  }],
};

describe("generatePublishMarkdown - decision-log", () => {
  it("renders a table with Area and Status columns", () => {
    const md = generatePublishMarkdown(exec(DECISION_PAYLOAD));
    expect(md).toContain("| Area |");
    expect(md).toContain("Scope");
    expect(md).toContain("Approved");
    expect(md).toContain("CTO");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   BUDGET TRACKER
   ═══════════════════════════════════════════════════════════════════════ */

const BUDGET_PAYLOAD: BudgetTrackerPayload = {
  skill: "budget-tracker", project: "Finwave", verdict: "green",
  approved: 100000, spent: 40000, committed: 0, remaining: 60000,
  forecastAtCompletion: 40000, variance: 60000, timeElapsedPct: 40, scopeCompletePct: 40,
  developers: [{ name: "Alice", hours: 100, rate: 200, cost: 20000 }],
};

describe("generatePublishMarkdown - budget-tracker", () => {
  it("renders budget summary table", () => {
    const md = generatePublishMarkdown(exec(BUDGET_PAYLOAD));
    expect(md).toContain("## Summary");
    expect(md).toContain("Approved budget"); // no change orders -> collapsed single row
    expect(md).toContain("100,000");
  });
  it("renders developer breakdown table", () => {
    const md = generatePublishMarkdown(exec(BUDGET_PAYLOAD));
    expect(md).toContain("Developer Cost");
    expect(md).toContain("Alice");
    expect(md).toContain("20,000");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   ROADMAP
   ═══════════════════════════════════════════════════════════════════════ */

const ROADMAP_PAYLOAD: RoadmapPayload = {
  skill: "roadmap", goal: "Ship MVP", horizon: "Q3 2026", weeks: 8,
  lanes: ["Sprint 1", "Sprint 2"],
  tasks: [{ name: "Auth", lane: "Sprint 1", startWeek: 1, endWeek: 2, startDate: "2026-07-01", endDate: "2026-07-14" }],
};

describe("generatePublishMarkdown - roadmap", () => {
  it("includes the goal", () => {
    expect(generatePublishMarkdown(exec(ROADMAP_PAYLOAD))).toContain("Ship MVP");
  });
  it("renders a task table with Lane and Task columns", () => {
    const md = generatePublishMarkdown(exec(ROADMAP_PAYLOAD));
    expect(md).toContain("| Lane |");
    expect(md).toContain("Sprint 1");
    expect(md).toContain("Auth");
    expect(md).toContain("2026-07-01");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   SPRINT REPORT
   ═══════════════════════════════════════════════════════════════════════ */

const REPORT_PAYLOAD: SprintReportPayload = {
  skill: "sprint-report", sprint: "Sprint 3", day: 5, totalDays: 10,
  status: "amber", confidence: 70, forecast: "On track",
  committed: 20, completed: 10,
  velocityTrend: [{ sprint: "S2", points: 18 }, { sprint: "S3", points: 10 }],
  burndown: [], topRisks: ["Dependency on API"],
  summary: "Halfway there, pacing well.", priorities: ["Finish auth"], actionsToday: ["Review PR"],
};

describe("generatePublishMarkdown - sprint-report", () => {
  it("includes sprint name and confidence", () => {
    const md = generatePublishMarkdown(exec(REPORT_PAYLOAD));
    expect(md).toContain("Sprint 3");
    expect(md).toContain("70%");
  });
  it("renders progress table with committed/completed", () => {
    const md = generatePublishMarkdown(exec(REPORT_PAYLOAD));
    expect(md).toContain("Committed");
    expect(md).toContain("20");
    expect(md).toContain("Completed");
    expect(md).toContain("10");
  });
  it("renders top risks", () => {
    expect(generatePublishMarkdown(exec(REPORT_PAYLOAD))).toContain("Dependency on API");
  });
  it("renders velocity trend table", () => {
    const md = generatePublishMarkdown(exec(REPORT_PAYLOAD));
    expect(md).toContain("Velocity Trend");
    expect(md).toContain("S2");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   DOC PAYLOAD - all section kinds
   ═══════════════════════════════════════════════════════════════════════ */

describe("generatePublishMarkdown - doc payload section kinds", () => {
  const docExec = (sections: DocPayload["sections"], status?: DocPayload["status"]): SkillExecution =>
    exec({ skill: "triage", sections, status } as DocPayload);

  it("fields → two-column table", () => {
    const md = generatePublishMarkdown(docExec([{ kind: "fields", heading: "Details", pairs: [{ label: "Client", value: "Acme" }] }]));
    expect(md).toContain("| Client |");
    expect(md).toContain("Acme");
  });

  it("bullets → hyphen list", () => {
    const md = generatePublishMarkdown(docExec([{ kind: "bullets", heading: "Actions", items: ["Do A", "Do B"] }]));
    expect(md).toContain("- Do A");
    expect(md).toContain("- Do B");
  });

  it("rows → pipe-table with columns", () => {
    const md = generatePublishMarkdown(docExec([{
      kind: "rows", heading: "Team",
      columns: ["Name", "Role"], rows: [["Alice", "PM"]],
    }]));
    expect(md).toContain("| Name |");
    expect(md).toContain("Alice");
  });

  it("text → paragraph body", () => {
    const md = generatePublishMarkdown(docExec([{ kind: "text", heading: "Summary", body: "All good." }]));
    expect(md).toContain("All good.");
  });

  it("tags → comma-separated values", () => {
    const md = generatePublishMarkdown(docExec([{ kind: "tags", heading: "Tags", items: ["urgent", "v2"] }]));
    expect(md).toContain("urgent");
    expect(md).toContain("v2");
  });

  it("status → prepends a Status line", () => {
    const md = generatePublishMarkdown(docExec([], { label: "On track", tone: "success" }));
    expect(md).toContain("**Status:** On track");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   TABLE CELL SAFETY
   ═══════════════════════════════════════════════════════════════════════ */

describe("table cell escaping", () => {
  it("escapes pipe characters in cell values so they don't break the table", () => {
    const payload: RiskScanPayload = {
      ...RISK_PAYLOAD,
      register: [{ ...RISK_PAYLOAD.register[0], risk: "A | B risk" }],
    };
    const md = generatePublishMarkdown(exec(payload));
    expect(md).toContain("A \\| B risk");
    // Should not produce a broken extra column
    const lines = md.split("\n").filter((l) => l.includes("A "));
    expect(lines[0].split("|").length).toBeLessThan(15);
  });

  it("replaces newlines in cell values with spaces", () => {
    const payload: RiskScanPayload = {
      ...RISK_PAYLOAD,
      register: [{ ...RISK_PAYLOAD.register[0], risk: "Line 1\nLine 2" }],
    };
    const md = generatePublishMarkdown(exec(payload));
    expect(md).not.toContain("Line 1\nLine 2");
    expect(md).toContain("Line 1 Line 2");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   UPGRADED VISUAL SKILLS - the deliverable path must export the new sections
   (guards against a renderer going stale after a payload upgrade).
   ═══════════════════════════════════════════════════════════════════════ */

describe("generatePublishMarkdown - upgraded visual skills export their new sections", () => {
  const md = (skill: string) => generatePublishMarkdown((SAMPLE_ARTIFACTS as Record<string, SkillExecution>)[skill]!);

  it("roadmap exports Now/Next/Later buckets, hard commitments, and changes-since, not just the old Gantt", () => {
    const m = md("roadmap");
    expect(m).toContain("## Now");
    expect(m).toContain("Hard Commitments");
    expect(m).toContain("Changes since");
    expect(m).toContain("Confidence");
  });
  it("sprint-report exports a close-out with a Not-assessable confidence and carry-over, never undefined%", () => {
    const m = md("sprint-report");
    expect(m).toContain("Not assessable");
    expect(m).not.toContain("undefined%");
    expect(m).toContain("Carry-over");
  });
  it("decision-log exports an index and a supersede link", () => {
    const m = md("decision-log");
    expect(m).toContain("## Index");
    expect(m).toContain("Supersedes");
  });
  it("release-checklist exports conditions and a path to GO", () => {
    const m = md("release-checklist");
    expect(m).toContain("Conditions");
    expect(m).toContain("Path to GO");
  });
  it("sprint-planning exports the velocity anchor and per-person load", () => {
    const m = md("sprint-planning");
    expect(m).toContain("Velocity anchor");
    expect(m).toContain("Per-person Load");
  });
  it("risk-scan exports the top-risk detail, decisions needed, and stakeholder summary", () => {
    const m = md("risk-scan");
    expect(m).toContain("Top Risks - Detail");
    expect(m).toContain("Decisions Needed");
    expect(m).toContain("Stakeholder Summary");
    expect(m).toContain("Key Assumptions");
  });
  it("stories exports the coverage note and priority", () => {
    const m = md("stories");
    expect(m).toContain("Requirement coverage");
    expect(m).toContain("Priority");
  });
  it("budget-tracker exports the baseline split, forecast method, and actions", () => {
    const m = md("budget-tracker");
    expect(m).toContain("Current baseline");
    expect(m).toContain("scope-based");
    expect(m).toContain("## Variance Drivers");
    expect(m).toContain("## Actions");
  });
  it("no visual-skill export contains an emoji RAG label", () => {
    for (const s of ["risk-scan", "sprint-report", "budget-tracker", "release-checklist"]) {
      expect(md(s)).not.toMatch(/[\u{1F534}\u{1F7E1}\u{1F7E2}]/u);
    }
  });
});
