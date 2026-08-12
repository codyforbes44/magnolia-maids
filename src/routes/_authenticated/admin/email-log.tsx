import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  SectionCard,
  StatCard,
  EmptyState,
  Drawer,
  DetailRow,
  inputClass,
  downloadCSV,
} from "@/components/admin/ui";
import { listEmailLog, type EmailLogRow } from "@/lib/admin/email-log.functions";

export const Route = createFileRoute("/_authenticated/admin/email-log")({
  head: () => ({
    meta: [
      { title: "Admin — Email log | Magnolia Maids" },
      {
        name: "description",
        content:
          "Read every email Maggie and the Magnolia Maids site sent, including the full message body, recipient, and delivery status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmailLogPage,
});

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function EmailLogPage() {
  const list = useServerFn(listEmailLog);

  const [rows, setRows] = useState<EmailLogRow[]>([]);
  const [kinds, setKinds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "sent" | "failed">("all");
  const [kind, setKind] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"rendered" | "text">("rendered");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await list({
        data: {
          search: search.trim() || undefined,
          status,
          kind: kind || undefined,
          limit: 200,
        },
      });
      setRows(res.rows);
      setKinds(res.kinds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the email log");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, kind]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const failed = rows.filter((r) => r.status === "failed").length;
  const maggie = rows.filter((r) => r.kind.startsWith("maggie") || r.kind.includes("followup")).length;
  const open = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);

  return (
    <div>
      <AdminPageHeader
        title="Email log"
        description="Every email sent from the site and by Maggie — open one to read the exact message the customer received."
        actions={
          <>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="tap-target rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCSV(
                  "email-log",
                  ["createdAt", "kind", "recipient", "subject", "status", "providerId", "error"],
                  rows as unknown as Record<string, unknown>[],
                )
              }
              className="tap-target rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
            >
              Export CSV
            </button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Emails" value={rows.length} hint="Most recent 200 matching" />
        <StatCard label="Delivery failures" value={failed} tone={failed ? "warn" : "default"} />
        <StatCard label="Maggie follow-ups" value={maggie} />
      </div>

      <SectionCard title="Search" description="Match on recipient, subject, message body, or error.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <input
            className={inputClass}
            placeholder="Email, subject, message text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">All statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All types</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {error && (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6">
        <SectionCard title="Sent messages" description="Newest first. Click a row to read the full email.">
          {rows.length === 0 && !loading ? (
            <EmptyState title="No emails yet" hint="Sends will appear here as soon as they go out." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Sent</th>
                    <th className="px-3 py-2">To</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        setOpenId(r.id);
                        setView("rendered");
                      }}
                      className="cursor-pointer border-t border-border/60 hover:bg-secondary/60"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">{r.recipient}</td>
                      <td className="max-w-[280px] truncate px-3 py-2">{r.subject}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{r.kind}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            r.status === "failed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-laurel/10 text-laurel"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {open && (
        <Drawer onClose={() => setOpenId(null)} title={open.subject}>
          <div className="space-y-4">
            <DetailRow label="Sent">{new Date(open.createdAt).toLocaleString()}</DetailRow>
            <DetailRow label="To">{open.recipient}</DetailRow>
            <DetailRow label="From">{open.fromAddress ?? "—"}</DetailRow>
            <DetailRow label="Reply-to">{open.replyTo ?? "—"}</DetailRow>
            <DetailRow label="Type">{open.kind}</DetailRow>
            <DetailRow label="Status">{open.status}</DetailRow>
            {open.error && <DetailRow label="Error">{open.error}</DetailRow>}
            {open.providerId && <DetailRow label="Provider ID">{open.providerId}</DetailRow>}

            <div className="flex gap-2">
              {(["rendered", "text"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`tap-target rounded-full px-4 py-2 text-xs font-semibold ${
                    view === v ? "bg-foreground text-background" : "border border-border hover:bg-secondary"
                  }`}
                >
                  {v === "rendered" ? "Rendered" : "Plain text"}
                </button>
              ))}
            </div>

            {open.bodyHtml ? (
              view === "rendered" ? (
                <iframe
                  title="Email preview"
                  sandbox=""
                  srcDoc={open.bodyHtml}
                  className="h-[540px] w-full rounded-xl border border-border/60 bg-white"
                />
              ) : (
                <pre className="max-h-[540px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-secondary/40 p-4 text-xs">
                  {stripHtml(open.bodyHtml)}
                </pre>
              )
            ) : (
              <p className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
                This message was sent before body archiving was turned on, so only its subject and
                delivery status were kept.
              </p>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}