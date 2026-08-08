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

function EmailTemplatesPage() {
  const load = useServerFn(listEmailTemplates);
  const preview = useServerFn(previewEmailTemplate);
  const sendTest = useServerFn(sendEmailTemplateTest);

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
  }, [selected, preview]);

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
              current && <StatusPill status={current.audience} styles={AUDIENCE_STYLES} />
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

          <SectionCard
            title="Send a test"
            description="Delivers this template, with sample data, to any inbox."
          >
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