import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  EmptyState,
  SectionCard,
  StatusPill,
  inputClass,
} from "@/components/admin/ui";
import {
  listEmailTemplates,
  previewEmailTemplate,
  sendEmailTemplateTest,
  getEmailTemplateOverride,
  saveEmailTemplateOverride,
  resetEmailTemplateOverride,
  duplicateEmailTemplate,
  deleteCustomEmailTemplate,
  type EmailTemplateSummary,
} from "@/lib/admin/email-templates.functions";

export const Route = createFileRoute("/_authenticated/admin/emails")({
  head: () => ({
    meta: [
      { title: "Admin — Email templates | Magnolia Maids" },
      {
        name: "description",
        content: "Preview every automated Magnolia Maids email and send yourself a test.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmailTemplatesPage,
});

const AUDIENCE_STYLES: Record<string, string> = {
  Customer: "bg-laurel/10 text-laurel border border-laurel/30",
  Admin: "bg-amber-100 text-amber-900 border border-amber-300",
  Applicant: "bg-sky-100 text-sky-900 border border-sky-300",
};

type Draft = {
  subject: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  introHtml: string;
  bodyHtml: string;
  footerNote: string;
  enabled: boolean;
};

const EMPTY_DRAFT: Draft = {
  subject: "",
  heroTitle: "",
  heroSubtitle: "",
  ctaLabel: "",
  introHtml: "",
  bodyHtml: "",
  footerNote: "",
  enabled: true,
};

function EmailTemplatesPage() {
  const load = useServerFn(listEmailTemplates);
  const preview = useServerFn(previewEmailTemplate);
  const sendTest = useServerFn(sendEmailTemplateTest);
  const loadOverride = useServerFn(getEmailTemplateOverride);
  const saveOverride = useServerFn(saveEmailTemplateOverride);
  const resetOverride = useServerFn(resetEmailTemplateOverride);
  const duplicate = useServerFn(duplicateEmailTemplate);
  const removeCustom = useServerFn(deleteCustomEmailTemplate);

  const [templates, setTemplates] = useState<EmailTemplateSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [testTo, setTestTo] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dupOpen, setDupOpen] = useState(false);
  const [dupName, setDupName] = useState("");
  const [dupCategory, setDupCategory] = useState("Custom");
  const [dupAudience, setDupAudience] = useState<"Customer" | "Admin" | "Applicant">("Customer");
  const [dupDescription, setDupDescription] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rows = await load({ data: undefined });
        setTemplates(rows);
        setSelected((cur) => cur ?? rows[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load templates");
      }
    })();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setLoadingPreview(true);
    setTestStatus(null);
    (async () => {
      try {
        const r = await preview({ data: { id: selected } });
        if (cancelled) return;
        setHtml(r.html);
        setSubject(r.subject);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Preview failed");
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, preview, reloadKey]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setSaveStatus(null);
    (async () => {
      try {
        const o = await loadOverride({ data: { id: selected } });
        if (cancelled) return;
        const { edited: wasEdited, ...rest } = o;
        setDraft(rest);
        setEdited(wasEdited);
      } catch {
        if (!cancelled) {
          setDraft(EMPTY_DRAFT);
          setEdited(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, loadOverride]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = (templates ?? []).filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
    const map = new Map<string, EmailTemplateSummary[]>();
    for (const t of rows) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return [...map.entries()];
  }, [templates, query]);

  const current = templates?.find((t) => t.id === selected) ?? null;

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function refreshList() {
    try {
      setTemplates(await load({ data: undefined }));
    } catch {
      /* list refresh is non-critical */
    }
  }

  async function onSaveDraft() {
    if (!selected) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await saveOverride({ data: { id: selected, ...draft } });
      setEdited(true);
      setSaveStatus("Saved — live emails now use this copy.");
      setReloadKey((k) => k + 1);
      await refreshList();
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onResetDraft() {
    if (!selected) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await resetOverride({ data: { id: selected } });
      setDraft(EMPTY_DRAFT);
      setEdited(false);
      setSaveStatus("Reverted to the original wording.");
      setReloadKey((k) => k + 1);
      await refreshList();
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setSaving(false);
    }
  }

  function openDuplicate() {
    if (!current) return;
    setDupName(`${current.name} (copy)`);
    setDupCategory(current.custom ? current.category : "Custom");
    setDupAudience(current.audience as "Customer" | "Admin" | "Applicant");
    setDupDescription("");
    setSaveStatus(null);
    setDupOpen(true);
  }

  async function onDuplicate() {
    if (!selected || !dupName.trim()) return;
    setDuplicating(true);
    setSaveStatus(null);
    try {
      const r = await duplicate({
        data: {
          id: selected,
          name: dupName.trim(),
          category: dupCategory.trim() || "Custom",
          audience: dupAudience,
          description: dupDescription.trim(),
        },
      });
      await refreshList();
      setSelected(r.id);
      setDupOpen(false);
      setSaveStatus("Copy created — edit its wording below and save.");
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : "Duplicate failed");
    } finally {
      setDuplicating(false);
    }
  }

  async function onDeleteCustom() {
    if (!selected || !current?.custom) return;
    if (!window.confirm(`Delete "${current.name}"? This can't be undone.`)) return;
    setSaving(true);
    try {
      await removeCustom({ data: { id: selected } });
      const rows = await load({ data: undefined });
      setTemplates(rows);
      setSelected(rows[0]?.id ?? null);
      setSaveStatus("Copy deleted.");
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function onSendTest() {
    if (!selected || !testTo.trim()) return;
    setSending(true);
    setTestStatus(null);
    try {
      const r = await sendTest({ data: { id: selected, to: testTo.trim() } });
      setTestStatus(`Test sent to ${r.to}`);
    } catch (e) {
      setTestStatus(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Email templates"
        description="Every automated email the site sends, rendered with sample data. Preview it, copy the HTML, or send yourself a test."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <SectionCard title="Templates" description={`${templates?.length ?? 0} in the library`}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className={inputClass}
          />
          <div className="mt-4 space-y-5">
            {groups.length === 0 && <EmptyState title="No templates match that search" />}
            {groups.map(([category, rows]) => (
              <div key={category}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {category}
                </div>
                <ul className="space-y-1.5">
                  {rows.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(t.id)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                          selected === t.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <span className="block font-semibold">{t.name}</span>
                        {t.custom && (
                          <span
                            className={`mt-0.5 mr-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              selected === t.id
                                ? "bg-primary-foreground/20"
                                : "bg-laurel/10 text-laurel"
                            }`}
                          >
                            Copy
                          </span>
                        )}
                        {t.edited && !t.custom && (
                          <span
                            className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              selected === t.id
                                ? "bg-primary-foreground/20"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            Edited
                          </span>
                        )}
                        <span
                          className={`mt-0.5 block truncate text-xs ${
                            selected === t.id ? "opacity-80" : "text-muted-foreground"
                          }`}
                        >
                          {t.audience} · {t.subject}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            title={current?.name ?? "Preview"}
            description={current?.description}
            action={
              current && (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={current.audience} styles={AUDIENCE_STYLES} />
                  <button
                    type="button"
                    onClick={openDuplicate}
                    className="tap-target rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary"
                  >
                    Duplicate
                  </button>
                  {current.custom && (
                    <button
                      type="button"
                      onClick={onDeleteCustom}
                      disabled={saving}
                      className="tap-target rounded-full border border-destructive/40 px-4 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      Delete copy
                    </button>
                  )}
                </div>
              )
            }
          >
            {current && (
              <dl className="mb-4 space-y-2 text-sm">
                <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Subject
                  </dt>
                  <dd className="min-w-0 break-words font-medium">{subject}</dd>
                </div>
                <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Trigger
                  </dt>
                  <dd className="min-w-0 break-words text-muted-foreground">{current.trigger}</dd>
                </div>
                <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Source
                  </dt>
                  <dd className="min-w-0 break-words font-mono text-xs text-muted-foreground">
                    {current.file}
                  </dd>
                </div>
              </dl>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-2">
              {(["desktop", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={`tap-target rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    device === d
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-secondary"
                  }`}
                >
                  {d === "desktop" ? "Desktop" : "Mobile"}
                </button>
              ))}
              <button
                type="button"
                disabled={!html}
                onClick={() => html && navigator.clipboard.writeText(html)}
                className="tap-target rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
              >
                Copy HTML
              </button>
              <button
                type="button"
                disabled={!html}
                onClick={() => {
                  if (!html) return;
                  const w = window.open("", "_blank");
                  w?.document.write(html);
                  w?.document.close();
                }}
                className="tap-target rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
              >
                Open in new tab
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/60 bg-secondary/40 p-3">
              {loadingPreview && (
                <p className="py-10 text-center text-sm text-muted-foreground">Rendering…</p>
              )}
              {!loadingPreview && html && (
                <iframe
                  title="Email preview"
                  srcDoc={html}
                  sandbox=""
                  className={`mx-auto h-[720px] w-full rounded-xl border border-border/50 bg-white ${
                    device === "mobile" ? "max-w-[390px]" : ""
                  }`}
                />
              )}
              {!loadingPreview && !html && <EmptyState title="Select a template" />}
            </div>
          </SectionCard>

          {dupOpen && (
            <SectionCard
              title="Duplicate this template"
              description="Creates a separate, editable copy. The original stays exactly as it is."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    New template name
                  </span>
                  <input
                    value={dupName}
                    onChange={(e) => setDupName(e.target.value)}
                    className={`mt-1.5 ${inputClass}`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Group it under
                  </span>
                  <input
                    value={dupCategory}
                    onChange={(e) => setDupCategory(e.target.value)}
                    placeholder="Custom"
                    className={`mt-1.5 ${inputClass}`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Audience
                  </span>
                  <select
                    value={dupAudience}
                    onChange={(e) =>
                      setDupAudience(e.target.value as "Customer" | "Admin" | "Applicant")
                    }
                    className={`mt-1.5 ${inputClass}`}
                  >
                    <option value="Customer">Customer</option>
                    <option value="Admin">Admin</option>
                    <option value="Applicant">Applicant</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    What is it for?
                  </span>
                  <input
                    value={dupDescription}
                    onChange={(e) => setDupDescription(e.target.value)}
                    placeholder="e.g. Spring promo follow-up"
                    className={`mt-1.5 ${inputClass}`}
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onDuplicate}
                  disabled={duplicating || !dupName.trim()}
                  className="tap-target rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {duplicating ? "Creating…" : "Create copy"}
                </button>
                <button
                  type="button"
                  onClick={() => setDupOpen(false)}
                  className="tap-target rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
                >
                  Cancel
                </button>
              </div>
            </SectionCard>
          )}

          <SectionCard
            title={current?.custom ? "Edit this copy" : "Edit this email"}
            description="Blank fields keep the original wording. Saved copy is used by every real send."
            action={
              !current?.custom && (
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => setField("enabled", e.target.checked)}
                  />
                  Edits active
                </label>
              )
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Subject line
                </span>
                <input
                  value={draft.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  placeholder={subject}
                  className={`mt-1.5 ${inputClass}`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Button label
                </span>
                <input
                  value={draft.ctaLabel}
                  onChange={(e) => setField("ctaLabel", e.target.value)}
                  placeholder="Leave blank to keep the default"
                  className={`mt-1.5 ${inputClass}`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Headline
                </span>
                <input
                  value={draft.heroTitle}
                  onChange={(e) => setField("heroTitle", e.target.value)}
                  placeholder="Leave blank to keep the default"
                  className={`mt-1.5 ${inputClass}`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sub-headline
                </span>
                <input
                  value={draft.heroSubtitle}
                  onChange={(e) => setField("heroSubtitle", e.target.value)}
                  placeholder="Leave blank to keep the default"
                  className={`mt-1.5 ${inputClass}`}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Intro paragraph (added above the email body)
                </span>
                <textarea
                  value={draft.introHtml}
                  onChange={(e) => setField("introHtml", e.target.value)}
                  rows={4}
                  placeholder="Optional. Blank line starts a new paragraph."
                  className={`mt-1.5 ${inputClass} h-auto`}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email body (replaces the whole body section)
                </span>
                <textarea
                  value={draft.bodyHtml}
                  onChange={(e) => setField("bodyHtml", e.target.value)}
                  rows={10}
                  placeholder="Optional. Leave blank to keep the built-in body. Plain text works (blank line = new paragraph), or paste HTML."
                  className={`mt-1.5 ${inputClass} h-auto font-mono text-xs`}
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Heads up: replacing the body removes the automatic details (booking summary, tables,
                  reference number) for this template.
                </span>
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Footer note
                </span>
                <textarea
                  value={draft.footerNote}
                  onChange={(e) => setField("footerNote", e.target.value)}
                  rows={2}
                  placeholder="Leave blank to keep the default"
                  className={`mt-1.5 ${inputClass} h-auto`}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={saving || !selected}
                className="tap-target rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {!current?.custom && (
                <button
                  type="button"
                  onClick={onResetDraft}
                  disabled={saving || !edited}
                  className="tap-target rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
                >
                  Revert to original
                </button>
              )}
              {saveStatus && <span className="text-sm text-muted-foreground">{saveStatus}</span>}
            </div>
          </SectionCard>

          <SectionCard
            title="Send a test"
            description="Delivers this template, with sample data, to any inbox."
          >
            <div className="mb-1" />
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[240px] flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Send to
                </span>
                <input
                  type="email"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="you@magnoliamaids.pro"
                  className={`mt-1.5 ${inputClass}`}
                />
              </label>
              <button
                type="button"
                onClick={onSendTest}
                disabled={sending || !testTo.trim() || !selected}
                className="tap-target rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send test email"}
              </button>
            </div>
            {testStatus && <p className="mt-3 text-sm text-muted-foreground">{testStatus}</p>}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}