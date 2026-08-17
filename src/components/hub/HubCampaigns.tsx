import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdInsights } from "@/lib/facebook.functions";

const money = (n: number) => `$${n.toFixed(2)}`;

export function HubCampaigns() {
  const insightsFn = useServerFn(listAdInsights);
  const q = useQuery({
    queryKey: ["hub", "campaigns"],
    queryFn: () => insightsFn({ data: { days: 28 } }),
  });

  const data = q.data as any;

  return (
    <div className="space-y-3 p-3">
      {q.isLoading && <p className="p-3 text-sm text-muted-foreground">Loading campaigns…</p>}
      {q.isError && (
        <p className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
          Meta Ads is not reachable — re-authorize permissions in Marketing.
        </p>
      )}
      {data?.summary && (
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Spend (28d)", money(Number(data.summary.spend ?? 0))],
            ["Leads", String(data.summary.leads ?? 0)],
            ["Clicks", String(data.summary.clicks ?? 0)],
            ["Impressions", String(data.summary.impressions ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border bg-background p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}
      <h3 className="px-1 font-display text-base font-semibold">Active campaigns</h3>
      <ul className="space-y-2">
        {(data?.campaigns ?? []).map((c: any) => (
          <li key={c.name ?? c.campaign_name} className="rounded-2xl border border-border bg-background p-3">
            <p className="truncate text-sm font-semibold">{c.name ?? c.campaign_name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {money(Number(c.spend ?? 0))} · {c.clicks ?? 0} clicks · {c.leads ?? 0} leads
            </p>
          </li>
        ))}
        {data && !(data.campaigns ?? []).length && (
          <li className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
            No campaign activity in the last 28 days.
          </li>
        )}
      </ul>
    </div>
  );
}
