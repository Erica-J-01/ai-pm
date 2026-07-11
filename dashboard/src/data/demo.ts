import {
  type ClientContext,
  type McpConnector,
  type ProjectContext,
  type SkillId,
  type SkillMeta,
  type ConnectorId,
  SKILL_TAXONOMY,
} from "@/types/pm";

/** Per-skill display + connector metadata (titles/commands for the nav). */
const META: Record<SkillId, { command: string; title: string; usesConnectors: boolean; connectors?: ConnectorId[] }> = {
  triage: { command: "/triage", title: "Triage", usesConnectors: false },
  "risk-scan": { command: "/risk-scan", title: "Risk Scan", usesConnectors: false },
  charter: { command: "/charter", title: "Charter", usesConnectors: false },
  discovery: { command: "/discovery", title: "Discovery", usesConnectors: false },
  prd: { command: "/prd", title: "PRD / BRD", usesConnectors: false },
  stories: { command: "/stories", title: "User Stories", usesConnectors: true, connectors: ["jira"] },
  "sprint-sow": { command: "/sprint-sow", title: "Sprint SOW", usesConnectors: true, connectors: ["confluence", "google-drive", "notion"] },
  "sprint-planning": { command: "/sprint-planning", title: "Sprint Planning", usesConnectors: false },
  "sprint-report": { command: "/sprint-report", title: "Sprint Report", usesConnectors: true, connectors: ["jira", "confluence"] },
  "release-checklist": { command: "/release-checklist", title: "Release Checklist", usesConnectors: true, connectors: ["jira", "confluence", "google-drive", "notion", "gmail"] },
  "decision-log": { command: "/decision-log", title: "Decision Log", usesConnectors: false },
  "meeting-notes": { command: "/meeting-notes", title: "Meeting Notes", usesConnectors: true, connectors: ["confluence", "google-drive", "notion", "gmail"] },
  "tech-review": { command: "/tech-review", title: "Tech Review", usesConnectors: false },
  retrospective: { command: "/retrospective", title: "Retrospective", usesConnectors: false },
  "stakeholder-update": { command: "/stakeholder-update", title: "Stakeholder Update", usesConnectors: true, connectors: ["gmail", "confluence"] },
  roadmap: { command: "/roadmap", title: "Roadmap", usesConnectors: false },
  "budget-tracker": { command: "/budget-tracker", title: "Budget Tracker", usesConnectors: false },
  onboarding: { command: "/onboarding", title: "Onboarding", usesConnectors: false },
};

/** Full SkillMeta index, derived from the taxonomy so category stays in sync. */
export const SKILL_INDEX: Record<SkillId, SkillMeta> = (() => {
  const index = {} as Record<SkillId, SkillMeta>;
  for (const category of SKILL_TAXONOMY) {
    for (const id of category.skillIds) {
      index[id] = { id, category: category.id, ...META[id] };
    }
  }
  return index;
})();

export const DEMO_CLIENTS: ClientContext[] = [
  {
    id: "c-finwave",
    slug: "FINWAVE",
    name: "Finwave",
    accountOwner: "PM",
    commercialModel: "retainer",
    stakeholders: [{ name: "Sarah Chen", role: "Head of Product", authority: "sponsor" }],
    projectIds: ["p-notifications", "p-portal"],
    createdAt: "2026-05-01T00:00:00Z",
  },
  {
    id: "c-acme",
    slug: "ACME",
    name: "Acme Corp",
    commercialModel: "fixed-price",
    stakeholders: [{ name: "VP Ops", role: "Sponsor", authority: "sponsor" }],
    projectIds: ["p-rebuild"],
    createdAt: "2026-04-10T00:00:00Z",
  },
];

export const DEMO_PROJECTS: ProjectContext[] = [
  {
    id: "p-notifications",
    clientId: "c-finwave",
    slug: "Notifications",
    name: "Real-time Notifications",
    phase: "development",
    status: "amber",
    currentSprint: { number: 7, goal: "Ship webhook delivery", startDate: "2026-06-09", endDate: "2026-06-20" },
    openRiskIds: ["R2"],
    updatedAt: "2026-05-29T00:00:00Z",
  },
  {
    id: "p-portal",
    clientId: "c-finwave",
    slug: "Portal",
    name: "Customer Portal",
    phase: "discovery",
    status: "green",
    openRiskIds: [],
    updatedAt: "2026-05-20T00:00:00Z",
  },
  {
    id: "p-rebuild",
    clientId: "c-acme",
    slug: "PortalRebuild",
    name: "Invoice Portal Rebuild",
    phase: "pre-project",
    status: "green",
    openRiskIds: [],
    updatedAt: "2026-05-15T00:00:00Z",
  },
];

/**
 * Stub answers to the gate intake questions for the seeded demo projects, so the
 * intake interview does not block "Run all" or per-step generate during testing.
 * Real (user-created) projects start empty and prompt the interview as normal.
 * Keys are the exact question ids from the generated intakeQuestions.ts
 * (risk-scan gate Q13, prd gate Q10).
 */
export const DEMO_INTAKE_ANSWERS: Record<string, Partial<Record<SkillId, Record<string, string>>>> =
  Object.fromEntries(
    DEMO_PROJECTS.map((p) => [p.id, {
      "risk-scan": {
        Q1: "Phase 1 / MVP - in active development",
        Q2: "Standard review - full risk register",
        Q13: "A few I am watching - vendor API access is unconfirmed and staging has been flaky.",
      },
      prd: {
        Q1: "PRD - engineering and product audience",
        Q10: "Yes, write the PRD.",
      },
    }]),
  );

export const DEMO_CONNECTORS: McpConnector[] = [
  { id: "claude",       label: "Claude (Orchestrator)", status: "disconnected" },
  { id: "jira",         label: "Jira",       status: "disconnected" },
  { id: "confluence",   label: "Confluence", status: "disconnected" },
  { id: "google-drive", label: "Drive",      status: "disconnected" },
  { id: "notion",       label: "Notion",     status: "disconnected" },
  { id: "gmail",        label: "Gmail",      status: "disconnected" },
];

/** Human title for a skill id (or "Orchestrator" for the pm orchestrator). */
export function skillTitle(skill: string): string {
  if (skill === "pm") return "Orchestrator";
  return (SKILL_INDEX as Record<string, SkillMeta | undefined>)[skill]?.title ?? skill;
}
