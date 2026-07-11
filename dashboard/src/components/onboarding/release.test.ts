import { describe, it, expect } from "vitest";
import type { ReleaseChecklistPayload, ChecklistStatus } from "@/types/pm";
import { STEPS, TEST_DATA } from "./steps";
import { buildExecution } from "./buildArtifact";
import { SAMPLE_ARTIFACTS } from "@/data/sampleArtifacts";

const step = STEPS.find((s) => s.id === "release-checklist")!;
const build = (values: Record<string, unknown>) =>
  buildExecution(step, values, "c", "p").payload as ReleaseChecklistPayload;

describe("buildRelease verdict and accepted-FAIL mechanic", () => {
  it("converts an accepted FAIL to a RISK, moves it to Conditions, and yields CONDITIONAL GO", () => {
    const p = build(TEST_DATA["release-checklist"]!);
    expect(p.verdict).toBe("CONDITIONAL GO");
    expect(p.tally.FAIL).toBe(0);          // the one FAIL was accepted and converted
    expect(p.tally.RISK).toBe(2);
    expect(p.tally.UNCONFIRMED).toBe(3);

    const load = p.categories.flatMap((c) => c.items).find((i) => i.label.includes("Load testing"))!;
    expect(load.status).toBe("RISK");
    expect(load.note).toContain("accepted by Sarah Chen");
    expect(p.conditions!.some((c) => c.label.includes("Load testing"))).toBe(true);
    expect(p.blockers.every((b) => !b.label.includes("Load testing"))).toBe(true); // not a blocker any more
    expect(p.blockers).toHaveLength(3);    // the three UNCONFIRMED items
  });

  it("groups the chase list by owner and flags a lead-time-sensitive security item", () => {
    const p = build(TEST_DATA["release-checklist"]!);
    expect(p.chaseList!.map((g) => g.owner).sort()).toEqual(["Marcus", "Priya", "Sofia (Security)"]);
    const sofia = p.chaseList!.find((g) => g.owner.startsWith("Sofia"))!;
    expect(sofia.questions[0]!.leadTime).toBe(true);   // "security" is lead-time-sensitive
    const priya = p.chaseList!.find((g) => g.owner === "Priya")!;
    expect(priya.questions[0]!.leadTime).toBeFalsy();
  });

  it("attaches a Path to GO for a non-GO verdict but not for a clean GO", () => {
    const p = build(TEST_DATA["release-checklist"]!);
    expect(p.pathToGo).toBeTruthy();

    const go = build({ release: "R", releaseType: "planned", items: [{ category: "Approvals", item: "PM sign-off", status: "PASS", owner: "PM" }] });
    expect(go.verdict).toBe("GO");
    expect(go.pathToGo).toBeUndefined();
    expect(go.chaseList).toBeUndefined();
    expect(go.conditions).toBeUndefined();
  });

  it("an unaccepted FAIL is a NO-GO with the item in Blockers", () => {
    const noGo = build({ release: "R", releaseType: "planned", items: [{ category: "Testing", item: "QA sign-off", status: "FAIL", owner: "Priya" }] });
    expect(noGo.verdict).toBe("NO-GO");
    expect(noGo.tally.FAIL).toBe(1);
    expect(noGo.blockers).toHaveLength(1);
    expect(noGo.pathToGo).toBeTruthy();
  });

  it("maps a Hotfix-categorised check to the hotfix category id", () => {
    const p = build({ release: "Emergency patch", releaseType: "hotfix", items: [{ category: "Hotfix", item: "Rollback step confirmed and ready", status: "PASS", owner: "Marcus" }] });
    expect(p.releaseType).toBe("hotfix");
    expect(p.categories[0]!.id).toBe("hotfix");
  });
});

describe("release-checklist seeded sample", () => {
  it("carries a re-assessment delta, chase list, conditions, and a path to GO, with a consistent tally", () => {
    const sp = SAMPLE_ARTIFACTS["release-checklist"]!.payload as ReleaseChecklistPayload;
    expect(sp.delta?.length).toBeGreaterThan(0);
    expect(sp.verdictMovement).toBeTruthy();
    expect(sp.chaseList?.length).toBeGreaterThan(0);
    expect(sp.conditions?.length).toBeGreaterThan(0);
    expect(sp.pathToGo).toBeTruthy();

    const items = sp.categories.flatMap((c) => c.items);
    const count = (s: ChecklistStatus) => items.filter((i) => i.status === s).length;
    expect(sp.tally.PASS).toBe(count("PASS"));
    expect(sp.tally.RISK).toBe(count("RISK"));
    expect(sp.tally.UNCONFIRMED).toBe(count("UNCONFIRMED"));
    expect(sp.tally.FAIL).toBe(count("FAIL"));
  });
});
