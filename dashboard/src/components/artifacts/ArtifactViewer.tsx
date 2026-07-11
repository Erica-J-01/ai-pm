import { lazy, Suspense, useMemo, useState } from "react";
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
import { openPrintable } from "@/lib/printPdf";
import { reportError } from "@/lib/telemetry";
import { ReleaseChecklistView } from "./ReleaseChecklistView";
import { DecisionLogView } from "./DecisionLogView";
import { SprintPlanView } from "./SprintPlanView";
import { RoadmapView } from "./RoadmapView";
import { StoriesView } from "./StoriesView";
import { DocumentView } from "./DocumentView";
import { ActionBar } from "./ActionBar";

// Lazy-load the chart-heavy views (recharts) and the markdown renderer
// (react-markdown) so those large libraries leave the entry chunk and load
// only when such an artefact is actually opened.
const RiskScanView = lazy(() => import("./RiskScanView").then((m) => ({ default: m.RiskScanView })));
const SprintReportView = lazy(() => import("./SprintReportView").then((m) => ({ default: m.SprintReportView })));
const BudgetTrackerView = lazy(() => import("./BudgetTrackerView").then((m) => ({ default: m.BudgetTrackerView })));
const MarkdownArtifact = lazy(() => import("./MarkdownArtifact").then((m) => ({ default: m.MarkdownArtifact })));

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

  // Serialize the publish markdown once per execution instead of on every render
  // (it was re-run inline in JSX, including with the publish dialog closed).
  const publishMarkdown = useMemo(
    () => (execution ? generatePublishMarkdown(execution) : ""),
    [execution],
  );

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
    try {
      await ws.regenerate(ws.activeProjectId, skill as SkillId);
    } catch (e) {
      reportError(e, { source: "artifact.regenerate", skill });
      notify({ title: `Regenerate failed - ${e instanceof Error ? e.message : "please try again"}`, tone: "danger" });
    } finally {
      setRegenerating(false);
    }
  };

  const confluenceConnector = connectors.find((c) => c.id === "confluence");

  const onAction = (dest: SaveDestination) => {
    if (dest === "confluence") { setConfluenceOpen(true); return; }

    if (dest === "clipboard") {
      navigator.clipboard.writeText(publishMarkdown)
        .then(() => notify({ title: "Markdown copied to clipboard", tone: "success" }))
        .catch(() => notify({ title: "Copy failed - check browser permissions", tone: "danger" }));
      return;
    }

    if (dest === "pdf") {
      // Open a clean printable document; the browser's print dialog offers
      // "Save as PDF", giving an emailable file (used for the onboarding brief).
      const ok = openPrintable(title, isDoc(p) ? p : undefined, publishMarkdown);
      notify(ok
        ? { title: "Opened the print view - choose Save as PDF", tone: "success" }
        : { title: "Popup blocked - allow popups to download the PDF", tone: "danger" });
      return;
    }

    if (dest === "local") {
      // Real download of the markdown, not a fake success toast. A browser cannot
      // write into the clients/ tree - that is a backend concern (see BACKEND_TODO.md).
      try {
        const date = new Date().toISOString().slice(0, 10);
        // Filename: <menu item>_<project>_<date>.md, e.g. user_stories_acme_corp_2026-07-06.md
        const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        const projectName = ws.projects.find((p) => p.id === ws.activeProjectId)?.name ?? "";
        const name = [slug(title), slug(projectName), date].filter(Boolean).join("_") || "artefact";
        const blob = new Blob([publishMarkdown], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        notify({ title: "Downloaded as markdown", tone: "success" });
      } catch {
        notify({ title: "Download failed - try Copy markdown instead", tone: "danger" });
      }
      return;
    }

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

      {execution.truncated && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-status-warning/40 bg-status-warning-bg px-3 py-2">
          <p className="text-xs text-status-warning">
            This artefact hit the length limit and may be cut off. Regenerate for the full document, or shorten the input.
          </p>
          {editable && (
            <Button size="sm" variant="outline" className="shrink-0" onClick={doRegenerate} disabled={regenerating}>
              {regenerating ? "Regenerating…" : "Regenerate"}
            </Button>
          )}
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
        ) : (
          <Suspense fallback={<p className="text-xs text-muted-foreground">Loading…</p>}>
            {hasVisual ? (
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
          </Suspense>
        )}
      </div>

      <ActionBar connectors={connectors} onAction={onAction} />

      {confluenceConnector && (
        <ConfluencePublishDialog
          open={confluenceOpen}
          onOpenChange={setConfluenceOpen}
          connector={confluenceConnector}
          artifactTitle={title}
          markdown={publishMarkdown}
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
