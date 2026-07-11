import { describe, it, expect } from "vitest";
import { loadStatus, sprintLoadBreakdown, assessVelocity } from "@/lib/sprint";
import type { CapacityRow, BacklogItem, SprintPlanPayload, SprintReportPayload } from "@/types/pm";
import { STEPS, TEST_DATA } from "@/components/onboarding/steps";
import { buildExecution } from "@/components/onboarding/buildArtifact";
import { SAMPLE_ARTIFACTS } from "@/data/sampleArtifacts";

describe("loadStatus (sprint overcommit calc)", () => {
  it("flags overcommitment above the 80% band", () => {
    expect(loadStatus(10, 9).overcommitted).toBe(true);
  });

  it("stays within the band at 75%", () => {
    const s = loadStatus(20, 15);
    expect(s.pct).toBe(75);
    expect(s.overcommitted).toBe(false);
  });

  it("treats exactly 80% as not overcommitted", () => {
    expect(loadStatus(10, 8).overcommitted).toBe(false);
  });

  it("handles zero capacity without dividing by zero", () => {
    expect(loadStatus(0, 5).ratio).toBe(0);
  });
});

describe("sprintLoadBreakdown (per-person load, TBD, off-goal)", () => {
  it("excludes TBD from committed points and counts it, flags off-goal, and catches a stretch bottleneck", () => {
    const cap: CapacityRow[] = [{ person: "A", availableDays: 8, workingDays: 10, usableCapacity: 10 }];
    const backlog: BacklogItem[] = [
      { priority: "P0", item: "x", estimate: 5, owner: "A", isStretch: false },
      { priority: "P1", item: "y", estimate: 2, owner: "A", isStretch: false, servesGoal: false },
      { priority: "P1", item: "z", estimate: "TBD", owner: "A", isStretch: false },
      { priority: "P2", item: "s", estimate: 8, owner: "A", isStretch: true },
    ];
    const b = sprintLoadBreakdown(cap, backlog);
    expect(b.committedPts).toBe(7);          // 5 + 2, TBD excluded
    expect(b.unestimated).toBe(1);           // the TBD item
    expect(b.offGoalPts).toBe(2);            // the servesGoal:false item
    const a = b.perPerson[0]!;
    expect(a.committed).toBe(7);
    expect(a.pct).toBe(70);                  // 7 / 10, under the band
    expect(a.stretchPct).toBe(150);          // (7 + 8) / 10
    expect(a.over).toBe(false);
    expect(a.overWithStretch).toBe(true);    // the bottleneck the team average hides
    expect(b.bottlenecks).toHaveLength(1);
  });

  it("ignores backlog owned by a name not in the capacity list", () => {
    const cap: CapacityRow[] = [{ person: "A", availableDays: 8, workingDays: 10, usableCapacity: 10 }];
    const backlog: BacklogItem[] = [{ priority: "P0", item: "x", estimate: 5, owner: "Ghost", isStretch: false }];
    expect(sprintLoadBreakdown(cap, backlog).perPerson[0]!.committed).toBe(0);
  });

  it("flags an individual over 80% on committed work alone while the team stays comfortable", () => {
    const cap: CapacityRow[] = [
      { person: "A", availableDays: 5, workingDays: 10, usableCapacity: 5 },
      { person: "B", availableDays: 10, workingDays: 10, usableCapacity: 20 },
    ];
    const backlog: BacklogItem[] = [
      { priority: "P0", item: "big", estimate: 5, owner: "A", isStretch: false }, // 5/5 = 100%
      { priority: "P1", item: "small", estimate: 2, owner: "B", isStretch: false }, // 2/20 = 10%
    ];
    const b = sprintLoadBreakdown(cap, backlog);
    const a = b.perPerson.find((p) => p.person === "A")!;
    expect(a.pct).toBe(100);
    expect(a.over).toBe(true);                 // committed overcommit, not just stretch
    expect(b.bottlenecks.map((p) => p.person)).toEqual(["A"]);
  });

  it("flags a person carrying committed work against zero usable capacity, but not one with none", () => {
    const cap: CapacityRow[] = [
      { person: "Z", availableDays: 0, workingDays: 10, usableCapacity: 0 },
      { person: "Q", availableDays: 10, workingDays: 10, usableCapacity: 0, notes: "QA, no points" },
    ];
    const backlog: BacklogItem[] = [{ priority: "P0", item: "x", estimate: 3, owner: "Z", isStretch: false }];
    const b = sprintLoadBreakdown(cap, backlog);
    expect(b.perPerson.find((p) => p.person === "Z")!.over).toBe(true);   // work but no capacity
    expect(b.perPerson.find((p) => p.person === "Q")!.over).toBe(false);  // no work, not flagged
    expect(b.bottlenecks.map((p) => p.person)).toEqual(["Z"]);
  });

  it("flags a zero-capacity person who owns only stretch work, with zero committed", () => {
    const cap: CapacityRow[] = [{ person: "Dana", availableDays: 0, workingDays: 10, usableCapacity: 0 }];
    const backlog: BacklogItem[] = [{ priority: "P2", item: "nice-to-have", estimate: 5, owner: "Dana", isStretch: true }];
    const d = sprintLoadBreakdown(cap, backlog).perPerson[0]!;
    expect(d.committed).toBe(0);          // no committed work, so the flag prose must stay neutral
    expect(d.over).toBe(false);
    expect(d.overWithStretch).toBe(true); // still a bottleneck: stretch with no capacity
  });
});

describe("sprint-planning payload wiring", () => {
  const step = STEPS.find((s) => s.id === "sprint-planning")!;

  it("the structured stub carries velocity, carryover, deps, risks, DoD, key dates, TBD and off-goal, with matching owners", () => {
    const payload = buildExecution(step, TEST_DATA["sprint-planning"]!, "c", "p").payload as SprintPlanPayload;
    expect(payload.velocity?.averagePoints).toBe(20);
    expect(payload.carryover?.length).toBeGreaterThan(0);
    expect(payload.dependencies?.length).toBeGreaterThan(0);
    expect(payload.risks?.length).toBeGreaterThan(0);
    expect(payload.definitionOfDone?.proposed).toBe(true);
    expect(payload.keyDates?.length).toBeGreaterThan(0);
    expect(payload.backlog.some((b) => b.estimate === "TBD")).toBe(true);
    expect(payload.backlog.some((b) => b.servesGoal === false)).toBe(true);
    const persons = new Set(payload.capacity.map((c) => c.person));
    expect(payload.backlog.every((b) => persons.has(b.owner))).toBe(true);
    // team is comfortable but a per-person stretch bottleneck is still caught
    const bd = sprintLoadBreakdown(payload.capacity, payload.backlog);
    expect(payload.overcommitted).toBe(false);
    expect(bd.bottlenecks.length).toBeGreaterThan(0);
    expect(bd.unestimated).toBe(1);
    expect(bd.offGoalPts).toBe(2);
  });

  it("omits the velocity anchor when no baseline is supplied", () => {
    const values = { ...TEST_DATA["sprint-planning"]!, velocityPoints: "" };
    const payload = buildExecution(step, values, "c", "p").payload as SprintPlanPayload;
    expect(payload.velocity).toBeUndefined();
  });

  it("the seeded sample is internally consistent and carries every section", () => {
    const sp = SAMPLE_ARTIFACTS["sprint-planning"]!.payload as SprintPlanPayload;
    expect(sp.usableCapacity).toBe(sp.capacity.reduce((s, c) => s + c.usableCapacity, 0));
    expect(sp.velocity).toBeTruthy();
    expect(sp.carryover?.length).toBeGreaterThan(0);
    expect(sp.dependencies?.length).toBeGreaterThan(0);
    expect(sp.risks?.length).toBeGreaterThan(0);
    expect(sp.definitionOfDone?.items.length).toBeGreaterThan(0);
    expect(sp.keyDates?.length).toBeGreaterThan(0);
    const bd = sprintLoadBreakdown(sp.capacity, sp.backlog);
    expect(bd.bottlenecks.length).toBeGreaterThan(0);
    expect(bd.offGoalPts).toBe(2);
    expect(bd.unestimated).toBe(1);
  });
});

describe("assessVelocity (committed vs trailing average, 10% band)", () => {
  it("names an over-commitment above the band", () => {
    expect(assessVelocity(18, 15)).toBe("over-committed"); // 18 > 16.5
  });
  it("names an under-commitment below the band", () => {
    expect(assessVelocity(12, 15)).toBe("under-committed"); // 12 < 13.5
  });
  it("reads on-trend inside the band", () => {
    expect(assessVelocity(15, 15)).toBe("on-trend");
    expect(assessVelocity(16, 15)).toBe("on-trend"); // within 10%
  });
  it("does not divide by a zero baseline", () => {
    expect(assessVelocity(10, 0)).toBe("on-trend");
  });
});

describe("sprint-report payload wiring", () => {
  const step = STEPS.find((s) => s.id === "sprint-report")!;
  const build = (v: Record<string, unknown>) => buildExecution(step, v, "c", "p").payload as SprintReportPayload;

  it("the in-flight stub computes the velocity assessment, goal attainment, and keeps actions and standup", () => {
    const p = build(TEST_DATA["sprint-report"]!);
    expect(p.closed).toBe(false);
    expect(p.confidence).toBe(72);
    expect(p.riskLevel).toBe("High");
    expect(p.goalStatus).toBe("at-risk");
    expect(p.trailingAverage).toBe(15);            // mean of 16 and 14
    expect(p.velocityAssessment).toBe("over-committed"); // committed 18 vs 15
    expect(p.velocityTrend).toHaveLength(3);       // 2 history + Now
    expect(p.actionsToday!.length).toBeGreaterThan(0);
    expect(p.standupQuestions!.length).toBeGreaterThan(0);
    expect(p.carryover).toBeUndefined();
    expect(p.movement).toBeTruthy();
    expect(p.leadershipUpdate).toBeTruthy();
  });

  it("close-out mode swaps actions and standup for carry-over", () => {
    const p = build({ ...TEST_DATA["sprint-report"]!, mode: "Closed", carryover: [{ item: "NOTIF-6 to Sprint 2" }], nextSprintImplications: "Commit no more than 15 points" });
    expect(p.closed).toBe(true);
    expect(p.actionsToday).toBeUndefined();
    expect(p.standupQuestions).toBeUndefined();
    expect(p.carryover).toEqual(["NOTIF-6 to Sprint 2"]);
    expect(p.nextSprintImplications).toBe("Commit no more than 15 points");
  });

  it("emits no confidence percentage when the field is blank (not assessable)", () => {
    const p = build({ ...TEST_DATA["sprint-report"]!, confidence: "" });
    expect(p.confidence).toBeUndefined();
  });

  it("marks the goal not-stated when no goal was given", () => {
    const p = build({ ...TEST_DATA["sprint-report"]!, goal: "" });
    expect(p.goalStatus).toBe("not-stated");
  });

  it("assesses velocity on the exact mean, not the display-rounded one, at the band boundary", () => {
    const p = build({ sprint: "S", committed: "12", completed: "5", velocityHistory: [{ sprint: "A", points: "10" }, { sprint: "B", points: "11" }] });
    expect(p.trailingAverage).toBe(10.5);                 // shown to one decimal
    expect(p.velocityAssessment).toBe("over-committed");  // 12 vs exact 10.5 (+10% band = 11.55)
  });

  it("treats a non-numeric confidence as not assessable rather than NaN", () => {
    expect(build({ ...TEST_DATA["sprint-report"]!, confidence: "~70" }).confidence).toBeUndefined();
    expect(build({ ...TEST_DATA["sprint-report"]!, confidence: "70%" }).confidence).toBeUndefined();
  });

  it("the seeded sample is a close-out with actuals, carry-over, and no live confidence", () => {
    const sp = SAMPLE_ARTIFACTS["sprint-report"]!.payload as SprintReportPayload;
    expect(sp.closed).toBe(true);
    expect(sp.confidence).toBeUndefined();
    expect(sp.goalStatus).toBe("missed");
    expect(sp.velocityAssessment).toBe("over-committed");
    expect(sp.carryover?.length).toBeGreaterThan(0);
    expect(sp.nextSprintImplications).toBeTruthy();
    expect(sp.leadershipUpdate).toBeTruthy();
    expect(sp.actionsToday).toBeUndefined();
  });
});
