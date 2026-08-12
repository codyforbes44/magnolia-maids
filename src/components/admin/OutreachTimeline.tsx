import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MessageSquare, PhoneCall, Sparkles, RefreshCw } from "lucide-react";
import { getOutreachTimeline, type OutreachItem } from "@/lib/admin/outreach.functions";

type Source =
  | "campaign_leads"
  | "booking_requests"
  | "job_applications"
  | "property_inquiries"
  | "franchise_inquiries";

const ICONS = {
  email: Mail,
  text: MessageSquare,
  call: PhoneCall,
  system: Sparkles,
} as const;

const CHANNEL_LABEL = {
  email: "Email",
  text: "Text",
  call: "Call",
  system: "Activity",
} as const;

function when(at: string) {
  return new Date(at).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Every Maggie touch on this record: what went out, when, how, and whether it landed. */
export function OutreachTimeline({ table, id }: { table: Source; id: string }) {
  const load = useServerFn(getOutreachTimeline);
  const [items, setItems] = useState<OutreachItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const res = await load({ data: { table, id } });
      setItems(res.items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the outreach timeline.");
    } finally {
      setBusy(false);
    }
  }, [load, table, id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Outreach timeline
        </h3>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          className="tap-target inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {!error && items === null && <p className="mt-2 text-xs text-muted-foreground">Loading…</p>}
      {!error && items?.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">No outreach yet for this contact.</p>
      )}

      {items && items.length > 0 && (
        <ol className="mt-3 space-y-3 border-l border-border pl-4">
          {items.map((item) => {
            const Icon = ICONS[item.channel];
            return (
              <li key={item.id} className="relative">
                <span className="absolute -left-[1.4rem] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-2.5 w-2.5 text-laurel" aria-hidden />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold">{CHANNEL_LABEL[item.channel]}</span>
                  <span className="text-xs text-muted-foreground">{when(item.at)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      item.ok ? "bg-secondary text-laurel" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm">{item.title}</p>
                {item.detail && (
                  <p className="text-xs text-muted-foreground break-words">{item.detail}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
