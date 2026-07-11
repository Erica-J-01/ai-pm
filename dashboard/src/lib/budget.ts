import type { RagStatus } from "@/types/pm";

/**
 * Budget RAG against the current baseline (original budget plus approved changes):
 * green within 5%, amber 5-10% over or a worsening burn, red more than 10% over
 * or the budget exhausts before the planned end. Returns which rule fired so the
 * verdict is reproducible.
 */
export function budgetVerdict(
  baseline: number,
  forecast: number,
  flags?: { worseningBurn?: boolean; exhaustsEarly?: boolean },
): { verdict: RagStatus; rule: string } {
  const overPct = baseline > 0 ? (forecast - baseline) / baseline : 0;
  if (overPct > 0.10) return { verdict: "red", rule: "forecast more than 10% over baseline" };
  if (flags?.exhaustsEarly) return { verdict: "red", rule: "budget exhausts before the planned end" };
  if (overPct >= 0.05) return { verdict: "amber", rule: "forecast 5-10% over baseline" };
  if (flags?.worseningBurn) return { verdict: "amber", rule: "burn trend worsening" };
  return { verdict: "green", rule: "forecast within 5% of baseline" };
}
