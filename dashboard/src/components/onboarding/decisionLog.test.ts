import { describe, it, expect } from "vitest";
import type { DecisionLogPayload } from "@/types/pm";
import { STEPS, TEST_DATA } from "./steps";
import { buildExecution } from "./buildArtifact";
import { SAMPLE_ARTIFACTS } from "@/data/sampleArtifacts";

const step = STEPS.find((s) => s.id === "decision-log")!;
const build = (v: Record<string, unknown>) => buildExecution(step, v, "c", "p").payload as DecisionLogPayload;

describe("buildDecisionLog register sequencing and sign-off", () => {
  it("assigns a D-00N id sequence, carries supersede and status, and captures discussed-not-decided", () => {
    const p = build(TEST_DATA["decision-log"]!);
    expect(p.entries.map((e) => e.id)).toEqual(["D-001", "D-002", "D-003"]);
    expect(p.entries[0]!.changeStatus).toBe("Superseded");
    expect(p.entries[2]!.supersedes).toBe("D-001");
    expect(p.discussedNotDecided?.length).toBe(1);
    expect(p.version).toBe("1.3");
    expect(p.preparedBy).toBe("PM");
  });

  it("nudges only the entries that still need sign-off, by id", () => {
    const p = build(TEST_DATA["decision-log"]!);
    expect(p.signOffNudge).toBeTruthy();
    expect(p.signOffNudge).toContain("D-002");     // Under Review
    expect(p.signOffNudge).not.toContain("D-001"); // Superseded, closed
    expect(p.signOffNudge).not.toContain("D-003"); // Approved with a named approver
  });

  it("nudges an Approved decision whose approver is still [TBC]", () => {
    const p = build({ project: "P", entries: [{ area: "Scope", revisedPlan: "X", changeStatus: "Approved", changeApprovedBy: "" }] });
    expect(p.entries[0]!.changeApprovedBy).toBe("[TBC]");
    expect(p.signOffNudge).toContain("D-001");
  });

  it("emits no nudge when every decision is approved with a named approver", () => {
    const p = build({ project: "P", entries: [{ area: "Scope", revisedPlan: "X", changeStatus: "Approved", changeApprovedBy: "Sarah" }] });
    expect(p.signOffNudge).toBeUndefined();
  });

  it("falls back to the revised plan for the title when none is given", () => {
    const p = build({ project: "P", entries: [{ area: "Scope", revisedPlan: "Move webhooks to Sprint 2", changeStatus: "Approved", changeApprovedBy: "Sarah" }] });
    expect(p.entries[0]!.title).toBe("Move webhooks to Sprint 2");
  });
});

describe("decision-log seeded sample", () => {
  it("is a multi-entry register with a supersede link, a sign-off nudge, and a discussed note", () => {
    const p = SAMPLE_ARTIFACTS["decision-log"]!.payload as DecisionLogPayload;
    expect(p.entries.length).toBe(3);
    expect(p.entries.map((e) => e.id)).toEqual(["D-001", "D-002", "D-003"]);
    expect(p.entries.find((e) => e.id === "D-001")!.changeStatus).toBe("Superseded");
    expect(p.entries.find((e) => e.id === "D-003")!.supersedes).toBe("D-001");
    expect(p.signOffNudge).toContain("D-002");
    expect(p.discussedNotDecided?.length).toBeGreaterThan(0);
  });
});
