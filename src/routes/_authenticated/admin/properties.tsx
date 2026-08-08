import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  StatCard,
  StatusPill,
  StatusPicker,
  Drawer,
  DetailRow,
  EmptyState,
  downloadCSV,
} from "@/components/admin/ui";
import { sourceLabel } from "@/lib/attribution";

export const Route = createFileRoute("/_authenticated/admin/properties")({
  head: () => ({
    meta: [
      { title: "Admin — Property Turnovers | Magnolia Maids" },
      { name: "description", content: "Apartment and property management turnover inquiries." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PropertiesPage,
});

type Inquiry = {
  id: string;
  property_name: string;
  property_address: string | null;
  total_units: number | null;
  units_studio: number;
  units_1bd: number;
  units_2bd: number;
  units_3bd_plus: number;
  turns_per_month: string | null;
  turnaround: string | null;
  access_method: string | null;
  needs_trash_out: boolean;
  needs_carpet_care: boolean;
  start_date: string | null;
  contact_name: string;
  contact_role: string | null;
  company: string | null;
  email: string;
  phone: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
};

const STATUSES = ["new", "contacted", "walkthrough", "proposal_sent", "won", "lost"] as const;

const STATUS_STYLES: Record<string, string> = {
  new: "bg-primary text-primary-foreground",
  contacted: "bg-brass/20 text-foreground border border-border",
  walkthrough: "bg-sage/30 text-foreground border border-border",
  proposal_sent: "bg-brass/30 text-foreground border border-border",
  won: "bg-laurel text-white",
  lost: "bg-secondary text-muted-foreground border border-border",
};

function unitMix(r: Inquiry) {
  const parts = [
    r.units_studio ? `${r.units_studio} studio` : null,
    r.units_1bd ? `${r.units_1bd}×1bd` : null,
    r.units_2bd ? `${r.units_2bd}×2bd` : null,
    r.units_3bd_plus ? `${r.units_3bd_plus}×3bd+` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function PropertiesPage() {
  const [rows, setRows] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const selected = useMemo(() => rows?.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("property_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      setRows(data as Inquiry[]);
    })();
  }, []);

  useEffect(() => {
    setNoteDraft(selected?.admin_notes ?? "");
  }, [selectedId, selected?.admin_notes]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const hay =
          `${r.property_name} ${r.company ?? ""} ${r.contact_name} ${r.email} ${r.phone ?? ""} ${r.property_address ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows?.length ?? 0 };
    STATUSES.forEach((s) => (c[s] = rows?.filter((r) => r.status === s).length ?? 0));
    return c;
  }, [rows]);

  const totalUnits = useMemo(
    () => (rows ?? []).reduce((sum, r) => sum + (r.total_units ?? 0), 0),
    [rows],
  );

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("property_inquiries").update({ status }).eq("id", id);
    if (error) return setError(error.message);
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
  }

  async function saveNote(id: string) {
    setSavingNote(true);
    const { error } = await supabase
      .from("property_inquiries")
      .update({ admin_notes: noteDraft || null })
      .eq("id", id);
    setSavingNote(false);
    if (error) return setError(error.message);
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, admin_notes: noteDraft || null } : r)) ?? null);
  }

  function exportCSV() {
    const headers = [
      "created_at", "property_name", "company", "contact_name", "email", "phone",
      "property_address", "total_units", "units_studio", "units_1bd", "units_2bd",
      "units_3bd_plus", "turns_per_month", "turnaround", "access_method",
      "needs_trash_out", "needs_carpet_care", "start_date", "status", "notes",
      "utm_source", "utm_medium", "utm_campaign", "landing_path",
    ];
    downloadCSV("property-inquiries", headers, filtered as unknown as Record<string, unknown>[]);
  }

  return (
    <>
      <AdminPageHeader
        title="Property turnovers"
        description="Apartment complexes, rental portfolios, and property managers requesting unit-turn proposals."
        actions={
          <button
            onClick={exportCSV}
            disabled={!filtered.length}
            className="tap-target rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            Export CSV ({filtered.length})
          </button>
        }
      />

      {error && (
        <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Inquiries" value={counts.all} hint="All time" />
        <StatCard label="Open" value={(counts.new ?? 0) + (counts.contacted ?? 0)} tone="accent" hint="New + contacted" />
        <StatCard label="Units represented" value={totalUnits} hint="Sum of reported unit counts" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`tap-target rounded-full px-4 py-2 text-xs font-semibold transition ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <input
        placeholder="Search property, company, contact…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Units</th>
              <th className="px-4 py-3">Turns / mo</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="cursor-pointer border-t border-border/50 hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.property_name}</div>
                  <div className="text-xs text-muted-foreground">{r.company || r.property_address || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{r.contact_name}</div>
                  <div className="text-xs text-muted-foreground">{r.phone || r.email}</div>
                </td>
                <td className="px-4 py-3 tabular-nums">{r.total_units ?? "—"}</td>
                <td className="px-4 py-3">{r.turns_per_month || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{sourceLabel(r.utm_source)}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} styles={STATUS_STYLES} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && !filtered.length && (
          <div className="p-6">
            <EmptyState
              title="No property inquiries yet"
              hint="Requests from the Apartment & Property Turnovers page land here."
            />
          </div>
        )}
      </div>

      {selected && (
        <Drawer
          title={selected.property_name}
          eyebrow="Property turnover inquiry"
          subtitle={`${selected.contact_name}${selected.company ? ` · ${selected.company}` : ""}`}
          onClose={() => setSelectedId(null)}
        >
          <div className="space-y-5">
            <StatusPicker
              value={selected.status}
              options={STATUSES}
              onChange={(next) => updateStatus(selected.id, next)}
            />

            <div className="space-y-1">
              <DetailRow label="Address">{selected.property_address || "—"}</DetailRow>
              <DetailRow label="Total units">{selected.total_units ?? "—"}</DetailRow>
              <DetailRow label="Unit mix">{unitMix(selected)}</DetailRow>
              <DetailRow label="Turns per month">{selected.turns_per_month || "—"}</DetailRow>
              <DetailRow label="Turnaround">{selected.turnaround || "—"}</DetailRow>
              <DetailRow label="Access">{selected.access_method || "—"}</DetailRow>
              <DetailRow label="Trash-out">{selected.needs_trash_out ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Carpet care">{selected.needs_carpet_care ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Target start">{selected.start_date || "—"}</DetailRow>
              <DetailRow label="Role">{selected.contact_role || "—"}</DetailRow>
              <DetailRow label="Email">
                <a className="underline" href={`mailto:${selected.email}`}>{selected.email}</a>
              </DetailRow>
              <DetailRow label="Phone">
                {selected.phone ? <a className="underline" href={`tel:${selected.phone}`}>{selected.phone}</a> : "—"}
              </DetailRow>
              <DetailRow label="Notes">{selected.notes || "—"}</DetailRow>
              <DetailRow label="Source">{sourceLabel(selected.utm_source)}</DetailRow>
              <DetailRow label="Landing page">{selected.landing_path || "—"}</DetailRow>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Internal notes
              </label>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
                placeholder="Walk-through date, per-unit rate quoted, decision maker…"
              />
              <button
                onClick={() => saveNote(selected.id)}
                disabled={savingNote}
                className="tap-target mt-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {savingNote ? "Saving…" : "Save notes"}
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}
