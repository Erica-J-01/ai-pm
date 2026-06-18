import { useCallback } from "react";
import { OrchestratorConsole } from "@/components/OrchestratorConsole";
import { ArtifactEditor } from "@/components/ArtifactEditor";
import { RecordList } from "@/components/RecordList";
import { getOrchestratorApi } from "@/api";
import { useWorkspace } from "@/store/workspace";
import { MULTI_RECORD_SKILLS } from "@/components/onboarding/steps";
import { cn } from "@/lib/utils";
import type { SkillExecution, SkillId } from "@/types/pm";

/** Demo text loaded into the Finwave project only (shown as a one-click example). */
const DEMO_INPUT =
  "From Sarah Chen (Head of Product): Our enterprise clients keep finding out about " +
  "failed payments only when their own customers call them. We need real-time payment " +
  "notifications before the conference in 6 weeks. Budget is around $80k.";

export function ExecutionPanel() {
  const ws = useWorkspace();
  const editing = ws.editingSkill;
  const { activeProjectId, completeOrchestration } = ws;

  // Resolve the orchestrator at render time so it picks up a newly-saved Claude key
  // without requiring a page reload.
  const api = getOrchestratorApi();

  const onComplete = useCallback(
    (
      decisions: Parameters<typeof completeOrchestration>[1],
      claudeExecutions?: Partial<Record<SkillId, SkillExecution>>,
    ) => {
      if (activeProjectId) completeOrchestration(activeProjectId, decisions, claudeExecutions);
    },
    [activeProjectId, completeOrchestration],
  );

  const recordSkill = !editing && ws.activeSkill && MULTI_RECORD_SKILLS.includes(ws.activeSkill) ? ws.activeSkill : null;
  const consoleHidden = !!editing || !!recordSkill;

  return (
    <div className="h-full">
      {editing && <ArtifactEditor skill={editing} />}
      {recordSkill && <RecordList skill={recordSkill} />}

      <div className={cn("h-full", consoleHidden && "hidden")}>
        <OrchestratorConsole
          clientId={ws.activeClientId}
          projectId={ws.activeProjectId}
          api={api}
          onViewSkill={ws.previewSkill}
          onComplete={onComplete}
          onVizDecision={(approved) => { if (ws.activeProjectId) ws.setRiskViz(ws.activeProjectId, approved); }}
          onGenerateStep={(skill) => (ws.activeProjectId ? ws.regenerate(ws.activeProjectId, skill) : Promise.resolve())}
          onFinalizeStepwise={(decisions) => {
            if (ws.activeProjectId) ws.finalizeStepwise(ws.activeProjectId, decisions);
          }}
          generatedSkills={ws.activeProjectId ? ws.generatedSkills[ws.activeProjectId] ?? [] : []}
          onIntakeChanged={(_skill, affected) => { if (ws.activeProjectId) ws.markStale(ws.activeProjectId, affected); }}
          onIntakeAnswersChange={(skill, answers) => { if (ws.activeProjectId) ws.setIntakeAnswers(ws.activeProjectId, skill, answers); }}
          intakeAnswersSeed={ws.activeProjectId ? ws.intakeAnswers[ws.activeProjectId] ?? {} : {}}
          onRunInput={(i) => { if (ws.activeProjectId) ws.setOrchestrationInput(ws.activeProjectId, i); }}
          orchestrated={!!ws.activeProjectId && ws.orchestratedProjects.includes(ws.activeProjectId)}
          defaultInput={ws.activeProjectId === "p-notifications" ? DEMO_INPUT : ""}
        />
      </div>
    </div>
  );
}
