import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import favicon from "@/assets/magnolia-mark-sm.webp";
import { CalendarDays, Home, LayoutDashboard, LogOut, Sparkles, UserRound } from "lucide-react";

export const ACCOUNT_NAV = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/account/appointments", label: "Appointments", icon: CalendarDays, exact: false },
  { to: "/account/history", label: "History", icon: Sparkles, exact: false },
  { to: "/account/home", label: "Home profile", icon: Home, exact: false },
  { to: "/account/profile", label: "Profile", icon: UserRound, exact: false },
] as const;

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-dvh bg-secondary/30">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img src={favicon} alt="" className="h-8 w-8 shrink-0" />
            <span className="truncate font-display text-lg font-semibold text-laurel">Magnolia Maids</span>
          </Link>
          <button
            onClick={signOut}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground/80 hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        <nav
          aria-label="Account sections"
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 md:px-8"
        >
          {ACCOUNT_NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                  active ? "bg-accent text-accent-foreground shadow-bloom" : "text-foreground/70 hover:bg-secondary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</main>
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-border/60 bg-card p-5 shadow-sm md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          {title ? <h2 className="truncate font-display text-lg font-semibold md:text-xl">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "confirmed" || status === "approved" || status === "completed"
      ? "bg-laurel/15 text-laurel"
      : status === "cancelled" || status === "declined"
        ? "bg-destructive/10 text-destructive"
        : "bg-accent/15 text-accent-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${tone}`}>
      {status}
    </span>
  );
}

export function fmtDate(value?: string | null) {
  if (!value) return "Not scheduled yet";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}