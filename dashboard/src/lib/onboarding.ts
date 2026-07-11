import type { SkillId } from "@/types/pm";
import type { Row, StepValues } from "@/components/onboarding/steps";
import { skillTitle } from "@/data/demo";

/**
 * Onboarding auto-fill.
 *
 * Onboarding is no longer a Claude skill - it is an app form that assembles a
 * sendable starter brief from the project's OTHER artefacts (its siblings).
 * Everything that can be derived from those artefacts is filled automatically
 * and refreshes from the latest data every time the brief is opened. Only the
 * fields that are genuine human logistics - which role is joining, client
 * sensitivities, ceremony times, role-specific pointers, and who grants each
 * access - are left blank for a person to complete, and those human answers are
 * the only ones that persist across a rebuild.
 */

/** Fields a person must fill; everything else is derived from sibling artefacts. */
export const ONBOARDING_HUMAN_FIELDS = [
  "role", "sensitivities", "howWeWork", "roleStart", "checklist",
] as const;

/** Chain order used to list "what to read first" from the artefacts that exist. */
const READ_ORDER: SkillId[] = [
  "triage", "risk-scan", "charter", "discovery", "prd", "stories",
  "sprint-sow", "sprint-planning", "sprint-report", "release-checklist",
  "decision-log", "roadmap", "budget-tracker", "tech-review",
  "meeting-notes", "stakeholder-update", "retrospective",
];

const str = (v: StepValues[string] | undefined): string => (typeof v === "string" ? v : "");
const rows = (v: StepValues[string] | undefined): Row[] =>
  Array.isArray(v) && v.every((x) => x && typeof x === "object" && !Array.isArray(x)) ? (v as Row[]) : [];

/** Capitalise a delivery phase like "pre-project" into "Pre-project". */
function phaseLabel(phase: string): string {
  if (!phase) return "";
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

/**
 * Derive the auto-fillable onboarding fields from a project's sibling artefacts.
 * Missing sources leave their field empty - nothing is invented.
 */
export function autofillOnboarding(
  siblings: Partial<Record<SkillId, StepValues>>,
  clientName: string,
  phase: string,
): StepValues {
  const charter = siblings.charter ?? {};
  const triage = siblings.triage ?? {};
  const risk = siblings["risk-scan"] ?? {};
  const dlog = siblings["decision-log"] ?? {};
  const splan = siblings["sprint-planning"] ?? {};
  const srep = siblings["sprint-report"] ?? {};

  const summary = str(charter.purpose) || str(triage.businessGoal) || str(triage.requestSummary);

  const whereWeAre: Row[] = [];
  if (str(srep.status) || str(srep.summary)) {
    const head = [str(srep.sprint) && `Sprint ${str(srep.sprint)}`, str(srep.status)].filter(Boolean).join(" - ");
    whereWeAre.push({ item: [head, str(srep.summary)].filter(Boolean).join(": ") });
    if (str(srep.forecast)) whereWeAre.push({ item: `Forecast: ${str(srep.forecast)}` });
  }
  if (str(splan.sprintGoal)) whereWeAre.push({ item: `Current sprint goal: ${str(splan.sprintGoal)}` });

  const whosWho: Row[] = [];
  if (str(charter.sponsor)) {
    whosWho.push({ who: str(charter.sponsor), owns: "Sponsor - budget authority and sign-off", goTo: "Approvals and escalations" });
  }
  rows(charter.approvals).forEach((a) => {
    const who = [str(a.name), str(a.role) && `(${str(a.role)})`].filter(Boolean).join(" ");
    if (who) whosWho.push({ who, owns: str(a.role), goTo: "" });
  });

  const readFirst: Row[] = READ_ORDER
    .filter((s) => siblings[s] && Object.keys(siblings[s] as StepValues).length > 0)
    .map((s) => ({ item: skillTitle(s) }));

  const decisions: Row[] = rows(dlog.entries)
    .map((e) => ({ item: [str(e.title), str(e.date) && `(${str(e.date)})`].filter(Boolean).join(" ") }))
    .filter((r) => r.item);

  const riskSource = rows(risk.risks).length ? rows(risk.risks) : rows(charter.risks);
  const risksOut: Row[] = riskSource
    .slice(0, 3)
    .map((r) => ({
      item: str(r.risk),
      why: str(r.response) || [str(r.likelihood), str(r.impact)].filter(Boolean).join(" / "),
    }))
    .filter((r) => r.item);

  const out: StepValues = {
    client: clientName,
    phase: phaseLabel(phase),
    summary,
    whereWeAre,
    whosWho,
    readFirst,
    decisions,
    risks: risksOut,
  };
  return out;
}

/**
 * The onboarding brief's values: auto-filled fields derived fresh from siblings,
 * with the human-only fields carried over from what the user has saved.
 */
export function onboardingValues(
  siblings: Partial<Record<SkillId, StepValues>>,
  clientName: string,
  phase: string,
  saved?: StepValues,
): StepValues {
  const merged = autofillOnboarding(siblings, clientName, phase);
  if (saved) {
    for (const key of ONBOARDING_HUMAN_FIELDS) {
      if (saved[key] !== undefined) merged[key] = saved[key];
    }
  }
  return merged;
}
