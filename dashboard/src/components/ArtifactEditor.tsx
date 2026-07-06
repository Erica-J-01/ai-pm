import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { STEPS, TEST_DATA, type StepValues } from "@/components/onboarding/steps";
import { StructuredFields } from "@/components/onboarding/StructuredFields";
import { buildExecution } from "@/components/onboarding/buildArtifact";
import { useWorkspace } from "@/store/workspace";
import { useToast } from "@/store/toast";
import { Button } from "@/components/ui/button";
import { skillTitle } from "@/data/demo";
import type { SkillId } from "@/types/pm";

/**
 * Structured editor that replaces the orchestrator console when the user hits
 * "Edit" on an artifact. It reuses the onboarding field engine (StructuredFields
 * + the skill's schema) so editing is form-driven, not raw-markdown. The canvas
 * updates live; Save persists the inputs and rebuilds the artifact.
 */
export function ArtifactEditor({ skill }: { skill: SkillId }) {
  const ws = useWorkspace();
  const { notify } = useToast();
  const pid = ws.activeProjectId ?? "";
  const cid = ws.activeClientId ?? "";
  const step = STEPS.find((s) => s.id === skill);

  const recordId = ws.editingRecordId;
  const record = recordId ? ws.records[pid]?.[skill]?.find((r) => r.id === recordId) : undefined;
  const seed = record ? record.values : (ws.artifactValues[pid]?.[skill] ?? TEST_DATA[skill] ?? {});
  const [values, setValues] = useState<StepValues>(seed);
  // Artifact shown before editing began - restored on Cancel.
  const prevRef = useRef(ws.current);

  // Live preview to the canvas as the form changes. Debounced so a full artifact
  // rebuild + app-wide store update does not fire on every keystroke.
  useEffect(() => {
    if (!step) return;
    const t = setTimeout(() => ws.showExecution(buildExecution(step, values, cid, pid)), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  if (!step) return null;

  const save = () => {
    if (recordId) ws.saveRecord(pid, skill, recordId, values);
    else ws.saveArtifactValues(pid, skill, values);
    ws.showExecution(buildExecution(step, values, cid, pid));
    ws.endEdit();
    notify({ title: `${record ? record.title : skillTitle(skill)} saved`, tone: "success" });
  };
  const cancel = () => {
    if (prevRef.current) ws.showExecution(prevRef.current);
    ws.endEdit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex h-full flex-col gap-4"
    >
      <div>
        <p className="text-sm font-semibold">Edit {record ? record.title : skillTitle(skill)}</p>
        <p className="text-xs text-muted-foreground">
          Update the fields below; the artifact on the right updates live. Save to keep your changes, or cancel to discard.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card p-4 shadow-card">
        <StructuredFields step={step} values={values} onChange={setValues} />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>
        <motion.div whileHover={{ y: -1 }}>
          <Button size="sm" onClick={save}>Save changes</Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
