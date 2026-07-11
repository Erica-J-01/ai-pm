/**
 * AI PM Assistant - PM data contracts
 * --------------------------------------------------------------------------
 * Strict TypeScript contracts for the AI PM Assistant web dashboard.
 * Mapped verbatim from INSTRUCTIONS.md (per-skill outputs) and README.md
 * (the PM Orchestrator workflow). The CLI saved Markdown to disk; here every
 * skill returns a typed, render-ready payload.
 *
 * Layering:
 *   1. Context        - ClientContext / ProjectContext (nested client->project)
 *   2. Connectors     - MCP tool connection state (Jira/Confluence/Drive/...)
 *   3. Skills         - the 18 lifecycle skills + the orchestrator
 *   4. Execution      - unified SkillExecution request/response lifecycle
 *   5. Orchestration  - the step-by-step plan the /pm console approves
 *   6. Artifacts      - discriminated union of per-skill output payloads
 */

/* ========================================================================
 * 1. CONTEXT  (mirrors clients/CLIENT/client.md + CLIENT/PROJECT/context.md)
 * ===================================================================== */

export type DeliveryPhase =
  | "pre-project"
  | "discovery"
  | "design"
  | "development"
  | "testing"
  | "deployment";

export type RagStatus = "green" | "amber" | "red";

/** Shared, relationship-level facts (client.md). */
export interface ClientContext {
  id: string;
  /** Uppercase folder-safe slug, e.g. "ACME". Validated [A-Za-z0-9._-]. */
  slug: string;
  name: string;
  accountOwner?: string;
  commercialModel?: "retainer" | "time-and-materials" | "fixed-price" | "unknown";
  stakeholders: Stakeholder[];
  projectIds: string[];
  createdAt: string; // ISO-8601
}

export interface Stakeholder {
  name: string;
  role: string;
  responsibility?: string;
  /** Decision authority - drives sign-off routing in charters/checklists. */
  authority?: "sponsor" | "approver" | "contributor" | "informed";
}

/** Per-engagement state (context.md). One client may hold many of these. */
export interface ProjectContext {
  id: string;
  clientId: string;
  slug: string; // folder-safe
  name: string;
  phase: DeliveryPhase;
  status: RagStatus;
  currentSprint?: SprintRef;
  openRiskIds: string[];
  lastArtifact?: ArtifactRef;
  updatedAt: string;
}

export interface SprintRef {
  number: number;
  goal: string;
  name?: string;
  startDate?: string;
  endDate?: string;
}

export interface ArtifactRef {
  id: string;
  skill: SkillId;
  title: string;
  createdAt: string;
  version: number;
}

/* ========================================================================
 * 2. CONNECTORS  (MCP - read-live / publish; Connection Failsafe aware)
 * ===================================================================== */

export type ConnectorId = "jira" | "confluence" | "google-drive" | "notion" | "gmail" | "claude";

export type ConnectionStatus = "connected" | "disconnected" | "error" | "checking";

export interface McpConnector {
  id: ConnectorId;
  label: string;
  status: ConnectionStatus;
  /** "hosted" = a managed connector; "self" = .mcp.json self-hosted server. */
  mode?: "hosted" | "self";
  detail?: string;
  /** Self-hosted MCP/API endpoint (HTTPS) and token, when configured. */
  endpoint?: string;
  token?: string;
}

/** Outbound destinations a finished artifact can be pushed to. */
export type SaveDestination = ConnectorId | "local" | "clipboard" | "pdf";

/* ========================================================================
 * 3. SKILLS  (the 18 lifecycle skills, grouped + the orchestrator)
 * ===================================================================== */

export type SkillId =
  // Intake & Framing
  | "triage" | "risk-scan" | "charter"
  // Discovery & Requirements
  | "discovery" | "prd" | "stories"
  // Sprint Delivery
  | "sprint-sow" | "sprint-planning" | "sprint-report" | "release-checklist"
  // Governance & Comms
  | "decision-log" | "meeting-notes" | "tech-review" | "retrospective" | "stakeholder-update"
  // Planning & Operations
  | "roadmap" | "budget-tracker" | "onboarding";

export type OrchestratorId = "pm";

export type SkillCategoryId =
  | "intake-framing"
  | "discovery-requirements"
  | "sprint-delivery"
  | "governance-comms"
  | "planning-operations";

export interface SkillMeta {
  id: SkillId;
  /** Command label as shown in the nav, e.g. "/triage". */
  command: string;
  title: string;
  category: SkillCategoryId;
  /** True if the skill can read/publish via MCP (drives action buttons). */
  usesConnectors: boolean;
  /** Connectors this skill may touch - filters the action bar. */
  connectors?: ConnectorId[];
}

export interface SkillCategory {
  id: SkillCategoryId;
  title: string;
  order: number;
  skillIds: SkillId[];
}

/** The five delivery-lifecycle groups from the README, in order. */
export const SKILL_TAXONOMY: readonly SkillCategory[] = [
  { id: "intake-framing", title: "Intake & Framing", order: 1, skillIds: ["triage", "risk-scan", "charter"] },
  { id: "discovery-requirements", title: "Discovery & Requirements", order: 2, skillIds: ["discovery", "prd", "stories"] },
  { id: "sprint-delivery", title: "Sprint Delivery", order: 3, skillIds: ["sprint-sow", "sprint-planning", "sprint-report", "release-checklist"] },
  { id: "governance-comms", title: "Governance & Comms", order: 4, skillIds: ["decision-log", "meeting-notes", "tech-review", "retrospective", "stakeholder-update"] },
  { id: "planning-operations", title: "Planning & Operations", order: 5, skillIds: ["roadmap", "budget-tracker", "onboarding"] },
] as const;

/* ========================================================================
 * 4. EXECUTION LIFECYCLE  (unified request/response for every skill)
 * ===================================================================== */

export type ExecutionStatus =
  | "idle"
  | "planning"          // orchestrator building the plan
  | "awaiting-approval" // plan shown, waiting on the user
  | "running"
  | "streaming"         // partial tokens/sections arriving
  | "complete"
  | "error"
  | "cancelled";

export interface SkillExecutionRequest {
  skill: SkillId | OrchestratorId;
  clientId: string;
  projectId: string;
  /** Raw user input - pasted message, transcript, brief, or form payload. */
  input: string;
  /** Structured form fields when the skill is driven by a form, not free text. */
  fields?: Record<string, unknown>;
  attachments?: FileAttachment[];
  /** Depth hint (risk-scan: low/medium/high), etc. */
  options?: Record<string, string | number | boolean>;
}

export interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** Server reference once uploaded; absent while pending. */
  storageKey?: string;
}

/** Streaming envelope React Query consumes chunk-by-chunk. */
export interface ExecutionChunk {
  executionId: string;
  status: ExecutionStatus;
  /** Markdown delta for live rendering. */
  delta?: string;
  /** Emitted once a typed section finalises. */
  section?: ArtifactSection;
}

/**
 * Unified execution record. `payload` is the discriminated artifact union so a
 * consumer can `switch (execution.payload.skill)` for fully-typed rendering.
 */
export interface SkillExecution<TPayload extends ArtifactPayload = ArtifactPayload> {
  id: string;
  request: SkillExecutionRequest;
  status: ExecutionStatus;
  /** Raw markdown (always present) for the markdown renderer and as an edit/fallback source. */
  markdown: string;
  /** Parsed, typed structure for visual rendering (charts, grids, banners). */
  payload?: TPayload;
  /** True when the model hit the output-token limit and the artefact was cut off. */
  truncated?: boolean;
  error?: { message: string; recoverable: boolean };
  startedAt?: string;
  completedAt?: string;
  /** Where it was saved/published, if anywhere yet. */
  savedTo?: SaveDestination[];
}

export interface ArtifactSection {
  key: string;
  heading: string;
  markdown: string;
}

/* ========================================================================
 * 5. ORCHESTRATION  (the /pm step-by-step plan the console approves)
 * ===================================================================== */

export type PlanStepState = "pending" | "approved" | "running" | "done" | "skipped" | "failed";

export interface PlanStep {
  id: string;
  skill: SkillId;
  /** One-line reason the orchestrator chose this skill. */
  rationale: string;
  /** Steps that must complete first (e.g. PRD before stories). */
  dependsOn: string[];
  /** Safe to run alongside its siblings (e.g. risk-scan beside charter). */
  parallelizable: boolean;
  state: PlanStepState;
  executionId?: string;
}

export interface OrchestrationPlan {
  id: string;
  request: SkillExecutionRequest;
  summary: string;
  steps: PlanStep[];
  status: ExecutionStatus;
}

/* ========================================================================
 * 6. ARTIFACT PAYLOADS  (discriminated by `skill`)
 * ===================================================================== */

/** Scoring scales reused across skills. */
export type HML = "H" | "M" | "L";
export type Detectability = "Easy" | "Moderate" | "Hard";
export type Velocity = "Fast" | "Medium" | "Slow";
export type Priority = "act-now" | "monitor" | "contingency" | "log"; // red/amber/amber/green

/* ---- /risk-scan : 4-dimension matrix (Likelihood x Impact x Detect x Velocity) ---- */
export type RiskCategory =
  | "Product" | "Customer" | "Adoption"
  | "Delivery" | "Technical"
  | "Security" | "Compliance"
  | "Operational" | "Dependency"
  | "Stakeholder" | "Business";

export type RiskProximity = "Week 1-2" | "Month 1" | "Month 2-3" | "Later";

export type Recommendation = "Proceed" | "Proceed with Conditions" | "Escalate" | "Pause";

export interface RiskEntry {
  ref: string; // R1, R2...
  risk: string;
  category: RiskCategory;
  likelihood: HML;
  impact: HML;
  detectability: Detectability;
  velocity: Velocity;
  priority: Priority;
  owner: string;
  /** When the risk is likely to materialise - drives the Timeline view. */
  proximity?: RiskProximity;
  /** Required when detectability is "Hard". */
  triggerSignal?: string;
  response: "Mitigate" | "Transfer" | "Avoid" | "Accept" | "Escalate";
}

export interface RiskAssumption {
  assumption: string;
  confidence: "High" | "Medium" | "Low";
  riskIfWrong: string;
}

export interface RiskDecision {
  decision: string;
  owner: string;
  by: string;
  impactIfDelayed: string;
}

/** Expanded narrative for a top risk (skill "Top Risks - Detail" section). */
export interface RiskDetailEntry {
  ref: string;
  name: string;
  rootCause: string;
  whyExposed: string;
  triggerSignal?: string;
  /** Rough delivery-terms exposure, e.g. "~2-4 weeks". Omitted when not estimable. */
  exposure?: string;
  action: string;
}

/** A cheap test that converts an unknown into evidence (Validation Experiments). */
export interface RiskExperiment {
  ref: string;
  experiment: string;
  testing: string;
  learning: string;
  by: string;
}

/** Delta versus the prior scan (re-scans only). */
export interface RiskChanges {
  added?: string[];
  escalated?: string[];
  deEscalated?: string[];
  closed?: string[];
  nextReview?: string;
}

/** Pre-scaled coordinates (0-100) for the Recharts likelihood x impact matrix. */
export interface RiskMatrixPoint {
  ref: string;
  x: number; // likelihood 0-100
  y: number; // impact 0-100
  priority: Priority;
}

/** Risk-scan depth: low = high-level (3-5 risks), medium = mid-level (5-8), high = detailed (8-12). */
export type RiskDepth = "low" | "medium" | "high";

export interface RiskScanPayload {
  skill: "risk-scan";
  project: string;
  phase: DeliveryPhase;
  depth: RiskDepth;
  verdict: RagStatus;
  /** Overall recommendation from the skill. */
  recommendation?: Recommendation;
  /** Conditions listed when recommendation is "Proceed with Conditions". */
  conditions?: string[];
  /** Stakeholder summary paragraph. */
  stakeholderSummary?: string;
  register: RiskEntry[];
  matrix: RiskMatrixPoint[];
  /** Key assumptions (Medium/High depth). */
  assumptions?: RiskAssumption[];
  /** Expanded detail for the top (red, or top-2 amber) risks. */
  topRisksDetail?: RiskDetailEntry[];
  /** One action line per Mitigate risk not expanded in topRisksDetail. */
  mitigationActions?: { ref: string; action: string }[];
  /** Cheap tests to convert scary unknowns into evidence (Medium/High, optional). */
  validationExperiments?: RiskExperiment[];
  /** Delta versus the prior scan, present only on a re-scan. */
  changesSinceLastScan?: RiskChanges;
  /** Decisions needed with owners and deadlines. */
  decisionsNeeded?: RiskDecision[];
  /** Why the top risks are ranked as they are (High/detailed depth only). */
  prioritisationReasoning?: string;
  /** Areas not assessed due to insufficient data. */
  notAssessed?: { critical: string[]; secondary: string[] };
}

/* ---- /release-checklist : 7 categories, status flags, verdict banner ---- */
export type ChecklistStatus = "PASS" | "FAIL" | "RISK" | "UNCONFIRMED" | "N/A";
export type ReleaseVerdict = "GO" | "NO-GO" | "CONDITIONAL GO";

export type ReleaseCategoryId =
  | "feature-readiness"
  | "testing"
  | "operational-readiness"
  | "communications"
  | "dependencies"
  | "approvals"
  | "post-release-readiness"
  | "hotfix";

export interface ChecklistItem {
  ref: string; // F1, T2...
  label: string;
  status: ChecklistStatus;
  note?: string;
  owner?: string;         // who can confirm the item or owns its resolution
  /** Set when a FAIL is accepted in writing - the item is treated as a RISK. */
  acceptedBy?: string;
}

export interface ReleaseCategory {
  id: ReleaseCategoryId;
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistTally {
  PASS: number; FAIL: number; RISK: number; UNCONFIRMED: number; "N/A": number;
}

/** UNCONFIRMED items grouped by the person who can answer them. */
export interface ChaseGroup {
  owner: string;
  questions: { ref: string; question: string; leadTime?: boolean }[];
}

/** One row of the re-assessment delta table. */
export interface ReleaseDeltaRow {
  ref: string;
  item: string;
  was: string; // FAIL / UNCONFIRMED
  now: string; // PASS / still open
  change: string;
}

/** The decision aid attached to a NO-GO or CONDITIONAL GO verdict. */
export interface PathToGo {
  resolvable: string[];
  descopeOptions: string[];
  reducedRelease: string;
  verdictUnderReducedScope: string;
}

export interface ReleaseChecklistPayload {
  skill: "release-checklist";
  release: string;
  releaseType: "planned" | "hotfix" | "phased" | "feature-flag";
  targetDate?: string;
  categories: ReleaseCategory[];
  tally: ChecklistTally;
  blockers: { ref: string; label: string; owner: string; due?: string }[];
  conditions?: { ref: string; label: string; owner: string; due?: string }[];
  /** UNCONFIRMED items grouped by owner - the day-before-the-meeting chase list. */
  chaseList?: ChaseGroup[];
  /** Re-assessment runs only: what moved since the prior checklist. */
  delta?: ReleaseDeltaRow[];
  verdictMovement?: string;
  /** Present on NO-GO and CONDITIONAL GO verdicts, omitted on a clean GO. */
  pathToGo?: PathToGo;
  verdict: ReleaseVerdict;
  verdictRationale: string;
}

/* ---- /decision-log : a running register (index + detail per decision) ---- */
export type ChangeStatus = "Proposed" | "Under Review" | "Approved" | "Rejected" | "Superseded";

export interface DecisionLogEntry {
  id?: string;              // D-001, D-002 ... assigned in register sequence
  date?: string;            // date decided ("[TBC]" when the input does not say)
  title?: string;           // short decision title for the detail-block heading
  area: "Scope" | "Timeline" | "Budget" | "Architecture" | "Team" | "Process" | "Other";
  originalPlan: string;
  revisedPlan: string;
  reason: string;
  changeProposedBy: string;
  deliveryImpact: string;
  technicalImpact: string;
  productOwnerImpact: string;
  costImpact: string;
  changeStatus: ChangeStatus;
  changeApprovedBy: string; // "[TBC]" when unconfirmed
  supersedes?: string;      // D-00X this decision reverses
  followUps?: string;       // one line, only when something genuinely arises
}

export interface DecisionLogPayload {
  skill: "decision-log";
  project: string;
  preparedBy?: string;
  version?: string;
  lastUpdated?: string;
  entries: DecisionLogEntry[];
  /** Floated ideas that were not decided - never logged as decisions. */
  discussedNotDecided?: string[];
  /** Closing nudge when any entry still needs sign-off. */
  signOffNudge?: string;
}

/* ---- /sprint-planning : 70-80% capacity + overcommit flag ---- */
export type BacklogPriority = "P0" | "P1" | "P2";

export interface CapacityRow {
  person: string;
  availableDays: number;
  workingDays: number;
  usableCapacity: number; // points or hours after the 70-80% haircut
  notes?: string;
}

/** A numeric estimate, or "TBD" for an unestimated item excluded from the load. */
export type BacklogEstimate = number | "TBD";

export interface BacklogItem {
  priority: BacklogPriority;
  item: string;
  estimate: BacklogEstimate;
  owner: string;
  dependencies?: string;
  /** P2 items are stretch and must never be committed at full confidence. */
  isStretch: boolean;
  /** false = this committed item does not serve the sprint goal, so it is flagged. */
  servesGoal?: boolean;
}

/** Carryover re-committed from a prior sprint, counted at remaining effort. */
export interface SprintCarryover {
  item: string;
  originalSprint: string;
  originalEstimate: number | string;
  remainingEffort: number | string;
  reason: string;
  reCommitted: boolean;
}

export interface SprintDependency {
  item: string;
  dependsOn: string;
  owner: string; // team or person that owns the dependency
  status: "Confirmed" | "Unconfirmed";
  riskIfBlocked: string;
}

export interface SprintRisk {
  risk: string;
  impact: string;
  mitigation: string;
}

export interface SprintKeyDate {
  date: string;
  event: string;
}

/** Historical velocity anchor: points averaged over the last N sprints. */
export interface SprintVelocity {
  averagePoints: number;
  sprints: number;
}

export interface SprintPlanPayload {
  skill: "sprint-planning";
  sprint: SprintRef;
  capacity: CapacityRow[];
  /** Sum of usable capacity across the team. */
  usableCapacity: number;
  backlog: BacklogItem[];
  /** Committed load = P0 + P1 (stretch excluded, TBD items excluded). */
  plannedLoad: number;
  /** plannedLoad / usableCapacity, 0-1. */
  loadRatio: number;
  /** Planning band - the tool defaults to 0.70-0.80. */
  capacityThreshold: { min: 0.7; max: 0.8 };
  /** True when loadRatio exceeds capacityThreshold.max. Drives the UI warning. */
  overcommitted: boolean;
  /** Historical velocity anchor. Absent = no baseline, so load % is indicative. */
  velocity?: SprintVelocity;
  carryover?: SprintCarryover[];
  dependencies?: SprintDependency[];
  risks?: SprintRisk[];
  /** proposed = true renders the "confirm with team" title when the team has no DoD of its own. */
  definitionOfDone?: { proposed: boolean; items: string[] };
  keyDates?: SprintKeyDate[];
}

/* ---- /sprint-report : velocity + burndown (charts) ---- */
export type GoalStatus = "on-track" | "at-risk" | "missed" | "not-stated";
export type VelocityAssessment = "on-trend" | "over-committed" | "under-committed";
export type RiskLevel = "Low" | "Medium" | "High";

export interface SprintReportPayload {
  skill: "sprint-report";
  sprint: string;
  day: number;
  totalDays: number;
  /** true = the sprint is closed, so the report is a close-out (actuals + carry-over). */
  closed?: boolean;
  status: RagStatus;
  /** undefined = not assessable (days remaining unknown) - never fabricate a %. */
  confidence?: number; // 0-100
  riskLevel?: RiskLevel;
  forecast: string; // in close-out mode this reads as actuals
  committed: number;
  completed: number;
  /** Sprint goal and its attainment. goalStatus "not-stated" when no goal was given. */
  goal?: string;
  goalStatus?: GoalStatus;
  /** Trailing velocity average and the committed-vs-average verdict, when history exists. */
  trailingAverage?: number;
  velocityAssessment?: VelocityAssessment;
  velocityTrend: { sprint: string; points: number }[];
  burndown: { day: number; remaining: number; ideal: number }[];
  topRisks: string[];
  /** Narrative sections (PM brief). */
  summary?: string;
  /** Movement since the prior report on this sprint (re-run delta). */
  movement?: string;
  priorities?: string[];
  actionsToday?: string[];
  standupQuestions?: string[];
  /** Close-out mode only: items carried over and what they mean for the next sprint. */
  carryover?: string[];
  nextSprintImplications?: string;
  leadershipUpdate?: string;
}

/* ---- /budget-tracker : per-developer cost mapped against budget ---- */
export interface BudgetDeveloper {
  name: string;
  hours: number;
  rate: number;   // cost per hour
  cost: number;   // hours * rate
}
export type CommercialModel = "fixed-price" | "time-and-materials" | "retainer";

export interface BudgetTrackerPayload {
  skill: "budget-tracker";
  project: string;
  verdict: RagStatus;
  /** Which RAG threshold fired, so the verdict is reproducible. */
  verdictRule?: string;
  commercialModel?: CommercialModel;
  /** Baseline split: original budget plus approved changes = the current baseline (`approved`). */
  originalBudget?: number;
  approvedChanges?: number;
  approvedChangesRef?: string;   // decision-log reference for the change order
  approved: number;              // current baseline
  spent: number;
  spentCaveat?: string;          // e.g. invoice-lag note
  committed: number;
  remaining: number;
  forecastAtCompletion: number;
  /** Which forecast drives the verdict, plus the two methods when they diverge. */
  forecastMethod?: "run-rate" | "scope-based";
  runRateForecast?: number;
  scopeForecast?: number;
  forecastAssumptions?: string;
  knownOneOffs?: { item: string; amount: number }[];
  variance: number;
  timeElapsedPct: number;
  scopeCompletePct: number;
  plannedStart?: string;
  plannedEnd?: string;
  /** Burn rate and the exhaustion-date check. */
  avgBurnPerPeriod?: number;
  burnPeriodLabel?: string;      // "sprint" / "week"
  exhaustionDate?: string;
  /** Movement since the prior budget report. */
  movement?: string;
  varianceDrivers?: { driver: string; effect: string; note?: string }[];
  actions?: { action: string; owner: string; by?: string }[];
  /** Per-developer cost breakdown (name, hours, rate). */
  developers?: BudgetDeveloper[];
  burn?: { period: string; cumulative: number; budgetLine: number }[];
}

/* ---- /roadmap : sprint/week timeline (Gantt-style bars) ---- */
export interface RoadmapTask {
  name: string;
  lane: string;      // grouping, e.g. "Sprint 1"
  startWeek: number; // 1-based inclusive
  endWeek: number;   // 1-based inclusive
  startDate?: string;
  endDate?: string;
}
export type RoadmapConfidence = "High" | "Medium" | "Low";
export type RoadmapSize = "S" | "M" | "L";

export interface RoadmapItem {
  initiative: string;
  theme?: string;
  note?: string;                 // why now / depends on / open question
  confidence: RoadmapConfidence;
  size?: RoadmapSize;            // present only when the input carries an effort signal
}
export interface RoadmapBucket {
  name: string;                  // "Now" / "Next" / "Later" or "Q1" ...
  span?: string;                 // rough time meaning, e.g. "roughly this quarter"
  items: RoadmapItem[];
}
export interface RoadmapCommitment {
  commitment: string;
  date: string;                  // a fixed date stated in the input, never inferred
  sitsIn: string;                // which bucket it lands in
}

export interface RoadmapPayload {
  skill: "roadmap";
  goal: string;
  horizon: string;
  confidence?: string;           // "Near-term firm, later directional"
  nextReview?: string;
  /** The Now/Next/Later (or quarterly) buckets - the roadmap's core content. */
  buckets?: RoadmapBucket[];
  hardCommitments?: RoadmapCommitment[];
  /** Update mode: what moved since the prior roadmap. */
  changesSince?: { date: string; changes: string[] };
  /** One-line flag when the Now bucket obviously exceeds known capacity. */
  capacityFlag?: string;
  dependencies?: string[];
  notNow?: string[];
  assumptions?: string[];
  /** Optional timeline visual. Total number of week columns. */
  weeks: number;
  /** Lane labels in order. */
  lanes: string[];
  tasks: RoadmapTask[];
}

/* ---- /stories : epics + stories tree (As a / I want / So that + AC) ---- */
export interface StoryItem {
  key?: string;
  title: string;
  /** As a {persona} / I want to {goal} / So that {outcome}. */
  asA?: string;
  iWant?: string;
  soThat?: string;
  /** Testable acceptance criteria, one statement per entry. */
  acceptanceCriteria?: string[];
  /** Indicative PM size pending team estimation. "TBD" is a legitimate value. */
  points?: number | string;
  status?: string;
  /** MoSCoW priority: Must / Should / Could. */
  priority?: string;
  /** Traceability back to the source requirement, e.g. "FR-04" or "None". */
  linkedRequirement?: string;
}
export interface EpicItem {
  key?: string;
  name: string;
  summary: string;
  stories: StoryItem[];
}
export interface StoriesPayload {
  skill: "stories";
  epics: EpicItem[];
  /** One-line requirement-coverage statement, flagging any orphaned requirements. */
  coverageNote?: string;
}

/* ---- Document skills : structured sections rendered as cards (DocumentView) ---- */
export type DocSkill =
  | "triage" | "charter" | "discovery" | "prd" | "sprint-sow"
  | "meeting-notes" | "tech-review" | "retrospective" | "stakeholder-update" | "onboarding";

/** A rendered section of a document artifact. */
export interface DocSection {
  heading?: string;
  /** fields = label/value grid, bullets = list, rows = table, tags = chips, text = paragraph. */
  kind: "fields" | "bullets" | "rows" | "tags" | "text";
  pairs?: { label: string; value: string }[];
  items?: string[];
  columns?: string[];
  rows?: string[][];
  body?: string;
}

export interface DocPayload {
  skill: DocSkill;
  /** Optional status banner (e.g. stakeholder RAG). */
  status?: { label: string; tone: StatusTone };
  sections: DocSection[];
}

/** Discriminated union - switch on `.skill` for exhaustive, typed rendering. */
export type ArtifactPayload =
  | RiskScanPayload
  | ReleaseChecklistPayload
  | DecisionLogPayload
  | SprintPlanPayload
  | SprintReportPayload
  | BudgetTrackerPayload
  | RoadmapPayload
  | StoriesPayload
  | DocPayload;

/* ========================================================================
 * 7. UI-LEVEL HELPERS  (status -> token mapping, type guards)
 * ===================================================================== */

export type StatusTone = "success" | "info" | "warning" | "danger" | "neutral" | "na";

/** Maps a release checklist flag to a Tailwind status token. */
export const CHECKLIST_TONE: Record<ChecklistStatus, StatusTone> = {
  PASS: "success",
  FAIL: "danger",
  RISK: "warning",
  UNCONFIRMED: "neutral",
  "N/A": "na",
};

export const VERDICT_TONE: Record<ReleaseVerdict, StatusTone> = {
  GO: "success",
  "NO-GO": "danger",
  "CONDITIONAL GO": "warning",
};

export const PRIORITY_TONE: Record<Priority, StatusTone> = {
  "act-now": "danger",
  monitor: "warning",
  contingency: "warning",
  log: "success",
};

export function isRiskScan(p?: ArtifactPayload): p is RiskScanPayload {
  return p?.skill === "risk-scan";
}
export function isReleaseChecklist(p?: ArtifactPayload): p is ReleaseChecklistPayload {
  return p?.skill === "release-checklist";
}
export function isDecisionLog(p?: ArtifactPayload): p is DecisionLogPayload {
  return p?.skill === "decision-log";
}
export function isSprintPlan(p?: ArtifactPayload): p is SprintPlanPayload {
  return p?.skill === "sprint-planning";
}
export function isSprintReport(p?: ArtifactPayload): p is SprintReportPayload {
  return p?.skill === "sprint-report";
}
export function isBudgetTracker(p?: ArtifactPayload): p is BudgetTrackerPayload {
  return p?.skill === "budget-tracker";
}
export function isRoadmap(p?: ArtifactPayload): p is RoadmapPayload {
  return p?.skill === "roadmap";
}
export function isStories(p?: ArtifactPayload): p is StoriesPayload {
  return p?.skill === "stories";
}
const DOC_SKILLS = new Set<string>([
  "triage", "charter", "discovery", "prd", "sprint-sow",
  "meeting-notes", "tech-review", "retrospective", "stakeholder-update", "onboarding",
]);
export function isDoc(p?: ArtifactPayload): p is DocPayload {
  return !!p && DOC_SKILLS.has(p.skill);
}
