/**
 * Live Claude orchestrator - calls api.anthropic.com via the local Vite proxy
 * at /api/claude/v1/messages. The user's API key is stored in sessionStorage
 * (persisted by the connector system, cleared when the tab closes) and
 * forwarded as a request header; it never leaves the local machine.
 *
 * Skill system prompts are loaded from `virtual:skill-prompts` - a Vite virtual
 * module that reads every skills/<id>/SKILL.md + reference.md at dev-server
 * start. Edits to those files are picked up on the next restart automatically.
 *
 * planOrchestration  -> Claude picks the right skills and writes a rationale.
 * streamStep         -> Claude runs a single skill with its full SKILL.md prompt.
 */

import type { OrchestratorApi } from "@/api/orchestrator";
import type {
  OrchestrationPlan, PlanStep, SkillExecution, SkillExecutionRequest, SkillId,
} from "@/types/pm";
import { adaptArtifact } from "@/api/adapter";
import { SKILL_PROMPTS } from "@/api/skillPrompts";

const MODEL = "claude-sonnet-4-6";
const CONNECTOR_KEY = "ai-pm-connector-apis";

export function getClaudeApiKey(): string | null {
  try {
    const raw = sessionStorage.getItem(CONNECTOR_KEY);
    if (!raw) return null;
    const apis = JSON.parse(raw) as Record<string, { token?: string }>;
    return apis["claude"]?.token ?? null;
  } catch { return null; }
}

/** POST to the local Vite proxy; returns the assistant text content. */
async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
  maxTokens = 4096,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/claude/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-claude-api-key": apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      // B2: the SKILL.md system prompt is large and identical across steps/runs.
      // Mark it ephemeral so Anthropic caches it - paid in full once, then ~10%
      // on every subsequent call that reuses the same prefix.
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userContent }],
    }),
    ...(signal ? { signal } : {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Claude API ${res.status}: ${detail}`);
  }

  const data = await res.json() as { content: { type: string; text: string }[] };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

/* ── Orchestration plan prompt ───────────────────────────────────────── */

const PLAN_SYSTEM = `You are a senior PM AI assistant. Analyse the raw input and select the appropriate PM skills.

Available skills (use these exact IDs):
- triage: structure a raw stakeholder message or intake request
- risk-scan: identify delivery, technical, stakeholder, and business risks
- charter: write a project charter
- discovery: plan a discovery workshop or summarise discovery findings
- prd: write a Product Requirements Document
- stories: break requirements into epics and user stories
- sprint-sow: write a sprint Statement of Work
- sprint-planning: plan sprint capacity and backlog
- sprint-report: analyse sprint velocity and progress
- release-checklist: run a go/no-go assessment before release
- decision-log: log a decision or plan change with impact assessment
- meeting-notes: extract minutes and actions from a transcript
- tech-review: review an SA proposal or architecture doc for PM risks
- retrospective: run a sprint retrospective
- stakeholder-update: draft a stakeholder status update
- roadmap: build a Now/Next/Later or quarterly roadmap
- budget-tracker: track spend against budget and flag burn-rate risk
- onboarding: generate an onboarding brief for a new joiner

Rules:
- Only include skills genuinely needed for the input - do not include all skills by default.
- Order steps in delivery sequence (e.g. triage before charter, charter before PRD).
- risk-scan can run in parallel with charter (set parallelizable: true for it).
- If the input is a meeting transcript, return only meeting-notes.
- If the input is a raw stakeholder message at pre-project phase, start with triage.
- If requirements already exist, you may skip triage and start from the appropriate phase.

Return ONLY a valid JSON object - no markdown fences, no extra text:
{
  "summary": "One sentence: what you detected in the input and which skills you chose.",
  "steps": [
    { "skill": "<skill-id>", "rationale": "One-line reason this skill is needed.", "parallelizable": false }
  ]
}`;

/* ── Module-level plan store (maps planId -> original request) ───────── */

const activePlans = new Map<string, SkillExecutionRequest>();

/* ── Exported API ────────────────────────────────────────────────────── */

export const claudeApi: OrchestratorApi = {
  async planOrchestration(req) {
    const apiKey = getClaudeApiKey();
    if (!apiKey) throw new Error("No Claude API key configured. Add it in Connected Tools (top-left connector icon).");

    const raw = await callClaude(apiKey, PLAN_SYSTEM, req.input, 1024);

    let parsed: { summary: string; steps: { skill: string; rationale: string; parallelizable?: boolean }[] };
    try {
      const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Claude returned an unexpected response. Please try again.");
    }

    const steps: PlanStep[] = parsed.steps.map((s, i) => ({
      id: `s${i + 1}`,
      skill: s.skill as SkillId,
      rationale: s.rationale,
      dependsOn: i > 0 && !s.parallelizable ? [`s${i}`] : [],
      parallelizable: s.parallelizable ?? false,
      state: "pending" as const,
    }));

    const plan: OrchestrationPlan = {
      id: `plan-${Date.now()}`,
      request: req,
      summary: parsed.summary,
      steps,
      status: "awaiting-approval",
    };

    activePlans.clear();        // only the latest plan is ever active
    activePlans.set(plan.id, req);
    return plan;
  },

  async streamStep(planId, step, _onChunk, signal, context) {
    const apiKey = getClaudeApiKey();
    if (!apiKey) throw new Error("No Claude API key configured.");

    const req = activePlans.get(planId);
    const input = req?.input ?? "Generate this artefact based on the project context.";

    // Use the full SKILL.md + reference.md prompt from the virtual module.
    // Fall back to a minimal prompt if the skill file isn't loaded (shouldn't happen).
    const skillSystem = SKILL_PROMPTS[step.skill]
      ?? `You are a senior PM. Generate a structured ${step.skill} artefact from the input provided.`;

    // B1: append the upstream chain context (dependencies' artefacts) so this
    // step derives from them, not just from the original brief.
    const userContent = context?.trim() ? `${input}\n\n---\n\n${context}` : input;

    const markdown = await callClaude(apiKey, skillSystem, userContent, 4096, signal);

    const now = new Date().toISOString();
    return {
      id: `exec-${step.id}`,
      request: { skill: step.skill, clientId: req?.clientId ?? "", projectId: req?.projectId ?? "", input },
      status: "complete",
      markdown,
      payload: adaptArtifact(step.skill, markdown),
      startedAt: now,
      completedAt: now,
    } as SkillExecution;
  },
};

/**
 * Intake signal detection: given the project input and the conditional intake
 * questions (each with its trigger condition), ask Claude which ones apply, so
 * the interview shows only the relevant questions. Falls back to "show all" on
 * no key, no candidates, or any error - detection should never hide a question
 * by mistake.
 */
export async function detectIntakeSignals(
  input: string,
  candidates: { id: string; condition: string }[],
): Promise<string[]> {
  const apiKey = getClaudeApiKey();
  if (!apiKey || candidates.length === 0) return candidates.map((c) => c.id);
  const system =
    "You decide which conditional intake questions apply to a project input. " +
    "You are given the input and a list of questions, each with an id and a trigger condition. " +
    "Return ONLY a JSON array of the ids whose condition is satisfied by the input. No prose, no code fence.";
  const user =
    `INPUT:\n${input}\n\nQUESTIONS:\n` +
    candidates.map((c) => `- ${c.id}: ${c.condition}`).join("\n") +
    `\n\nReturn the JSON array of applicable ids (a subset of: ${candidates.map((c) => c.id).join(", ")}).`;
  try {
    const raw = await callClaude(apiKey, system, user, 256);
    const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const ids = JSON.parse(clean) as unknown;
    if (!Array.isArray(ids)) return candidates.map((c) => c.id);
    const valid = new Set(candidates.map((c) => c.id));
    return ids.filter((x): x is string => typeof x === "string" && valid.has(x));
  } catch {
    return candidates.map((c) => c.id); // never hide questions on a detection failure
  }
}

/**
 * B3 edit-cascade: regenerate ONE skill live, deriving from supplied upstream
 * context. Runs outside a plan, so the caller passes the original brief and the
 * chained context built from the current (edited) upstream artefacts.
 */
export async function regenerateSkillLive(
  skill: SkillId,
  input: string,
  context: string,
  signal?: AbortSignal,
): Promise<SkillExecution> {
  const apiKey = getClaudeApiKey();
  if (!apiKey) throw new Error("No Claude API key configured.");
  const skillSystem = SKILL_PROMPTS[skill]
    ?? `You are a senior PM. Generate a structured ${skill} artefact from the input provided.`;
  const userContent = context.trim() ? `${input}\n\n---\n\n${context}` : input;
  const markdown = await callClaude(apiKey, skillSystem, userContent, 4096, signal);
  const now = new Date().toISOString();
  return {
    id: `exec-regen-${skill}-${now}`,
    request: { skill, clientId: "", projectId: "", input },
    status: "complete",
    markdown,
    payload: adaptArtifact(skill, markdown),
    startedAt: now,
    completedAt: now,
  } as SkillExecution;
}
