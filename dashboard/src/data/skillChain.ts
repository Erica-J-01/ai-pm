import type { SkillId } from "@/types/pm";

/**
 * The delivery chain's data dependencies. Each entry lists the DIRECT upstream
 * artifacts a skill consumes when generated, mirroring the CLI chain:
 *   triage -> risk-scan -> charter -> discovery -> prd -> stories -> sprint-sow -> sprint-planning
 *
 * Used for:
 *  - B1 chaining: a step is generated with its dependencies' artifacts as context.
 *  - B3 cascade: when an upstream artifact changes, everything transitively
 *    downstream of it is marked stale and must be regenerated.
 */
export const SKILL_DEPS: Partial<Record<SkillId, SkillId[]>> = {
  "risk-scan": ["triage"],
  charter: ["triage"],
  discovery: ["triage", "charter"],
  prd: ["charter", "discovery"],
  stories: ["prd"],
  "sprint-sow": ["prd", "stories"],
  "sprint-planning": ["sprint-sow", "stories"],
};

/** Direct upstream dependencies a skill consumes as context. */
export function dependenciesOf(skill: SkillId): SkillId[] {
  return SKILL_DEPS[skill] ?? [];
}

/**
 * Every skill that (transitively) depends on `skill` - i.e. the ones that must
 * be regenerated when `skill` changes. Changing `triage` returns the whole
 * chain; changing `prd` returns stories, sprint-sow, and sprint-planning.
 */
export function downstreamOf(skill: SkillId): SkillId[] {
  const out = new Set<SkillId>();
  const visit = (s: SkillId) => {
    for (const [candidate, deps] of Object.entries(SKILL_DEPS) as [SkillId, SkillId[]][]) {
      if (deps.includes(s) && !out.has(candidate)) {
        out.add(candidate);
        visit(candidate);
      }
    }
  };
  visit(skill);
  return [...out];
}
