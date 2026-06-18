import { useState } from "react";
import {
  type McpConnector, type SkillExecution, type SaveDestination, type SkillId,
  isRiskScan, isReleaseChecklist, isDecisionLog, isSprintPlan,
  isSprintReport, isBudgetTracker, isRoadmap, isStories, isDoc,
} from "@/types/pm";
import { Pencil, Sparkles } from "lucide-react";
import { skillTitle } from "@/data/demo";
import { useToast } from "@/store/toast";
import { useWorkspace } from "@/store/workspace";
import { STEPS } from "@/components/onboarding/steps";
import { Button } from "@/components/ui/button";
import { ConfluencePublishDialog } from "./ConfluencePublishDialog";
import { generatePublishMarkdown } from "@/lib/generatePublishMarkdown";
import { RiskScanView } from "./RiskScanView";
import { ReleaseChecklistView } from "./ReleaseChecklistView";
import { DecisionLogView } from "./DecisionLogView";
import { SprintPlanView } from "./SprintPlanView";
import { SprintReportView } from "./SprintReportView";
import { BudgetTrackerView } from "./BudgetTrackerView";
import { RoadmapView } from "./RoadmapView";
import { StoriesView } from "./StoriesView";
import { DocumentView } from "./DocumentView";
import { MarkdownArtifact } from "./MarkdownArtifact";
import { ActionBar } from "./ActionBar";

/** Skills with a structured schema can be edited via the form (not raw markdown). */
const EDITABLE = new Set(STEPS.map((s) => s.id));

/**
 * The right-hand canvas. Shows the bespoke visual view (or markdown). The "Edit"
 * button hands off to the structured form in the center column (see
 * ArtifactEditor) - no raw-markdown editing here. Edit is offered only for
 * skills that have a structured schema.
 */
export function ArtifactViewer({
  execution, connectors, onEdit, onGenerate, skillStatus,
}: {
  execution: SkillExecution | null;
  connectors: McpConnector[];
  /** Open the structured editor for this skill in the center column. */
  onEdit?: (skill: SkillId) => void;
  /** Generate a skipped section (populate it and mark approved). */
  onGenerate?: (skill: SkillId) => void;
  /** Per-skill orchestration outcome for the active project. */
  skillStatus?: Partial<Record<SkillId, "approved" | "skipped">>;
}) {
  const { notify } = useToast();
  const ws = useWorkspace();
  const [confluenceOpen, setConfluenceOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!execution) return <EmptyState />;

  const p = execution.payload;
  const hasVisual =
    isRiskScan(p) || isReleaseChecklist(p) || isDecisionLog(p) || isSprintPlan(p) ||
    isSprintReport(p) || isBudgetTracker(p) || isRoadmap(p) || isStories(p) || isDoc(p);

  const skill = execution.request.skill;
  const title = skillTitle(skill);
  const editable = EDITABLE.has(skill as SkillId) && !!onEdit;
  const skipped = skillStatus?.[skill as SkillId] === "skipped";
  const empty = !execution.payload && !execution.markdown.trim();
  const isStale = !!(ws.activeProjectId && ws.staleSkills[ws.activeProjectId]?.includes(skill as SkillId));

  const doRegenerate = async () => {
    if (!ws.activeProjectId) return;
    setRegenerating(true);
    await ws.regenerate(ws.activeProjectId, skill as SkillId);
    setRegenerating(false);
  };

  const confluenceConnector = connectors.find((c) => c.id === "confluence");

  const onAction = (dest: SaveDestination) => {
    if (dest === "confluence") { setConfluenceOpen(true); return; }

    if (dest === "clipboard") {
      const md = generatePublishMarkdown(execution);
      navigator.clipboard.writeText(md)
        .then(() => notify({ title: "Markdown copied to clipboard", tone: "success" }))
        .catch(() => notify({ title: "Copy failed - check browser permissions", tone: "danger" }));
      return;
    }

    if (dest === "local") { notify({ title: "Saved locally", tone: "success" }); return; }

    // Jira, Drive, Notion, Gmail - not yet implemented
    notify({ title: `${dest.charAt(0).toUpperCase() + dest.slice(1)} publishing coming soon`, tone: "info" });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">{title}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {skipped && onGenerate && (
            <Button size="sm" className="gap-1.5" onClick={() => onGenerate(skill as SkillId)}>
              <Sparkles className="h-3.5 w-3.5" /> Generate Plan
            </Button>
          )}
          {editable && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onEdit!(skill as SkillId)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      {skipped && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          This section was skipped during orchestration. Generate it to populate a starting draft, or Edit to add it manually.
        </div>
      )}

      {isStale && !skipped && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-status-warning/40 bg-status-warning-bg px-3 py-2">
          <p className="text-xs text-status-warning">
            An upstream artefact changed - this may be out of date. Regenerate to derive it from the latest inputs.
          </p>
          <Button size="sm" variant="outline" className="shrink-0" onClick={doRegenerate} disabled={regenerating}>
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {empty ? (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-xs space-y-1">
              <p className="text-sm font-medium">This section is empty</p>
              <p className="text-xs text-muted-foreground">
                {skipped
                  ? "It was skipped during orchestration. Generate it for a starting draft, or Edit to add it."
                  : "Nothing here yet. Use Edit to add the details."}
              </p>
            </div>
          </div>
        ) : hasVisual ? (
          <>
            {isRiskScan(p) && <RiskScanView payload={p} />}
            {isReleaseChecklist(p) && <ReleaseChecklistView payload={p} />}
            {isDecisionLog(p) && <DecisionLogView payload={p} />}
            {isSprintPlan(p) && <SprintPlanView payload={p} />}
            {isSprintReport(p) && <SprintReportView payload={p} />}
            {isBudgetTracker(p) && <BudgetTrackerView payload={p} />}
            {isRoadmap(p) && <RoadmapView payload={p} />}
            {isStories(p) && <StoriesView payload={p} />}
            {isDoc(p) && <DocumentView payload={p} />}
          </>
        ) : (
          <MarkdownArtifact markdown={execution.markdown} />
        )}
      </div>

      <ActionBar connectors={connectors} onAction={onAction} />

      {confluenceConnector && (
        <ConfluencePublishDialog
          open={confluenceOpen}
          onOpenChange={setConfluenceOpen}
          connector={confluenceConnector}
          artifactTitle={title}
          markdown={generatePublishMarkdown(execution)}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center text-center">
      <div className="max-w-xs space-y-1">
        <p className="text-sm font-medium">No artifact yet</p>
        <p className="text-xs text-muted-foreground">
          Run the orchestrator and approve a step, or pick a skill on the left to load a sample artifact.
        </p>
      </div>
    </div>
  );
}
