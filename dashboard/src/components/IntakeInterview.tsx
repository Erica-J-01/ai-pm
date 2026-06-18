import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronsRight, Lock, X } from "lucide-react";
import type { SkillId } from "@/types/pm";
import type { IntakeQuestion } from "@/api/intakeQuestions";
import { skillTitle } from "@/data/demo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * One-question-at-a-time intake interview, shown before a skill is generated.
 * Answers live in the parent (per skill); this panel reads/writes them via
 * `onChange`. Conditional questions are marked and skippable; only the gate
 * question is required (the parent enforces that before generation).
 */
export function IntakeInterview({
  skill, questions, answers, onChange, onClose,
}: {
  skill: SkillId;
  questions: IntakeQuestion[];
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
  onClose: () => void;
}) {
  // Open at the first unanswered question (so "Review answers" jumps to what's left).
  const firstUnanswered = questions.findIndex((x) => !answers[x.id]?.trim());
  const [idx, setIdx] = useState(firstUnanswered === -1 ? 0 : firstUnanswered);
  const q = questions[idx];
  if (!q) return null;

  const total = questions.length;
  const answered = questions.filter((x) => answers[x.id]?.trim()).length;
  const set = (value: string) => onChange({ ...answers, [q.id]: value });
  const isLast = idx === total - 1;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Intake interview</p>
          <p className="text-xs text-muted-foreground">{skillTitle(skill)} · runs before this step is generated</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {idx < total - 1 && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIdx(total - 1)}>
              <ChevronsRight className="h-3.5 w-3.5" /> Skip to last
            </Button>
          )}
          <span className="rounded-md bg-status-info-bg px-2 py-1 text-[11px] font-medium text-status-info">
            Q{idx + 1} of {total}
          </span>
          <button type="button" onClick={onClose} aria-label="Back to plan" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-status-info" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      {/* Question */}
      <div className={cn("rounded-lg border bg-muted/20 p-3", q.gate ? "border-status-danger/50" : "border-border")}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {q.conditional && (
            <span className="rounded-md bg-status-info-bg px-2 py-0.5 text-[10px] font-medium text-status-info">
              Conditional · {q.condition.replace(/^ask if:?\s*/i, "")}
            </span>
          )}
          {q.gate && (
            <span className="rounded-md bg-status-danger-bg px-2 py-0.5 text-[10px] font-medium text-status-danger">
              Required to generate
            </span>
          )}
        </div>
        <p className="mb-3 text-sm font-medium">{q.title}</p>
        <p className="mb-3 text-sm text-muted-foreground">{q.prompt}</p>

        {q.suggested.length > 0 && (
          <div className="mb-3 flex flex-col gap-1.5">
            {q.suggested.map((s, i) => {
              const active = answers[q.id] === s;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => set(s)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                    active ? "border-status-info bg-status-info-bg text-status-info" : "border-border hover:bg-muted",
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  <span>{s}</span>
                </button>
              );
            })}
          </div>
        )}

        <label className="mb-1 block text-[11px] text-muted-foreground">
          {q.suggested.length > 0 ? "Other / add detail" : "Your answer"}
        </label>
        <textarea
          rows={2}
          value={answers[q.id] ?? ""}
          onChange={(e) => set(e.target.value)}
          placeholder={q.gate ? "Required before generating" : "Type an answer, or leave blank to skip"}
          className="w-full resize-y rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button size="sm" variant="ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <span className="text-[11px] text-muted-foreground">{answered} of {total} answered</span>
        {isLast ? (
          <Button size="sm" onClick={onClose} className="gap-1.5">
            <Check className="h-3.5 w-3.5" /> Done
          </Button>
        ) : (
          <Button size="sm" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))} className="gap-1.5">
            Next <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {questions.some((x) => x.gate && !answers[x.id]?.trim()) && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" /> The required question must be answered before this step can generate.
        </p>
      )}
    </div>
  );
}
