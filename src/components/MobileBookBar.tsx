import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarHeart, Phone } from "lucide-react";

const HIDDEN_ON = ["/booking"];

export function MobileBookBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-primary/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 shadow-[0_-6px_24px_-12px_rgba(20,40,25,0.35)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3">
        <a
          href="tel:+15805550142"
          aria-label="Call Magnolia Maids"
          className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-laurel/30 bg-laurel/5 text-laurel"
        >
          <Phone className="h-5 w-5" />
        </a>
        <Link
          to="/booking"
          className="tap-target flex min-w-0 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-white shadow-lg"
        >
          <CalendarHeart className="h-4 w-4 shrink-0" />
          <span className="truncate">Book a Cleaning</span>
        </Link>
      </div>
    </div>
  );
}
