import { describe, it, expect } from "vitest";
import { seedFor, withDemoSeeds } from "@/store/workspace";
import { TEST_DATA } from "@/components/onboarding/steps";

describe("seedFor (demo-seed guard)", () => {
  it("never falls back to the Finwave TEST_DATA for a demo-seeded project", () => {
    // Pre-seed (or after a failed chunk load) a demo project must stay empty,
    // not render another client's stub data.
    expect(seedFor({}, "p-portal", "triage")).toEqual({});
    expect(seedFor({}, "p-rebuild", "charter")).toEqual({});
  });

  it("falls back to TEST_DATA for non-demo projects", () => {
    expect(seedFor({}, "p-notifications", "triage")).toBe(TEST_DATA.triage);
    expect(seedFor({}, "p-new-123", "triage")).toBe(TEST_DATA.triage);
  });

  it("saved values always win, demo project or not", () => {
    const saved = { purpose: "Custom purpose" };
    expect(seedFor({ "p-portal": { charter: saved } }, "p-portal", "charter")).toBe(saved);
    expect(seedFor({ "p-new-123": { charter: saved } }, "p-new-123", "charter")).toBe(saved);
  });
});

describe("withDemoSeeds (lazy seed merge)", () => {
  const portal = { triage: { requestSummary: "portal triage" }, charter: { purpose: "portal charter" } };
  const acme = { triage: { requestSummary: "acme triage" } };

  it("seeds both demo projects and leaves other projects untouched", () => {
    const merged = withDemoSeeds({ "p-notifications": { triage: { requestSummary: "finwave" } } }, portal, acme);
    expect(merged["p-portal"]?.triage).toEqual({ requestSummary: "portal triage" });
    expect(merged["p-rebuild"]?.triage).toEqual({ requestSummary: "acme triage" });
    expect(merged["p-notifications"]?.triage).toEqual({ requestSummary: "finwave" });
  });

  it("a skill the user saved before the seeds landed survives the merge", () => {
    const userEdit = { purpose: "user edit" };
    const merged = withDemoSeeds({ "p-portal": { charter: userEdit } }, portal, acme);
    expect(merged["p-portal"]?.charter).toBe(userEdit);        // user value kept
    expect(merged["p-portal"]?.triage).toEqual({ requestSummary: "portal triage" }); // seed fills the rest
  });
});
