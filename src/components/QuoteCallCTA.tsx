import { Link } from "@tanstack/react-router";
import { Phone, Calculator, ArrowRight } from "lucide-react";

export const PHONE_DISPLAY = "(580) 745-0045";
export const PHONE_HREF = "tel:+15807450045";

/**
 * Sitewide conversion band: instant quote + click-to-call.
 * `tone="light"` sits on ivory/white sections, `tone="dark"` on laurel bands.
 */
export function QuoteCallCTA({
  heading = "Get an instant quote in about 60 seconds",
  body = "Flat pricing before you book — or call and we'll quote it with you over the phone.",
  tone = "light",
  className = "",
}: {
  heading?: string;
  body?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pb-16 md:pb-24 ${className}`}>
      <div
        className={`rounded-[2rem] border p-7 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10 ${
          dark ? "bg-laurel text-white border-white/15" : "bg-white border-border"
        }`}
      >
        <div className="flex-1">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">{heading}</h2>
          <p className={`mt-2 text-sm sm:text-base ${dark ? "text-white/85" : "text-muted-foreground"}`}>{body}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 md:shrink-0">
          <Link
            to="/booking"
            className={`tap-target inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-bold transition ${
              dark
                ? "bg-white text-primary hover:bg-secondary"
                : "bg-accent text-accent-foreground shadow-bloom hover:brightness-105"
            }`}
          >
            <Calculator className="h-4 w-4" /> Get an instant quote <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={PHONE_HREF}
            className={`tap-target inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-bold transition border ${
              dark
                ? "border-white/60 text-white hover:bg-white/10"
                : "border-border text-foreground hover:bg-secondary"
            }`}
          >
            <Phone className="h-4 w-4" /> Call {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}