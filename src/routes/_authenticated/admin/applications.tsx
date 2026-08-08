import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendApplicantFollowup } from "@/lib/careers.functions";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  Drawer,
  DetailRow,
  EmptyState,
  StatusPicker,
  StatusPill,
  downloadCSV,
  inputClass,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  head: () => ({
    meta: [
      { title: "Admin — Applications | Magnolia Maids" },
      { name: "description", content: "Review and move cleaner applications through hiring." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApplicationsPage,
});

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  role: string;
  availability: string;
  experience: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "screening", "interview", "offer", "hired", "rejected"] as const;

const STATUS_STYLES: Record<string, string> = {
  new: "bg-laurel/10 text-laurel border border-laurel/30",
  screening: "bg-amber-100 text-amber-900 border border-amber-300",
  interview: "bg-sky-100 text-sky-900 border border-sky-300",
  offer: "bg-violet-100 text-violet-900 border border-violet-300",
  hired: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  rejected: "bg-secondary text-muted-foreground border border-border",
};

function ApplicationsPage() {
  const [rows, setRows] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingNotes, setSavingNotes] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [sentNote, setSentNote] = useState<string | null>(null);
  const sendFollowup = useServerFn(sendApplicantFollowup);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      setRows(data as Application[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${r.name} ${r.email} ${r.phone} ${r.area} ${r.role}`.toLowerCase().includes(q);
    });
  }, [rows, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows?.length ?? 0 };
    STATUSES.forEach((s) => (c[s] = rows?.filter((r) => r.status === s).length ?? 0));
    return c;
  }, [rows]);

  const selected = useMemo(
    () => rows?.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("job_applications").update({ status }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
  }

  async function saveNotes(id: string, admin_notes: string) {
    setSavingNotes(true);
    const { error } = await supabase.from("job_applications").update({ admin_notes }).eq("id", id);
    setSavingNotes(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, admin_notes } : r)) ?? null);
  }

  async function emailApplicant(
    id: string,
    templateId: "facebook-hiring-followup" | "careers-candidate",
  ) {
    setSending(templateId);
    setSentNote(null);
    setError(null);
    try {
      const res = await sendFollowup({ data: { id, templateId } });
      setSentNote(`Sent to ${res.email}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send that email");
    } finally {
      setSending(null);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Applications"
        description="Cleaner applications from the Careers page, with a hiring pipeline."
        actions={
          <button
            onClick={() =>
              downloadCSV(
                "applications",
                ["created_at","name","email","phone","area","role","availability","status","experience","notes","admin_notes"],
                filtered as unknown as Record<string, unknown>[],
              )
            }
            disabled={!filtered.length}
            className="tap-target rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            Export CSV ({filtered.length})
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`tap-target rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-secondary"
            }`}
          >
            {s} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email, area, role…"
        className={`${inputClass} mt-4 max-w-md`}
      />

      {!rows ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading applications…</p>
      ) : !filtered.length ? (
        <div className="mt-6">
          <EmptyState
            title="No applications yet"
            hint="Applications submitted on /about/careers land here automatically."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="cursor-pointer border-t border-border/60 hover:bg-secondary/40"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="px-4 py-3">{r.role}</td>
                  <td className="px-4 py-3">{r.area}</td>
                  <td className="px-4 py-3 text-xs">{r.availability}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} styles={STATUS_STYLES} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Drawer
          eyebrow="Application"
          title={selected.name}
          subtitle={new Date(selected.created_at).toLocaleString()}
          onClose={() => setSelectedId(null)}
        >
          <StatusPicker
            value={selected.status}
            options={STATUSES}
            onChange={(s) => updateStatus(selected.id, s)}
          />
          <dl>
            <DetailRow label="Email">
              <a className="underline" href={`mailto:${selected.email}`}>{selected.email}</a>
            </DetailRow>
            <DetailRow label="Phone">
              <a className="underline" href={`tel:${selected.phone}`}>{selected.phone}</a>
            </DetailRow>
            <DetailRow label="Role">{selected.role}</DetailRow>
            <DetailRow label="Area">{selected.area}</DetailRow>
            <DetailRow label="Availability">{selected.availability}</DetailRow>
            {selected.experience && <DetailRow label="Experience">{selected.experience}</DetailRow>}
            {selected.notes && <DetailRow label="Notes">{selected.notes}</DetailRow>}
          </dl>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Internal notes
            </label>
            <textarea
              key={selected.id}
              defaultValue={selected.admin_notes ?? ""}
              rows={4}
              onBlur={(e) => saveNotes(selected.id, e.target.value)}
              placeholder="Interview notes, references, scheduling…"
              className={`${inputClass} mt-1.5`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {savingNotes ? "Saving…" : "Saves when you click outside the box."}
            </p>
          </div>
        </Drawer>
      )}
    </>
  );
}