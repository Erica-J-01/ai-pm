import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Paperclip, X } from "lucide-react";
import {
  type OrchestrationPlan,
  type PlanStep,
  type PlanStepState,
  type SkillExecution,
  type SkillExecutionRequest,
  type SkillId,
} from "@/types/pm";
import { type OrchestratorApi } from "@/api/orchestrator";
import { getClaudeApiKey } from "@/api";
import { detectIntakeSignals } from "@/api/claudeOrchestrator";
import { buildChainContext, intakeAnswersContext } from "@/api/artifactDigest";
import { INTAKE_QUESTIONS, type IntakeQuestion } from "@/api/intakeQuestions";
import { IntakeInterview } from "@/components/IntakeInterview";
import { downstreamOf } from "@/data/skillChain";
import { skillTitle } from "@/data/demo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * OrchestratorConsole - the "/pm" console.
 *
 * Flow:
 *   1. Paste a message / upload a PDF / drop a file → Run orchestrator → plan appears.
 *   2. Every suggested step starts Approved; the user toggles Approve/Skip per step.
 *   3. "Complete Orchestration" → Claude generates approved sections; skipped are blank.
 */

type Decision = "approved" | "skipped";

export interface OrchestratorConsoleProps {
  clientId?: string;
  projectId?: string;
  api: OrchestratorApi;
  onViewSkill?: (skill: SkillId) => void;
  onComplete?: (
    decisions: Record<SkillId, Decision>,
    claudeExecutions?: Partial<Record<SkillId, SkillExecution>>,
  ) => void;
  /** Records whether the risk-scan visualisation/dashboard should be generated. */
  onVizDecision?: (approved: boolean) => void;
  /** Generate one step (next ungenerated), deriving from the current upstream artefacts. */
  onGenerateStep?: (skill: SkillId) => Promise<void>;
  /** Finish a step-by-step run: record skip decisions without regenerating. */
  onFinalizeStepwise?: (decisions: Record<SkillId, Decision>) => void;
  /** Skills already generated for this project (drives the per-step status). */
  generatedSkills?: SkillId[];
  /** A generated skill's intake answers changed - mark it and its downstream stale. */
  onIntakeChanged?: (skill: SkillId, affected: SkillId[]) => void;
  /** Persist intake answers as they are entered (so regeneration re-reads them). */
  onIntakeAnswersChange?: (skill: SkillId, answers: Record<string, string>) => void;
  /** Stored intake answers for this project, used to seed the console on load. */
  intakeAnswersSeed?: Partial<Record<SkillId, Record<string, string>>>;
  /** Persist the brief that produced the plan (enables later live regeneration). */
  onRunInput?: (input: string) => void;
  orchestrated?: boolean;
  defaultInput?: string;
}

/* ─── reducer ───────────────────────────────────────────────────────── */

interface PlanState { plan: OrchestrationPlan | null; }
type PlanAction =
  | { type: "set-plan"; plan: OrchestrationPlan }
  | { type: "set-step"; stepId: string; state: PlanStepState }
  | { type: "reset" };

function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case "set-plan": return { plan: action.plan };
    case "set-step":
      if (!state.plan) return state;
      return {
        plan: {
          ...state.plan,
          steps: state.plan.steps.map((s) => (s.id === action.stepId ? { ...s, state: action.state } : s)),
        },
      };
    case "reset": return { plan: null };
    default: return state;
  }
}

/* ─── PDF extraction ─────────────────────────────────────────────────── */

async function extractPdfText(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  // Point the worker at the bundled worker file via CDN to avoid complex bundling
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${(await import("pdfjs-dist")).version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n\n");
}

/* ─── component ──────────────────────────────────────────────────────── */

export function OrchestratorConsole({
  clientId, projectId, api, onViewSkill, onComplete, onVizDecision, onGenerateStep, onFinalizeStepwise, generatedSkills = [], onIntakeChanged, onIntakeAnswersChange, intakeAnswersSeed, onRunInput, orchestrated, defaultInput = "",
}: OrchestratorConsoleProps) {
  const [input, setInput] = useState(defaultInput);
  const [dragging, setDragging] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [{ plan }, dispatch] = useReducer(planReducer, { plan: null });
  const [completing, setCompleting] = useState(false);
  const [completingStep, setCompletingStep] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [rerun, setRerun] = useState(false);
  const [stubPrompt, setStubPrompt] = useState(false);
  const [vizApproved, setVizApproved] = useState(true); // risk-scan dashboard sub-step
  const [completionError, setCompletionError] = useState<string | null>(null);
  // Step-by-step run: index of the next approved step to generate (null = not stepping).
  const [stepIdx, setStepIdx] = useState<number | null>(null);
  // Intake interview answers per skill, and which skill's interview is open (null = none).
  const [intakeAnswers, setIntakeAnswers] = useState<Partial<Record<SkillId, Record<string, string>>>>({});
  const [intakeOpenFor, setIntakeOpenFor] = useState<SkillId | null>(null);
  // Answers snapshot per skill at generation time, to detect post-run edits.
  const genAnswersRef = useRef<Partial<Record<SkillId, string>>>({});
  // Pending cascade warning when a generated skill's answers changed.
  const [intakeWarn, setIntakeWarn] = useState<{ skill: SkillId; affected: SkillId[] } | null>(null);
  // Conditional question ids detected as applicable per skill (live signal detection).
  const [detectedFor, setDetectedFor] = useState<Partial<Record<SkillId, string[]>>>({});
  const [detecting, setDetecting] = useState<SkillId | null>(null);
  // Skills flagged red because a run was attempted with their intake unanswered.
  const [highlightMissing, setHighlightMissing] = useState<SkillId[]>([]);
  // Artefacts generated so far this run, for chaining context across steps.
  const execAccRef = useRef<Partial<Record<SkillId, SkillExecution>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When the active project changes, reset ALL per-project state so a new
  // project always starts with a blank console - not with the previous
  // project's input or the demo pre-fill.
  useEffect(() => {
    dispatch({ type: "reset" });
    setCompleted(false);
    setRerun(false);
    setCompletionError(null);
    setInput(defaultInput); // pre-fill the demo input where one is provided
    setAttachments([]);
    setVizApproved(true);
    setStepIdx(null);
    setIntakeAnswers(intakeAnswersSeed ?? {}); // seed from the store so answers survive project switches
    setIntakeOpenFor(null);
    setIntakeWarn(null);
    setDetectedFor({});
    setDetecting(null);
    setHighlightMissing([]);
    genAnswersRef.current = {};
    execAccRef.current = {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // On opening an intake, ask Claude which conditional questions apply (live only).
  // Stub / no key / failure falls back to showing all (detectedFor stays unset).
  useEffect(() => {
    const skill = intakeOpenFor;
    if (!skill || detectedFor[skill] || !getClaudeApiKey()) return;
    const conditionals = (INTAKE_QUESTIONS[skill] ?? []).filter((q) => q.conditional);
    if (conditionals.length === 0) { setDetectedFor((m) => ({ ...m, [skill]: [] })); return; }
    let cancelled = false;
    setDetecting(skill);
    detectIntakeSignals(input, conditionals.map((q) => ({ id: q.id, condition: q.condition })))
      .then((ids) => { if (!cancelled) setDetectedFor((m) => ({ ...m, [skill]: ids })); })
      .finally(() => { if (!cancelled) setDetecting(null); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intakeOpenFor]);

  // Clear the "answer the required intake" warning + red flags as soon as the
  // required questions are answered.
  useEffect(() => {
    if (!plan) return;
    const gateOk = (skill: SkillId) =>
      (INTAKE_QUESTIONS[skill] ?? []).filter((q) => q.gate).every((q) => (intakeAnswers[skill] ?? {})[q.id]?.trim());
    setHighlightMissing((m) => m.filter((s) => !gateOk(s)));
    const allReady = plan.steps
      .filter((s) => s.state !== "skipped")
      .every((s) => (INTAKE_QUESTIONS[s.skill]?.length ?? 0) === 0 || gateOk(s.skill));
    if (allReady) {
      setCompletionError((e) => (e && e.startsWith("Answer the required intake") ? null : e));
    }
  }, [intakeAnswers, plan]);

  const canRun = Boolean(input.trim() && clientId && projectId);
  const showHub = !!orchestrated && !plan && !rerun;

  /* ── handle files (drag-drop or file input) ── */
  const handleFiles = useCallback(async (files: File[]) => {
    const pdfs = files.filter((f) => f.type === "application/pdf");
    const others = files.filter((f) => f.type !== "application/pdf");
    setAttachments((prev) => [...prev, ...others]);

    for (const pdf of pdfs) {
      setExtracting(true);
      try {
        const text = await extractPdfText(pdf);
        // Replace if the textarea is empty; otherwise append below a divider.
        setInput((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed}\n\n---\n\n${text}` : text;
        });
        setAttachments((prev) => [...prev, pdf]);
      } catch (e) {
        console.error("PDF extraction failed:", e);
        setAttachments((prev) => [...prev, pdf]);
      } finally {
        setExtracting(false);
      }
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  }, [handleFiles]);

  /* ── plan mutation ── */
  const planMutation = useMutation({
    mutationFn: async () => {
      const req: SkillExecutionRequest = {
        skill: "pm",
        clientId: clientId!,
        projectId: projectId!,
        input: input.trim(),
        attachments: attachments.map((f, i) => ({
          id: `att-${i}`, name: f.name, mimeType: f.type, sizeBytes: f.size,
        })),
      };
      return api.planOrchestration(req);
    },
    onSuccess: (p) => {
      dispatch({
        type: "set-plan",
        plan: { ...p, steps: p.steps.map((s) => ({ ...s, state: "approved" as PlanStepState })) },
      });
      setCompleted(false);
      setCompletionError(null);
      setStepIdx(null);
      setIntakeOpenFor(null);
      setDetectedFor({}); // re-detect signals against the new input
      setDetecting(null);
      setHighlightMissing([]);
      execAccRef.current = {};
      onRunInput?.(input.trim()); // persist the brief for later regeneration
    },
  });

  const setDecision = useCallback((step: PlanStep, state: PlanStepState) => {
    dispatch({ type: "set-step", stepId: step.id, state });
  }, []);

  /* ── complete: run Claude for each approved step ── */
  const decisionsFor = () =>
    Object.fromEntries(
      plan!.steps.map((s) => [s.skill, s.state === "skipped" ? "skipped" : "approved"]),
    ) as Record<SkillId, Decision>;

  const riskScanApproved = () => {
    const rs = plan?.steps.find((s) => s.skill === "risk-scan");
    return !!rs && rs.state !== "skipped";
  };

  // Risk dashboard is generated only when risk-scan is approved AND its viz sub-step is approved.
  const recordViz = () => {
    onVizDecision?.(riskScanApproved() && vizApproved);
  };

  /** Instant completion using seeded stub data (no API wait). */
  const finishWithStub = () => {
    if (!plan) return;
    setStubPrompt(false);
    recordViz();
    onComplete?.(decisionsFor()); // no Claude executions -> buildExecution/TEST_DATA path
    approvedSteps().forEach((s) => snapshotIntake(s.skill));
    setCompleted(true);
  };

  const approvedSteps = (): PlanStep[] => (plan ? plan.steps.filter((s) => s.state !== "skipped") : []);

  /* ── intake interview (A) ── */
  const hasIntake = (skill: SkillId) => (INTAKE_QUESTIONS[skill]?.length ?? 0) > 0;
  /** Questions to actually ask: always-questions, plus conditionals whose signal was detected. */
  const questionsFor = (skill: SkillId): IntakeQuestion[] => {
    const all = INTAKE_QUESTIONS[skill] ?? [];
    const detected = detectedFor[skill];
    if (!detected) return all; // not yet detected (stub / no key / pending) -> show all
    return all.filter((q) => !q.conditional || detected.includes(q.id));
  };
  const gateAnswered = (skill: SkillId) => {
    const ans = intakeAnswers[skill] ?? {};
    return (INTAKE_QUESTIONS[skill] ?? []).filter((q) => q.gate).every((q) => ans[q.id]?.trim());
  };
  /** Every approved step that has an intake must have its gate question answered. */
  const intakeReady = () => approvedSteps().every((s) => !hasIntake(s.skill) || gateAnswered(s.skill));

  /** Intake answers for a skill, serialised as context for its generation. */
  const intakeContext = (skill: SkillId): string => intakeAnswersContext(skill, intakeAnswers[skill]);

  /** Full per-step context: intake answers + chained upstream artefacts. */
  const contextFor = (skill: SkillId): string =>
    [intakeContext(skill), buildChainContext(skill, execAccRef.current)].filter(Boolean).join("\n\n---\n\n");

  /** Record the answers a skill was generated with, to detect later edits. */
  const snapshotIntake = (skill: SkillId) => {
    if (INTAKE_QUESTIONS[skill]) genAnswersRef.current[skill] = JSON.stringify(intakeAnswers[skill] ?? {});
  };

  /**
   * Close the intake panel. If a generated skill's answers changed, warn that
   * the affected steps (this skill plus everything downstream) must re-run.
   */
  const closeIntake = () => {
    const skill = intakeOpenFor;
    // The change-cascade only applies while still orchestrating. Once complete,
    // artefacts are independent living documents - editing answers never cascades.
    if (!completed && skill && generatedSkills.includes(skill) && genAnswersRef.current[skill] !== undefined) {
      const changed = genAnswersRef.current[skill] !== JSON.stringify(intakeAnswers[skill] ?? {});
      if (changed) {
        const affected = [skill, ...downstreamOf(skill)].filter((s) => generatedSkills.includes(s));
        if (affected.length) { setIntakeWarn({ skill, affected }); return; }
      }
    }
    setIntakeOpenFor(null);
  };

  /** Confirm the cascade: mark the affected steps stale, then close. */
  const confirmIntakeChange = () => {
    if (intakeWarn) {
      onIntakeChanged?.(intakeWarn.skill, intakeWarn.affected);
      snapshotIntake(intakeWarn.skill);
    }
    setIntakeWarn(null);
    setIntakeOpenFor(null);
  };

  /** Run all approved steps in chain order; each step derives from prior outputs. */
  const runLive = async () => {
    if (!plan) return;
    setCompleting(true);
    setCompletionError(null);
    execAccRef.current = {};

    for (const step of approvedSteps()) {
      setCompletingStep(skillTitle(step.skill));
      const ctrl = new AbortController();
      try {
        const execution = await api.streamStep(plan.id, step, () => {}, ctrl.signal, contextFor(step.skill));
        execAccRef.current[step.skill] = execution;
        snapshotIntake(step.skill);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!completionError) setCompletionError(msg);
      }
    }

    setCompletingStep(null);
    recordViz();
    const acc = execAccRef.current;
    onComplete?.(decisionsFor(), Object.keys(acc).length > 0 ? acc : undefined);
    setCompleting(false);
    setCompleted(true);
  };

  /**
   * Block a run until every approved intake step has its gate question answered.
   * Does NOT open the interview - it flags the missing step(s) red, scrolls to
   * the first one, and shows a warning, so the user sees where input is needed.
   */
  const blockedByIntake = (): boolean => {
    if (intakeReady()) return false;
    const missing = approvedSteps().filter((s) => hasIntake(s.skill) && !gateAnswered(s.skill)).map((s) => s.skill);
    setHighlightMissing(missing);
    setCompletionError("Answer the required intake question first - see the highlighted step below.");
    if (missing[0]) {
      requestAnimationFrame(() => {
        document.getElementById(`intake-row-${missing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    return true;
  };

  /** Run all: live if a Claude key exists, otherwise offer stub mode. */
  const runAll = async () => {
    if (!plan || blockedByIntake()) return;
    if (!getClaudeApiKey()) { setStubPrompt(true); return; }
    await runLive();
  };

  /** Begin step-by-step. Commits the plan (so the nav/cards reflect it); each step is generated on demand. */
  const startStepwise = () => {
    if (!plan) return;
    setCompletionError(null);
    onFinalizeStepwise?.(decisionsFor()); // commit decisions so pending + skipped lock in the nav
    setStepIdx(0); // stepping flag (the active step is always the next ungenerated one)
  };

  /**
   * Generate one step (the next ungenerated). Gated per-step on that step's own
   * intake. Routed through the store so it derives from the CURRENT upstream
   * artefacts - correct both for first generation and after an upstream edit.
   */
  const requestGenerate = async (skill: SkillId) => {
    if (!plan) return;
    if (hasIntake(skill) && !gateAnswered(skill)) {
      setHighlightMissing([skill]);
      setCompletionError("Answer the required intake question first - see the highlighted step below.");
      requestAnimationFrame(() => {
        document.getElementById(`intake-row-${skill}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setCompleting(true);
    setCompletingStep(skillTitle(skill));
    try { await onGenerateStep?.(skill); }
    catch (e) { setCompletionError(e instanceof Error ? e.message : String(e)); }
    setCompleting(false);
    setCompletingStep(null);
    snapshotIntake(skill);
  };

  /** Finish the step-by-step run. */
  const finishStepwise = () => {
    recordViz();
    onFinalizeStepwise?.(decisionsFor());
    setStepIdx(null);
    setCompleted(true);
  };

  const cancelStepwise = () => {
    setStepIdx(null);
    setCompletionError(null);
  };

  const reset = () => {
    dispatch({ type: "reset" });
    planMutation.reset();
    setInput("");
    setAttachments([]);
    setCompleted(false);
    setCompletionError(null);
    setStepIdx(null);
    setIntakeAnswers({});
    setIntakeOpenFor(null);
    setDetectedFor({});
    setDetecting(null);
    setHighlightMissing([]);
    execAccRef.current = {};
  };

  const approvedCount = plan ? plan.steps.filter((s) => s.state !== "skipped").length : 0;
  const skippedCount = plan ? plan.steps.length - approvedCount : 0;
  // Step-by-step view state
  const stepList = approvedSteps();
  // The active step is always the first approved step not yet generated. This
  // self-corrects after an upstream edit resets downstream steps.
  const decidePhase = stepIdx === null && !completed;
  const nextUngenerated = !decidePhase ? (stepList.find((s) => !generatedSkills.includes(s.skill)) ?? null) : null;
  const stepDone = stepIdx !== null && !nextUngenerated;

  if (showHub) return <OrchestratedHub onRerun={() => setRerun(true)} />;

  return (
    <div className="flex flex-col gap-4">
      {/* No Claude key -> offer instant stub data instead of waiting on the API */}
      <Dialog open={stubPrompt} onOpenChange={setStubPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claude API not found</DialogTitle>
            <DialogDescription>
              No Anthropic API key is configured, so live orchestration is unavailable. Continue with stub data for test mode? You can add a key under Manage to run live Claude orchestration.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStubPrompt(false)}>Cancel</Button>
            <Button size="sm" onClick={finishWithStub}>Continue with stub data</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Changed-answer cascade warning */}
      <Dialog open={!!intakeWarn} onOpenChange={(o) => { if (!o) { setIntakeWarn(null); setIntakeOpenFor(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-run affected steps?</DialogTitle>
            <DialogDescription>
              {intakeWarn
                ? `This will re-run the orchestrator from these steps: ${intakeWarn.affected.map((s) => skillTitle(s)).join(", ")} - due to your changed answer.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setIntakeWarn(null); setIntakeOpenFor(null); }}>Keep as is</Button>
            <Button size="sm" onClick={confirmIntakeChange}>Re-run those steps</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Input surface ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border bg-card p-4 shadow-card transition-colors",
          dragging ? "border-accent ring-2 ring-accent/40" : "border-border",
        )}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder="Paste a stakeholder message, meeting transcript, PRD, or requirements - or drop a PDF here."
          className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
        />

        {extracting && (
          <p className="mt-1 text-xs text-muted-foreground animate-pulse">Extracting PDF text…</p>
        )}

        {attachments.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {attachments.map((f, i) => (
              <li key={i} className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs">
                {f.name}
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              multiple
              className="hidden"
              onChange={onFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach a PDF, TXT, or MD file"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach PDF
            </button>
            <span className="text-xs text-muted-foreground">
              {clientId && projectId ? "Proposes which steps to run - you approve or skip each." : "Select a client & project first."}
            </span>
          </div>
          <div className="flex gap-2">
            {plan && !completed && <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>}
            <Button size="sm" disabled={!canRun || planMutation.isPending || extracting} onClick={() => planMutation.mutate()}>
              {planMutation.isPending ? "Planning…" : "Plan steps"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── States ── */}
      {planMutation.isPending && <PlanSkeleton />}
      {planMutation.isError && (
        <ErrorCard message={(planMutation.error as Error).message} onRetry={() => planMutation.mutate()} />
      )}

      {/* ── Intake interview (replaces the plan while open) ── */}
      {intakeOpenFor && (
        detecting === intakeOpenFor ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-card">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-status-info" aria-hidden />
            Working out which questions apply to your input…
          </div>
        ) : (
          <IntakeInterview
            skill={intakeOpenFor}
            questions={questionsFor(intakeOpenFor)}
            answers={intakeAnswers[intakeOpenFor] ?? {}}
            onChange={(a) => {
              setIntakeAnswers((m) => ({ ...m, [intakeOpenFor]: a }));
              onIntakeAnswersChange?.(intakeOpenFor, a); // persist to the store for regeneration
            }}
            onClose={closeIntake}
          />
        )
      )}

      {/* ── Step-by-step plan ── */}
      {plan && !intakeOpenFor && (
        <div key={plan.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Orchestration Plan</h3>
            <Badge variant="outline" className="text-[11px]">{plan.steps.length} steps</Badge>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{plan.summary}</p>

          <ol className={cn("relative space-y-2", stepIdx !== null && "pl-6")}>
            {/* Timeline rail + dots only guide the step-by-step run, not the decide/run-all/done views */}
            {stepIdx !== null && <span className="absolute left-[9px] top-1 bottom-1 w-px bg-border" aria-hidden />}
            {/* initial enabled so the staggered list animates in when the plan first appears, not only on re-key */}
            <AnimatePresence>
              {plan.steps.map((step, i) => (
                <motion.li
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 32 }}
                >
                  <StepCard
                    step={step}
                    index={i}
                    decidePhase={decidePhase}
                    stepping={stepIdx !== null}
                    generated={generatedSkills.includes(step.skill)}
                    isNext={!decidePhase && nextUngenerated?.skill === step.skill}
                    completing={completing && completingStep === skillTitle(step.skill)}
                    onApprove={() => setDecision(step, "approved")}
                    onSkip={() => setDecision(step, "skipped")}
                    onGenerate={() => { if (step.state === "skipped") setDecision(step, "approved"); requestGenerate(step.skill); }}
                    onView={() => onViewSkill?.(step.skill)}
                  />

                  {/* Risk-scan visualisation: a sub-step that slides down when risk-scan is approved */}
                  {step.skill === "risk-scan" && !completed && (
                    <AnimatePresence initial={false}>
                      {step.state !== "skipped" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-3 mt-1.5 overflow-hidden"
                        >
                          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground/80">↳ Risk dashboard (visualisation)</p>
                                <p className="text-[11px] text-muted-foreground">Optional executive dashboard. Skip to save tokens; you can generate it on the artifact later.</p>
                              </div>
                              <div className="flex shrink-0 rounded-md border border-border p-0.5" role="group" aria-label="Generate risk visuals?">
                                <button type="button" onClick={() => setVizApproved(true)} aria-pressed={vizApproved}
                                  className={cn(SEG, vizApproved ? "bg-status-success-bg text-status-success" : "text-muted-foreground hover:bg-muted")}>Approve</button>
                                <button type="button" onClick={() => setVizApproved(false)} aria-pressed={!vizApproved}
                                  className={cn(SEG, !vizApproved ? "bg-status-na-bg text-status-na" : "text-muted-foreground hover:bg-muted")}>Skip</button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  {/* Intake interview: required before generating, and editable after (with a cascade warning) */}
                  {hasIntake(step.skill) && (
                    <AnimatePresence initial={false}>
                      {step.state !== "skipped" && (() => {
                        const qs = questionsFor(step.skill);
                        const ans = intakeAnswers[step.skill] ?? {};
                        const answeredN = qs.filter((q) => ans[q.id]?.trim()).length;
                        const ready = gateAnswered(step.skill);
                        return (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-3 mt-1.5 overflow-hidden"
                          >
                            <div
                              id={`intake-row-${step.skill}`}
                              className={cn(
                                "rounded-lg border border-dashed bg-muted/30 p-2.5",
                                highlightMissing.includes(step.skill) && !ready
                                  ? "border-status-danger"
                                  : ready ? "border-border" : "border-status-warning/50",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-foreground/80">
                                    ↳ Intake interview {!ready && <span className={highlightMissing.includes(step.skill) ? "text-status-danger" : "text-status-warning"}>*</span>}
                                  </p>
                                  <p className={cn(
                                    "text-[11px]",
                                    highlightMissing.includes(step.skill) && !ready ? "text-status-danger" : "text-muted-foreground",
                                  )}>
                                    {answeredN}/{qs.length} answered. {ready ? "Ready to generate." : "Answer the required question before generating."}
                                  </p>
                                </div>
                                <Button size="sm" variant="outline" className="shrink-0" onClick={() => { setHighlightMissing((m) => m.filter((s) => s !== step.skill)); setIntakeOpenFor(step.skill); }}>
                                  {answeredN > 0 ? "Review answers" : "Answer questions"}
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>

          {/* ── Footer ── */}
          {!completed ? (
            <div className="mt-4 border-t border-border pt-3">
              {stepIdx === null ? (
                /* Not started: choose a run mode */
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {completing
                        ? completingStep ? `Generating ${completingStep}…` : "Finishing up…"
                        : `${approvedCount} approved, ${skippedCount} skipped.`}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={startStepwise} disabled={completing || approvedCount === 0}>
                        Run step by step
                      </Button>
                      <Button size="sm" onClick={runAll} disabled={completing || approvedCount === 0}>
                        {completing ? "Generating…" : "Run all"}
                      </Button>
                    </div>
                  </div>
                  {!intakeReady() && approvedCount > 0 && (
                    <p className="text-[11px] text-status-warning">
                      An intake interview must be answered before generating - open it from the step above.
                    </p>
                  )}
                </div>
              ) : (
                /* Step-by-step: generate each step from its card, top to bottom */
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {stepDone
                        ? "All steps generated. Review on the right, then finish."
                        : completing
                          ? `Generating ${completingStep}…`
                          : `${generatedSkills.filter((s) => stepList.some((x) => x.skill === s)).length} of ${stepList.length} generated. Use "Generate ${nextUngenerated ? skillTitle(nextUngenerated.skill) : "…"}" above to continue.`}
                    </p>
                    <div className="flex gap-2">
                      {!stepDone && (
                        <Button size="sm" variant="ghost" onClick={cancelStepwise} disabled={completing}>Cancel</Button>
                      )}
                      {stepDone && <Button size="sm" onClick={finishStepwise}>Finish</Button>}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Each step generates from the ones before it. Editing a generated step resets everything below it.
                  </p>
                </div>
              )}
              {completionError && (
                <p className="mt-2 text-xs text-status-danger">{completionError}</p>
              )}
            </div>
          ) : (
            <div className="mt-4 border-t border-border pt-3 space-y-1">
              {nextUngenerated ? (
                <p className="text-xs text-status-warning">
                  An edit reset some steps. Generate them above (starting with {skillTitle(nextUngenerated.skill)}) to bring the chain up to date.
                </p>
              ) : (
                <p className="text-xs text-status-success">
                  Orchestration complete. Pick a skill on the left to view the output.
                </p>
              )}
              {completionError && (
                <p className="text-xs text-status-danger">
                  Some steps encountered errors: {completionError}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── step card ─────────────────────────────────────────────────────── */

const STEP_DOT: Record<PlanStepState, string> = {
  pending:  "border-border bg-card",
  approved: "border-status-info bg-status-info-bg",
  running:  "border-status-info bg-status-info animate-pulse",
  done:     "border-status-success bg-status-success",
  skipped:  "border-status-na bg-status-na-bg",
  failed:   "border-status-danger bg-status-danger",
};

const SEG = "rounded px-2.5 py-1 text-xs font-medium transition-colors";

function StepCard({
  step, index, decidePhase, stepping, generated, isNext, completing, onApprove, onSkip, onGenerate, onView,
}: {
  step: PlanStep;
  index: number;
  /** True before a run starts: show the Approve/Skip toggle. */
  decidePhase: boolean;
  /** True during a step-by-step run: show the timeline dot. */
  stepping: boolean;
  /** True once this step's artefact has been generated. */
  generated: boolean;
  /** True if this is the next ungenerated step (gets the Generate button). */
  isNext: boolean;
  completing: boolean;
  onApprove: () => void;
  onSkip: () => void;
  onGenerate: () => void;
  onView: () => void;
}) {
  const approved = step.state !== "skipped";
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      {stepping && (
        <span
          className={cn(
            "absolute -left-[3px] mt-1 grid h-[18px] w-[18px] -translate-x-1/2 place-items-center rounded-full border-2",
            completing ? "border-status-info bg-status-info animate-pulse" : generated ? STEP_DOT.done : STEP_DOT[step.state],
          )}
          aria-hidden
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{index + 1}</span>
            <span className="text-sm font-medium">{skillTitle(step.skill)}</span>
            {step.parallelizable && <Badge variant="outline" className="text-[10px]">parallel</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{step.rationale}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {decidePhase ? (
            <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="Approve or skip">
              <button
                type="button"
                onClick={onApprove}
                aria-pressed={approved}
                className={cn(SEG, approved ? "bg-status-success-bg text-status-success" : "text-muted-foreground hover:bg-muted")}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={onSkip}
                aria-pressed={!approved}
                className={cn(SEG, !approved ? "bg-status-na-bg text-status-na" : "text-muted-foreground hover:bg-muted")}
              >
                Skip
              </button>
            </div>
          ) : !approved ? (
            <>
              <Button size="sm" variant="outline" onClick={onGenerate} disabled={completing}>
                {completing ? "Generating…" : `Generate ${skillTitle(step.skill)}`}
              </Button>
              <Badge className="bg-status-na-bg text-status-na">Skipped</Badge>
            </>
          ) : generated ? (
            <>
              <Button size="sm" variant="outline" onClick={onView}>View</Button>
              <Badge className="bg-status-success-bg text-status-success">Generated</Badge>
            </>
          ) : isNext ? (
            <Button size="sm" onClick={onGenerate} disabled={completing}>
              {completing ? "Generating…" : `Generate ${skillTitle(step.skill)}`}
            </Button>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">Not generated</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── helpers ────────────────────────────────────────────────────────── */

function OrchestratedHub({ onRerun }: { onRerun: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <p className="text-sm font-semibold">Project orchestrated</p>
      <p className="mt-1 text-sm text-muted-foreground">
        This project is set up. Pick a skill on the left to view or edit it - skipped sections can be generated from there anytime.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRerun}>Re-run orchestration</Button>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-card">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-status-danger/40 bg-status-danger-bg p-4">
      <p className="text-sm text-status-danger">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
    </div>
  );
}
