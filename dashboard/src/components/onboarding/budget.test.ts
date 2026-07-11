import { describe, it, expect } from "vitest";
import { budgetVerdict } from "@/lib/budget";
import type { BudgetTrackerPayload } from "@/types/pm";
import { STEPS, TEST_DATA } from "./steps";
import { buildExecution } from "./buildArtifact";
import { SAMPLE_ARTIFACTS } from "@/data/sampleArtifacts";

describe("budgetVerdict (RAG vs baseline)", () => {
  it("is green within 5%", () => {
    expect(budgetVerdict(100000, 104000).verdict).toBe("green");
  });
  it("is amber at 5-10% over", () => {
    const v = budgetVerdict(100000, 107000);
    expect(v.verdict).toBe("amber");
    expect(v.rule).toContain("5-10%");
  });
  it("is red above 10%", () => {
    expect(budgetVerdict(100000, 115000).verdict).toBe("red");
  });
  it("holds the exact boundaries: 5% amber, 10% amber, just over 10% red", () => {
    expect(budgetVerdict(100000, 105000).verdict).toBe("amber"); // exactly 5%
    expect(budgetVerdict(100000, 110000).verdict).toBe("amber"); // exactly 10%, not yet red
    expect(budgetVerdict(100000, 110001).verdict).toBe("red");   // just over 10%
  });
  it("is red when the budget exhausts before the planned end", () => {
    expect(budgetVerdict(100000, 101000, { exhaustsEarly: true }).verdict).toBe("red");
  });
  it("is amber on a worsening burn even within 5%", () => {
    expect(budgetVerdict(100000, 102000, { worseningBurn: true }).verdict).toBe("amber");
  });
});

describe("buildBudget baseline, forecast, and commercial-model actions", () => {
  const step = STEPS.find((s) => s.id === "budget-tracker")!;
  const build = (v: Record<string, unknown>) => buildExecution(step, v, "c", "p").payload as BudgetTrackerPayload;

  it("splits the baseline, computes the scope-based forecast, and lands amber", () => {
    const p = build(TEST_DATA["budget-tracker"]!);
    expect(p.originalBudget).toBe(80000);
    expect(p.approvedChanges).toBe(5000);
    expect(p.approved).toBe(85000);              // current baseline = original + changes
    expect(p.spent).toBe(54500);
    expect(p.scopeForecast).toBe(90833);         // 54500 / 0.60
    expect(p.forecastMethod).toBe("scope-based");
    expect(p.forecastAtCompletion).toBe(90833);
    expect(p.verdict).toBe("amber");
    expect(p.verdictRule).toContain("5-10%");
    expect(p.movement).toBeTruthy();
    expect(p.knownOneOffs?.length).toBeGreaterThan(0);
  });

  it("words the action to the commercial model - T&M raises a change order", () => {
    const p = build(TEST_DATA["budget-tracker"]!);
    expect(p.commercialModel).toBe("time-and-materials");
    expect(p.actions?.[0]?.action.toLowerCase()).toContain("change order");
  });

  it("uses the run-rate forecast when no scope percentage is given", () => {
    const p = build({ ...TEST_DATA["budget-tracker"]!, scopeComplete: "" });
    expect(p.scopeForecast).toBeUndefined();
    expect(p.forecastMethod).toBe("run-rate");
    expect(p.runRateForecast).toBe(61500);       // spent 54500 + committed 4000 + one-off 3000
    expect(p.forecastAtCompletion).toBe(61500);
  });

  it("words a fixed-price overrun as internal margin escalation, not a change order", () => {
    const p = build({ ...TEST_DATA["budget-tracker"]!, commercialModel: "fixed-price" });
    expect(p.actions?.[0]?.action.toLowerCase()).toContain("margin");
    expect(p.actions?.[0]?.action.toLowerCase()).not.toContain("change order");
  });
});

describe("budget-tracker seeded sample", () => {
  it("carries the baseline split, forecast method, variance drivers, and actions", () => {
    const sp = SAMPLE_ARTIFACTS["budget-tracker"]!.payload as BudgetTrackerPayload;
    expect(sp.verdict).toBe("amber");
    expect(sp.approvedChanges).toBe(5000);
    expect(sp.forecastMethod).toBe("scope-based");
    expect(sp.varianceDrivers?.length).toBeGreaterThan(0);
    expect(sp.actions?.length).toBeGreaterThan(0);
    expect(sp.commercialModel).toBe("time-and-materials");
  });
});
