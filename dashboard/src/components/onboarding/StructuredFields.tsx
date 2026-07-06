import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { EpicGroup, OnbStep, Row, ScalarField, StepValues } from "./steps";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Renders a step's structured inputs (scalars, tags, list rows, epic groups).
 * List rows lay out as a wrapping grid of labelled fields so nothing is
 * cut off or overlaps the remove button on a narrow column.
 */
export function StructuredFields({
  step, values, onChange,
}: {
  step: OnbStep;
  values: StepValues;
  onChange: (next: StepValues) => void;
}) {
  const set = (name: string, v: StepValues[string]) => onChange({ ...values, [name]: v });

  return (
    <div className="space-y-4">
      {step.fields.map((f) => {
        if (f.kind === "list") {
          const list = Array.isArray(values[f.name]) ? (values[f.name] as Row[]) : [];
          const addRow = () => {
            const blank: Row = {};
            f.itemFields.forEach((itf) => { blank[itf.name] = itf.kind === "select" ? (itf.options?.[0] ?? "") : ""; });
            set(f.name, [...list, blank]);
          };
          return (
            <section key={f.name} className="space-y-2 rounded-xl border border-border bg-card p-3 shadow-card">
              <SectionTitle label={f.label} required={f.required} count={list.length} />
              <div className="space-y-2">
                {list.map((row, idx) => (
                  <RowEditor
                    key={idx}
                    fields={f.itemFields}
                    row={row}
                    onCell={(name, v) => set(f.name, list.map((r, i) => (i === idx ? { ...r, [name]: v } : r)))}
                    onRemove={() => set(f.name, list.filter((_, i) => i !== idx))}
                  />
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
                <Plus className="h-3.5 w-3.5" /> {f.addLabel}
              </Button>
            </section>
          );
        }

        if (f.kind === "epics") {
          const epics = Array.isArray(values[f.name]) ? (values[f.name] as EpicGroup[]) : [];
          return (
            <section key={f.name} className="space-y-2 rounded-xl border border-border bg-card p-3 shadow-card">
              <SectionTitle label={f.label} required={f.required} count={epics.length} />
              <EpicsEditor field={f} value={epics} onChange={(v) => set(f.name, v)} />
            </section>
          );
        }

        // scalar / tags
        return (
          <div key={f.name} className="space-y-1">
            <Label>{f.label}{f.required && <span className="text-status-danger"> *</span>}</Label>
            {f.kind === "tags" ? (
              <TagInput
                value={Array.isArray(values[f.name]) ? (values[f.name] as string[]) : []}
                placeholder={f.placeholder}
                onChange={(arr) => set(f.name, arr)}
              />
            ) : (
              <FieldInput field={f} value={(values[f.name] as string) ?? ""} onChange={(v) => set(f.name, v)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Header for a grouped section (Agenda, Decisions, Action items, etc.). */
function SectionTitle({ label, required, count }: { label: string; required?: boolean; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
        {label}{required && <span className="text-status-danger"> *</span>}
      </p>
      {count > 0 && <span className="text-[10px] tabular-nums text-muted-foreground">{count}</span>}
    </div>
  );
}

/** One list row: labelled fields that wrap, with a remove button that never overlaps. */
function RowEditor({
  fields, row, onCell, onRemove,
}: {
  fields: ScalarField[];
  row: Row;
  onCell: (name: string, v: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-2">
      <div className="flex flex-1 flex-wrap gap-x-3 gap-y-2">
        {fields.map((f) => (
          <div
            key={f.name}
            className={cn(
              "min-w-[150px] space-y-0.5",
              // wide fields take the full row; narrow selects sit side by side
              f.kind === "textarea" ? "w-full" : "flex-1",
            )}
          >
            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{f.label}</span>
            <FieldInput field={f} value={row[f.name] ?? ""} onChange={(v) => onCell(f.name, v)} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-5 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Remove"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: ScalarField; value: string; onChange: (v: string) => void }) {
  if (field.kind === "textarea") {
    return <Textarea rows={2} value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.kind === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-9 w-full rounded-md border border-border bg-card pl-2 pr-7 text-sm outline-none focus:ring-2 focus:ring-ring")}
      >
        {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return <Input value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
}

/** Type a value, press Enter -> chip below; chips are removable. */
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div>
      <Input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        onBlur={add}
      />
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((t, i) => (
            <span key={i} className="flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs">
              {t}
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground" title="Remove">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Multiple epics, each with its own nested story rows. */
function EpicsEditor({
  field, value, onChange,
}: {
  field: { storyFields: ScalarField[] };
  value: EpicGroup[];
  onChange: (v: EpicGroup[]) => void;
}) {
  const setEpic = (idx: number, patch: Partial<EpicGroup>) => onChange(value.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  const addEpic = () => onChange([...value, { name: "", stories: [] }]);
  const addStory = (ei: number) => {
    const blank: Row = {};
    field.storyFields.forEach((sf) => { blank[sf.name] = sf.kind === "select" ? (sf.options?.[0] ?? "") : ""; });
    setEpic(ei, { stories: [...(value[ei]?.stories ?? []), blank] });
  };

  return (
    <div className="space-y-3">
      {value.map((epic, ei) => (
        <div key={ei} className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Epic</span>
            <Input value={epic.name} placeholder="Epic name" onChange={(e) => setEpic(ei, { name: e.target.value })} />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== ei))}
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Remove epic"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {(epic.stories ?? []).map((s, si) => (
              <RowEditor
                key={si}
                fields={field.storyFields}
                row={s}
                onCell={(name, v) => setEpic(ei, { stories: epic.stories.map((x, i) => (i === si ? { ...x, [name]: v } : x)) })}
                onRemove={() => setEpic(ei, { stories: epic.stories.filter((_, i) => i !== si) })}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => addStory(ei)}>
            <Plus className="h-3.5 w-3.5" /> Add story
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addEpic}>
        <Plus className="h-3.5 w-3.5" /> Add epic
      </Button>
    </div>
  );
}
