import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Briefcase,
  CalendarCheck,
  Mail,
  MessageSquare,
  PhoneCall,
  Search,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  addHubPersonNote,
  getHubPerson,
  listHubPeople,
  sendHubEmail,
  setHubPersonStatus,
} from "@/lib/hub/people.functions";
import { sendHubText } from "@/lib/hub/hub.functions";
import { queueOutboundCall } from "@/lib/outbound-calls.functions";
import { OUTBOUND_AGENT_ID } from "@/lib/agents";
import type { HubPerson, HubPersonKind } from "@/lib/hub/hub-types";
import { inputClass } from "@/components/admin/ui";

const KINDS: { key: HubPersonKind | "all"; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "lead", label: "Leads" },
  { key: "booking", label: "Bookings" },
  { key: "applicant", label: "Applicants" },
  { key: "client", label: "Clients" },
];

const KIND_ICON = {
  lead: Sparkles,
  booking: CalendarCheck,
  applicant: Briefcase,
  client: UserRound,
} as const;

const STATUSES: Record<HubPersonKind, readonly string[]> = {
  lead: ["new", "contacted", "booked", "closed"],
  booking: ["new", "contacted", "scheduled", "completed", "cancelled"],
  applicant: ["new", "screening", "interview", "offer", "hired", "rejected"],
  client: [],
};

const TABLE_BY_KIND: Record<HubPersonKind, string> = {
  lead: "campaign_leads",
  booking: "booking_requests",
  applicant: "job_applications",
  client: "customer_profiles",
};

function when(at: string) {
  return new Date(at).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Leads, bookings, applicants and clients — with call / text / email in reach. */
export function HubPeople({ wide }: { wide?: boolean }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listHubPeople);
  const [kind, setKind] = useState<HubPersonKind | "all">("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<HubPerson | null>(null);

  const people = useQuery({
    queryKey: ["hub", "people", kind, search],
    queryFn: () => listFn({ data: { kind, search: search || undefined, limit: 60 } }),
  });

  const listPane = (
    <div className="p-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={`${inputClass} pl-9`}
          placeholder="Search people"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search people"
        />
      </label>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKind(k.key)}
            aria-pressed={kind === k.key}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              kind === k.key
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-secondary"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <ul className="mt-3 space-y-2">
        {people.isLoading && <li className="p-3 text-sm text-muted-foreground">Loading…</li>}
        {people.data && people.data.people.length === 0 && (
          <li className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
            Nobody matches that yet.
          </li>
        )}
        {(people.data?.people ?? []).map((p) => {
          const Icon = KIND_ICON[p.kind];
          return (
            <li key={`${p.kind}-${p.id}`}>
              <button
                onClick={() => setOpen(p)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left hover:bg-secondary/60 ${
                  open?.id === p.id && open?.kind === p.kind
                    ? "border-primary bg-secondary"
                    : "border-border bg-background"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{p.name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{when(p.at)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {p.summary || p.email || p.phone || "—"}
                  </span>
                </span>
                {p.status && (
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    {p.status}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const detail = open ? (
    <PersonDetail
      key={`${open.kind}-${open.id}`}
      person={open}
      wide={wide}
      onClose={() => setOpen(null)}
      onChanged={() => qc.invalidateQueries({ queryKey: ["hub", "people"] })}
    />
  ) : null;

  if (wide) {
    return (
      <div className="grid h-full min-h-0 grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto border-r border-border">{listPane}</div>
        <div className="min-h-0 overflow-y-auto">
          {detail ?? (
            <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground">
              Pick someone to call, text, email, or update.
            </div>
          )}
        </div>
      </div>
    );
  }

  return detail ?? listPane;
}

function PersonDetail({
  person,
  wide,
  onClose,
  onChanged,
}: {
  person: HubPerson;
  wide?: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const loadFn = useServerFn(getHubPerson);
  const textFn = useServerFn(sendHubText);
  const emailFn = useServerFn(sendHubEmail);
  const statusFn = useServerFn(setHubPersonStatus);
  const noteFn = useServerFn(addHubPersonNote);
  const callFn = useServerFn(queueOutboundCall);

  const [tab, setTab] = useState<"text" | "email" | "note">("text");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ["hub", "person", person.kind, person.id],
    queryFn: () => loadFn({ data: { kind: person.kind, id: person.id } }),
  });

  const d = detail.data;
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["hub", "person", person.kind, person.id] });
    onChanged();
  };

  const textMut = useMutation({
    mutationFn: () => textFn({ data: { to: d!.phone!, body: text.trim(), allowUnknown: true } }),
    onSuccess: (res) => {
      const ok = (res as { sent?: boolean }).sent !== false;
      setFlash(ok ? "Text sent." : `Not sent — ${(res as { reason?: string }).reason ?? "unknown"}`);
      if (ok) setText("");
      refresh();
    },
    onError: (e) => setFlash(e instanceof Error ? e.message : "Text failed."),
  });

  const emailMut = useMutation({
    mutationFn: () =>
      emailFn({
        data: {
          to: d!.email!,
          subject: subject.trim(),
          body: emailBody.trim(),
          name: d!.name,
          recordTable: TABLE_BY_KIND[person.kind],
          recordId: person.id,
        },
      }),
    onSuccess: () => {
      setFlash("Email sent.");
      setSubject("");
      setEmailBody("");
      refresh();
    },
    onError: (e) => setFlash(e instanceof Error ? e.message : "Email failed."),
  });

  const noteMut = useMutation({
    mutationFn: () => noteFn({ data: { kind: person.kind, id: person.id, note: note.trim() } }),
    onSuccess: () => {
      setFlash("Note saved.");
      setNote("");
      refresh();
    },
    onError: (e) => setFlash(e instanceof Error ? e.message : "Couldn't save that note."),
  });

  const statusMut = useMutation({
    mutationFn: (status: string) =>
      statusFn({ data: { kind: person.kind as "lead" | "booking" | "applicant", id: person.id, status } }),
    onSuccess: () => {
      setFlash("Status updated.");
      refresh();
    },
    onError: (e) => setFlash(e instanceof Error ? e.message : "Couldn't update status."),
  });

  const callMut = useMutation({
    mutationFn: () =>
      callFn({
        data: {
          contactName: d!.name,
          phone: d!.phone!,
          email: d!.email ?? "",
          purpose: person.kind === "applicant" ? "applicant_followup" : "general_followup",
          contextNote: `Queued from the communications hub (${person.kind}).`,
          agentId: OUTBOUND_AGENT_ID,
          sourceTable: TABLE_BY_KIND[person.kind],
          sourceId: person.id,
        },
      }),
    onSuccess: () => {
      setFlash("Maggie will call them shortly.");
      refresh();
    },
    onError: (e) => setFlash(e instanceof Error ? e.message : "Couldn't queue that call."),
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {detail.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {detail.isError && (
          <p className="text-sm text-destructive">Couldn't load that record.</p>
        )}
        {d && (
          <>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="font-display text-lg font-semibold">{d.name}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                {d.kind}
                {d.status ? ` · ${d.status}` : ""}
                {d.contactPref ? ` · prefers ${d.contactPref}` : ""}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {[d.phone, d.email].filter(Boolean).join(" · ") || "No contact details on file"}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <a
                  href={d.phone ? `tel:${d.phone}` : undefined}
                  aria-disabled={!d.phone}
                  className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${
                    d.phone
                      ? "bg-primary text-primary-foreground"
                      : "pointer-events-none bg-secondary text-muted-foreground"
                  }`}
                >
                  <PhoneCall className="h-3.5 w-3.5" /> Call
                </a>
                <button
                  type="button"
                  disabled={!d.phone || callMut.isPending}
                  onClick={() => callMut.mutate()}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-bold text-primary disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Maggie call
                </button>
                <button
                  type="button"
                  disabled={!d.phone}
                  onClick={() => setTab("text")}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-bold text-primary disabled:opacity-50"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Text
                </button>
                <button
                  type="button"
                  disabled={!d.email}
                  onClick={() => setTab("email")}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-bold text-primary disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>
              </div>

              {STATUSES[d.kind].length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {STATUSES[d.kind].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => statusMut.mutate(s)}
                      disabled={statusMut.isPending}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        d.status === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {flash && <p className="mt-2 text-xs font-semibold text-primary">{flash}</p>}
            </div>

            {/* Composer */}
            <div className="rounded-2xl border border-border bg-background p-3">
              <div className="flex gap-1.5">
                {(["text", "email", "note"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      tab === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === "text" && (
                <form
                  className="mt-2 flex items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (text.trim() && d.phone) textMut.mutate();
                  }}
                >
                  <textarea
                    rows={2}
                    className={`${inputClass} resize-none`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={d.phone ? "Text them…" : "No phone number on file"}
                    disabled={!d.phone}
                    aria-label="Text message"
                  />
                  <button
                    className="rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-50"
                    disabled={!d.phone || textMut.isPending}
                    aria-label="Send text"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}

              {tab === "email" && (
                <form
                  className="mt-2 space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (subject.trim() && emailBody.trim() && d.email) emailMut.mutate();
                  }}
                >
                  <input
                    className={inputClass}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                    disabled={!d.email}
                    aria-label="Email subject"
                  />
                  <textarea
                    rows={4}
                    className={`${inputClass} resize-none`}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder={d.email ? "Write your message…" : "No email on file"}
                    disabled={!d.email}
                    aria-label="Email body"
                  />
                  <button
                    className="w-full rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    disabled={!d.email || emailMut.isPending}
                  >
                    {emailMut.isPending ? "Sending…" : "Send email"}
                  </button>
                </form>
              )}

              {tab === "note" && (
                <form
                  className="mt-2 space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (note.trim()) noteMut.mutate();
                  }}
                >
                  <textarea
                    rows={3}
                    className={`${inputClass} resize-none`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What happened on this contact?"
                    aria-label="Internal note"
                  />
                  <button
                    className="w-full rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    disabled={noteMut.isPending}
                  >
                    Save note
                  </button>
                </form>
              )}
            </div>

            {d.fields.length > 0 && (
              <div className="rounded-2xl border border-border bg-background p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Record
                </p>
                <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {d.fields.map((f) => (
                    <div key={f.label} className="min-w-0">
                      <dt className="text-[11px] capitalize text-muted-foreground">{f.label}</dt>
                      <dd className="truncate text-sm">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                History
              </p>
              <ul className="mt-2 space-y-2">
                {d.calls.map((c) => (
                  <li key={c.id} className="flex gap-2 text-sm">
                    <PhoneCall className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate">
                        {c.purpose.replace(/_/g, " ")} — {c.outcome || c.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{when(c.at)}</span>
                    </span>
                  </li>
                ))}
                {d.activity.map((a) => (
                  <li key={a.id} className="flex gap-2 text-sm">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block break-words">{a.summary}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {a.event.replace(/_/g, " ")} · {when(a.at)}
                      </span>
                    </span>
                  </li>
                ))}
                {d.threads.map((t) => (
                  <li key={t.id} className="flex gap-2 text-sm">
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate">
                        {t.channel}: {t.snippet || "—"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{when(t.at)}</span>
                    </span>
                  </li>
                ))}
                {d.calls.length + d.activity.length + d.threads.length === 0 && (
                  <li className="text-sm text-muted-foreground">No outreach yet.</li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>

      <button
        onClick={onClose}
        className="border-t border-border bg-background py-2 text-xs font-bold text-primary"
      >
        {wide ? "Close" : "Back to people"}
      </button>
    </div>
  );
}
