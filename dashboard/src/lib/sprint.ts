import type { CapacityRow, BacklogItem, BacklogEstimate, VelocityAssessment } from "@/types/pm";

/** Sprint load math shared by the planning form and view (single source). */
export interface LoadStatus {
  ratio: number;
  pct: number;
  overcommitted: boolean;
}

/** committed = P0 + P1 (stretch excluded). Overcommit when above the 80% band. */
export function loadStatus(usableCapacity: number, committed: number): LoadStatus {
  const ratio = usableCapacity > 0 ? committed / usableCapacity : 0;
  return { ratio, pct: Math.round(ratio * 100), overcommitted: ratio > 0.8 };
}

const estNum = (e: BacklogEstimate) => (typeof e === "number" ? e : 0);

export interface PersonLoad {
  person: string;
  committed: number;
  withStretch: number;
  capacity: number;
  pct: number;
  stretchPct: number;
  over: boolean;
  overWithStretch: boolean;
}

export interface SprintLoadBreakdown {
  /** Committed (P0 + P1) points across the team, TBD excluded. */
  committedPts: number;
  /** Count of committed items left unestimated (TBD), excluded from the load. */
  unestimated: number;
  /** Committed points on items flagged as not serving the sprint goal. */
  offGoalPts: number;
  perPerson: PersonLoad[];
  /** People over 80% on committed work, or once their stretch starts. */
  bottlenecks: PersonLoad[];
}

/**
 * The honest load picture the plan skill demands: committed points, unestimated
 * items excluded, off-goal points, and per-owner load so a comfortable team
 * average can't hide an over-loaded individual. Derived, never stored.
 */
export function sprintLoadBreakdown(capacity: CapacityRow[], backlog: BacklogItem[]): SprintLoadBreakdown {
  const committed = backlog.filter((b) => !b.isStretch); // P0 + P1
  const committedPts = committed.reduce((s, b) => s + estNum(b.estimate), 0);
  const unestimated = committed.filter((b) => b.estimate === "TBD").length;
  const offGoalPts = committed.filter((b) => b.servesGoal === false).reduce((s, b) => s + estNum(b.estimate), 0);

  const perPerson: PersonLoad[] = capacity.map((c) => {
    const own = (stretch: boolean) =>
      backlog.filter((b) => b.owner === c.person && b.isStretch === stretch).reduce((s, b) => s + estNum(b.estimate), 0);
    const load = own(false);
    const withStretch = load + own(true);
    const hasCapacity = c.usableCapacity > 0;
    const pct = hasCapacity ? Math.round((load / c.usableCapacity) * 100) : 0;
    const stretchPct = hasCapacity ? Math.round((withStretch / c.usableCapacity) * 100) : 0;
    // A person with committed work but zero usable capacity is over-allocated, not
    // 0% - flag them rather than letting a comfortable team average hide it.
    return {
      person: c.person, committed: load, withStretch, capacity: c.usableCapacity, pct, stretchPct,
      over: hasCapacity ? pct > 80 : load > 0,
      overWithStretch: hasCapacity ? stretchPct > 80 : withStretch > 0,
    };
  });

  return { committedPts, unestimated, offGoalPts, perPerson, bottlenecks: perPerson.filter((p) => p.over || p.overWithStretch) };
}

/**
 * Commitment vs the trailing velocity average, within a 10% band. Naming an
 * over-commitment separates a planning error from an execution problem.
 */
export function assessVelocity(committed: number, trailingAverage: number): VelocityAssessment {
  if (trailingAverage <= 0) return "on-trend";
  if (committed > trailingAverage * 1.1) return "over-committed";
  if (committed < trailingAverage * 0.9) return "under-committed";
  return "on-trend";
}
