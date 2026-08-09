import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  History,
  KeyRound,
  PawPrint,
  LayoutDashboard,
  UserCog,
} from "lucide-react";

export const accountFeatures = [
  {
    icon: CalendarClock,
    title: "See your next visit",
    body: "Date, arrival window, service, and flat rate — always current in your dashboard.",
  },
  {
    icon: UserCog,
    title: "Request changes online",
    body: "Reschedule, skip, or cancel a visit in a couple of taps. Our office confirms same day.",
  },
  {
    icon: History,
    title: "Service history & rebooking",
    body: "Every past clean saved with its details, plus one-tap “book this again”.",
  },
  {
    icon: KeyRound,
    title: "Entry & access on file",
    body: "Door codes, lockbox, parking, and alarm notes stored once — no repeating yourself.",
  },
  {
    icon: PawPrint,
    title: "Pets & preferences",
    body: "Pet names and temperaments, product preferences, and rooms to skip or focus on.",
  },
  {
    icon: LayoutDashboard,
    title: "Plan & billing at a glance",
    body: "Your recurring frequency, discount, and contact details — update them anytime.",
  },
];

/**
 * Sitewide reference to the client dashboard. `variant="full"` renders the
 * feature grid; `variant="strip"` renders a compact one-line reminder.
 */
export function AccountPromo({
  variant = "full",
  heading = "Your account, after you book",
  body = "Every Magnolia Maids client gets a free online dashboard — no app to download.",
  className = "",
}: {
  variant?: "full" | "strip";
  heading?: string;
  body?: string;
  className?: string;
}) {
  if (variant === "strip") {
    return (
      <div
        className={`rounded-3xl border border-border bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}
      >
        <LayoutDashboard className="h-6 w-6 text-primary shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 text-sm sm:text-base text-muted-foreground">
          <span className="font-semibold text-foreground">Every client gets a free dashboard.</span>{" "}
          Track upcoming visits, request reschedules, save entry and pet details, and rebook past cleans.
        </p>
        <Link
          to="/account"
          className="tap-target inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-foreground hover:bg-secondary transition"
        >
          My account <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-24 ${className}`}>
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
          <LayoutDashboard className="h-3.5 w-3.5" /> Client dashboard
        </span>
        <h2 className="mt-4 font-display text-3xl sm:text-4xl font-semibold leading-tight">{heading}</h2>
        <p className="mt-3 text-muted-foreground text-base sm:text-lg">{body}</p>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accountFeatures.map((f) => (
          <li key={f.title} className="rounded-3xl border border-border bg-white p-6">
            <f.icon className="h-6 w-6 text-primary" aria-hidden />
            <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          to="/account"
          className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition"
        >
          Open my account <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/booking"
          className="tap-target inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 font-bold text-foreground hover:bg-secondary transition"
        >
          Book a cleaning first
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Sign up with the email you booked with and your past visits and quotes attach automatically.
      </p>
    </section>
  );
}
