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
  clientId, projectId, api, onViewSkill, onComplete, onVizDecision, orchestrated, defaultInput = "",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

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
    setCompleted(true);
  };

  /** Live completion: run Claude for each approved step. */
  const runLive = async () => {
    if (!plan) return;
    setCompleting(true);
    setCompletionError(null);

    const approvedSteps = plan.steps.filter((s) => s.state !== "skipped");
    const claudeExecutions: Partial<Record<SkillId, SkillExecution>> = {};

    for (const step of approvedSteps) {
      setCompletingStep(skillTitle(step.skill));
      const ctrl = new AbortController();
      try {
        const execution = await api.streamStep(plan.id, step, () => {}, ctrl.signal);
        claudeExecutions[step.skill] = execution;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!completionError) setCompletionError(msg);
      }
    }

    setCompletingStep(null);
    recordViz();
    onComplete?.(decisionsFor(), Object.keys(claudeExecutions).length > 0 ? claudeExecutions : undefined);
    setCompleting(false);
    setCompleted(true);
  };

  /** Entry point: live if a Claude key exists, otherwise offer stub mode. */
  const complete = async () => {
    if (!plan) return;
    if (!getClaudeApiKey()) { setStubPrompt(true); return; }
    await runLive();
  };

  const reset = () => {
    dispatch({ type: "reset" });
    planMutation.reset();
    setInput("");
    setAttachments([]);
    setCompleted(false);
    setCompletionError(null);
  };

  const approvedCount = plan ? plan.steps.filter((s) => s.state !== "skipped").length : 0;
  const skippedCount = plan ? plan.steps.length - approvedCount : 0;

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
              {clientId && projectId ? "Orchestrator will plan the right skills." : "Select a client & project first."}
            </span>
          </div>
          <div className="flex gap-2">
            {plan && <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>}
            <Button size="sm" disabled={!canRun || planMutation.isPending || extracting} onClick={() => planMutation.mutate()}>
              {planMutation.isPending ? "Planning…" : "Run orchestrator"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── States ── */}
      {planMutation.isPending && <PlanSkeleton />}
      {planMutation.isError && (
        <ErrorCard message={(planMutation.error as Error).message} onRetry={() => planMutation.mutate()} />
      )}

      {/* ── Step-by-step plan ── */}
      {plan && (
        <div key={plan.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Orchestration Plan</h3>
            <Badge variant="outline" className="text-[11px]">{plan.steps.length} steps</Badge>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{plan.summary}</p>

          <ol className="relative space-y-2 pl-6">
            <span className="absolute left-[9px] top-1 bottom-1 w-px bg-border" aria-hidden />
            {/* initial enabled so the staggered list animates in when the plan first appears, not only on re-key */}
            <AnimatePresence>
              {plan.steps.map((step, i) => (
                <motion.li
                  key={step.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 32 }}
                >
                  <StepCard
                    step={step}
                    index={i}
                    completed={completed}
                    completing={completing && completingStep === skillTitle(step.skill)}
                    onApprove={() => setDecision(step, "approved")}
                    onSkip={() => setDecision(step, "skipped")}
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
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>

          {/* ── Footer ── */}
          {!completed ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                {completing
                  ? completingStep ? `Generating ${completingStep}…` : "Finishing up…"
                  : `${approvedCount} approved, ${skippedCount} skipped.`}
              </p>
              <Button size="sm" onClick={complete} disabled={completing || approvedCount === 0}>
                {completing ? "Generating…" : "Complete Orchestration"}
              </Button>
            </div>
          ) : (
            <div className="mt-4 border-t border-border pt-3 space-y-1">
              <p className="text-xs text-status-success">
                Orchestration complete. Pick a skill on the left to view the output.
              </p>
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
  step, index, completed, completing, onApprove, onSkip, onView,
}: {
  step: PlanStep;
  index: number;
  completed: boolean;
  completing: boolean;
  onApprove: () => void;
  onSkip: () => void;
  onView: () => void;
}) {
  const approved = step.state !== "skipped";
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <span
        className={cn(
          "absolute -left-[3px] mt-1 grid h-[18px] w-[18px] -translate-x-1/2 place-items-center rounded-full border-2",
          completing ? "border-status-info bg-status-info animate-pulse" : STEP_DOT[step.state],
        )}
        aria-hidden
      />
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
          {!completed ? (
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
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onView}>View</Button>
              {approved
                ? <Badge className="bg-status-success-bg text-status-success">Generated</Badge>
                : <Badge className="bg-status-na-bg text-status-na">Skipped</Badge>}
            </>
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
