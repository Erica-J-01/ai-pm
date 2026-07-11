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
