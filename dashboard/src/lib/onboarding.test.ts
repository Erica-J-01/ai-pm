import { describe, it, expect } from "vitest";
import { autofillOnboarding, onboardingValues, ONBOARDING_HUMAN_FIELDS } from "@/lib/onboarding";
import { skillTitle } from "@/data/demo";
import type { SkillId } from "@/types/pm";
import type { Row, StepValues } from "@/components/onboarding/steps";

const siblings: Partial<Record<SkillId, StepValues>> = {
  triage: { businessGoal: "Reduce churn from silent payment failures.", requestSummary: "Real-time failure alerts." },
  charter: {
    purpose: "Give enterprise clients real-time payment failure visibility.",
    sponsor: "Sarah (VP Product)",
    approvals: [{ role: "Tech Lead", name: "Marcus" }, { role: "QA Lead", name: "Priya" }],
    risks: [{ risk: "Charter-only risk", likelihood: "High", impact: "High", response: "Mitigate" }],
  },
  "risk-scan": {
    risks: [
      { risk: "R1", response: "Mitigate now" },
      { risk: "R2", response: "Monitor" },
      { risk: "R3", response: "Accept" },
      { risk: "R4", response: "Ignore" },
    ],
  },
  "decision-log": { entries: [{ title: "Dropped reporting from MVP", date: "2026-05-02" }] },
  "sprint-planning": { sprintGoal: "Ship the live dashboard." },
  "sprint-report": { sprint: "3", status: "AMBER", summary: "2 stories at risk", forecast: "On track for the demo" },
};

const list = (v: StepValues[string] | undefined): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

describe("autofillOnboarding", () => {
  const out = autofillOnboarding(siblings, "FinWave", "pre-project");

  it("sets client and title-cased phase", () => {
    expect(out.client).toBe("FinWave");
    expect(out.phase).toBe("Pre-project");
  });

  it("takes the summary from the charter purpose", () => {
    expect(out.summary).toBe("Give enterprise clients real-time payment failure visibility.");
  });

  it("falls back to the triage business goal when there is no charter purpose", () => {
    const noCharter = autofillOnboarding({ triage: siblings.triage }, "FinWave", "delivery");
    expect(noCharter.summary).toBe("Reduce churn from silent payment failures.");
  });

  it("builds who's-who from the sponsor plus the charter approvals", () => {
    const who = list(out.whosWho);
    expect(who).toHaveLength(3);
    expect(who[0].who).toBe("Sarah (VP Product)");
    expect(who[1].who).toContain("Marcus");
    expect(who[1].who).toContain("(Tech Lead)");
  });

  it("takes the top three risks from the risk scan, not the charter", () => {
    const risks = list(out.risks);
    expect(risks).toHaveLength(3);
    expect(risks[0]).toEqual({ item: "R1", why: "Mitigate now" });
    expect(risks.map((r) => r.item)).not.toContain("Charter-only risk");
  });

  it("falls back to charter risks when there is no risk scan", () => {
    const { "risk-scan": _omit, ...noScan } = siblings;
    const risks = list(autofillOnboarding(noScan, "FinWave", "delivery").risks);
    expect(risks[0].item).toBe("Charter-only risk");
  });

  it("lists decisions from the decision log with their date", () => {
    const decisions = list(out.decisions);
    expect(decisions[0].item).toBe("Dropped reporting from MVP (2026-05-02)");
  });

  it("summarises where-we-are from the sprint report and plan with the exact derived lines", () => {
    const where = list(out.whereWeAre);
    expect(where.map((w) => w.item)).toEqual([
      "Sprint 3 - AMBER: 2 stories at risk",
      "Forecast: On track for the demo",
      "Current sprint goal: Ship the live dashboard.",
    ]);
  });

  it("lists the artefacts that exist as their titles in read-first order", () => {
    const read = list(out.readFirst);
    // present siblings, ordered by the delivery chain (READ_ORDER):
    // triage, risk-scan, charter, sprint-planning, sprint-report, decision-log
    expect(read.map((r) => r.item)).toEqual(
      ["triage", "risk-scan", "charter", "sprint-planning", "sprint-report", "decision-log"].map((s) => skillTitle(s)),
    );
  });

  it("never invents the human-only fields", () => {
    for (const field of ONBOARDING_HUMAN_FIELDS) {
      expect(out[field]).toBeUndefined();
    }
  });

  it("invents nothing when there are no siblings", () => {
    const empty = autofillOnboarding({}, "", "");
    expect(empty.summary).toBe("");
    expect(list(empty.whosWho)).toHaveLength(0);
    expect(list(empty.readFirst)).toHaveLength(0);
  });
});

describe("onboardingValues", () => {
  it("keeps the human fields from saved and refreshes the auto fields from siblings", () => {
    const saved: StepValues = {
      role: "QA engineer",
      sensitivities: "Sponsor is sensitive about the delay - keep it factual.",
      summary: "STALE hand-typed summary that must be ignored",
      client: "STALE client",
    };
    const merged = onboardingValues(siblings, "FinWave", "delivery", saved);
    // human fields persist
    expect(merged.role).toBe("QA engineer");
    expect(merged.sensitivities).toContain("Sponsor is sensitive");
    // auto fields always come from the siblings, never the saved copy
    expect(merged.summary).toBe("Give enterprise clients real-time payment failure visibility.");
    expect(merged.client).toBe("FinWave");
  });

  it("leaves human fields blank when nothing was saved", () => {
    const merged = onboardingValues(siblings, "FinWave", "delivery");
    expect(merged.role).toBeUndefined();
    expect(merged.checklist).toBeUndefined();
  });
});
