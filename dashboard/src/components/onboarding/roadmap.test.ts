import { describe, it, expect } from "vitest";
import type { RoadmapPayload } from "@/types/pm";
import { STEPS, TEST_DATA } from "./steps";
import { buildExecution } from "./buildArtifact";
import { SAMPLE_ARTIFACTS } from "@/data/sampleArtifacts";

const step = STEPS.find((s) => s.id === "roadmap")!;
const build = (v: Record<string, unknown>) => buildExecution(step, v, "c", "p").payload as RoadmapPayload;

describe("buildRoadmap buckets and sections", () => {
  it("groups initiatives into Now / Next / Later in order, with confidence and size", () => {
    const p = build(TEST_DATA["roadmap"]!);
    expect(p.buckets?.map((b) => b.name)).toEqual(["Now", "Next", "Later"]);
    expect(p.buckets?.[0]?.items).toHaveLength(2);           // two Now initiatives
    expect(p.buckets?.[0]?.span).toBeTruthy();               // rough time span
    expect(p.buckets?.[0]?.items[0]?.confidence).toBe("High");
    expect(p.buckets?.[0]?.items[0]?.size).toBe("M");
    expect(p.confidence).toBeTruthy();
    expect(p.nextReview).toBe("Post-Q2 close");
  });

  it("orders buckets Now, Next, Later even when the input rows are scrambled", () => {
    const p = build({
      goal: "G",
      items: [
        { bucket: "Later", initiative: "L1", confidence: "Low" },
        { bucket: "Now", initiative: "N1", confidence: "High" },
        { bucket: "Next", initiative: "X1", confidence: "Medium" },
        { bucket: "Now", initiative: "N2", confidence: "High" },
      ],
    });
    expect(p.buckets?.map((b) => b.name)).toEqual(["Now", "Next", "Later"]);
    expect(p.buckets?.[0]?.items.map((i) => i.initiative)).toEqual(["N1", "N2"]);
  });

  it("carries the framing sections and the optional timeline", () => {
    const p = build(TEST_DATA["roadmap"]!);
    expect(p.hardCommitments?.length).toBeGreaterThan(0);
    expect(p.changesSince?.changes.length).toBeGreaterThan(0);
    expect(p.capacityFlag).toBeTruthy();
    expect(p.dependencies?.length).toBeGreaterThan(0);
    expect(p.notNow?.length).toBeGreaterThan(0);
    expect(p.assumptions?.length).toBeGreaterThan(0);
    expect(p.tasks.length).toBeGreaterThan(0);               // optional timeline present
    expect(p.lanes).toContain("Now");
  });
});

describe("roadmap timeline week/date sync via the anchor date", () => {
  it("derives week numbers from dates when an anchor is set", () => {
    const p = build({
      goal: "G", weeks: "8", anchorDate: "2026-06-01",
      tasks: [{ name: "A", lane: "Now", startDate: "2026-06-08", endDate: "2026-06-22" }],
    });
    // 7 days after anchor = week 2; 21 days after = week 4
    expect(p.tasks[0]).toMatchObject({ startWeek: 2, endWeek: 4, startDate: "2026-06-08", endDate: "2026-06-22" });
  });

  it("fills missing dates from week numbers when an anchor is set", () => {
    const p = build({
      goal: "G", weeks: "8", anchorDate: "2026-06-01",
      tasks: [{ name: "A", lane: "Now", startWeek: "2", endWeek: "3" }],
    });
    // week 2 start = anchor + 7 days; week 3 end = anchor + 3*7-1 = anchor + 20 days
    expect(p.tasks[0]).toMatchObject({ startWeek: 2, endWeek: 3, startDate: "2026-06-08", endDate: "2026-06-21" });
  });

  it("runs an item with no end to the end of the timeline", () => {
    const p = build({
      goal: "G", weeks: "8", anchorDate: "2026-06-01",
      tasks: [{ name: "A", lane: "Now", startWeek: "1" }],
    });
    expect(p.tasks[0].endWeek).toBe(8);
    expect(p.tasks[0].endDate).toBe("2026-07-26"); // anchor + 8*7-1 = anchor + 55 days
  });

  it("leaves weeks and dates independent when no anchor is given", () => {
    const p = build({
      goal: "G", weeks: "8",
      tasks: [{ name: "A", lane: "Now", startWeek: "2", endWeek: "3", startDate: "2026-06-08", endDate: "2026-06-22" }],
    });
    // no anchor: the typed weeks are used as-is, dates kept as-is, no derivation
    expect(p.tasks[0]).toMatchObject({ startWeek: 2, endWeek: 3, startDate: "2026-06-08", endDate: "2026-06-22" });
  });
});

describe("roadmap seeded sample", () => {
  it("is a Now/Next/Later roadmap with hard commitments, a changes-since, and optional sizes", () => {
    const sp = SAMPLE_ARTIFACTS["roadmap"]!.payload as RoadmapPayload;
    expect(sp.buckets?.map((b) => b.name)).toEqual(["Now", "Next", "Later"]);
    expect(sp.hardCommitments?.length).toBeGreaterThan(0);
    expect(sp.changesSince?.changes.length).toBeGreaterThan(0);
    expect(sp.capacityFlag).toBeTruthy();
    // some items carry a size, some do not (the optional-size rule)
    const laterItems = sp.buckets?.find((b) => b.name === "Later")?.items ?? [];
    expect(laterItems.some((i) => i.size)).toBe(true);
    expect(laterItems.some((i) => !i.size)).toBe(true);
  });
});
