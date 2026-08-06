import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Drawer, DetailRow, EmptyState, StatCard, downloadCSV } from "@/components/admin/ui";
import {
  AGENTS,
  listConversations,
  getConversation,
  type ConversationSummary,
  type ConversationTurn,
} from "@/lib/elevenlabs.functions";

export const Route = createFileRoute("/_authenticated/admin/conversations")({
  head: () => ({
    meta: [
      { title: "Admin — Conversations | Magnolia Maids" },
      { name: "description", content: "Voice and chat conversation history from the assistant." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConversationsPage,
});

function fmtDuration(secs: number | null) {
  if (secs == null) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function fmtDate(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

type Detail = Awaited<ReturnType<typeof getConversation>>;

function ConversationsPage() {
  const fetchList = useServerFn(listConversations);
  const fetchOne = useServerFn(getConversation);

  const [agentId, setAgentId] = useState<string>("all");
  const [rows, setRows] = useState<ConversationSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchList({
          data: {
            ...(agentId !== "all" ? { agentId } : {}),
            ...(opts?.cursor ? { cursor: opts.cursor } : {}),
            pageSize: 30,
          },
        });
        setRows((prev) => (opts?.append && prev ? [...prev, ...res.items] : res.items));
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load conversations");
        if (!opts?.append) setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [agentId, fetchList],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (conversationId: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetchOne({ data: { conversationId } });
      setDetail(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load transcript");
    } finally {
      setDetailLoading(false);
    }
  };

  const stats = useMemo(() => {
    const list = rows ?? [];
    const totalSecs = list.reduce((n, r) => n + (r.durationSecs ?? 0), 0);
    const successful = list.filter((r) => r.callSuccessful === "success").length;
    return {
      count: list.length,
      avg: list.length ? Math.round(totalSecs / list.length) : 0,
      successful,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Conversations"
        description="Voice and chat history from the Magnolia assistant."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Loaded" value={stats.count} hint="Conversations in this view" />
        <StatCard label="Avg length" value={fmtDuration(stats.avg)} />
        <StatCard label="Marked successful" value={stats.successful} tone="accent" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[{ id: "all", name: "All agents" }, ...AGENTS].map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAgentId(a.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              agentId === a.id
                ? "border-laurel bg-laurel/10 text-laurel"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {a.name}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            Refresh
          </button>
          <button
            type="button"
            disabled={!rows?.length}
            onClick={() =>
              downloadCSV(
                "conversations.csv",
                ["conversationId", "agentName", "startedAt", "durationSecs", "messageCount", "status", "callSuccessful"],
                (rows ?? []).map((r) => ({ ...r, startedAt: fmtDate(r.startedAt) })),
              )
            }
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {rows === null || (loading && !rows?.length) ? (
        <p className="text-sm text-muted-foreground">Loading conversations…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          hint="Voice and chat sessions with the assistant will show up here."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Length</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.conversationId} className="border-t border-border/60">
                  <td className="whitespace-nowrap px-4 py-3">{fmtDate(r.startedAt)}</td>
                  <td className="px-4 py-3">{r.agentName}</td>
                  <td className="px-4 py-3">{fmtDuration(r.durationSecs)}</td>
                  <td className="px-4 py-3 tabular-nums">{r.messageCount ?? "—"}</td>
                  <td className="px-4 py-3">{r.callSuccessful ?? r.status ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void openDetail(r.conversationId)}
                      className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-secondary"
                    >
                      Transcript
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void load({ append: true, cursor })}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-40"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}

      {(detail || detailLoading) && (
        <Drawer
          title={detail?.agentName ?? "Transcript"}
          eyebrow="Conversation"
          subtitle={detail ? fmtDate(detail.startedAt) : undefined}
          onClose={() => setDetail(null)}
        >
          {detailLoading || !detail ? (
            <p className="text-sm text-muted-foreground">Loading transcript…</p>
          ) : (
            <div className="space-y-5">
              <dl>
                <DetailRow label="Length">{fmtDuration(detail.durationSecs)}</DetailRow>
                <DetailRow label="Status">{detail.status ?? "—"}</DetailRow>
                <DetailRow label="Outcome">{detail.callSuccessful ?? "—"}</DetailRow>
                <DetailRow label="ID">
                  <code className="text-xs">{detail.conversationId}</code>
                </DetailRow>
              </dl>
              {detail.summary && (
                <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Summary
                  </p>
                  {detail.summary}
                </div>
              )}
              <div className="space-y-3">
                {detail.transcript.filter((t: ConversationTurn) => t.message).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transcript turns recorded.</p>
                ) : (
                  detail.transcript.map((t: ConversationTurn, i: number) =>
                    t.message ? (
                      <div
                        key={i}
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          t.role === "user"
                            ? "ml-6 bg-laurel/10"
                            : "mr-6 border border-border/60 bg-card"
                        }`}
                      >
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          {t.role === "user" ? "Visitor" : "Assistant"}
                        </p>
                        {t.message}
                      </div>
                    ) : null,
                  )
                )}
              </div>
            </div>
          )}
        </Drawer>
      )}
    </div>
  );
}