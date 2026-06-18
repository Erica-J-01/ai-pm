import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ExecutionPanel } from "@/components/ExecutionPanel";
import { ArtifactViewer } from "@/components/artifacts/ArtifactViewer";
import { ConnectorsDialog } from "@/components/ConnectorsDialog";
import { Toaster } from "@/components/Toaster";
import { useWorkspace } from "@/store/workspace";
import { SKILL_INDEX } from "@/data/demo";

/**
 * App integrator. State lives in the WorkspaceProvider (see main.tsx). The
 * center is always the execution console; hitting "Edit" on the canvas swaps it
 * for the structured form (handled inside ExecutionPanel).
 */
export default function App() {
  const ws = useWorkspace();
  const [connectorsOpen, setConnectorsOpen] = useState(false);

  // The skill nav stays hidden until the project's first orchestration completes.
  const skillsUnlocked = !!ws.activeProjectId && ws.orchestratedProjects.includes(ws.activeProjectId);

  return (
    <>
      <DashboardLayout
        clients={ws.clients}
        projects={ws.projects}
        connectors={ws.connectors}
        activeClientId={ws.activeClientId}
        activeProjectId={ws.activeProjectId}
        activeSkill={ws.activeSkill}
        skillIndex={SKILL_INDEX}
        onClientChange={ws.selectClient}
        onProjectChange={ws.selectProject}
        onSelectSkill={ws.selectSkill}
        onAddProject={(name) => { if (ws.activeClientId) ws.addProject(ws.activeClientId, name); }}
        onAddClient={ws.addClient}
        onDeleteProject={ws.deleteProject}
        onDeleteClient={ws.deleteClient}
        onManageConnectors={() => setConnectorsOpen(true)}
        skillsUnlocked={skillsUnlocked}
        skillStatus={ws.skillStatus[ws.activeProjectId ?? ""] ?? {}}
        generatedSkills={ws.generatedSkills[ws.activeProjectId ?? ""] ?? []}
        unseenSkills={ws.unseenSkills[ws.activeProjectId ?? ""] ?? []}
        console={<ExecutionPanel />}
        canvas={
          <ArtifactViewer
            execution={ws.current}
            connectors={ws.connectors}
            onEdit={ws.beginEdit}
            onGenerate={(skill) => ws.activeProjectId && ws.generateSkill(ws.activeProjectId, skill)}
            skillStatus={ws.skillStatus[ws.activeProjectId ?? ""] ?? {}}
          />
        }
      />
      <ConnectorsDialog open={connectorsOpen} onOpenChange={setConnectorsOpen} />
      <Toaster />
    </>
  );
}
