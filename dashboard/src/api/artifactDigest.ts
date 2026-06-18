import type { SkillExecution, SkillId } from "@/types/pm";
import { skillTitle } from "@/data/demo";
import { dependenciesOf } from "@/data/skillChain";
import { INTAKE_QUESTIONS } from "@/api/intakeQuestions";

/**
 * Serialise a skill's intake answers as prompt context. Shared by the console
 * (first generation) and the store (regeneration) so both feed Claude the same
 * thing - the answers are not lost when a skill is regenerated later.
 */
export function intakeAnswersContext(skill: SkillId, answers: Record<string, string> | undefined): string {
  const a = answers ?? {};
  const lines = (INTAKE_QUESTIONS[skill] ?? [])
    .filter((q) => a[q.id]?.trim())
    .map((q) => `- ${q.title}: ${a[q.id].trim()}`);
  return lines.length ? `## Intake interview answers\n\n${lines.join("\n")}` : "";
}

/** Max chars of an upstream artifact fed into a downstream step (keeps tokens bounded). */
const MAX_DIGEST = 1800;

/** A compact context block for one already-generated upstream artifact. */
function digest(exec: SkillExecution): string {
  let body = (exec.markdown ?? "").trim();
  if (body.length > MAX_DIGEST) body = body.slice(0, MAX_DIGEST) + "\n\n...(truncated for context)";
  return `## Upstream artefact: ${skillTitle(exec.request.skill)}\n\n${body}`;
}

/**
 * Build the chained-context string for `skill` from the artifacts generated so
 * far. Only the skill's DIRECT dependencies are included - each already carries
 * its own upstream context, so this stays bounded instead of growing with the
 * whole chain. Returns "" when the skill has no available dependencies.
 */
export function buildChainContext(
  skill: SkillId,
  generated: Partial<Record<SkillId, SkillExecution>>,
): string {
  const parts = dependenciesOf(skill)
    .map((dep) => generated[dep])
    .filter((e): e is SkillExecution => !!e && !!e.markdown?.trim())
    .map(digest);
  if (parts.length === 0) return "";
  return [
    "The following upstream artefacts were produced earlier in this orchestration.",
    "Derive this artefact from them - do not contradict or restate them verbatim.",
    "",
    ...parts,
  ].join("\n");
}
