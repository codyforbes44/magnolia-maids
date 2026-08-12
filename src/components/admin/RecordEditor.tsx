import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { inputClass } from "@/components/admin/ui";

export type EditField = {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "date" | "textarea" | "select";
  options?: readonly string[];
  rows?: number;
};

/**
 * Inline editor for correcting bad data on a lead / applicant record.
 * Writes straight to the table (admin-only UPDATE policies apply).
 */
export function RecordEditor<T extends Record<string, unknown>>({
  table,
  record,
  fields,
  onSaved,
}: {
  table: "campaign_leads" | "job_applications" | "booking_requests";
  record: T & { id: string };
  fields: EditField[];
  onSaved: (patch: Record<string, string | null>) => void;
}) {
  const [open, setOpen] = useState(false);
  const initial = useMemo(() => {
    const o: Record<string, string> = {};
    fields.forEach((f) => (o[f.key] = (record[f.key] as string | null) ?? ""));
    return o;
  }, [record, fields]);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValues(initial);
    setError(null);
    setSaved(false);
  }, [initial]);

  const dirty = fields.some((f) => values[f.key] !== initial[f.key]);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const patch: Record<string, string | null> = {};
    fields.forEach((f) => {
      const next = (values[f.key] ?? "").trim();
      if (next !== (initial[f.key] ?? "")) patch[f.key] = next === "" ? null : next;
    });
    const { error } = await supabase
      .from(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", record.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    onSaved(patch);
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Edit details
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="tap-target rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
        >
          {open ? "Hide" : "Correct info"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {f.label}
              </span>
              {f.type === "textarea" ? (
                <textarea
                  value={values[f.key] ?? ""}
                  rows={f.rows ?? 3}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className={`${inputClass} mt-1.5`}
                />
              ) : f.type === "select" ? (
                <select
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className={`${inputClass} mt-1.5`}
                >
                  <option value="">—</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type ?? "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className={`${inputClass} mt-1.5`}
                />
              )}
            </label>
          ))}

          {error && <p className="text-xs text-destructive">{error}</p>}
          {saved && !dirty && <p className="text-xs text-laurel">Saved.</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="tap-target rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setValues(initial)}
              disabled={!dirty || saving}
              className="tap-target rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
