import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  ClientContext, ConnectionStatus, ConnectorId, McpConnector, ProjectContext, RiskDepth, SkillExecution, SkillId,
} from "@/types/pm";

/* ── Connector credential persistence (sessionStorage) ───────────────── */
// Credentials (Claude key, Confluence token) are kept in sessionStorage, not
// localStorage, so they are cleared when the tab closes and never persisted to
// disk - a smaller window for a stolen key.
const CONNECTOR_STORAGE_KEY = "ai-pm-connector-apis";

type PersistedApis = Partial<Record<ConnectorId, { endpoint?: string; token?: string }>>;

function loadPersistedApis(): PersistedApis {
  try {
    const raw = sessionStorage.getItem(CONNECTOR_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedApis) : {};
  } catch { return {}; }
}

function persistApis(apis: PersistedApis) {
  try { sessionStorage.setItem(CONNECTOR_STORAGE_KEY, JSON.stringify(apis)); }
  catch { /* storage unavailable - in-memory only */ }
}

function mergePersistedConnectors(defaults: McpConnector[]): McpConnector[] {
  const saved = loadPersistedApis();
  return defaults.map((c) => {
    const s = saved[c.id];
    if (!s?.endpoint && !s?.token) return c;
    return { ...c, endpoint: s.endpoint, token: s.token, status: "connected" as ConnectionStatus };
  });
}
import { DEMO_CLIENTS, DEMO_PROJECTS, DEMO_CONNECTORS } from "@/data/demo";
import { SAMPLE_ARTIFACTS } from "@/data/sampleArtifacts";
import { STEPS, TEST_DATA, RECORD_NOUN, type StepValues } from "@/components/onboarding/steps";
import { RECORD_SEEDS } from "@/components/onboarding/recordSeeds";
import { buildExecution } from "@/components/onboarding/buildArtifact";
import { ACME_DATA } from "@/data/acmeData";
import { PORTAL_DATA } from "@/data/portalData";
import { downstreamOf, dependenciesOf } from "@/data/skillChain";
import { buildChainContext, intakeAnswersContext } from "@/api/artifactDigest";
import { getClaudeApiKey, regenerateSkillLive } from "@/api/claudeOrchestrator";

/** A single named record for a multi-record skill (a meeting, a sprint, etc.). */
export interface ArtifactRecord {
  id: string;
  title: string;
  date: string;
  values: StepValues;
}
type RecordsMap = Record<string, Partial<Record<SkillId, ArtifactRecord[]>>>;
let recSeq = 1;

/** Chain skills marked approved for the pre-built Acme example. */
const ACME_APPROVED: Partial<Record<SkillId, SkillDecision>> = {
  triage: "approved", "risk-scan": "approved", charter: "approved", discovery: "approved",
  prd: "approved", stories: "approved", "sprint-sow": "approved", "sprint-planning": "approved",
};

/** Structured artifact inputs per project, per skill (drives the Edit form). */
type ArtifactValues = Record<string, Partial<Record<SkillId, StepValues>>>;

/** Per-step orchestration outcome. Skipped sections are generated blank. */
export type SkillDecision = "approved" | "skipped";
type SkillStatusMap = Record<string, Partial<Record<SkillId, SkillDecision>>>;

/**
 * Single source of truth for what's shown AND what's edited. For a skill with a
 * structured schema, the artifact is built from its saved inputs (or the seed),
 * so the canvas and the Edit form always match. Other skills fall back to the
 * static sample.
 */
function artifactFor(
  skill: SkillId, clientId: string | undefined, projectId: string | undefined, values: ArtifactValues,
): SkillExecution | null {
  const step = STEPS.find((s) => s.id === skill);
  if (step) {
    const v = values[projectId ?? ""]?.[skill] ?? TEST_DATA[skill] ?? {};
    return buildExecution(step, v, clientId ?? "", projectId ?? "");
  }
  return SAMPLE_ARTIFACTS[skill] ?? null;
}

interface WorkspaceValue {
  clients: ClientContext[];
  projects: ProjectContext[];
  connectors: McpConnector[];
  activeClientId?: string;
  activeProjectId?: string;
  activeSkill?: SkillId;
  current: SkillExecution | null;
  /** Skill currently being edited in the structured form (null = show console). */
  editingSkill: SkillId | null;
  /** Record id being edited (multi-record skills); null = the skill's single artifact. */
  editingRecordId: string | null;
  /** Structured artifact inputs per project, per skill (single-record skills). */
  artifactValues: ArtifactValues;
  /** Named record collections for multi-record skills. */
  records: RecordsMap;
  /** Projects whose first orchestration has finished (unlocks the skill nav). */
  orchestratedProjects: string[];
  /** Per-project, per-skill orchestration decision (drives the nav indicators). */
  skillStatus: SkillStatusMap;
  /** Per-project: was the risk-scan visualisation/dashboard generated? */
  riskVizApproved: Record<string, boolean>;
  /** Record the risk visualisation decision for a project. */
  setRiskViz: (projectId: string, approved: boolean) => void;
  /** Per-project: the chosen risk-scan depth (high-level / mid-level / detailed). */
  riskScanLevel: Record<string, RiskDepth>;
  /** Record the chosen risk-scan level for a project. */
  setRiskScanLevel: (projectId: string, level: RiskDepth) => void;
  /** Per-project: skills made stale by an upstream edit (B3 cascade). */
  staleSkills: Record<string, SkillId[]>;
  /** Persist the original orchestration brief (enables live regeneration). */
  setOrchestrationInput: (projectId: string, input: string) => void;
  /** Regenerate one skill after an upstream change and clear its stale flag. */
  regenerate: (projectId: string, skill: SkillId) => Promise<void>;
  /** Per-project: skills that have actually been generated (drives nav greying). */
  generatedSkills: Record<string, SkillId[]>;
  /** Per-project: generated/changed skills this user has not viewed yet (green dot). */
  unseenSkills: Record<string, SkillId[]>;
  /** Finish a step-by-step run: record skip decisions and mark orchestrated. */
  finalizeStepwise: (projectId: string, decisions: Record<SkillId, SkillDecision>) => void;
  /** Mark a set of skills stale (intake-answer-change cascade). */
  markStale: (projectId: string, skills: SkillId[]) => void;
  /** Per-project, per-skill intake interview answers (persisted for regeneration). */
  intakeAnswers: Record<string, Partial<Record<SkillId, Record<string, string>>>>;
  /** Persist a skill's intake answers for a project. */
  setIntakeAnswers: (projectId: string, skill: SkillId, answers: Record<string, string>) => void;
  selectClient: (id: string) => void;
  selectProject: (id: string) => void;
  selectSkill: (id: SkillId) => void;
  showExecution: (e: SkillExecution) => void;
  /** Create a client only (no project yet); selects it and clears the project. */
  addClient: (clientName: string) => void;
  addProject: (clientId: string, projectName: string) => void;
  /** Delete a project (and clear selection if it was active). */
  deleteProject: (projectId: string) => void;
  /** Delete a client and all its projects (and clear selection if active). */
  deleteClient: (clientId: string) => void;
  setConnectorStatus: (id: ConnectorId, status: ConnectionStatus) => void;
  /** Save (or clear) a connector's API endpoint + token. */
  setConnectorApi: (id: ConnectorId, patch: { endpoint?: string; token?: string }) => void;
  /** Open the structured editor for a skill (optionally a specific record). */
  beginEdit: (skill: SkillId, recordId?: string) => void;
  /** Close the structured editor (back to the console / record list). */
  endEdit: () => void;
  /** Persist a skill's structured inputs for the active project (single-record). */
  saveArtifactValues: (projectId: string, skill: SkillId, values: StepValues) => void;
  /** Multi-record helpers. */
  ensureRecords: (projectId: string, skill: SkillId) => ArtifactRecord[];
  addRecord: (projectId: string, skill: SkillId) => string;
  updateRecordMeta: (projectId: string, skill: SkillId, id: string, patch: Partial<Pick<ArtifactRecord, "title" | "date">>) => void;
  saveRecord: (projectId: string, skill: SkillId, id: string, values: StepValues) => void;
  openRecord: (projectId: string, skill: SkillId, id: string) => void;
  /**
   * Finish orchestration: generate the approved sections from seed data (or
   * Claude executions when provided), leave skipped ones blank, record the
   * decisions, and unlock the skill nav.
   */
  completeOrchestration: (
    projectId: string,
    decisions: Record<SkillId, SkillDecision>,
    claudeExecutions?: Partial<Record<SkillId, import("@/types/pm").SkillExecution>>,
  ) => void;
  /** Show a skill's artifact in the canvas without changing the active skill. */
  previewSkill: (skill: SkillId) => void;
  /** Generate a previously-skipped section (populate from seed, mark approved). */
  generateSkill: (projectId: string, skill: SkillId) => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

let idSeq = 1;
const slugify = (s: string) => s.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientContext[]>(DEMO_CLIENTS);
  const [projects, setProjects] = useState<ProjectContext[]>(DEMO_PROJECTS);
  const [connectors, setConnectors] = useState<McpConnector[]>(() => mergePersistedConnectors(DEMO_CONNECTORS));
  // Nothing is pre-selected: the user picks a client, then a project, before the
  // skill nav and artifacts appear.
  const [activeClientId, setActiveClientId] = useState<string | undefined>(undefined);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [activeSkill, setActiveSkill] = useState<SkillId | undefined>(undefined);
  const [current, setCurrent] = useState<SkillExecution | null>(null);
  const [editingSkill, setEditingSkill] = useState<SkillId | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordsMap>({});
  // All demo projects ship pre-orchestrated with stub data so they open populated.
  const [artifactValues, setArtifactValues] = useState<ArtifactValues>({
    "p-notifications": { ...(TEST_DATA as Partial<Record<SkillId, StepValues>>) },
    "p-portal": { ...(PORTAL_DATA as Partial<Record<SkillId, StepValues>>) },
    "p-rebuild": { ...(ACME_DATA as Partial<Record<SkillId, StepValues>>) },
  });
  // Customer Portal + Acme ship pre-orchestrated (stub data visible). Real-time
  // Notifications is left un-orchestrated so it demos the Run Orchestrator flow
  // with a pre-filled prompt.
  const [orchestratedProjects, setOrchestratedProjects] = useState<string[]>(["p-portal", "p-rebuild"]);
  const [skillStatus, setSkillStatus] = useState<SkillStatusMap>({
    "p-portal": ACME_APPROVED,
    "p-rebuild": ACME_APPROVED,
  });
  // Which approved skills have actually been generated (step-by-step grows this
  // incrementally; run-all fills it in one go). Pre-built projects start full.
  const [generatedSkills, setGeneratedSkills] = useState<Record<string, SkillId[]>>({
    "p-portal": Object.keys(ACME_APPROVED) as SkillId[],
    "p-rebuild": Object.keys(ACME_APPROVED) as SkillId[],
  });
  // Per-project skills that have been generated/changed but not yet viewed by
  // this user (drives the green "unseen" dot). Pre-built demos start fully seen.
  // NOTE: this is the per-user half only. Cross-user sync (a section another user
  // edited re-flagging for everyone else) needs a backend - see BACKEND_TODO.md.
  const [unseenSkills, setUnseenSkills] = useState<Record<string, SkillId[]>>({});
  const markUnseen = useCallback((projectId: string, skills: SkillId[]) => {
    setUnseenSkills((m) => ({ ...m, [projectId]: [...new Set([...(m[projectId] ?? []), ...skills])] }));
  }, []);
  const markSeen = useCallback((projectId: string, skill: SkillId) => {
    setUnseenSkills((m) => ({ ...m, [projectId]: (m[projectId] ?? []).filter((s) => s !== skill) }));
  }, []);
  // Pre-built projects have their risk dashboard available; Notifications decides at orchestration.
  const [riskVizApproved, setRiskVizApproved] = useState<Record<string, boolean>>({ "p-portal": true, "p-rebuild": true });
  const setRiskViz = useCallback((projectId: string, approved: boolean) => {
    setRiskVizApproved((m) => ({ ...m, [projectId]: approved }));
  }, []);
  // Risk-scan level is a per-project display choice made on the artefact; it
  // defaults to high-level (see RiskScanView) until the user picks another.
  const [riskScanLevel, setRiskScanLevelState] = useState<Record<string, RiskDepth>>({});
  const setRiskScanLevel = useCallback((projectId: string, level: RiskDepth) => {
    setRiskScanLevelState((m) => ({ ...m, [projectId]: level }));
  }, []);
  // B3 edit-cascade: skills whose upstream changed (need regenerating), per project.
  const [staleSkills, setStaleSkills] = useState<Record<string, SkillId[]>>({});
  // Original orchestration brief per project, kept so a skill can be regenerated live.
  const [orchestrationInput, setOrchestrationInputState] = useState<Record<string, string>>({});
  const setOrchestrationInput = useCallback((projectId: string, input: string) => {
    setOrchestrationInputState((m) => ({ ...m, [projectId]: input }));
  }, []);
  // Intake interview answers per project, per skill. Persisted so a later
  // regeneration (B3 cascade) re-reads the answers the artefact was built with.
  const [intakeAnswers, setIntakeAnswersState] = useState<Record<string, Partial<Record<SkillId, Record<string, string>>>>>({});
  const setIntakeAnswers = useCallback((projectId: string, skill: SkillId, answers: Record<string, string>) => {
    setIntakeAnswersState((m) => ({ ...m, [projectId]: { ...(m[projectId] ?? {}), [skill]: answers } }));
  }, []);
  // Claude-generated executions keyed as "${projectId}::${skill}"
  const [claudeExecMap, setClaudeExecMap] = useState<Record<string, import("@/types/pm").SkillExecution>>({});

  // Changing client or project starts that context fresh: no skill, no artifact,
  // no open editor.
  const resetWorkContext = () => {
    setActiveSkill(undefined);
    setCurrent(null);
    setEditingSkill(null);
  };

  const selectClient = useCallback((id: string) => {
    setActiveClientId(id);
    setActiveProjectId(undefined);
    resetWorkContext();
  }, []);

  const selectProject = useCallback((id: string) => {
    setActiveProjectId(id);
    resetWorkContext();
  }, []);

  const selectSkill = useCallback((id: SkillId) => {
    setActiveSkill(id);
    const claudeExec = claudeExecMap[`${activeProjectId}::${id}`];
    setCurrent(claudeExec ?? artifactFor(id, activeClientId, activeProjectId, artifactValues));
    setEditingSkill(null); // switching skills leaves any open editor
    setEditingRecordId(null);
    if (activeProjectId) markSeen(activeProjectId, id); // viewing it clears its unseen dot
  }, [activeClientId, activeProjectId, artifactValues, claudeExecMap, markSeen]);

  const showExecution = useCallback((e: SkillExecution) => setCurrent(e), []);

  const makeProject = (clientId: string, projectName: string): ProjectContext => ({
    id: `p-${slugify(projectName).toLowerCase()}-${idSeq++}`,
    clientId,
    slug: slugify(projectName),
    name: projectName,
    phase: "pre-project",
    status: "green",
    openRiskIds: [],
    updatedAt: new Date().toISOString(),
  });

  // A fresh project starts clean: no active skill/artifact/editor, so the center
  // shows the orchestrator console ready to run (kicking off orchestration).
  const addProject = useCallback((clientId: string, projectName: string) => {
    const project = makeProject(clientId, projectName);
    setProjects((ps) => [...ps, project]);
    setActiveClientId(clientId);
    setActiveProjectId(project.id);
    setActiveSkill(undefined);
    setCurrent(null);
    setEditingSkill(null);
    setEditingRecordId(null);
  }, []);

  const addClient = useCallback((clientName: string) => {
    const clientId = `c-${slugify(clientName).toLowerCase()}-${idSeq++}`;
    const client: ClientContext = {
      id: clientId, slug: slugify(clientName).toUpperCase(), name: clientName,
      stakeholders: [], projectIds: [], createdAt: new Date().toISOString(),
    };
    setClients((cs) => [...cs, client]);
    setActiveClientId(clientId);
    setActiveProjectId(undefined); // no project yet - user adds one to start orchestration
    setActiveSkill(undefined);
    setCurrent(null);
    setEditingSkill(null);
    setEditingRecordId(null);
  }, []);

  /** Delete a project. If it was active, drop back to the client with no project selected. */
  const deleteProject = useCallback((projectId: string) => {
    setProjects((ps) => ps.filter((p) => p.id !== projectId));
    setActiveProjectId((cur) => {
      if (cur !== projectId) return cur;
      setActiveSkill(undefined);
      setCurrent(null);
      setEditingSkill(null);
      setEditingRecordId(null);
      return undefined;
    });
  }, []);

  /** Delete a client and all of its projects. If active, clear the selection. */
  const deleteClient = useCallback((clientId: string) => {
    setProjects((ps) => ps.filter((p) => p.clientId !== clientId));
    setClients((cs) => cs.filter((c) => c.id !== clientId));
    setActiveClientId((cur) => {
      if (cur !== clientId) return cur;
      setActiveProjectId(undefined);
      setActiveSkill(undefined);
      setCurrent(null);
      setEditingSkill(null);
      setEditingRecordId(null);
      return undefined;
    });
  }, []);

  const setConnectorStatus = useCallback((id: ConnectorId, status: ConnectionStatus) => {
    setConnectors((cs) => cs.map((c) => (c.id === id ? { ...c, status, detail: undefined } : c)));
  }, []);

  const setConnectorApi = useCallback((id: ConnectorId, patch: { endpoint?: string; token?: string }) => {
    setConnectors((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    // Persist to sessionStorage so credentials survive a refresh within the tab.
    const saved = loadPersistedApis();
    if (!patch.endpoint && !patch.token) {
      delete saved[id];
    } else {
      saved[id] = { ...saved[id], ...patch };
    }
    persistApis(saved);
  }, []);

  const beginEdit = useCallback((skill: SkillId, recordId?: string) => {
    setEditingSkill(skill);
    setEditingRecordId(recordId ?? null);
  }, []);
  const endEdit = useCallback(() => { setEditingSkill(null); setEditingRecordId(null); }, []);
  const saveArtifactValues = useCallback((projectId: string, skill: SkillId, values: StepValues) => {
    setArtifactValues((m) => ({ ...m, [projectId]: { ...(m[projectId] ?? {}), [skill]: values } }));
    markSeen(projectId, skill); // the editor has seen their own change (others would see a dot - needs a backend)
    // The chain dependency is a GENERATION-TIME aid only. While still orchestrating,
    // editing an upstream artefact resets everything downstream so it can be
    // regenerated. Once orchestration is complete the artefacts are independent
    // living documents - an edit must never wipe downstream work the team owns.
    const status = skillStatus[projectId] ?? {};
    const approved = (Object.keys(status) as SkillId[]).filter((k) => status[k] === "approved");
    const complete = approved.length > 0 && approved.every((k) => (generatedSkills[projectId] ?? []).includes(k));
    if (!complete) {
      const downstream = downstreamOf(skill);
      if (downstream.length) {
        setGeneratedSkills((g) => ({ ...g, [projectId]: (g[projectId] ?? []).filter((s) => !downstream.includes(s)) }));
      }
    }
  }, [markSeen, skillStatus, generatedSkills]);

  /* ---------------- multi-record helpers ---------------- */

  const ensureRecords = useCallback((projectId: string, skill: SkillId): ArtifactRecord[] => {
    const existing = records[projectId]?.[skill];
    if (existing) return existing; // already seeded (possibly empty by intent)

    // A skipped section stays empty - no mock records.
    if (skillStatus[projectId]?.[skill] === "skipped") {
      setRecords((m) => ({ ...m, [projectId]: { ...(m[projectId] ?? {}), [skill]: [] } }));
      return [];
    }

    const seeds = RECORD_SEEDS[skill];
    let list: ArtifactRecord[];
    if (seeds && seeds.length) {
      list = seeds.map((s) => ({ id: `rec-${recSeq++}`, title: s.title, date: s.date, values: s.values }));
    } else {
      const seed = (artifactValues[projectId]?.[skill] ?? TEST_DATA[skill] ?? {}) as StepValues;
      const noun = RECORD_NOUN[skill] ?? "Item";
      list = [{ id: `rec-${recSeq++}`, title: `${noun} 1`, date: (typeof seed.date === "string" ? seed.date : "") || "", values: seed }];
    }
    setRecords((m) => ({ ...m, [projectId]: { ...(m[projectId] ?? {}), [skill]: list } }));
    return list;
  }, [records, artifactValues, skillStatus]);

  const addRecord = useCallback((projectId: string, skill: SkillId): string => {
    const list = records[projectId]?.[skill] ?? [];
    const noun = RECORD_NOUN[skill] ?? "Item";
    const rec: ArtifactRecord = { id: `rec-${recSeq++}`, title: `${noun} ${list.length + 1}`, date: "", values: {} };
    setRecords((m) => ({ ...m, [projectId]: { ...(m[projectId] ?? {}), [skill]: [...list, rec] } }));
    return rec.id;
  }, [records]);

  const updateRecordMeta = useCallback((projectId: string, skill: SkillId, id: string, patch: Partial<Pick<ArtifactRecord, "title" | "date">>) => {
    setRecords((m) => ({
      ...m,
      [projectId]: { ...(m[projectId] ?? {}), [skill]: (m[projectId]?.[skill] ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)) },
    }));
  }, []);

  const saveRecord = useCallback((projectId: string, skill: SkillId, id: string, values: StepValues) => {
    setRecords((m) => ({
      ...m,
      [projectId]: {
        ...(m[projectId] ?? {}),
        [skill]: (m[projectId]?.[skill] ?? []).map((r) =>
          r.id === id ? { ...r, values, date: (typeof values.date === "string" && values.date) || r.date } : r),
      },
    }));
  }, []);

  const openRecord = useCallback((projectId: string, skill: SkillId, id: string) => {
    const rec = records[projectId]?.[skill]?.find((r) => r.id === id);
    const step = STEPS.find((s) => s.id === skill);
    if (rec && step) {
      setActiveSkill(skill);
      setCurrent(buildExecution(step, rec.values, activeClientId ?? "", projectId));
    }
  }, [records, activeClientId]);

  const completeOrchestration = useCallback((
    projectId: string,
    decisions: Record<SkillId, SkillDecision>,
    incomingClaudeExecs?: Partial<Record<SkillId, import("@/types/pm").SkillExecution>>,
  ) => {
    const skills = Object.keys(decisions) as SkillId[];
    // Approved -> generate from seed data; skipped -> blank (an explicit {}).
    setArtifactValues((m) => {
      const next: Partial<Record<SkillId, StepValues>> = { ...(m[projectId] ?? {}) };
      skills.forEach((skill) => {
        next[skill] = decisions[skill] === "approved" ? (TEST_DATA[skill] ?? {}) : {};
      });
      return { ...m, [projectId]: next };
    });
    setSkillStatus((s) => ({ ...s, [projectId]: decisions }));
    setOrchestratedProjects((p) => (p.includes(projectId) ? p : [...p, projectId]));
    // Run-all generates every approved skill at once. They start unseen (green dot);
    // the one surfaced below is marked seen.
    const approvedSkills = skills.filter((k) => decisions[k] === "approved");
    setGeneratedSkills((g) => ({ ...g, [projectId]: approvedSkills }));
    markUnseen(projectId, approvedSkills);

    // Store Claude executions (override the TEST_DATA path for skill nav clicks).
    if (incomingClaudeExecs) {
      setClaudeExecMap((m) => {
        const next = { ...m };
        for (const [skill, exec] of Object.entries(incomingClaudeExecs)) {
          if (exec) next[`${projectId}::${skill}`] = exec;
        }
        return next;
      });
    }

    // Surface the first approved section so the canvas isn't empty.
    const firstApproved = skills.find((k) => decisions[k] === "approved");
    if (firstApproved) {
      setActiveSkill(firstApproved);
      const claudeExec = incomingClaudeExecs?.[firstApproved];
      if (claudeExec) {
        setCurrent(claudeExec);
      } else {
        const step = STEPS.find((s) => s.id === firstApproved);
        if (step) setCurrent(buildExecution(step, (TEST_DATA[firstApproved] ?? {}) as StepValues, activeClientId ?? "", projectId));
      }
      markSeen(projectId, firstApproved); // the surfaced section is considered viewed
    }
  }, [activeClientId, markUnseen, markSeen]);

  const previewSkill = useCallback((skill: SkillId) => {
    const claudeExec = claudeExecMap[`${activeProjectId}::${skill}`];
    setCurrent(claudeExec ?? artifactFor(skill, activeClientId, activeProjectId, artifactValues));
    if (activeProjectId) markSeen(activeProjectId, skill);
  }, [activeClientId, activeProjectId, artifactValues, claudeExecMap, markSeen]);

  const generateSkill = useCallback((projectId: string, skill: SkillId) => {
    const seed = (TEST_DATA[skill] ?? {}) as StepValues;
    setArtifactValues((m) => ({ ...m, [projectId]: { ...(m[projectId] ?? {}), [skill]: seed } }));
    setSkillStatus((s) => ({ ...s, [projectId]: { ...(s[projectId] ?? {}), [skill]: "approved" } }));
    setGeneratedSkills((g) => ({ ...g, [projectId]: [...new Set([...(g[projectId] ?? []), skill])] }));
    const step = STEPS.find((x) => x.id === skill);
    if (step) {
      setActiveSkill(skill);
      setCurrent(buildExecution(step, seed, activeClientId ?? "", projectId));
    }
    markSeen(projectId, skill);
  }, [activeClientId, markSeen]);


  /** Finish a step-by-step run: record skip decisions, mark complete, do not regenerate. */
  const finalizeStepwise = useCallback((projectId: string, decisions: Record<SkillId, SkillDecision>) => {
    setSkillStatus((s) => ({ ...s, [projectId]: { ...(s[projectId] ?? {}), ...decisions } }));
    setOrchestratedProjects((p) => (p.includes(projectId) ? p : [...p, projectId]));
  }, []);

  /** Mark a set of skills stale (used by the intake-answer-change cascade). */
  const markStale = useCallback((projectId: string, skills: SkillId[]) => {
    setStaleSkills((m) => ({ ...m, [projectId]: [...new Set([...(m[projectId] ?? []), ...skills])] }));
  }, []);

  /**
   * B3: regenerate one skill after an upstream change. Live (Claude key + the
   * original brief) re-derives it from the current upstream artefacts; otherwise
   * it re-seeds from stub. Either way the stale flag for this skill is cleared.
   */
  const regenerate = useCallback(async (projectId: string, skill: SkillId) => {
    const apiKey = getClaudeApiKey();
    const input = orchestrationInput[projectId] ?? "";
    if (apiKey && input) {
      const generated: Partial<Record<SkillId, SkillExecution>> = {};
      for (const dep of dependenciesOf(skill)) {
        const exec = claudeExecMap[`${projectId}::${dep}`]
          ?? artifactFor(dep, activeClientId, projectId, artifactValues);
        if (exec) generated[dep] = exec;
      }
      const context = [
        intakeAnswersContext(skill, intakeAnswers[projectId]?.[skill]),
        buildChainContext(skill, generated),
      ].filter(Boolean).join("\n\n---\n\n");
      try {
        const exec = await regenerateSkillLive(skill, input, context);
        setClaudeExecMap((m) => ({ ...m, [`${projectId}::${skill}`]: exec }));
        setActiveSkill(skill);
        setCurrent(exec);
      } catch { /* keep the stale flag if the call fails */ return; }
    } else {
      const seed = (artifactValues[projectId]?.[skill] ?? TEST_DATA[skill] ?? {}) as StepValues;
      const step = STEPS.find((x) => x.id === skill);
      if (step) { setActiveSkill(skill); setCurrent(buildExecution(step, seed, activeClientId ?? "", projectId)); }
    }
    // The skill is now (re)generated and surfaced: mark generated + seen, unlock the nav.
    setGeneratedSkills((g) => ({ ...g, [projectId]: [...new Set([...(g[projectId] ?? []), skill])] }));
    setSkillStatus((s) => ({ ...s, [projectId]: { ...(s[projectId] ?? {}), [skill]: "approved" } }));
    setOrchestratedProjects((p) => (p.includes(projectId) ? p : [...p, projectId]));
    setStaleSkills((m) => ({ ...m, [projectId]: (m[projectId] ?? []).filter((s) => s !== skill) }));
    markSeen(projectId, skill);
  }, [activeClientId, orchestrationInput, claudeExecMap, artifactValues, intakeAnswers, markSeen]);

  const value = useMemo<WorkspaceValue>(
    () => ({
      clients, projects, connectors, activeClientId, activeProjectId, activeSkill, current,
      editingSkill, editingRecordId, artifactValues, records, orchestratedProjects, skillStatus, riskVizApproved, setRiskViz, riskScanLevel, setRiskScanLevel,
      selectClient, selectProject, selectSkill, showExecution,
      addClient, addProject, deleteProject, deleteClient, setConnectorStatus, setConnectorApi,
      beginEdit, endEdit, saveArtifactValues, completeOrchestration, previewSkill, generateSkill,
      ensureRecords, addRecord, updateRecordMeta, saveRecord, openRecord,
      staleSkills, setOrchestrationInput, regenerate,
      generatedSkills, unseenSkills, finalizeStepwise, markStale, intakeAnswers, setIntakeAnswers,
    }),
    [clients, projects, connectors, activeClientId, activeProjectId, activeSkill, current,
      editingSkill, editingRecordId, artifactValues, records, orchestratedProjects, skillStatus, riskVizApproved, setRiskViz, riskScanLevel, setRiskScanLevel,
      selectClient, selectProject, selectSkill, showExecution,
      addClient, addProject, deleteProject, deleteClient, setConnectorStatus, setConnectorApi,
      beginEdit, endEdit, saveArtifactValues, completeOrchestration, previewSkill, generateSkill,
      ensureRecords, addRecord, updateRecordMeta, saveRecord, openRecord,
      staleSkills, setOrchestrationInput, regenerate,
      generatedSkills, unseenSkills, finalizeStepwise, markStale, intakeAnswers, setIntakeAnswers],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
