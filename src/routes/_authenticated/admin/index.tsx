import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { StatCard, SectionCard, EmptyState } from "@/components/admin/ui";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { runCommunityHealthNow } from "@/lib/community-health.functions";
import { runContentSyncNow } from "@/lib/content-sync.functions";
import { priceHome, type ServiceKey, type FrequencyKey, bedroomCount, bathroomCount } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Overview — Admin | Magnolia Maids" },
      { name: "description", content: "Magnolia Maids operations overview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OverviewPage,
});

type BookingLite = {
  id: string;
  name: string;
  service: string;
  frequency: string;
  bedrooms: string;
  bathrooms: string;
  status: string;
  preferred_day: string | null;
  created_at: string;
};

type LeadLite = { id: string; name: string; campaign: string; status: string; created_at: string };
type AppLite = { id: string; name: string; role: string; status: string; created_at: string };

type HealthLite = {
  status: string;
  notes: string | null;
  weather_ok: boolean;
  page_ok: boolean;
  created_at: string;
  forecast_days: number;
  attractions_rendered: number;
  season_tips_rendered: number;
  broken_links: { name: string; url: string; status: number | string }[] | null;
};

type SyncLite = {
  status: string;
  notes: string | null;
  kb_document_id: string | null;
  kb_bytes: number;
  agents_updated: number;
  agents_total: number;
  pages_checked: number;
  page_failures: { path: string; reason: string }[] | null;
  created_at: string;
};

type ActivityLite = {
  id: string;
  record_table: string;
  record_id: string;
  event: string;
  source: string | null;
  email: string | null;
  summary: string;
  created_at: string;
};

const TABLE_LABELS: Record<string, { label: string; to: string }> = {
  booking_requests: { label: "Booking", to: "/admin/bookings" },
  campaign_leads: { label: "Lead", to: "/admin/leads" },
  job_applications: { label: "Applicant", to: "/admin/applications" },
  property_inquiries: { label: "Property", to: "/admin/properties" },
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function estimate(b: BookingLite) {
  try {
    return priceHome({
      service: b.service as ServiceKey,
      frequency: b.frequency as FrequencyKey,
      bedrooms: bedroomCount(b.bedrooms),
      bathrooms: bathroomCount(b.bathrooms),
    }).total;
  } catch {
    return 0;
  }
}

function OverviewPage() {
  const [bookings, setBookings] = useState<BookingLite[] | null>(null);
  const [leads, setLeads] = useState<LeadLite[] | null>(null);
  const [apps, setApps] = useState<AppLite[] | null>(null);
  const [failedEmails, setFailedEmails] = useState(0);
  const [tokenAlert, setTokenAlert] = useState<string | null>(null);
  const [returning, setReturning] = useState<ActivityLite[]>([]);
  const [health, setHealth] = useState<HealthLite | null>(null);
  const [checking, setChecking] = useState(false);
  const [sync, setSync] = useState<SyncLite | null>(null);
  const [syncing, setSyncing] = useState(false);
  const runHealthCheck = useServerFn(runCommunityHealthNow);
  const runSync = useServerFn(runContentSyncNow);

  async function handleRunSync() {
    setSyncing(true);
    try {
      const r = await runSync();
      setSync({
        status: r.status,
        notes: r.notes,
        kb_document_id: r.kb_document_id,
        kb_bytes: r.kb_bytes,
        agents_updated: r.agents_updated,
        agents_total: r.agents_total,
        pages_checked: r.pages_checked,
        page_failures: r.page_failures,
        created_at: new Date().toISOString(),
      });
      if (r.status === "ok")
        toast.success("Content synced — Maggie's knowledge base is current.");
      else toast.warning(`Content sync: ${r.status}`, { description: r.notes ?? undefined });
    } catch (e) {
      toast.error("Could not run the sync", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSyncing(false);
    }
  }

  async function handleRunHealthCheck() {
    setChecking(true);
    try {
      const result = await runHealthCheck();
      setHealth({
        status: result.status,
        notes: result.notes,
        weather_ok: result.weather_ok,
        page_ok: result.page_ok,
        created_at: new Date().toISOString(),
        forecast_days: result.forecast_days,
        attractions_rendered: result.attractions_rendered,
        season_tips_rendered: result.season_tips_rendered,
        broken_links: result.broken_links,
      });
      if (result.status === "ok") toast.success("Community page checked — everything is current.");
      else
        toast.warning(`Community page check: ${result.status}`, {
          description: result.notes ?? undefined,
        });
    } catch (e) {
      toast.error("Could not run the check", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    (async () => {
      const [b, l, a, e, f, r, h, cs] = await Promise.all([
        supabase
          .from("booking_requests")
          .select("id,name,service,frequency,bedrooms,bathrooms,status,preferred_day,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("campaign_leads")
          .select("id,name,campaign,status,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("job_applications")
          .select("id,name,role,status,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("email_log")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
          .gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()),
        supabase.from("facebook_connections").select("page_name,updated_at").limit(1),
        supabase
          .from("contact_activity")
          .select("id,record_table,record_id,event,source,email,summary,created_at")
          .eq("event", "appended")
          .gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString())
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("community_health_checks")
          .select(
            "status,notes,weather_ok,page_ok,created_at,forecast_days,attractions_rendered,season_tips_rendered,broken_links",
          )
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("content_sync_runs")
          .select(
            "status,notes,kb_document_id,kb_bytes,agents_updated,agents_total,pages_checked,page_failures,created_at",
          )
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      setBookings((b.data as BookingLite[]) ?? []);
      setLeads((l.data as LeadLite[]) ?? []);
      setApps((a.data as AppLite[]) ?? []);
      setFailedEmails(e.count ?? 0);
      setReturning((r.data as ActivityLite[]) ?? []);
      setHealth(((h.data as HealthLite[]) ?? [])[0] ?? null);
      setSync((((cs.data as unknown) as SyncLite[]) ?? [])[0] ?? null);
      const conn = f.data?.[0];
      if (conn) {
        const ageDays = (Date.now() - new Date(conn.updated_at).getTime()) / 864e5;
        if (ageDays > 50) {
          setTokenAlert(
            `Facebook page token for ${conn.page_name} was refreshed ${Math.round(ageDays)} days ago — long-lived tokens expire around 60 days.`,
          );
        }
      }
    })();
  }, []);

  const today = startOfToday().toISOString();
  const weekEnd = new Date(startOfToday().getTime() + 7 * 864e5).toISOString().slice(0, 10);
  const todayStr = startOfToday().toISOString().slice(0, 10);

  const newToday = bookings?.filter((b) => b.created_at >= today).length ?? 0;
  const unanswered = bookings?.filter((b) => b.status === "new").length ?? 0;
  const openLeads = leads?.filter((l) => l.status === "new").length ?? 0;
  const newApps = apps?.filter((a) => a.status === "new").length ?? 0;
  const upcoming =
    bookings?.filter(
      (b) =>
        b.preferred_day &&
        b.preferred_day >= todayStr &&
        b.preferred_day <= weekEnd &&
        b.status !== "cancelled",
    ) ?? [];
  const bookedRevenue =
    bookings
      ?.filter((b) => b.status === "scheduled" || b.status === "completed")
      .reduce((sum, b) => sum + estimate(b), 0) ?? 0;

  const loading = bookings === null;

  // Daily Community page check: flag a bad result, or a job that stopped running.
  const healthStale =
    health !== null && Date.now() - new Date(health.created_at).getTime() > 36 * 3600 * 1000;
  const healthAlert =
    health && health.status !== "ok"
      ? `Community page check came back ${health.status}${health.notes ? ` — ${health.notes}` : ""}`
      : healthStale
        ? `The daily Community page check hasn't run since ${new Date(health!.created_at).toLocaleDateString()}.`
        : null;

  const syncStale =
    sync !== null && Date.now() - new Date(sync.created_at).getTime() > 36 * 3600 * 1000;
  const syncAlert =
    sync && sync.status !== "ok"
      ? `Daily content sync came back ${sync.status}${sync.notes ? ` — ${sync.notes}` : ""}`
      : syncStale
        ? `The daily content sync hasn't run since ${new Date(sync!.created_at).toLocaleDateString()}.`
        : null;

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="Everything that needs your attention across Magnolia Maids."
      />

      {(unanswered > 0 ||
        openLeads > 0 ||
        failedEmails > 0 ||
        tokenAlert ||
        healthAlert ||
        syncAlert ||
        returning.length > 0) && (
        <div className="mb-6 space-y-2">
          {returning.length > 0 && (
            <Alert
              text={`${returning.length} returning contact${returning.length === 1 ? "" : "s"} updated their details in the last 7 days.`}
              to={TABLE_LABELS[returning[0]!.record_table]?.to ?? "/admin/bookings"}
              cta="See updates"
            />
          )}
          {unanswered > 0 && (
            <Alert
              text={`${unanswered} booking request${unanswered === 1 ? "" : "s"} still marked new.`}
              to="/admin/bookings"
              cta="Review bookings"
            />
          )}
          {openLeads > 0 && (
            <Alert
              text={`${openLeads} campaign lead${openLeads === 1 ? "" : "s"} haven't been contacted.`}
              to="/admin/leads"
              cta="Review leads"
            />
          )}
          {failedEmails > 0 && (
            <Alert
              tone="warn"
              text={`${failedEmails} email${failedEmails === 1 ? "" : "s"} failed to send in the last 7 days.`}
              to="/admin/settings"
              cta="Open email log"
            />
          )}
          {tokenAlert && (
            <Alert tone="warn" text={tokenAlert} to="/admin/facebook" cta="Reconnect Facebook" />
          )}
          {healthAlert && (
            <Alert tone="warn" text={healthAlert} to="/community" cta="Open Community page" />
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="New requests today"
          value={loading ? "—" : newToday}
          hint={`${bookings?.length ?? 0} total all time`}
          tone="accent"
        />
        <StatCard
          label="Jobs this week"
          value={loading ? "—" : upcoming.length}
          hint="Based on preferred day"
        />
        <StatCard
          label="Booked revenue"
          value={loading ? "—" : `$${bookedRevenue.toLocaleString()}`}
          hint="Scheduled + completed, estimated"
        />
        <StatCard
          label="Applications"
          value={apps === null ? "—" : apps.length}
          hint={`${newApps} awaiting first review`}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold">Operations Manual</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The complete Magnolia Maids operations handbook (PDF).
          </p>
        </div>
        <a
          href="/docs/magnolia-maids-operations-manual.pdf"
          download="Magnolia-Maids-Operations-Manual.pdf"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Download manual
        </a>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="This week's schedule"
          description="Requests with a preferred day in the next 7 days"
          action={
            <Link
              to="/admin/bookings"
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              Open calendar
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing on the books this week" hint="New requests will land here." />
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming
                .sort((a, b) => (a.preferred_day ?? "").localeCompare(b.preferred_day ?? ""))
                .map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="font-semibold">{b.name}</span>{" "}
                      <span className="text-muted-foreground">· {b.service}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {b.preferred_day}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Latest activity" description="Most recent requests, leads, and applicants">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {[
                ...(bookings ?? []).slice(0, 4).map((b) => ({
                  id: `b-${b.id}`,
                  when: b.created_at,
                  what: `Booking · ${b.name} · ${b.service}`,
                })),
                ...(leads ?? []).slice(0, 3).map((l) => ({
                  id: `l-${l.id}`,
                  when: l.created_at,
                  what: `Lead · ${l.name} · ${l.campaign}`,
                })),
                ...(apps ?? []).slice(0, 3).map((a) => ({
                  id: `a-${a.id}`,
                  when: a.created_at,
                  what: `Applicant · ${a.name} · ${a.role}`,
                })),
              ]
                .sort((x, y) => y.when.localeCompare(x.when))
                .slice(0, 8)
                .map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{row.what}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(row.when).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              {(bookings?.length ?? 0) + (leads?.length ?? 0) + (apps?.length ?? 0) === 0 && (
                <EmptyState
                  title="No activity yet"
                  hint="Once the site starts collecting requests, they appear here."
                />
              )}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Returning contacts"
          description="Existing people who came back and updated their details (last 7 days)"
        >
          {returning.length === 0 ? (
            <EmptyState
              title="No repeat submissions yet"
              hint="When a known email or phone submits again, the update lands here."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {returning.map((row) => {
                const meta = TABLE_LABELS[row.record_table];
                return (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="font-semibold">{meta?.label ?? row.record_table}</span>{" "}
                      <span className="text-muted-foreground">
                        · {row.email ?? "no email"} · {row.summary}
                        {row.source ? ` · via ${row.source}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString()}
                      {meta && (
                        <Link
                          to={meta.to}
                          className="rounded-full border border-border px-3 py-1 font-semibold hover:bg-secondary"
                        >
                          Open
                        </Link>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Community page check"
          description="Live weather feed, rendered attractions and tips, and outbound source links"
          action={
            <button
              type="button"
              onClick={handleRunHealthCheck}
              disabled={checking}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
            >
              {checking ? "Checking…" : "Run check now"}
            </button>
          }
        >
          {health === null ? (
            <EmptyState
              title="No check has run yet"
              hint="The check runs daily at 8:15 AM Central, or run it now."
            />
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    health.status === "ok"
                      ? "bg-laurel/10 text-laurel"
                      : "bg-amber-500/15 text-amber-700"
                  }`}
                >
                  {health.status === "ok" ? "All current" : health.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Last run {new Date(health.created_at).toLocaleString()}
                </span>
              </div>
              <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <li>
                  Weather feed: {health.weather_ok ? "live" : "not responding"} ·{" "}
                  {health.forecast_days} forecast days
                </li>
                <li>Page render: {health.page_ok ? "complete" : "incomplete"}</li>
                <li>Attractions rendered: {health.attractions_rendered}</li>
                <li>Seasonal tips rendered: {health.season_tips_rendered}</li>
              </ul>
              {health.notes && <p className="text-xs text-amber-700">{health.notes}</p>}
              {health.broken_links && health.broken_links.length > 0 && (
                <ul className="space-y-1 text-xs">
                  {health.broken_links.map((l) => (
                    <li key={l.url}>
                      <span className="font-semibold">{l.name}</span>{" "}
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground underline"
                      >
                        {l.url}
                      </a>{" "}
                      ({l.status})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Daily content sync"
          description="Rebuilds Maggie's knowledge base from live pricing, services, campaigns, FAQs, service areas and the community guide, then checks every public page"
          action={
            <button
              type="button"
              onClick={handleRunSync}
              disabled={syncing}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
            >
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          }
        >
          {sync === null ? (
            <EmptyState
              title="No sync has run yet"
              hint="The sync runs daily at 8:45 AM Central, or run it now."
            />
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    sync.status === "ok"
                      ? "bg-laurel/10 text-laurel"
                      : "bg-amber-500/15 text-amber-700"
                  }`}
                >
                  {sync.status === "ok" ? "All current" : sync.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Last run {new Date(sync.created_at).toLocaleString()}
                </span>
              </div>
              <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <li>
                  Knowledge base: {sync.kb_document_id ? "updated" : "not updated"} ·{" "}
                  {Math.round(sync.kb_bytes / 1024)} KB
                </li>
                <li>
                  Agents refreshed: {sync.agents_updated}/{sync.agents_total}
                </li>
                <li>Pages checked: {sync.pages_checked}</li>
                <li>Page failures: {sync.page_failures?.length ?? 0}</li>
              </ul>
              {sync.notes && <p className="text-xs text-amber-700">{sync.notes}</p>}
              {sync.page_failures && sync.page_failures.length > 0 && (
                <ul className="space-y-1 text-xs">
                  {sync.page_failures.map((f) => (
                    <li key={f.path}>
                      <span className="font-semibold">{f.path}</span>{" "}
                      <span className="text-muted-foreground">— {f.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ADMIN_NAV.filter((n) => n.to !== "/admin").map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-2xl border border-border/60 bg-card p-4 transition hover:border-laurel/50 hover:shadow-sm"
            >
              <Icon className="h-5 w-5 text-laurel" aria-hidden />
              <div className="mt-2 font-semibold">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function Alert({
  text,
  to,
  cta,
  tone = "default",
}: {
  text: string;
  to: string;
  cta: string;
  tone?: "default" | "warn";
}) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
        tone === "warn"
          ? "border-destructive/40 bg-destructive/5"
          : "border-brass/40 bg-brass/10"
      }`}
    >
      <span className="min-w-0">{text}</span>
      <Link
        to={to}
        className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
      >
        {cta}
      </Link>
    </div>
  );
}