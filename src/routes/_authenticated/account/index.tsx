import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAccountProfile, getHomeProfile, getMyBookings } from "@/lib/account.functions";
import { Card, StatusPill, fmtDate } from "@/components/account/AccountShell";
import { CalendarDays, Dog, KeyRound, Phone, Sparkles } from "lucide-react";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({
    meta: [
      { title: "My dashboard — Magnolia Maids" },
      { name: "description", content: "Your Magnolia Maids dashboard: upcoming cleanings, recent visits, and account shortcuts in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountOverview,
});

const today = () => new Date().toISOString().slice(0, 10);

function AccountOverview() {
  const profileFn = useServerFn(getAccountProfile);
  const bookingsFn = useServerFn(getMyBookings);
  const homeFn = useServerFn(getHomeProfile);

  const profile = useQuery({ queryKey: ["account", "profile"], queryFn: () => profileFn({}) });
  const bookings = useQuery({ queryKey: ["account", "bookings"], queryFn: () => bookingsFn({}) });
  const home = useQuery({ queryKey: ["account", "home"], queryFn: () => homeFn({}) });

  const rows = bookings.data?.bookings ?? [];
  const upcoming = rows
    .filter((b) => b.status !== "cancelled" && (b.preferred_day ?? "") >= today())
    .sort((a, b) => (a.preferred_day ?? "").localeCompare(b.preferred_day ?? ""));
  const past = rows.filter((b) => !upcoming.includes(b));
  const next = upcoming[0];
  const pending = (bookings.data?.changeRequests ?? []).filter((r) => r.status === "pending");

  const homeRow = home.data?.home;
  const pets = home.data?.pets ?? [];
  const checklist = [
    { label: "Entry & access", done: !!homeRow?.entry_method && homeRow.entry_method !== "someone_home" ? true : !!homeRow },
    { label: "Pets", done: pets.length > 0 || !!homeRow?.updated_at },
    { label: "Preferences", done: !!homeRow?.focus_rooms || !!homeRow?.product_preferences },
    { label: "Contact details", done: !!profile.data?.profile?.fullName && !!profile.data?.profile?.phone },
  ];
  const complete = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">
          Welcome back{profile.data?.profile?.fullName ? `, ${profile.data.profile.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your visits, history, and the home details our Durant team works from.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Next visit">
          {bookings.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your schedule…</p>
          ) : next ? (
            <div className="space-y-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold">{next.service}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {fmtDate(next.preferred_day)}
                    {next.preferred_time ? ` · ${next.preferred_time}` : ""}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{next.address}</p>
                </div>
                <StatusPill status={next.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/account/appointments"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom"
                >
                  <CalendarDays className="h-4 w-4" /> Manage this visit
                </Link>
                <a
                  href={PHONE_HREF}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold"
                >
                  <Phone className="h-4 w-4 text-primary" /> {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Nothing on the calendar yet.</p>
              <Link
                to="/booking"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom"
              >
                <Sparkles className="h-4 w-4" /> Book a cleaning
              </Link>
            </div>
          )}
          {pending.length > 0 && (
            <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm">
              {pending.length} change request{pending.length > 1 ? "s" : ""} waiting on our office. We confirm every
              change by email.
            </p>
          )}
        </Card>

        <Card title="Home profile">
          <p className="text-sm text-muted-foreground">
            {complete} of {checklist.length} sections complete
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-laurel" style={{ width: `${(complete / checklist.length) * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${c.done ? "bg-laurel" : "bg-border"}`} />
                <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/account/home"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold"
          >
            <KeyRound className="h-4 w-4" /> Update details
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Visits booked">
          <p className="font-display text-3xl font-semibold">{rows.length}</p>
          <p className="text-sm text-muted-foreground">All time with Magnolia Maids</p>
        </Card>
        <Card title="Completed cleans">
          <p className="font-display text-3xl font-semibold">{past.filter((b) => b.status === "completed").length}</p>
          <Link to="/account/history" className="text-sm font-semibold text-primary">
            View history →
          </Link>
        </Card>
        <Card title="Pets on file">
          <p className="flex items-center gap-2 font-display text-3xl font-semibold">
            <Dog className="h-6 w-6 text-laurel" /> {pets.length}
          </p>
          <Link to="/account/home" className="text-sm font-semibold text-primary">
            Add a pet →
          </Link>
        </Card>
      </div>
    </div>
  );
}