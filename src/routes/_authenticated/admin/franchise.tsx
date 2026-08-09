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

export const Route = createFileRoute("/_authenticated/admin/franchise")({
  head: () => ({
    meta: [
      { title: "Admin — Franchise Interest | Magnolia Maids" },
      { name: "description", content: "Franchise ownership candidate pipeline." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FranchiseAdminPage,
});

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  target_city: string | null;
  target_state: string | null;
  timeline: string | null;
  capital_band: string | null;
  background: string | null;
  why: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: string;
  source: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
};

const STATUSES = ["new", "contacted", "intro_call", "discovery", "qualified", "not_a_fit"] as const;

const STATUS_STYLES: Record<string, string> = {
  new: "bg-primary text-primary-foreground",
  contacted: "bg-brass/20 text-foreground border border-border",
  intro_call: "bg-sage/30 text-foreground border border-border",
  discovery: "bg-brass/30 text-foreground border border-border",
  qualified: "bg-laurel text-white",
  not_a_fit: "bg-secondary text-muted-foreground border border-border",
};

function market(r: Inquiry) {
  return [r.target_city, r.target_state].filter(Boolean).join(", ") || "—";
}

function FranchiseAdminPage() {
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
        .from("franchise_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      setRows(data as unknown as Inquiry[]);
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
        const hay = `${r.name} ${r.email} ${r.phone ?? ""} ${r.target_city ?? ""} ${r.target_state ?? ""}`.toLowerCase();
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

  const markets = useMemo(
    () => new Set((rows ?? []).map((r) => market(r)).filter((m) => m !== "—")).size,
    [rows],
  );

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("franchise_inquiries").update({ status }).eq("id", id);
    if (error) return setError(error.message);
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
  }

  async function saveNote(id: string) {
    setSavingNote(true);
    const { error } = await supabase
      .from("franchise_inquiries")
      .update({ admin_notes: noteDraft || null })
      .eq("id", id);
    setSavingNote(false);
    if (error) return setError(error.message);
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, admin_notes: noteDraft || null } : r)) ?? null);
  }

  function exportCSV() {
    const headers = [
      "created_at", "name", "email", "phone", "target_city", "target_state",
      "timeline", "capital_band", "background", "why", "status", "notes",
      "utm_source", "utm_medium", "utm_campaign", "landing_path",
    ];
    downloadCSV("franchise-inquiries", headers, filtered as unknown as Record<string, unknown>[]);
  }

  return (
    <>
      <AdminPageHeader
        title="Franchise interest"
        description="Ownership candidates who registered early interest. No FDD exists yet — do not quote fees, investment, or earnings."
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

      <div className="mt-6 rounded-xl border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-foreground">
        <strong>Pre-offer stage.</strong> Conversations only — background, market, and motivation. Any numbers must wait
        for a Franchise Disclosure Document.
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Candidates" value={counts.all} hint="All time" />
        <StatCard label="Open" value={(counts.new ?? 0) + (counts.contacted ?? 0)} tone="accent" hint="New + contacted" />
        <StatCard label="Distinct markets" value={markets} hint="City / state combinations" />
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
            {s === "all" ? "All" : s.replace(/_/g, " ")} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <input
        placeholder="Search name, email, market…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Market</th>
              <th className="px-4 py-3">Timeline</th>
              <th className="px-4 py-3">Capital</th>
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
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.phone || r.email}</div>
                </td>
                <td className="px-4 py-3">{market(r)}</td>
                <td className="px-4 py-3">{r.timeline || "—"}</td>
                <td className="px-4 py-3">{r.capital_band || "—"}</td>
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
              title="No franchise inquiries yet"
              hint="Submissions from the /franchise interest page land here."
            />
          </div>
        )}
      </div>

      {selected && (
        <Drawer
          title={selected.name}
          eyebrow="Franchise candidate"
          subtitle={market(selected)}
          onClose={() => setSelectedId(null)}
        >
          <div className="space-y-5">
            <StatusPicker
              value={selected.status}
              options={STATUSES}
              onChange={(next) => updateStatus(selected.id, next)}
            />

            <div className="space-y-1">
              <DetailRow label="Email">
                <a className="underline" href={`mailto:${selected.email}`}>{selected.email}</a>
              </DetailRow>
              <DetailRow label="Phone">
                {selected.phone ? <a className="underline" href={`tel:${selected.phone}`}>{selected.phone}</a> : "—"}
              </DetailRow>
              <DetailRow label="Market">{market(selected)}</DetailRow>
              <DetailRow label="Timeline">{selected.timeline || "—"}</DetailRow>
              <DetailRow label="Capital">{selected.capital_band || "—"}</DetailRow>
              <DetailRow label="Background">{selected.background || "—"}</DetailRow>
              <DetailRow label="Why Magnolia Maids">{selected.why || "—"}</DetailRow>
              <DetailRow label="Return submissions">{selected.notes || "—"}</DetailRow>
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
                placeholder="Call notes, market fit, follow-up date…"
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
