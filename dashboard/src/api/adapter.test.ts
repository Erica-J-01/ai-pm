import { describe, it, expect } from "vitest";
import { adaptArtifact } from "@/api/adapter";
import type { DocPayload } from "@/types/pm";
import { SAMPLE_ARTIFACTS } from "@/data/sampleArtifacts";
import { STEPS, TEST_DATA } from "@/components/onboarding/steps";
import { buildExecution } from "@/components/onboarding/buildArtifact";
import { onboardingValues } from "@/lib/onboarding";

/** Helper: adapt a triage (doc) markdown and return its sections. */
function sections(markdown: string) {
  const payload = adaptArtifact("triage", markdown) as DocPayload | undefined;
  return payload?.sections ?? [];
}

describe("adaptArtifact - doc field parsing", () => {
  it("parses a label-on-its-own-line field (the skill house format) as a labelled field", () => {
    const secs = sections(`## Requirement Intake Summary

**Requester & Source:**
Priya, account manager, via Slack on 9 July. She relays the CEO's ask.`);
    const field = secs.find((s) => s.kind === "fields");
    expect(field).toBeTruthy();
    expect(field?.pairs?.[0]?.label).toBe("Requester & Source");
    expect(field?.pairs?.[0]?.value).toContain("Priya");
  });

  it("still parses an inline label field", () => {
    const secs = sections(`## Summary

**Request Summary:** The CEO wants onboarding fixed by end of month.`);
    const field = secs.find((s) => s.kind === "fields");
    expect(field?.pairs?.[0]?.label).toBe("Request Summary");
    expect(field?.pairs?.[0]?.value).toContain("onboarding");
  });

  it("renders a bullet list as bullets, not fields", () => {
    const secs = sections(`## Clear

**What Is Clear**
- Trigger event is known
- Audience is enterprise clients`);
    const bullets = secs.find((s) => s.kind === "bullets");
    expect(bullets?.items?.length).toBe(2);
  });

  it("renders a two-column table as rows with headers", () => {
    const secs = sections(`## Missing

**Missing Information**

| Question | For |
|---|---|
| Which channels? | Ask requester |
| Existing infra? | Check internally |`);
    const rows = secs.find((s) => s.kind === "rows");
    expect(rows?.columns).toEqual(["Question", "For"]);
    expect(rows?.rows?.length).toBe(2);
  });
});

/** Proves the artifact section actually surfaces the triage fields the updated
 *  skill generates, on both display paths (seeded sample and structured stub). */
describe("triage artifact surfaces all updated fields", () => {
  const labelsOf = (secs: { heading?: string; pairs?: { label: string }[] }[]) =>
    secs.flatMap((s) => [s.heading, ...(s.pairs?.map((p) => p.label) ?? [])]).filter(Boolean).join(" | ");

  it("the seeded demo sample shows Requester & Source, Urgency, and Impact on Current Work", () => {
    const md = SAMPLE_ARTIFACTS.triage!.markdown;
    const payload = adaptArtifact("triage", md) as DocPayload;
    const labels = labelsOf(payload.sections);
    expect(labels).toContain("Requester & Source");
    expect(labels).toContain("Urgency");
    expect(labels).toContain("Impact on Current Work");
    // Missing Information carries the audience column
    const rows = payload.sections.find((s) => s.kind === "rows");
    expect(rows?.columns).toContain("For");
  });

  it("the structured stub (form -> buildExecution) shows the new fields too", () => {
    const step = STEPS.find((s) => s.id === "triage")!;
    const exec = buildExecution(step, TEST_DATA.triage!, "c", "p");
    const payload = exec.payload as DocPayload;
    const labels = labelsOf(payload.sections);
    expect(labels).toContain("Requester & source");
    expect(labels).toContain("Urgency");
    expect(labels).toContain("Impact on current work");
    expect(labels).toContain("Intake classification");
  });
});

/** Proves the stories artifact carries priority, traceability, TBD size, and coverage. */
describe("stories artifact surfaces the new fields", () => {
  it("the seeded sample carries priority, linked requirement, a TBD size, and a coverage note", () => {
    const payload = SAMPLE_ARTIFACTS.stories!.payload as import("@/types/pm").StoriesPayload;
    const first = payload.epics[0]?.stories[0];
    expect(first?.priority).toBe("Must");
    expect(first?.linkedRequirement).toBe("FR-01");
    expect(payload.epics[0]?.stories.some((s) => s.points === "TBD")).toBe(true);
    expect(payload.coverageNote).toBeTruthy();
  });

  it("the structured stub maps priority, linked requirement, and TBD points through buildExecution", () => {
    const step = STEPS.find((s) => s.id === "stories")!;
    const payload = buildExecution(step, TEST_DATA.stories!, "c", "p").payload as import("@/types/pm").StoriesPayload;
    const first = payload.epics[0]?.stories[0];
    expect(first?.priority).toBe("Must");
    expect(first?.linkedRequirement).toBe("FR-01");
    expect(payload.epics.flatMap((e) => e.stories).some((s) => s.points === "TBD")).toBe(true);
  });
});

/** Proves the charter artifact surfaces the new sections on both paths. */
describe("charter artifact surfaces the new sections", () => {
  const headings = (secs: { heading?: string }[]) => secs.map((s) => s.heading).filter(Boolean).join(" | ");

  it("the seeded sample shows Governance, Client-side dependencies, and an Assumptions Log", () => {
    const md = SAMPLE_ARTIFACTS.charter!.markdown;
    const secs = (adaptArtifact("charter", md) as DocPayload).sections;
    const h = headings(secs);
    expect(h).toContain("Governance");
    expect(h).toContain("Client-side dependencies");
    expect(h).toContain("Assumptions Log");
    expect(md).toContain("[proposed - confirm]");
    expect(md).toContain("Commercial basis");
  });

  it("the structured stub (form -> buildExecution) shows the new lists", () => {
    const step = STEPS.find((s) => s.id === "charter")!;
    const secs = (buildExecution(step, TEST_DATA.charter!, "c", "p").payload as DocPayload).sections;
    const h = headings(secs);
    expect(h).toContain("Governance");
    expect(h).toContain("Constraints");
    expect(h).toContain("Assumptions");
    expect(h).toContain("Client-side dependencies");
  });
});

/** Proves the PRD artifact carries the new sections on both paths. */
describe("prd artifact surfaces the new sections", () => {
  const headings = (secs: { heading?: string }[]) => secs.map((s) => s.heading).filter(Boolean).join(" | ");
  const hasCol = (secs: { kind: string; columns?: string[] }[], col: string) =>
    secs.some((s) => s.kind === "rows" && (s.columns ?? []).includes(col));

  it("the seeded sample shows a Baseline column, Key User Journeys, and Dependencies", () => {
    const md = SAMPLE_ARTIFACTS.prd!.markdown;
    const secs = (adaptArtifact("prd", md) as DocPayload).sections;
    expect(headings(secs)).toContain("Key User Journeys");
    expect(headings(secs)).toContain("Dependencies");
    expect(hasCol(secs, "Baseline")).toBe(true);
  });

  it("the structured stub shows Baseline in goals, Key user journeys, and dependency status", () => {
    const step = STEPS.find((s) => s.id === "prd")!;
    const secs = (buildExecution(step, TEST_DATA.prd!, "c", "p").payload as DocPayload).sections;
    expect(hasCol(secs, "Baseline")).toBe(true);
    expect(headings(secs)).toContain("Key user journeys");
    expect(hasCol(secs, "Status")).toBe(true);
  });
});

/** Proves the discovery findings doc carries the new sections on both paths. */
describe("discovery artifact surfaces the new sections", () => {
  const headings = (secs: { heading?: string }[]) => secs.map((s) => s.heading).filter(Boolean).join(" | ");

  it("the seeded sample shows Who Is Affected, sourced Key Findings, and a Readiness Verdict", () => {
    const md = SAMPLE_ARTIFACTS.discovery!.markdown;
    const secs = (adaptArtifact("discovery", md) as DocPayload).sections;
    const h = headings(secs);
    expect(h).toContain("Who Is Affected and How");
    expect(h).toContain("Readiness Verdict");
    const findings = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Source"));
    expect(findings).toBeTruthy();
    expect(md).toContain("session notes - unattributed");
  });

  it("the structured stub shows the readiness verdict and a sourced findings table", () => {
    const step = STEPS.find((s) => s.id === "discovery")!;
    const secs = (buildExecution(step, TEST_DATA.discovery!, "c", "p").payload as DocPayload).sections;
    expect(headings(secs)).toContain("Readiness verdict");
    const findings = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Source"));
    expect(findings).toBeTruthy();
  });
});

/** Proves the sprint-sow document surfaces the full SOW structure on both paths:
 *  header block, themed deliverables with estimates, the optional dependencies
 *  section, and clean rendering of the goal blockquote and the DoD checklist. */
describe("sprint-sow artifact surfaces the full SOW structure", () => {
  const headings = (secs: { heading?: string }[]) => secs.map((s) => s.heading).filter(Boolean).join(" | ");
  const fieldLabels = (secs: { pairs?: { label: string }[] }[]) =>
    secs.flatMap((s) => s.pairs?.map((p) => p.label) ?? []).join(" | ");
  const hasCol = (secs: { kind: string; columns?: string[] }[], col: string) =>
    secs.some((s) => s.kind === "rows" && (s.columns ?? []).includes(col));

  it("the seeded sample shows the header, themed deliverables with estimates, dependencies, and a clean goal and DoD", () => {
    const md = SAMPLE_ARTIFACTS["sprint-sow"]!.markdown;
    const secs = (adaptArtifact("sprint-sow", md) as DocPayload).sections;
    const h = headings(secs);
    expect(fieldLabels(secs)).toContain("Prepared By");
    expect(fieldLabels(secs)).toContain("Version");
    expect(fieldLabels(secs)).toContain("Status");
    expect(h).toContain("Sprint Goal");
    expect(h).toContain("Sprint Team");
    expect(h).toContain("1. Event Consumption");
    expect(h).toContain("Dependencies & Assumptions");
    expect(h).toContain("Approval");
    // themed deliverable tables carry an Estimate column
    expect(hasCol(secs, "Estimate")).toBe(true);
    // the sprint goal blockquote renders as clean prose (no leading ">")
    const goal = secs.find((s) => s.heading === "Sprint Goal");
    expect(goal?.body).toContain("Deliver");
    expect(goal?.body).not.toContain(">");
    // the DoD checklist renders as clean bullets (no "[ ]" marker survives)
    const dod = secs.find((s) => s.heading === "Definition of Done" && s.kind === "bullets");
    expect(dod?.items?.some((i) => i.includes("Code reviewed and merged to main"))).toBe(true);
    expect(dod?.items?.every((i) => !i.includes("[ ]"))).toBe(true);
  });

  it("the structured stub (form -> buildExecution) shows the goal, themed deliverables, and dependencies", () => {
    const step = STEPS.find((s) => s.id === "sprint-sow")!;
    const secs = (buildExecution(step, TEST_DATA["sprint-sow"]!, "c", "p").payload as DocPayload).sections;
    const h = headings(secs);
    expect(h).toContain("Sprint goal");
    expect(h).toContain("Sprint team");
    expect(h).toContain("Deliverables by theme");
    expect(h).toContain("Dependencies & assumptions");
    expect(h).toContain("Definition of Done");
    expect(hasCol(secs, "Theme")).toBe(true);
    expect(hasCol(secs, "Ticket")).toBe(true);
    expect(hasCol(secs, "Estimate")).toBe(true);
    expect(fieldLabels(secs)).toContain("Status");
  });
});

/** Proves the meeting-notes minutes surface the full structure on both paths:
 *  title header, key discussion points, an Unassigned action, open questions
 *  (with attribution-unclear), and the follow-up questions. */
describe("meeting-notes artifact surfaces the full minutes structure", () => {
  const headings = (secs: { heading?: string }[]) => secs.map((s) => s.heading).filter(Boolean).join(" | ");
  const fieldLabels = (secs: { pairs?: { label: string }[] }[]) =>
    secs.flatMap((s) => s.pairs?.map((p) => p.label) ?? []).join(" | ");

  it("the seeded sample shows the title header, key discussion points, an unassigned action, and follow-ups", () => {
    const md = SAMPLE_ARTIFACTS["meeting-notes"]!.markdown;
    const secs = (adaptArtifact("meeting-notes", md) as DocPayload).sections;
    expect(fieldLabels(secs)).toContain("Title");
    expect(fieldLabels(secs)).toContain("Duration");
    const h = headings(secs);
    expect(h).toContain("Summary");
    expect(h).toContain("Key Discussion Points");
    expect(h).toContain("Action Items");
    expect(h).toContain("Want to dig deeper?");
    const actions = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Who"));
    expect(actions?.rows?.some((r) => r[0] === "Unassigned")).toBe(true);
    // attribution uncertainty is surfaced, not papered over
    expect(md).toContain("attribution unclear");
  });

  it("the structured stub shows key discussion points, an unassigned action, and follow-ups", () => {
    const step = STEPS.find((s) => s.id === "meeting-notes")!;
    const secs = (buildExecution(step, TEST_DATA["meeting-notes"]!, "c", "p").payload as DocPayload).sections;
    const h = headings(secs);
    expect(h).toContain("Key discussion points");
    expect(h).toContain("Action items");
    expect(h).toContain("Want to dig deeper?");
    const actions = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Who (or Unassigned)"));
    expect(actions?.rows?.some((r) => r.includes("Unassigned"))).toBe(true);
  });
});

/** Proves the tech-review surfaces the feasibility verdict, estimate assessment,
 *  cost line, risks-with-note, top risk, and scope implications on both paths. */
describe("tech-review artifact surfaces the feasibility sections", () => {
  const headings = (secs: { heading?: string }[]) => secs.map((s) => s.heading).filter(Boolean).join(" | ");
  const fieldLabels = (secs: { pairs?: { label: string }[] }[]) =>
    secs.flatMap((s) => s.pairs?.map((p) => p.label) ?? []).join(" | ");

  it("the seeded sample shows the verdict, estimate, cost, a risks table with a Note, the top risk, and scope implications", () => {
    const md = SAMPLE_ARTIFACTS["tech-review"]!.markdown;
    const secs = (adaptArtifact("tech-review", md) as DocPayload).sections;
    expect(fieldLabels(secs)).toContain("Project");
    expect(fieldLabels(secs)).toContain("Timeline"); // delivery implications render as labelled fields
    const h = headings(secs);
    expect(h).toContain("Feasibility Verdict");
    expect(h).toContain("Estimate Assessment");
    expect(h).toContain("Cost / Commercial");
    expect(h).toContain("Top Risk to Act On Now");
    expect(h).toContain("Scope Implications");
    const risks = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Note"));
    expect(risks?.columns).toContain("Likelihood");
    expect(risks?.rows?.some((r) => r.join(" ").toLowerCase().includes("rollback"))).toBe(true); // omission-derived risk
    // bodies carry substance, not just headings - a gutted section would fail here
    expect(secs.find((s) => s.heading === "Feasibility Verdict")?.body).toContain("Feasible with conditions");
    expect(secs.find((s) => s.heading === "Estimate Assessment")?.body?.toLowerCase()).toContain("exclude");
  });

  it("the structured stub shows the verdict, estimate, cost, top risk, and a risks table with a Note", () => {
    const step = STEPS.find((s) => s.id === "tech-review")!;
    const secs = (buildExecution(step, TEST_DATA["tech-review"]!, "c", "p").payload as DocPayload).sections;
    expect(fieldLabels(secs)).toContain("Feasibility verdict");
    const h = headings(secs);
    expect(h).toContain("Estimate assessment");
    expect(h).toContain("Cost / commercial");
    expect(h).toContain("Top risk to act on now");
    expect(h).toContain("Scope implications");
    const risks = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Note"));
    expect(risks).toBeTruthy();
  });
});

/** Proves the retrospective synthesise output surfaces sprint facts, prior actions,
 *  a recurring theme, and an escalation action on both paths. */
describe("retrospective artifact surfaces the synthesise structure", () => {
  const headings = (secs: { heading?: string }[]) => secs.map((s) => s.heading).filter(Boolean).join(" | ");
  const fieldLabels = (secs: { pairs?: { label: string }[] }[]) =>
    secs.flatMap((s) => s.pairs?.map((p) => p.label) ?? []).join(" | ");

  it("the seeded sample shows sprint facts, prior actions, a recurring theme, and an escalation action", () => {
    const md = SAMPLE_ARTIFACTS["retrospective"]!.markdown;
    const secs = (adaptArtifact("retrospective", md) as DocPayload).sections;
    expect(fieldLabels(secs)).toContain("Sprint facts");
    const h = headings(secs);
    expect(h).toContain("Prior Actions Review");
    expect(h).toContain("What Didn't");
    expect(h).toContain("Action Items");
    expect(h).toContain("Parked - revisit if it recurs");
    const didnt = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Theme"));
    expect(didnt?.rows?.some((r) => r.join(" ").includes("(Recurring)"))).toBe(true);
    const actions = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Addresses"));
    expect(actions?.rows?.some((r) => r.join(" ").includes("Escalation:"))).toBe(true);
  });

  it("the structured stub shows prior actions, what-didn't with a Recurring column, and an escalation column", () => {
    const step = STEPS.find((s) => s.id === "retrospective")!;
    const secs = (buildExecution(step, TEST_DATA["retrospective"]!, "c", "p").payload as DocPayload).sections;
    expect(fieldLabels(secs)).toContain("Sprint facts");
    const h = headings(secs);
    expect(h).toContain("Prior actions review");
    expect(h).toContain("Action items");
    expect(h).toContain("Parked - revisit if it recurs");
    const didnt = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Recurring?"));
    expect(didnt?.rows?.some((r) => r.includes("Yes"))).toBe(true);
    const actions = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Escalation?"));
    expect(actions?.rows?.some((r) => r.includes("Yes"))).toBe(true);
  });
});

/** Proves the stakeholder-update surfaces the RAG-trend banner, budget, moved key
 *  dates, and next-update on both paths, and de-dupes the status out of the fields. */
describe("stakeholder-update artifact surfaces the trend, budget, and key dates", () => {
  const headings = (secs: { heading?: string }[]) => secs.map((s) => s.heading).filter(Boolean).join(" | ");

  it("the seeded sample shows an AMBER-down-from-GREEN banner, budget, and a moved key date", () => {
    const md = SAMPLE_ARTIFACTS["stakeholder-update"]!.markdown;
    const payload = adaptArtifact("stakeholder-update", md) as DocPayload;
    expect(payload.status?.tone).toBe("warning");
    expect(payload.status?.label).toContain("AMBER");
    expect(payload.status?.label).toContain("down from");
    expect(payload.status?.label).not.toMatch(/AMBER\W+AMBER/i); // de-dup: never doubles the RAG word
    // the status is shown only in the banner, not duplicated as a field
    const labels = payload.sections.flatMap((s) => s.pairs?.map((p) => p.label) ?? []);
    expect(labels).toContain("Headline");
    expect(labels.some((l) => /status|rag/i.test(l))).toBe(false);
    const h = headings(payload.sections);
    expect(h).toContain("Budget");
    expect(h).toContain("Next update");
    const kdValues = payload.sections.flatMap((s) => s.pairs?.map((p) => `${p.label}: ${p.value}`) ?? []);
    expect(kdValues.some((s) => s.includes("was 3 July"))).toBe(true);
  });

  it("the structured stub derives the trend banner and shows budget, a Was column, and next update", () => {
    const step = STEPS.find((s) => s.id === "stakeholder-update")!;
    const payload = buildExecution(step, TEST_DATA["stakeholder-update"]!, "c", "p").payload as DocPayload;
    expect(payload.status?.tone).toBe("warning");
    expect(payload.status?.label).toBe("At risk, down from On track");
    const h = headings(payload.sections);
    expect(h).toContain("Budget");
    const kd = payload.sections.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Was (previous date)"));
    expect(kd?.rows?.some((r) => r.includes("2026-07-03"))).toBe(true);
    const labels = payload.sections.flatMap((s) => s.pairs?.map((p) => p.label) ?? []);
    expect(labels).toContain("Next update");
    expect(labels).not.toContain("Previous status (for the trend)"); // consumed by the banner, not a field
  });
});

/** Proves the onboarding brief renders as a DOC skill on both paths: the internal
 *  header, cadence, who's-who, decisions, risks, and the access checklist. */
describe("onboarding artifact surfaces the starter-brief structure", () => {
  const headings = (secs: { heading?: string }[]) => secs.map((s) => s.heading).filter(Boolean).join(" | ");
  const fieldLabels = (secs: { pairs?: { label: string }[] }[]) =>
    secs.flatMap((s) => s.pairs?.map((p) => p.label) ?? []).join(" | ");

  it("the seeded sample shows the internal header, who's-who, what-to-read, and a clean access checklist", () => {
    const md = SAMPLE_ARTIFACTS["onboarding"]!.markdown;
    const secs = (adaptArtifact("onboarding", md) as DocPayload).sections;
    expect(fieldLabels(secs)).toContain("Role");
    expect(fieldLabels(secs)).toContain("Handle with care");
    expect(md).toContain("Internal - not for client distribution");
    const h = headings(secs);
    expect(h).toContain("In One Paragraph");
    expect(h).toContain("Who's Who");
    expect(h).toContain("What to Read First");
    expect(h).toContain("First-Week Checklist");
    const who = secs.find((s) => s.kind === "rows" && (s.columns ?? []).includes("Name / Role"));
    expect(who).toBeTruthy();
    const cl = secs.find((s) => s.heading === "First-Week Checklist" && s.kind === "bullets");
    expect(cl?.items?.some((i) => i.includes("GitHub repo access"))).toBe(true);
    expect(cl?.items?.every((i) => !i.includes("[ ]"))).toBe(true); // checkbox markers stripped
    // the grantor and lead time survive, not just the item text
    expect(cl?.items?.some((i) => i.includes("Finwave IT"))).toBe(true);
    expect(cl?.items?.some((i) => i.toLowerCase().includes("lead time"))).toBe(true);
  });

  it("the auto-filled brief renders the derived VALUES from the siblings, not just the section headings", () => {
    const step = STEPS.find((s) => s.id === "onboarding")!;
    // Onboarding is now an app form: the auto fields derive from the project's
    // other artefacts, the human fields come from the saved stub.
    const siblings = {
      charter: {
        purpose: "Real-time payment failure visibility for enterprise clients.",
        sponsor: "Sarah (VP Product)",
        approvals: [{ role: "Tech Lead", name: "Marcus" }],
      },
      "risk-scan": { risks: [
        { risk: "Redis in the wrong region", response: "Mitigate now" },
        { risk: "SendGrid throttling", response: "Monitor" },
      ]},
      "decision-log": { entries: [{ title: "Cut reporting from MVP", date: "2026-05-02" }] },
      "sprint-report": { sprint: "3", status: "AMBER", summary: "2 stories at risk" },
      "sprint-planning": { sprintGoal: "Ship the live dashboard." },
    };
    const values = onboardingValues(siblings, "FinWave", "delivery", TEST_DATA["onboarding"]!);
    const secs = (buildExecution(step, values, "c", "p").payload as DocPayload).sections;
    const byHeading = (h: string) => secs.find((s) => s.heading === h);

    // human field survives from the stub
    expect(fieldLabels(secs)).toContain("Joiner role");

    // summary body is the charter purpose verbatim (not just a "Summary" heading)
    expect(byHeading("In one paragraph")?.body).toBe("Real-time payment failure visibility for enterprise clients.");

    // who's-who rows carry the sponsor and the approval, with the role
    const who = byHeading("Who's who");
    expect(who?.rows?.some((r) => r.includes("Sarah (VP Product)"))).toBe(true);
    expect(who?.rows?.some((r) => r.join(" ").includes("Marcus") && r.join(" ").includes("Tech Lead"))).toBe(true);

    // risks rows match the risk scan item + response
    const risks = byHeading("Live risks & open questions");
    expect(risks?.rows?.some((r) => r[0] === "Redis in the wrong region" && r[1] === "Mitigate now")).toBe(true);

    // decisions carry the decision-log title and date
    expect(byHeading("Key decisions already made")?.items).toContain("Cut reporting from MVP (2026-05-02)");

    // where-we-are reflects the sprint report status and the plan goal
    const where = byHeading("Where we are now");
    expect(where?.items?.some((i) => i.includes("AMBER") && i.includes("2 stories at risk"))).toBe(true);
    expect(where?.items?.some((i) => i.includes("Ship the live dashboard."))).toBe(true);

    // human field: the access checklist keeps its grantor from the stub
    const cl = byHeading("First-week checklist");
    expect(cl?.rows?.some((r) => r.join(" ").includes("Finwave IT"))).toBe(true);
  });
});

/** Proves the risk-scan artifact carries the updated sections on both paths. */
describe("risk-scan artifact surfaces the updated sections", () => {
  it("the seeded sample carries top-risk detail, mitigation actions, experiments, and a changes delta", () => {
    const payload = SAMPLE_ARTIFACTS["risk-scan"]!.payload as import("@/types/pm").RiskScanPayload;
    expect(payload.topRisksDetail?.length).toBeGreaterThan(0);
    expect(payload.topRisksDetail?.[0]?.rootCause).toBeTruthy();
    expect(payload.mitigationActions?.length).toBeGreaterThan(0);
    expect(payload.validationExperiments?.length).toBeGreaterThan(0);
    expect(payload.changesSinceLastScan?.escalated?.length).toBeGreaterThan(0);
  });

  it("a risk's trigger-signal input flows through buildExecution into the register", () => {
    const step = STEPS.find((s) => s.id === "risk-scan")!;
    const values = {
      risks: [{
        risk: "Vendor API access unconfirmed blocks the booking build",
        category: "Dependency", likelihood: "H", impact: "H",
        detectability: "Hard", velocity: "Fast", response: "Escalate",
        owner: "Katie Lund", triggerSignal: "Sandbox credentials not issued by end of sprint 1",
      }],
    };
    const exec = buildExecution(step, values, "c", "p");
    const payload = exec.payload as import("@/types/pm").RiskScanPayload;
    expect(payload.register[0]?.triggerSignal).toBe("Sandbox credentials not issued by end of sprint 1");
    // stub extras still present so the view renders the analytical sections
    expect(payload.topRisksDetail?.length).toBeGreaterThan(0);
  });
});
