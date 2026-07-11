import type { OrchestratorApi } from "@/api/orchestrator";
import type { PlanStep, SkillExecution } from "@/types/pm";
import { skillTitle } from "@/data/demo";

/**
 * In-memory OrchestratorApi for local development - no backend required.
 * Mirrors the Finwave "Real-Time Payment Notifications" end-to-end scenario:
 * the plan is the orchestrator chain, and each step streams the matching
 * Finwave artifact (visual payload where one exists, rich markdown otherwise).
 *
 * Swap planOrchestration / streamStep for real fetch calls when the API lands:
 *   - planOrchestration -> POST /orchestrate/plan
 *   - streamStep        -> SSE / chunked fetch at /orchestrate/step
 */

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Orchestrator chain for a raw stakeholder request at pre-project phase. */
const PLAN_STEPS: PlanStep[] = [
  { id: "s1", skill: "triage", rationale: "Raw message needs structuring before any planning begins.", dependsOn: [], parallelizable: false, state: "pending" },
  { id: "s2", skill: "risk-scan", rationale: "A 6-week deadline with an $80k cap is a red flag worth assessing early.", dependsOn: ["s1"], parallelizable: true, state: "pending" },
  { id: "s3", skill: "charter", rationale: "Once triage is clean, formalise the project before discovery.", dependsOn: ["s1"], parallelizable: false, state: "pending" },
  { id: "s4", skill: "discovery", rationale: "Requirements are vague; need a session before writing a PRD.", dependsOn: ["s3"], parallelizable: false, state: "pending" },
  { id: "s5", skill: "prd", rationale: "Document what real-time notifications actually means to build.", dependsOn: ["s4"], parallelizable: false, state: "pending" },
  { id: "s6", skill: "stories", rationale: "Break the PRD into Jira-ready epics and tickets.", dependsOn: ["s5"], parallelizable: false, state: "pending" },
  { id: "s7", skill: "sprint-sow", rationale: "Scope the first sprint as a signed-off statement of work.", dependsOn: ["s6"], parallelizable: false, state: "pending" },
  { id: "s8", skill: "sprint-planning", rationale: "Plan capacity, backlog, and dependencies for sprint 1.", dependsOn: ["s7"], parallelizable: false, state: "pending" },
];

export const mockApi: OrchestratorApi = {
  async planOrchestration(req) {
    await wait(600);
    return {
      id: "plan-1",
      request: req,
      summary:
        "Detected a raw stakeholder request at pre-project phase. Suggested chain: triage, risk-scan (parallel), charter, discovery, PRD, stories, sprint SOW, and sprint planning.",
      steps: PLAN_STEPS.map((s) => ({ ...s })),
      status: "awaiting-approval",
    };
  },

  async streamStep(_planId, step, onChunk, signal) {
    // Loaded on demand so the ~46 kB sample corpus stays out of the entry chunk.
    const { SAMPLE_ARTIFACTS } = await import("@/data/sampleArtifacts");
    const sample = SAMPLE_ARTIFACTS[step.skill];
    const markdown = sample?.markdown ?? `## ${skillTitle(step.skill)}\n\nGenerated output for ${skillTitle(step.skill)}.`;
    let acc = "";
    for (const token of markdown.split(/(\s+)/)) {
      if (signal.aborted) break;
      await wait(20);
      acc += token;
      onChunk({ executionId: `exec-${step.id}`, status: "streaming", delta: token });
    }
    const now = new Date().toISOString();
    const execution: SkillExecution = {
      id: `exec-${step.id}`,
      request: { skill: step.skill, clientId: "c-finwave", projectId: "p-notifications", input: "" },
      status: "complete",
      markdown: acc,
      payload: sample?.payload,
      startedAt: now,
      completedAt: now,
    };
    return execution;
  },
};
