import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, StatCard } from "@/components/admin/ui";
import { getNextdoorStatus, type NextdoorStatus } from "@/lib/nextdoor.functions";
import {
  NEXTDOOR_CAPABILITIES,
  NEXTDOOR_ADS_MANAGER_URL,
  NEXTDOOR_DEVELOPER_URL,
  NEXTDOOR_PAGE_URL,
  NEXTDOOR_PIXEL_ID,
  nextdoorLink,
} from "@/lib/nextdoor-config";
import { Check, Copy, ExternalLink, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/nextdoor")({
  head: () => ({
    meta: [
      { title: "Admin — Nextdoor | Magnolia Maids" },
      { name: "description", content: "Nextdoor attribution, pixel status, and API access for Magnolia Maids." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NextdoorAdminPage,
});

const DESTINATIONS = [
  { path: "/nextdoor", label: "Nextdoor neighbor landing page" },
  { path: "/quote", label: "Instant quote (no nav, fastest)" },
  { path: "/booking", label: "Full booking wizard" },
  { path: "/airbnb-turnover", label: "Airbnb turnover page" },
];

function NextdoorAdminPage() {
  const fetchStatus = useServerFn(getNextdoorStatus);
  const [status, setStatus] = useState<NextdoorStatus | null>(null);
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [campaign, setCampaign] = useState("neighbors");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus({ data: undefined } as never)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [fetchStatus]);

  useEffect(() => {
    (async () => {
      const [leads, bookings] = await Promise.all([
        supabase.from("campaign_leads").select("id", { count: "exact", head: true }).eq("utm_source", "nextdoor"),
        supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("utm_source", "nextdoor"),
      ]);
      setLeadCount(leads.count ?? 0);
      setBookingCount(bookings.count ?? 0);
    })();
  }, []);

  const unlocked = useMemo(
    () => ({
      none: true,
      pixel: Boolean(NEXTDOOR_PIXEL_ID),
      ads: Boolean(status?.adsToken && status?.advertiserId),
      capi: Boolean(status?.capiToken),
      publishing: Boolean(status?.publishingClient),
    }),
    [status],
  );

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Nextdoor"
        description="Attribution, pixel status, and the credentials that unlock the Ads and Conversions APIs."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Leads from Nextdoor" value={leadCount ?? "—"} hint="Tagged utm_source=nextdoor" />
        <StatCard label="Bookings from Nextdoor" value={bookingCount ?? "—"} hint="Tagged utm_source=nextdoor" />
        <StatCard
          label="Universal Pixel"
          value={NEXTDOOR_PIXEL_ID ? "Live" : "Not set"}
          tone={NEXTDOOR_PIXEL_ID ? "accent" : "warn"}
          hint={NEXTDOOR_PIXEL_ID ? "Page views and lead events firing" : "Add VITE_NEXTDOOR_PIXEL_ID"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Capabilities"
          description="What's active today and what each Nextdoor approval unlocks."
        >
          <ul className="space-y-3">
            {NEXTDOOR_CAPABILITIES.map((c) => {
              const on = unlocked[c.requires];
              return (
                <li key={c.key} className="flex gap-3 rounded-xl border border-border/60 p-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      on ? "bg-laurel text-white" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {on ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{c.label}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="Tagged ad links"
          description="Copy these into the destination URL of any Nextdoor ad or post so the lead is attributed."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Campaign name
              <input
                value={campaign}
                onChange={(e) => setCampaign(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ad / creative label
              <input
                value={content}
                placeholder="optional"
                onChange={(e) => setContent(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal"
              />
            </label>
          </div>

          <ul className="mt-4 space-y-2">
            {DESTINATIONS.map((d) => {
              const url = nextdoorLink(d.path, campaign || "neighbors", content || undefined);
              return (
                <li key={d.path} className="rounded-xl border border-border/60 p-3">
                  <div className="text-xs font-semibold">{d.label}</div>
                  <div className="mt-1 flex items-start gap-2">
                    <code className="min-w-0 flex-1 break-all text-xs text-muted-foreground">{url}</code>
                    <button
                      type="button"
                      onClick={() => copy(url, d.path)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-secondary"
                    >
                      {copied === d.path ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === d.path ? "Copied" : "Copy"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Getting API access"
          description="Nextdoor's platform is application-gated — these are the exact steps."
        >
          <ol className="space-y-4 text-sm">
            <li>
              <span className="font-semibold">1. Apply for the Ads &amp; Conversion API.</span>{" "}
              Submit the request form on the Nextdoor developer portal. Access is granted to advertising
              partners, so apply from the account that runs the ads.
              <div className="mt-1">
                <a
                  href={NEXTDOOR_DEVELOPER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
                >
                  Applying for access <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </li>
            <li>
              <span className="font-semibold">2. Generate the API token.</span> Once approved, mint the token
              inside Nextdoor Ads Manager and send it over — it gets stored as{" "}
              <code className="rounded bg-secondary px-1">NEXTDOOR_ADS_TOKEN</code> alongside{" "}
              <code className="rounded bg-secondary px-1">NEXTDOOR_ADVERTISER_ID</code>.
              <div className="mt-1">
                <a
                  href={NEXTDOOR_ADS_MANAGER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
                >
                  Ads Manager API page <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </li>
            <li>
              <span className="font-semibold">3. Create the Universal Pixel</span> and share the pixel id so
              page views and lead events start reporting back to Nextdoor.
            </li>
            <li>
              <span className="font-semibold">4. Optional — Publishing API.</span> A separate application on
              the same portal unlocks posting to the business feed from this dashboard.
              <div className="mt-1">
                <a
                  href={NEXTDOOR_PAGE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
                >
                  Business page <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </li>
          </ol>

          <p className="mt-5 rounded-xl border border-border/60 bg-secondary/40 p-3 text-xs text-muted-foreground">
            Nextdoor publishes no lead-retrieval webhook. Lead-gen form submissions are pulled from Ads
            Manager reporting, so once the Ads API token lands, leads sync on a schedule rather than
            instantly.
          </p>
        </SectionCard>
      </div>
    </>
  );
}
