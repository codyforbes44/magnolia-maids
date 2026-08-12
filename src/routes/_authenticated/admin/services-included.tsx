import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, GripVertical, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, inputClass } from "@/components/admin/ui";
import {
  DEFAULT_INCLUDED_ROWS, INCLUDED_KEY, INCLUDED_SCOPE, INCLUDED_SERVICE_KEYS,
  INCLUDED_SERVICE_TITLES, parseIncludedRows,
  type IncludedRow, type IncludedServiceKey,
} from "@/lib/services-included";

export const Route = createFileRoute("/_authenticated/admin/services-included")({
  head: () => ({
    meta: [
      { title: "Admin — What's included | Magnolia Maids" },
      { name: "description", content: "Edit the What's included comparison matrix on the services page." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ServicesIncludedPage,
});

function ServicesIncludedPage() {
  const [rows, setRows] = useState<IncludedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("value")
      .eq("scope", INCLUDED_SCOPE)
      .eq("key", INCLUDED_KEY)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRows(parseIncludedRows(data?.value) ?? DEFAULT_INCLUDED_ROWS);
      });
  }, []);

  function flash(msg: string) {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2500);
  }

  function update(next: IncludedRow[]) {
    setRows(next);
  }

  function toggle(index: number, key: IncludedServiceKey) {
    if (!rows) return;
    update(
      rows.map((r, i) =>
        i !== index
          ? r
          : {
              ...r,
              services: r.services.includes(key)
                ? r.services.filter((s) => s !== key)
                : INCLUDED_SERVICE_KEYS.filter((s) => s === key || r.services.includes(s)),
            },
      ),
    );
  }

  function move(index: number, dir: -1 | 1) {
    if (!rows) return;
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  async function save() {
    if (!rows) return;
    const clean = rows
      .map((r) => ({ label: r.label.trim(), services: r.services }))
      .filter((r) => r.label);
    if (!clean.length) return setError("Add at least one line item before saving.");
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("site_content")
      .upsert(
        { scope: INCLUDED_SCOPE, key: INCLUDED_KEY, value: clean },
        { onConflict: "scope,key" },
      );
    setSaving(false);
    if (error) return setError(error.message);
    setRows(clean);
    flash("Saved — the services page is updated.");
  }

  return (
    <>
      <AdminPageHeader
        title="What's included"
        description="The comparison matrix on the services page. Check the services each line item is part of."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => update(DEFAULT_INCLUDED_ROWS)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              <RotateCcw className="h-4 w-4" /> Reset to defaults
            </button>
            <button
              onClick={save}
              disabled={saving || !rows}
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {status && (
        <div className="mb-4 rounded-xl border border-laurel/40 bg-laurel/5 p-3 text-sm text-laurel">
          {status}
        </div>
      )}

      <SectionCard
        title="Line items"
        description="Each row shows on /services as a feature with a check or cross per service."
      >
        {!rows ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {/* Desktop grid */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Line item
                    </th>
                    {INCLUDED_SERVICE_KEYS.map((k) => (
                      <th key={k} className="p-3 text-xs font-bold text-muted-foreground">
                        {INCLUDED_SERVICE_TITLES[k]}
                      </th>
                    ))}
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <span className="flex flex-col">
                            <button
                              onClick={() => move(i, -1)}
                              className="px-1 text-muted-foreground hover:text-foreground"
                              aria-label="Move up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => move(i, 1)}
                              className="px-1 text-muted-foreground hover:text-foreground"
                              aria-label="Move down"
                            >
                              ▼
                            </button>
                          </span>
                          <input
                            value={row.label}
                            onChange={(e) =>
                              update(rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))
                            }
                            className={`${inputClass} min-w-[240px]`}
                          />
                        </div>
                      </td>
                      {INCLUDED_SERVICE_KEYS.map((k) => (
                        <td key={k} className="p-3 text-center">
                          <button
                            onClick={() => toggle(i, k)}
                            aria-label={`${row.label} — ${INCLUDED_SERVICE_TITLES[k]}`}
                            aria-pressed={row.services.includes(k)}
                            className={`inline-grid h-8 w-8 place-items-center rounded-full border ${
                              row.services.includes(k)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {row.services.includes(k) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      ))}
                      <td className="p-3 text-right">
                        <button
                          onClick={() => update(rows.filter((_, j) => j !== i))}
                          className="rounded-full border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete line item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-4 md:hidden">
              {rows.map((row, i) => (
                <li key={i} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      value={row.label}
                      onChange={(e) =>
                        update(rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))
                      }
                      className={inputClass}
                    />
                    <button
                      onClick={() => update(rows.filter((_, j) => j !== i))}
                      className="rounded-full border border-border p-2 text-muted-foreground"
                      aria-label="Delete line item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {INCLUDED_SERVICE_KEYS.map((k) => (
                      <button
                        key={k}
                        onClick={() => toggle(i, k)}
                        aria-pressed={row.services.includes(k)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          row.services.includes(k)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {INCLUDED_SERVICE_TITLES[k]}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <button onClick={() => move(i, -1)} className="rounded-full border border-border px-3 py-1">
                      Move up
                    </button>
                    <button onClick={() => move(i, 1)} className="rounded-full border border-border px-3 py-1">
                      Move down
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={() => update([...(rows ?? []), { label: "New line item", services: [] }])}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              <Plus className="h-4 w-4" /> Add line item
            </button>
          </>
        )}
      </SectionCard>
    </>
  );
}
