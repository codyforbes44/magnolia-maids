import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  Drawer,
  DetailRow,
  EmptyState,
  SectionCard,
  StatCard,
  inputClass,
  downloadCSV,
} from "@/components/admin/ui";
import { AGENTS } from "@/lib/agents";
import {
  listOutboundCalls,
  queueOutboundCall,
  updateOutboundCall,
  dialOutboundCallNow,
  listCallOptOuts,
  addCallOptOut,
  removeCallOptOut,
} from "@/lib/outbound-calls.functions";

export const Route = createFileRoute("/_authenticated/admin/calls")({
  head: () => ({
    meta: [
      { title: "Admin — Outbound calls | Magnolia Maids" },
      { name: "description", content: "Queue, assign, and review Maggie's outbound follow-up calls." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallsPage,
});

const PURPOSES = [
  { value: "lead_followup", label: "New lead follow-up" },
  { value: "quote_followup", label: "Quote follow-up" },
  { value: "booking_confirm", label: "Confirm a booking" },
  { value: "reschedule", label: "Reschedule / change request" },
  { value: "applicant_screen", label: "Applicant screening" },
  { value: "property_followup", label: "Property / turnover follow-up" },
  { value: "win_back", label: "Win-back / check-in" },
  { value: "general_followup", label: "General follow-up" },
];

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-amber-100 text-amber-900",
  scheduled: "bg-sky-100 text-sky-900",
  calling: "bg-primary/15 text-primary",
  completed: "bg-emerald-100 text-emerald-900",
  no_answer: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

type CallRow = Record<string, any>;

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function purposeLabel(value: string) {
  return PURPOSES.find((p) => p.value === value)?.label ?? value;
}

function Pill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function CallsPage() {
  const fetchCalls = useServerFn(listOutboundCalls);
  const createCall = useServerFn(queueOutboundCall);
  const patchCall = useServerFn(updateOutboundCall);
  const dialNow = useServerFn(dialOutboundCallNow);
  const fetchOptOuts = useServerFn(listCallOptOuts);
  const optOut = useServerFn(addCallOptOut);
  const unOptOut = useServerFn(removeCallOptOut);

  const [tab, setTab] = useState<"queue" | "history" | "new" | "optouts">("queue");
  const [rows, setRows] = useState<CallRow[] | null>(null);
  const [optOuts, setOptOuts] = useState<CallRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detail, setDetail] = useState<CallRow | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [calls, outs] = await Promise.all([
        fetchCalls({ data: {} }),
        fetchOptOuts({ data: undefined as never }),
      ]);
      setRows(calls as CallRow[]);
      setOptOuts(outs as CallRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load calls.");
    } finally {
      setBusy(false);
    }
  }, [fetchCalls, fetchOptOuts]);

  useEffect(() => {
    void load();
  }, [load]);

  const queue = useMemo(
    () => (rows ?? []).filter((r) => ["queued", "scheduled", "calling"].includes(r["status"])),
    [rows],
  );
  const history = useMemo(
    () => (rows ?? []).filter((r) => !["queued", "scheduled", "calling"].includes(r["status"])),
    [rows],
  );
  const completed = useMemo(() => (rows ?? []).filter((r) => r["status"] === "completed"), [rows]);

  async function handleDial(id: string) {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const res: any = await dialNow({ data: { id } });
      if (res.ok) {
        setNotice(res.outsideWindow ? "Dialing now (note: outside the 8am–8pm window)." : "Maggie is dialing now.");
      } else {
        setError(res.error ?? `Call not placed (${res.reason}).`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dial failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStatus(id: string, status: string) {
    setBusy(true);
    try {
      await patchCall({ data: { id, status } });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Outbound calls"
        description="Queue Maggie to call leads, clients, and applicants. Calls dial from (580) 745-0045 between 8am and 8pm Central."
        actions={
          <button
            onClick={() =>
              downloadCSV(
                "outbound-calls.csv",
                ["contact_name", "phone_e164", "purpose", "status", "outcome", "attempts", "created_at"],
                rows ?? [],
              )
            }
            className="tap-target rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Export CSV
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="In queue" value={String(queue.length)} />
        <StatCard label="Completed" value={String(completed.length)} />
        <StatCard label="All time" value={String((rows ?? []).length)} />
        <StatCard label="Do not call" value={String((optOuts ?? []).length)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["queue", `Queue (${queue.length})`],
          ["history", "History"],
          ["new", "New call"],
          ["optouts", "Do not call"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`tap-target rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === value ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {notice && <p className="rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">{notice}</p>}

      {(tab === "queue" || tab === "history") && (
        <SectionCard title={tab === "queue" ? "Waiting to be called" : "Call history"}>
          {rows === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (tab === "queue" ? queue : history).length === 0 ? (
            <EmptyState
              title={tab === "queue" ? "Nothing queued" : "No completed calls yet"}
              hint={tab === "queue" ? "Add a call from the New call tab." : undefined}
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {(tab === "queue" ? queue : history).map((row) => (
                <li key={row["id"]} className="flex flex-wrap items-center gap-3 py-3">
                  <button onClick={() => setDetail(row)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{row["contact_name"]}</span>
                      <Pill status={row["status"]} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row["phone_e164"]} · {purposeLabel(row["purpose"])} ·{" "}
                      {row["scheduled_at"] ? `for ${fmt(row["scheduled_at"])}` : `queued ${fmt(row["created_at"])}`}
                      {row["created_by_label"] === "maggie" ? " · queued by Maggie" : ""}
                    </div>
                  </button>
                  {tab === "queue" && (
                    <div className="flex gap-2">
                      <button
                        disabled={busy}
                        onClick={() => handleDial(row["id"])}
                        className="tap-target rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        Call now
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => handleStatus(row["id"], "cancelled")}
                        className="tap-target rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {tab === "new" && <NewCallForm onCreate={createCall} onDone={() => { setTab("queue"); void load(); }} />}

      {tab === "optouts" && (
        <SectionCard title="Do-not-call list" description="Numbers here are never dialed and queued calls are cancelled automatically.">
          <OptOutForm
            onAdd={async (phone, reason) => {
              await optOut({ data: { phone, reason } });
              await load();
            }}
          />
          <ul className="mt-4 divide-y divide-border/60">
            {(optOuts ?? []).map((o) => (
              <li key={o["phone_e164"]} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <strong>{o["phone_e164"]}</strong>{" "}
                  <span className="text-muted-foreground">{o["reason"] ?? "—"}</span>
                </span>
                <button
                  onClick={async () => {
                    await unOptOut({ data: { phone: o["phone_e164"] } });
                    await load();
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  Remove
                </button>
              </li>
            ))}
            {(optOuts ?? []).length === 0 && <EmptyState title="No opt-outs" />}
          </ul>
        </SectionCard>
      )}

      <Drawer open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.["contact_name"] ?? "Call"}>
        {detail && (
          <div className="space-y-4">
            <DetailRow label="Phone">{detail["phone_e164"]}</DetailRow>
            <DetailRow label="Email">{detail["email"] ?? "—"}</DetailRow>
            <DetailRow label="Purpose">{purposeLabel(detail["purpose"])}</DetailRow>
            <DetailRow label="Status">{detail["status"]}</DetailRow>
            <DetailRow label="Attempts">{String(detail["attempts"])}</DetailRow>
            <DetailRow label="Last attempt">{fmt(detail["last_attempt_at"])}</DetailRow>
            <DetailRow label="Scheduled">{fmt(detail["scheduled_at"])}</DetailRow>
            <DetailRow label="Queued by">{detail["created_by_label"]}</DetailRow>
            <DetailRow label="Context">{detail["context_note"] ?? "—"}</DetailRow>
            <DetailRow label="Outcome">{detail["outcome"] ?? "—"}</DetailRow>
            {detail["transcript_summary"] && (
              <DetailRow label="Summary">{detail["transcript_summary"]}</DetailRow>
            )}
            {detail["error"] && <DetailRow label="Error">{detail["error"]}</DetailRow>}
            <OutcomeEditor
              row={detail}
              onSave={async (patch) => {
                await patchCall({ data: { id: detail["id"], ...patch } });
                setDetail(null);
                await load();
              }}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}

function OutcomeEditor({ row, onSave }: { row: CallRow; onSave: (patch: any) => Promise<void> }) {
  const [status, setStatus] = useState(row["status"] as string);
  const [outcome, setOutcome] = useState((row["outcome"] as string) ?? "");
  const [notes, setNotes] = useState((row["outcome_notes"] as string) ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 p-4">
      <label className="block text-sm font-semibold">Status</label>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
        {["queued", "scheduled", "calling", "completed", "no_answer", "failed", "cancelled"].map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>
      <label className="block text-sm font-semibold">Outcome</label>
      <input value={outcome} onChange={(e) => setOutcome(e.target.value)} className={inputClass} placeholder="Booked, callback later, not interested…" />
      <label className="block text-sm font-semibold">Notes</label>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={inputClass} />
      <button
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await onSave({ status, outcome, outcomeNotes: notes });
          setSaving(false);
        }}
        className="tap-target w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function OptOutForm({ onAdd }: { onAdd: (phone: string, reason: string) => Promise<void> }) {
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!phone) return;
        setBusy(true);
        await onAdd(phone, reason);
        setPhone("");
        setReason("");
        setBusy(false);
      }}
    >
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(580) 555-0100" className={inputClass} />
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className={inputClass} />
      <button disabled={busy} className="tap-target rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        Add
      </button>
    </form>
  );
}

function NewCallForm({ onCreate, onDone }: { onCreate: any; onDone: () => void }) {
  const [form, setForm] = useState({
    contactName: "",
    phone: "",
    email: "",
    purpose: "lead_followup",
    contextNote: "",
    agentId: AGENTS[0].id as string,
    scheduledAt: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <SectionCard title="Queue a new call" description="Maggie will introduce herself, reference the context you give her, and follow the purpose.">
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            await onCreate({ data: form });
            onDone();
          } catch (e2) {
            setErr(e2 instanceof Error ? e2.message : "Couldn't queue the call.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <label className="text-sm font-semibold">Contact name</label>
          <input required value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-semibold">Phone</label>
          <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(580) 555-0100" className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-semibold">Email (optional)</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-semibold">Purpose</label>
          <select value={form.purpose} onChange={(e) => set("purpose", e.target.value)} className={inputClass}>
            {PURPOSES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold">Agent</label>
          <select value={form.agentId} onChange={(e) => set("agentId", e.target.value)} className={inputClass}>
            {AGENTS.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold">Call at (optional)</label>
          <input type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-semibold">What should Maggie know?</label>
          <textarea
            rows={4}
            value={form.contextNote}
            onChange={(e) => set("contextNote", e.target.value)}
            placeholder="Requested a deep clean quote for a 4/2 in Durant on Tuesday; wants pricing and to book."
            className={inputClass}
          />
        </div>
        {err && <p className="md:col-span-2 text-sm text-destructive">{err}</p>}
        <div className="md:col-span-2">
          <button disabled={busy} className="tap-target w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 md:w-auto md:px-8">
            {busy ? "Queuing…" : "Add to queue"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
