import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listLeadEmailOptions,
  previewLeadEmail,
  resendCampaignThankYou,
  sendLeadEmail,
  type LeadEmailOption,
} from "@/lib/campaign-leads.functions";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { downloadCSV } from "@/components/admin/ui";
import { sourceLabel } from "@/lib/attribution";
import { QueueCallButton } from "@/components/admin/QueueCallButton";
import { RecordEditor } from "@/components/admin/RecordEditor";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({
    meta: [
      { title: "Admin — Campaign Leads | Magnolia Maids" },
      { name: "description", content: "List, filter, and export Magnolia Maids campaign leads." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadsPage,
});

type Lead = {
  id: string;
  campaign: string;
  name: string;
  email: string;
  phone: string | null;
  home_size: string | null;
  preferred_date: string | null;
  referral_name: string | null;
  message: string | null;
  status: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
};

const STATUSES = ["new", "contacted", "booked", "closed"] as const;

const STATUS_STYLES: Record<string, string> = {
  new: "bg-primary text-primary-foreground",
  contacted: "bg-brass/20 text-foreground border border-border",
  booked: "bg-laurel text-white",
  closed: "bg-secondary text-muted-foreground border border-border",
};

function prettyCampaign(key: string) {
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function LeadsPage() {
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const selected = useMemo(() => rows?.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("campaign_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      setRows(data as Lead[]);
    })();
  }, []);

  const campaigns = useMemo(() => {
    const s = new Set<string>();
    rows?.forEach((r) => s.add(r.campaign));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (campaignFilter !== "all" && r.campaign !== campaignFilter) return false;
      if (fromDate && r.created_at < fromDate) return false;
      if (toDate && r.created_at > toDate + "T23:59:59") return false;
      if (q) {
        const hay = `${r.name} ${r.email} ${r.phone ?? ""} ${r.referral_name ?? ""} ${r.message ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, campaignFilter, fromDate, toDate]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows?.length ?? 0 };
    STATUSES.forEach((s) => (c[s] = rows?.filter((r) => r.status === s).length ?? 0));
    return c;
  }, [rows]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("campaign_leads").update({ status }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
  }

  function exportCSV() {
    const headers = [
      "created_at", "campaign", "name", "email", "phone",
      "home_size", "preferred_date", "referral_name", "status", "message",
      "utm_source", "utm_medium", "utm_campaign", "landing_path",
    ];
    downloadCSV("campaign-leads", headers, filtered as unknown as Record<string, unknown>[]);
  }

  return (
    <>
      <AdminPageHeader
        title="Campaign leads"
        description="Leads captured from Summer on the Lake, Referral Week, Holiday Ready, and Meta Lead Ads."
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

      {(
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {(["all", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`tap-target rounded-full px-4 py-2 text-xs font-semibold transition ${
                    statusFilter === s ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"
                  }`}
                >
                  {s === "all" ? "All" : s} ({counts[s] ?? 0})
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <input
                placeholder="Search name, email, message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:col-span-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
              />
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
              >
                <option value="all">All campaigns</option>
                {campaigns.map((c) => (
                  <option key={c} value={c}>{prettyCampaign(c)}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="date"
                  aria-label="From date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
                />
                <input
                  type="date"
                  aria-label="To date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            {/* Mobile cards */}
            <div className="mt-6 grid gap-3 md:hidden">
              {rows === null && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
              {rows && filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No leads match your filters.</p>
              )}
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="rounded-2xl border border-border/60 bg-card p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[r.status] ?? ""}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {prettyCampaign(r.campaign)} · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-border/60 bg-card md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary/60 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Lead</th>
                    <th className="px-4 py-3 font-semibold">Campaign</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Home</th>
                    <th className="px-4 py-3 font-semibold">Preferred</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows === null && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
                  )}
                  {rows && filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No leads match your filters.</td></tr>
                  )}
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer border-t border-border/60 align-top transition hover:bg-secondary/40 ${
                        selectedId === r.id ? "bg-secondary/60" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-muted-foreground">{r.email}</div>
                        {r.phone && <div className="text-muted-foreground">{r.phone}</div>}
                      </td>
                      <td className="px-4 py-3">{prettyCampaign(r.campaign)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-xs font-semibold">
                          {sourceLabel(r.utm_source)}
                        </span>
                        {r.utm_campaign && (
                          <div className="mt-1 text-xs text-muted-foreground">{r.utm_campaign}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{r.home_size ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{r.preferred_date ?? "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={r.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateStatus(r.id, e.target.value)}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {r.message && <div className="mt-1 text-xs text-muted-foreground">Has message</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      {selected && (
        <LeadDetailPanel
          lead={selected}
          onClose={() => setSelectedId(null)}
          onStatusChange={(status) => updateStatus(selected.id, status)}
          onPatch={(patch) =>
            setRows(
              (prev) =>
                prev?.map((r) => (r.id === selected.id ? ({ ...r, ...patch } as Lead) : r)) ?? null,
            )
          }
        />
      )}
    </>
  );
}

function LeadDetailPanel({
  lead,
  onClose,
  onStatusChange,
  onPatch,
}: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onPatch: (patch: Record<string, string | null>) => void;
}) {
  const resendThankYou = useServerFn(resendCampaignThankYou);
  const loadOptions = useServerFn(listLeadEmailOptions);
  const previewEmail = useServerFn(previewLeadEmail);
  const sendEmail = useServerFn(sendLeadEmail);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [options, setOptions] = useState<LeadEmailOption[]>([]);
  const [templateId, setTemplateId] = useState("instant-quote-followup");
  const [draft, setDraft] = useState({
    subject: "",
    heroTitle: "",
    heroSubtitle: "",
    ctaLabel: "",
    introHtml: "",
    bodyHtml: "",
    footerNote: "",
  });
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    setResult(null);
    setSending(false);
    setPreviewHtml(null);
    setShowEditor(false);
    setDraft({
      subject: "",
      heroTitle: "",
      heroSubtitle: "",
      ctaLabel: "",
      introHtml: "",
      bodyHtml: "",
      footerNote: "",
    });
  }, [lead.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await loadOptions({ data: undefined });
        if (cancelled) return;
        setOptions(rows);
        setTemplateId((cur) => (rows.some((r) => r.id === cur) ? cur : (rows[0]?.id ?? cur)));
      } catch {
        /* selector falls back to the default template */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOptions]);

  const setField = (key: keyof typeof draft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function handlePreview() {
    setPreviewing(true);
    setResult(null);
    try {
      const r = await previewEmail({ data: { id: lead.id, templateId, ...draft } });
      setPreviewSubject(r.subject);
      setPreviewHtml(r.html);
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "Preview failed." });
    } finally {
      setPreviewing(false);
    }
  }

  async function handleResend() {
    setSending(true);
    setResult(null);
    try {
      const res = await resendThankYou({ data: { id: lead.id } });
      setResult({ ok: true, text: `Thank-you email re-sent to ${res.email}.` });
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "Could not send the email." });
    } finally {
      setSending(false);
    }
  }

  async function handleSendTemplate() {
    setSending(true);
    setResult(null);
    try {
      const res = await sendEmail({ data: { id: lead.id, templateId, ...draft } });
      setResult({ ok: true, text: `Email sent to ${res.email}.` });
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "Could not send the email." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close details" onClick={onClose} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border/60 bg-card/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {prettyCampaign(lead.campaign)} lead
            </div>
            <h2 className="font-display text-2xl font-semibold">{lead.name}</h2>
            <div className="mt-1 text-xs text-muted-foreground">
              Received {new Date(lead.created_at).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} className="tap-target rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`tap-target rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    lead.status === s ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact</h3>
            <dl className="mt-2 space-y-1 text-sm">
              <DetailRow label="Email">
                <a href={`mailto:${lead.email}`} className="text-laurel hover:underline">{lead.email}</a>
              </DetailRow>
              <DetailRow label="Phone">
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="text-laurel hover:underline">{lead.phone}</a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </DetailRow>
            </dl>
          </section>
            <div className="mt-3">
              <QueueCallButton
                contactName={lead.name}
                phone={lead.phone}
                email={lead.email}
                purpose="lead_followup"
                context={`Campaign lead (${lead.campaign}). ${lead.message ?? ""}`}
                sourceTable="campaign_leads"
                sourceId={lead.id}
              />
            </div>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Details</h3>
            <dl className="mt-2 space-y-1 text-sm">
              <DetailRow label="Home size">{lead.home_size ?? "—"}</DetailRow>
              <DetailRow label="Preferred date">{lead.preferred_date ?? "—"}</DetailRow>
              <DetailRow label="Referred by">{lead.referral_name ?? "—"}</DetailRow>
              <DetailRow label="Source">{sourceLabel(lead.utm_source)}</DetailRow>
              <DetailRow label="Ad campaign">{lead.utm_campaign ?? "—"}</DetailRow>
              <DetailRow label="Landed on">{lead.landing_path ?? "—"}</DetailRow>
            </dl>
          </section>

          <RecordEditor
            table="campaign_leads"
            record={lead as unknown as Record<string, unknown> & { id: string }}
            fields={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Phone", type: "tel" },
              { key: "contact_pref", label: "Preferred contact", type: "select", options: ["email", "text", "call", "messenger"] },
              { key: "home_size", label: "Home size" },
              { key: "preferred_date", label: "Preferred date", type: "date" },
              { key: "referral_name", label: "Referred by" },
              { key: "message", label: "Message", type: "textarea", rows: 4 },
            ]}
            onSaved={onPatch}
          />

          {lead.message && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</h3>
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-secondary/50 p-4 text-sm">{lead.message}</p>
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</h3>
            {["summer-on-the-lake", "referral-week", "holiday-ready"].includes(lead.campaign) && (
            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="tap-target mt-2 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
            >
              {sending ? "Sending…" : "Resend thank-you email"}
            </button>
            )}

            <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-secondary/30 p-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Template
                </span>
                <select
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    setPreviewHtml(null);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                >
                  {options.length === 0 && (
                    <option value="instant-quote-followup">Instant quote follow-up</option>
                  )}
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {o.custom ? " (copy)" : ""}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {options.find((o) => o.id === templateId)?.description ??
                    `Personalised with ${lead.name}'s details before sending.`}
                </span>
              </label>

              <Field
                label="Your message to this lead"
                value={draft.introHtml}
                onChange={(v) => setField("introHtml", v)}
                placeholder={`Hi ${lead.name.split(" ")[0]} — thanks for reaching out! …`}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Added at the top of the email. Leave blank to send the template as-is.
              </p>

              <button
                type="button"
                onClick={() => setShowEditor((v) => !v)}
                className="tap-target rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                {showEditor ? "Hide advanced options" : "More options"}
              </button>

              {showEditor && (
                <div className="grid gap-3">
                  <Field label="Subject" value={draft.subject} onChange={(v) => setField("subject", v)} placeholder="Leave blank to keep the template subject" />
                  <Field label="Headline" value={draft.heroTitle} onChange={(v) => setField("heroTitle", v)} placeholder="Leave blank to keep the default" />
                  <Field label="Sub-headline" value={draft.heroSubtitle} onChange={(v) => setField("heroSubtitle", v)} placeholder="Leave blank to keep the default" />
                  <Field label="Button label" value={draft.ctaLabel} onChange={(v) => setField("ctaLabel", v)} placeholder="Leave blank to keep the default" />
                  <Field label="Replace the whole body" value={draft.bodyHtml} onChange={(v) => setField("bodyHtml", v)} placeholder="Optional. Plain text or HTML." rows={5} />
                  <Field label="Footer note" value={draft.footerNote} onChange={(v) => setField("footerNote", v)} placeholder="Leave blank to keep the default" rows={2} />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewing}
                  className="tap-target rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary disabled:opacity-60"
                >
                  {previewing ? "Rendering…" : "Preview"}
                </button>
                <button
                  type="button"
                  onClick={handleSendTemplate}
                  disabled={sending}
                  className="tap-target rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? "Sending…" : `Send to ${lead.email}`}
                </button>
              </div>

              {previewHtml && (
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    Subject: <span className="font-semibold text-foreground">{previewSubject}</span>
                  </div>
                  <iframe
                    title="Email preview"
                    srcDoc={previewHtml}
                    className="h-96 w-full rounded-xl border border-border bg-white"
                  />
                </div>
              )}
            </div>

            {result && (
              <p
                role="status"
                className={`mt-2 text-sm ${result.ok ? "text-laurel" : "text-destructive"}`}
              >
                {result.text}
              </p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{children}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const cls =
    "mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/70";
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {rows ? (
        <textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </label>
  );
}

