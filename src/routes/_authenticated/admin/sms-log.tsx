import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, StatCard, EmptyState, inputClass, downloadCSV } from "@/components/admin/ui";
import { listSmsActivity, type SmsActivityRow } from "@/lib/admin/sms-events.functions";

export const Route = createFileRoute("/_authenticated/admin/sms-log")({
  head: () => ({
    meta: [
      { title: "Admin — SMS activity log | Magnolia Maids" },
      {
        name: "description",
        content:
          "Search every text Magnolia Maids sent or received, including delivery errors and inbound STOP, START, and HELP replies.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SmsLogPage,
});

function kindLabel(kind: string) {
  if (kind.startsWith("sms-inbound:")) return `Inbound · ${kind.split(":")[1]}`;
  return kind.replace(/^sms-/, "").replace(/-/g, " ");
}

function SmsLogPage() {
  const list = useServerFn(listSmsActivity);

  const [rows, setRows] = useState<SmsActivityRow[]>([]);
  const [kinds, setKinds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "sent" | "failed">("all");
  const [direction, setDirection] = useState<"all" | "inbound" | "outbound">("all");
  const [kind, setKind] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await list({
        data: {
          search: search.trim() || undefined,
          status,
          direction,
          kind: kind || undefined,
          limit: 200,
        },
      });
      setRows(res.rows);
      setKinds(res.kinds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the SMS log");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, direction, kind]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const failed = rows.filter((r) => r.status === "failed").length;
  const inbound = rows.filter((r) => r.direction === "inbound").length;
  const optOuts = rows.filter((r) => r.kind === "sms-inbound:stop").length;

  return (
    <div>
      <AdminPageHeader
        title="SMS activity log"
        description="Every text sent from the app plus inbound STOP, START, and HELP replies — with Twilio message IDs and delivery errors."
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
                  "sms-activity",
                  ["createdAt", "direction", "kind", "recipient", "status", "subject", "providerId", "error"],
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

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Messages" value={rows.length} hint="Most recent 200 matching" />
        <StatCard label="Delivery failures" value={failed} tone={failed ? "warn" : "default"} />
        <StatCard label="Inbound replies" value={inbound} />
        <StatCard label="STOP opt-outs" value={optOuts} tone={optOuts ? "warn" : "default"} />
      </div>

      <SectionCard title="Search" description="Match on phone number, message text, Twilio SID, or error.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Phone, text, SID, error…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className={inputClass} value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
            <option value="all">All directions</option>
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">Any status</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All message types</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {kindLabel(k)}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <div className="mt-6">
        <SectionCard title="Messages" description="Newest first. Tap a row for the full message body.">
          {error && (
            <div className="mb-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No messages match"
              hint="Try clearing the filters, or send a test text from SMS templates."
            />
          ) : (
            <ul className="grid gap-2">
              {rows.map((r) => {
                const open = expanded === r.id;
                return (
                  <li key={r.id} className="rounded-2xl border border-border/60">
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : r.id)}
                      className="grid w-full gap-1 px-4 py-3 text-left hover:bg-secondary/50 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                    >
                      <span
                        className={`justify-self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          r.status === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : r.direction === "inbound"
                              ? "bg-sky-100 text-sky-900"
                              : "bg-laurel/10 text-laurel"
                        }`}
                      >
                        {r.status === "failed" ? "Failed" : r.direction === "inbound" ? "Inbound" : "Sent"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{r.recipient}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {kindLabel(r.kind)} · {r.subject}
                        </span>
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground sm:justify-self-end">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </button>
                    {open && (
                      <div className="grid gap-2 border-t border-border/60 px-4 py-3 text-sm">
                        <pre className="whitespace-pre-wrap break-words font-sans">{r.subject}</pre>
                        {r.error && (
                          <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            {r.error}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Type: {r.kind}
                          {r.providerId ? ` · Twilio SID: ${r.providerId}` : ""}
                          {r.relatedId ? ` · Record: ${r.relatedId}` : ""}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
