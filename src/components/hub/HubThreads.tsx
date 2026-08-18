import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, CheckCheck, Clock, RefreshCw, Search, Send } from "lucide-react";
import {
  getHubThread,
  listHubThreads,
  retryHubMessage,
  sendHubText,
} from "@/lib/hub/hub.functions";
import { deliveryLabel, deliveryTone, parseDeliveryError } from "@/lib/hub/delivery";
import type { HubMessage, HubThread } from "@/lib/hub/hub-types";
import { inputClass } from "@/components/admin/ui";

function initials(name: string) {
  return name
    .split(/[\s@.+-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function stamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Delivery footer: state icon, plain-English carrier error, retry action. */
function MessageStatus({
  message,
  onRetry,
  retrying,
}: {
  message: HubMessage;
  onRetry: () => void;
  retrying: boolean;
}) {
  const tone = deliveryTone(message.status);
  const parsed = parseDeliveryError(message.error);
  const outbound = message.direction === "out";
  const Icon =
    tone === "failed"
      ? AlertTriangle
      : tone === "delivered"
        ? CheckCheck
        : tone === "pending"
          ? Clock
          : Check;

  return (
    <div className={`mt-1 text-[10px] ${outbound ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
      <p className="flex flex-wrap items-center gap-1">
        <span>{stamp(message.at)}</span>
        <span aria-hidden="true">·</span>
        {outbound && <Icon className={`h-3 w-3 ${tone === "failed" ? "text-destructive" : ""}`} />}
        <span className={tone === "failed" && !outbound ? "text-destructive" : ""}>
          {deliveryLabel(message.status)}
        </span>
      </p>
      {tone === "failed" && parsed.message && (
        <p className="mt-0.5 break-words font-semibold">{parsed.message}</p>
      )}
      {message.retryable && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Resending…" : "Resend"}
        </button>
      )}
    </div>
  );
}

export function HubThreads({
  channel,
  canReply,
  emptyHint,
  initialSearch,
  autoOpenThreadId,
  wide,
}: {
  channel: "sms" | "email" | "chat" | "call" | "all";
  canReply?: boolean;
  emptyHint: string;
  initialSearch?: string;
  autoOpenThreadId?: string | null;
  wide?: boolean;
}) {
  const qc = useQueryClient();
  const list = useServerFn(listHubThreads);
  const load = useServerFn(getHubThread);
  const send = useServerFn(sendHubText);
  const retry = useServerFn(retryHubMessage);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [open, setOpen] = useState<HubThread | null>(null);
  const [draft, setDraft] = useState("");

  const threads = useQuery({
    queryKey: ["hub", "threads", channel, search],
    queryFn: () => list({ data: { channel, search: search || undefined, limit: 60 } }),
  });

  useEffect(() => {
    if (!autoOpenThreadId || open) return;
    const match = threads.data?.threads.find((t) => t.id === autoOpenThreadId);
    if (match) setOpen(match);
  }, [autoOpenThreadId, threads.data, open]);

  const convo = useQuery({
    queryKey: ["hub", "thread", open?.id],
    queryFn: () => load({ data: { threadId: open!.id, markRead: true } }),
    enabled: !!open,
    // Carrier receipts land a few seconds after send, so keep the open
    // conversation fresh without the admin refreshing anything.
    refetchInterval: 10000,
  });

  const retryMut = useMutation({
    mutationFn: (messageId: string) => retry({ data: { messageId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hub"] }),
  });

  const sendMut = useMutation({
    mutationFn: (body: string) =>
      send({ data: { to: open!.contactKey, body, allowUnknown: true } }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["hub"] });
    },
  });

  const conversation = open ? (
    <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {convo.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {(convo.data?.messages ?? []).map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.direction === "out"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-background border border-border"
              }`}
            >
              {m.subject && m.channel === "email" && (
                <p className="mb-1 text-xs font-bold opacity-80">{m.subject}</p>
              )}
              <p className="whitespace-pre-wrap break-words">{m.body || "(no content)"}</p>
              <MessageStatus
                message={m}
                onRetry={() => retryMut.mutate(m.id)}
                retrying={retryMut.isPending}
              />
            </div>
          ))}
          {convo.data && convo.data.messages.length === 0 && (
            <p className="text-sm text-muted-foreground">No messages in this conversation yet.</p>
          )}
        </div>

        {canReply && open.channel === "sms" && (
          <form
            className="flex items-end gap-2 border-t border-border bg-background p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) sendMut.mutate(draft.trim());
            }}
          >
            <textarea
              className={`${inputClass} min-h-[44px] resize-none`}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                open.consent === "opted_out" ? "This number replied STOP" : "Text back…"
              }
              disabled={open.consent === "opted_out"}
              aria-label="Message"
            />
            <button
              className="rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-50"
              disabled={sendMut.isPending || open.consent === "opted_out"}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
        {sendMut.data && !("sent" in sendMut.data && sendMut.data.sent) && (
          <p className="border-t border-border bg-background px-3 pb-2 text-xs text-destructive">
            Not sent — {String((sendMut.data as { reason?: string }).reason ?? "unknown")}
          </p>
        )}
        <button
          onClick={() => setOpen(null)}
          className="border-t border-border bg-background py-2 text-xs font-bold text-primary"
        >
          {wide ? "Close conversation" : "Back to conversations"}
        </button>
    </div>
  ) : null;

  const listPane = (
    <div className="p-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={`${inputClass} pl-9`}
          placeholder="Search people or messages"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search conversations"
        />
      </label>

      <ul className="mt-3 space-y-2">
        {threads.isLoading && <li className="p-3 text-sm text-muted-foreground">Loading…</li>}
        {threads.data && threads.data.threads.length === 0 && (
          <li className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
            {emptyHint}
          </li>
        )}
        {(threads.data?.threads ?? []).map((t) => (
          <li key={t.id}>
            <button
              onClick={() => setOpen(t)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left hover:bg-secondary/60 ${
                open?.id === t.id ? "border-primary bg-secondary" : "border-border bg-background"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                {initials(t.contactName || t.contactKey)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {t.contactName || t.contactKey}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {stamp(t.lastMessageAt)}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {t.lastDirection === "out" ? "You: " : ""}
                  {t.snippet || "—"}
                </span>
                {t.consent === "opted_out" && (
                  <span className="mt-1 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                    opted out
                  </span>
                )}
              </span>
              {t.unread > 0 && (
                <span className="ml-1 shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                  {t.unread}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  if (wide) {
    return (
      <div className="grid h-full min-h-0 grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto border-r border-border">{listPane}</div>
        <div className="min-h-0">
          {conversation ?? (
            <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground">
              Pick a conversation to read and reply.
            </div>
          )}
        </div>
      </div>
    );
  }

  return conversation ?? listPane;
}
