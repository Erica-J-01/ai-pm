import { type ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Plus, Settings, Sun, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  type ClientContext,
  type ProjectContext,
  type McpConnector,
  type SkillId,
  type SkillMeta,
  SKILL_TAXONOMY,
} from "@/types/pm";
import { cn } from "@/lib/utils";
import { useTheme } from "@/store/theme";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * DashboardLayout - the 3-column workspace shell.
 *
 *   [ Left: Navigation & Context ] [ Center: Execution Console ] [ Right: Artifact Canvas ]
 *
 * The shell owns the left rail (context switchers, lifecycle-grouped skill nav,
 * MCP status). Center and canvas are injected so routes/pages stay decoupled.
 * Theme tokens come from styles/theme.css (main_design.png palette).
 */
export interface DashboardLayoutProps {
  clients: ClientContext[];
  projects: ProjectContext[];
  connectors: McpConnector[];
  activeClientId?: string;
  activeProjectId?: string;
  activeSkill?: SkillId;
  skillIndex: Record<SkillId, SkillMeta>;
  onClientChange: (clientId: string) => void;
  onProjectChange: (projectId: string) => void;
  onSelectSkill: (skill: SkillId) => void;
  /** Add a project to the active client inline (name only). */
  onAddProject?: (name: string) => void;
  /** Add a client inline (name only). */
  onAddClient?: (name: string) => void;
  /** Delete the given project. */
  onDeleteProject?: (projectId: string) => void;
  /** Delete the given client (and its projects). */
  onDeleteClient?: (clientId: string) => void;
  onManageConnectors?: () => void;
  /** Reveal the skill nav once the project's first orchestration has finished. */
  skillsUnlocked?: boolean;
  /** Per-skill orchestration outcome for the active project (nav indicators). */
  skillStatus?: Partial<Record<SkillId, "approved" | "skipped">>;
  /** Skills already generated for the active project (others stay greyed/locked). */
  generatedSkills?: SkillId[];
  /** Generated/changed skills this user has not yet viewed (green "unseen" dot). */
  unseenSkills?: SkillId[];
  /** Center column - the OrchestratorConsole / skill form. */
  console: ReactNode;
  /** Right column - the ArtifactViewer. */
  canvas: ReactNode;
}

export function DashboardLayout({
  clients, projects, connectors,
  activeClientId, activeProjectId, activeSkill, skillIndex,
  onClientChange, onProjectChange, onSelectSkill, onAddProject, onAddClient, onDeleteProject, onDeleteClient, onManageConnectors,
  skillsUnlocked, skillStatus, generatedSkills, unseenSkills, console: consoleSlot, canvas,
}: DashboardLayoutProps) {
  const projectsForClient = useMemo(
    () => projects.filter((p) => p.clientId === activeClientId),
    [projects, activeClientId],
  );
  // Pending delete confirmation (project or client). Client delete also requires
  // typing the client name to confirm (matched against confirmText).
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "project" | "client"; id: string; name: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const activeClientName = clients.find((c) => c.id === activeClientId)?.name ?? "";
  const activeProjectName = projects.find((p) => p.id === activeProjectId)?.name ?? "";

  // Orchestration is "complete" once every approved chain step has been generated.
  // Standalone skills unlock at that point; while it is still in progress they stay locked.
  const approvedChain = Object.entries(skillStatus ?? {}).filter(([, s]) => s === "approved").map(([id]) => id);
  const orchestrationComplete = approvedChain.length > 0 && approvedChain.every((id) => (generatedSkills ?? []).includes(id as SkillId));

  // Inline add - translucent fields instead of dialogs. Any non-empty name is allowed.
  const [addingClient, setAddingClient] = useState(false);
  const [clientDraft, setClientDraft] = useState("");
  const [addingProject, setAddingProject] = useState(false);
  const [projectDraft, setProjectDraft] = useState("");

  const submitClient = () => {
    const v = clientDraft.trim();
    if (v) onAddClient?.(v);
    setClientDraft("");
    setAddingClient(false);
  };
  const submitProject = () => {
    const v = projectDraft.trim();
    if (v) onAddProject?.(v);
    setProjectDraft("");
    setAddingProject(false);
  };

  // A client with no projects: prompt to add one straight away.
  const noProjects = !!activeClientId && projectsForClient.length === 0;
  useEffect(() => {
    if (noProjects) setAddingProject(true);
  }, [activeClientId, noProjects]);

  return (
    <div className="grid h-dvh grid-cols-[280px_minmax(440px,1fr)_minmax(420px,640px)] bg-background text-foreground">
      {/* Delete confirmation (project or client) */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) { setConfirmDelete(null); setConfirmText(""); } }}>
        <DialogContent>
          {(() => {
            const isClient = confirmDelete?.kind === "client";
            const clientProjects = isClient && confirmDelete ? projects.filter((p) => p.clientId === confirmDelete.id) : [];
            const nameMatches = !isClient || confirmText.trim() === confirmDelete?.name;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Delete {isClient ? "client" : "project"}?</DialogTitle>
                  <DialogDescription>
                    {isClient ? (
                      clientProjects.length > 0
                        ? `Deleting "${confirmDelete?.name}" also permanently deletes all ${clientProjects.length} of its projects (${clientProjects.map((p) => p.name).join(", ")}) and everything in them. This cannot be undone.`
                        : `This permanently deletes the client "${confirmDelete?.name}". This cannot be undone.`
                    ) : (
                      `This permanently removes the project "${confirmDelete?.name}". This cannot be undone.`
                    )}
                  </DialogDescription>
                </DialogHeader>

                {isClient && (
                  <div className="mt-3 space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Type <span className="font-medium text-foreground">{confirmDelete?.name}</span> to confirm
                    </label>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={confirmDelete?.name}
                      autoFocus
                    />
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setConfirmDelete(null); setConfirmText(""); }}>Cancel</Button>
                  <Button
                    size="sm"
                    className="bg-status-danger text-white hover:bg-status-danger/90"
                    disabled={!nameMatches}
                    onClick={() => {
                      if (confirmDelete?.kind === "project") onDeleteProject?.(confirmDelete.id);
                      else if (confirmDelete?.kind === "client") onDeleteClient?.(confirmDelete.id);
                      setConfirmDelete(null);
                      setConfirmText("");
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ---------------- LEFT: Navigation & Context ---------------- */}
      <aside className="flex min-h-0 flex-col border-r border-border bg-surface">
        <BrandHeader />

        <div className="space-y-3 px-4 py-4">
          <ContextSelect
            label="Client"
            value={activeClientId}
            placeholder="Select client"
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
            onChange={onClientChange}
            action={activeClientId && (
              <button
                type="button"
                onClick={() => setConfirmDelete({ kind: "client", id: activeClientId, name: activeClientName })}
                title="Delete client"
                aria-label="Delete client"
                className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-status-danger"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
          />

          {/* Inline client add - translucent box, right above the Project section */}
          {addingClient && (
            <InlineAdd
              label="New client"
              value={clientDraft}
              onChange={setClientDraft}
              onSubmit={submitClient}
              onCancel={() => { setAddingClient(false); setClientDraft(""); }}
            />
          )}

          <ContextSelect
            label="Project"
            value={activeProjectId}
            placeholder={!activeClientId ? "Pick a client first" : noProjects ? "No projects yet" : "Select project"}
            disabled={!activeClientId || noProjects}
            options={projectsForClient.map((p) => ({ value: p.id, label: p.name }))}
            onChange={onProjectChange}
            action={activeProjectId && (
              <button
                type="button"
                onClick={() => setConfirmDelete({ kind: "project", id: activeProjectId, name: activeProjectName })}
                title="Delete project"
                aria-label="Delete project"
                className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-status-danger"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
          />

          {/* Inline project add - translucent box */}
          {addingProject && (
            <InlineAdd
              label="New project"
              value={projectDraft}
              onChange={setProjectDraft}
              onSubmit={submitProject}
              onCancel={() => { setAddingProject(false); setProjectDraft(""); }}
            />
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-center gap-1.5 transition-transform hover:-translate-y-0.5"
              onClick={() => { if (activeClientId) setAddingProject((v) => !v); }}
              disabled={!activeClientId}
              title={activeClientId ? "Add a project to this client" : "Select a client first"}
            >
              <Plus className="h-3.5 w-3.5" /> Project
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-center gap-1.5 transition-transform hover:-translate-y-0.5"
              onClick={() => setAddingClient((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" /> Client
            </Button>
          </div>
        </div>

        <Separator className="bg-border" />

        {!skillsUnlocked ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-3">
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              {!activeClientId
                ? "Select a client and project to begin."
                : !activeProjectId
                ? "Select a project to begin."
                : "Run the orchestrator to unlock this project's PM skills."}
            </p>
          </div>
        ) : (
        <ScrollArea className="min-h-0 flex-1 px-2 py-3">
          <nav aria-label="PM skills" className="space-y-5">
            {SKILL_TAXONOMY.map((category) => (
              <div key={category.id}>
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.title}
                </p>
                <ul className="space-y-0.5">
                  {category.skillIds.map((id) => {
                    const meta = skillIndex[id];
                    const active = id === activeSkill;
                    const status = skillStatus?.[id];
                    const generated = !!generatedSkills && generatedSkills.includes(id);
                    const isChain = status === "approved" || status === "skipped";
                    const skipped = status === "skipped";
                    // Approved chain step awaiting generation.
                    const pending = status === "approved" && !generated;
                    // Chain steps: open only once generated (skipped/pending stay locked).
                    // Standalone skills: locked while orchestration is in progress, unlocked once complete.
                    const locked = isChain ? !generated : !orchestrationComplete;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => { if (!locked) onSelectSkill(id); }}
                          disabled={locked}
                          aria-current={active ? "page" : undefined}
                          title={
                            skipped ? "Skipped during orchestration - locked."
                            : pending ? "Not generated yet - generate it from the orchestration plan first."
                            : locked ? "Available once orchestration is complete."
                            : undefined
                          }
                          className={cn(
                            "group relative flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : locked
                                ? "text-foreground/80"
                                : "text-foreground/80 hover:bg-muted",
                            locked && !active && "opacity-45 cursor-not-allowed",
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="skill-active"
                              className="absolute inset-0 -z-10 rounded-md bg-primary"
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                          )}
                          <span className="truncate">{meta?.title}</span>
                          {skipped && (
                            <span className={cn(
                              "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                              active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-status-na-bg text-status-na",
                            )}>
                              Skipped
                            </span>
                          )}
                          {pending && (
                            <span className={cn(
                              "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                              "bg-muted text-muted-foreground",
                            )}>
                              Pending
                            </span>
                          )}
                          {generated && !active && unseenSkills?.includes(id) && (
                            <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-status-success" aria-hidden title="New since you last viewed" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>
        )}

        <Separator className="bg-border" />
        <ConnectorStatusBar connectors={connectors} onManage={onManageConnectors} />

        <Separator className="bg-border" />
        <CurrentUser name="Erica J." role="Product Owner" />
      </aside>

      {/* ---------------- CENTER: Execution Console ---------------- */}
      <main className="flex min-h-0 flex-col overflow-hidden">
        <ColumnHeader title="Execution Console" subtitle="Paste anything - the orchestrator plans the run" />
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">{consoleSlot}</div>
      </main>

      {/* ---------------- RIGHT: Artifact Canvas ---------------- */}
      <section className="flex min-h-0 flex-col overflow-hidden border-l border-border bg-surface/60">
        <ColumnHeader title="Artifact" subtitle="Editable, visual, ready to publish" />
        <div className="min-h-0 flex-1 overflow-auto px-5 py-5">{canvas}</div>
      </section>
    </div>
  );
}

/* ----------------------------- internals ----------------------------- */

function BrandHeader() {
  const { theme, toggle } = useTheme();
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold">PM</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">AI PM Assistant</p>
          <p className="text-[11px] text-muted-foreground">PM Dashboard</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/** Translucent inline add field (client / project) - no dialog. */
function InlineAdd({
  label, value, onChange, onSubmit, onCancel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <button
          type="button"
          onClick={onCancel}
          title="Close"
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          value={value}
          placeholder="Name"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); if (e.key === "Escape") onCancel(); }}
          className="h-8 border-border/50 bg-background/50 text-sm"
        />
        <Button size="sm" variant="ghost" className="shrink-0 px-2 text-xs" onClick={onSubmit}>Add</Button>
      </div>
    </div>
  );
}

/** Current-user chip pinned to the bottom of the left rail. */
function CurrentUser({ name, role }: { name: string; role: string }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex items-center gap-2.5 px-4 py-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
        {initials}
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

function ColumnHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex items-baseline justify-between border-b border-border bg-background/80 px-6 py-3.5 backdrop-blur">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </header>
  );
}

function ContextSelect({
  label, value, placeholder, options, disabled, onChange, action,
}: {
  label: string;
  value?: string;
  placeholder: string;
  disabled?: boolean;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  /** Optional control rendered at the right of the label row (e.g. a delete button). */
  action?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex h-4 items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {action}
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 w-full rounded-md border-border bg-card text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ConnectorStatusBar({ connectors, onManage }: { connectors: McpConnector[]; onManage?: () => void }) {
  const connectedCount = connectors.filter((c) => c.status === "connected").length;
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Connected Tools <span className="tabular-nums text-foreground/70">{connectedCount}/{connectors.length}</span>
        </p>
        {onManage && (
          <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-[11px]" onClick={onManage}>
            <Settings className="h-3.5 w-3.5" /> Manage
          </Button>
        )}
      </div>
    </div>
  );
}
