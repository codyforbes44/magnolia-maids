import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { StatCard, SectionCard, EmptyState } from "@/components/admin/ui";
import { ADMIN_NAV } from "@/lib/admin/nav";
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

  useEffect(() => {
    (async () => {
      const [b, l, a, e, f, r] = await Promise.all([
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
      ]);
      setBookings((b.data as BookingLite[]) ?? []);
      setLeads((l.data as LeadLite[]) ?? []);
      setApps((a.data as AppLite[]) ?? []);
      setFailedEmails(e.count ?? 0);
      setReturning((r.data as ActivityLite[]) ?? []);
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

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="Everything that needs your attention across Magnolia Maids."
      />

      {(unanswered > 0 || openLeads > 0 || failedEmails > 0 || tokenAlert || returning.length > 0) && (
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