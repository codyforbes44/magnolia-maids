import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Mail, MessageSquare, RefreshCw, Webhook } from "lucide-react";
import { getHubDeliveryStatus, retryHubDelivery } from "@/lib/hub/hub.functions";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "email", label: "Email" },
  { key: "sms", label: "Texts" },
  { key: "failed", label: "Problems" },
];

function stamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function tone(status: string, delivery: string | null) {
  const s = (delivery || status).toLowerCase();
  if (["failed", "bounced", "complained", "undelivered"].includes(s))
    return "bg-destructive/10 text-destructive";
  if (["delivered", "sent", "opened"].includes(s)) return "bg-primary/10 text-primary";
  return "bg-secondary text-muted-foreground";
}

/** Live delivery health: what went out, what bounced, and webhook processing. */
export function HubDelivery() {
  const load = useServerFn(getHubDeliveryStatus);
  const retry = useServerFn(retryHubDelivery);
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"sends" | "webhooks">("sends");

  const status = useQuery({
    queryKey: ["hub", "delivery", filter],
    queryFn: () => load({ data: { filter } }),
    refetchInterval: 60000,
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => retry({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hub", "delivery"] }),
  });

  const c = status.data?.counts;

  return (
    <div className="p-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Sent 24h", value: c?.sent24h ?? 0, icon: CheckCircle2 },
          { label: "Failed 24h", value: (c?.failed24h ?? 0) + (c?.smsFailed24h ?? 0), icon: AlertTriangle },
          { label: "Bounced 7d", value: c?.bounced7d ?? 0, icon: Mail },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-background p-2.5">
            <s.icon className="h-4 w-4 text-primary" />
            <p className="mt-1 text-lg font-bold leading-none">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-2 rounded-2xl bg-background p-2.5 text-[11px] text-muted-foreground">
        {c?.webhooksFailed24h ?? 0} webhook error{(c?.webhooksFailed24h ?? 0) === 1 ? "" : "s"} in
        24h · {c?.duplicatesSuppressed7d ?? 0} sends tracked with idempotency keys this week.
      </p>

      <div className="mt-3 flex gap-1.5">
        {(["sends", "webhooks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted-foreground"
            }`}
          >
            {t === "sends" ? "Deliveries" : "Webhooks"}
          </button>
        ))}
      </div>

      {tab === "sends" && (
        <>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  filter === f.key
                    ? "bg-secondary text-primary"
                    : "border border-border bg-background text-muted-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ul className="mt-2 space-y-2">
            {status.isLoading && <li className="p-2 text-sm text-muted-foreground">Loading…</li>}
            {status.data?.deliveries.length === 0 && (
              <li className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
                Nothing to show for this filter.
              </li>
            )}
            {(status.data?.deliveries ?? []).map((d) => (
              <li key={d.id} className="rounded-2xl border border-border bg-background p-3">
                <div className="flex items-start gap-2">
                  {d.channel === "sms" ? (
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{d.recipient}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.subject}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone(d.status, d.deliveryStatus)}`}
                      >
                        {d.deliveryStatus ?? d.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {d.kind} · {stamp(d.at)}
                      </span>
                    </div>
                    {d.detail && (
                      <p className="mt-1 break-words text-[11px] text-destructive">{d.detail}</p>
                    )}
                  </div>
                  {d.canRetry && (
                    <button
                      onClick={() => retryMut.mutate(d.id)}
                      disabled={retryMut.isPending}
                      className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-bold text-primary disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "webhooks" && (
        <ul className="mt-2 space-y-2">
          {(status.data?.webhooks ?? []).length === 0 && (
            <li className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
              No webhook deliveries recorded yet.
            </li>
          )}
          {(status.data?.webhooks ?? []).map((w) => (
            <li key={w.id} className="rounded-2xl border border-border bg-background p-3">
              <div className="flex items-start gap-2">
                <Webhook className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold capitalize">
                    {w.provider} · {w.eventType ?? "event"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{w.route}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone(w.status, null)}`}
                    >
                      {w.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {w.attempts} delivery attempt{w.attempts === 1 ? "" : "s"} · {stamp(w.receivedAt)}
                    </span>
                  </div>
                  {w.error && (
                    <p className="mt-1 break-words text-[11px] text-destructive">{w.error}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
