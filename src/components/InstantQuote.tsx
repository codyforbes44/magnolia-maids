import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, Phone, ShieldCheck } from "lucide-react";
import { HomeDetailsPicker } from "@/components/HomeDetailsPicker";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import {
  DEFAULT_SELECTION,
  FREQUENCY_RATES,
  SERVICE_RATES,
  countLabel,
  getServiceRate,
  getAddon,
  quoteVisit,
  serviceLabel,
  toQuoteSearch,
  type AddonKey,
  type FrequencyKey,
  type QuoteSelection,
  type ServiceKey,
} from "@/lib/pricing";

/**
 * The homepage front door to the one quote flow: pick service, frequency,
 * home size and add-ons, see the flat price, then carry the exact selection
 * into /booking through the shared search params.
 */
export function InstantQuote() {
  const [sel, setSel] = useState<QuoteSelection>({ ...DEFAULT_SELECTION, service: "Bright Clean" });
  const recurring = getServiceRate(sel.service).recurring;
  const frequency: FrequencyKey = recurring ? sel.frequency : "One-time";

  const quote = useMemo(
    () =>
      quoteVisit({
        service: sel.service,
        frequency,
        bedrooms: sel.bedrooms,
        bathrooms: sel.bathrooms,
        addons: sel.addons,
      }),
    [sel.service, frequency, sel.bedrooms, sel.bathrooms, sel.addons],
  );

  const search = toQuoteSearch({ ...sel, frequency });
  const extras = sel.addons
    .map((k) => getAddon(k))
    .filter((a): a is NonNullable<ReturnType<typeof getAddon>> => !!a);

  return (
    <section id="instant-quote" className="scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pt-14 md:pt-24">
      <div className="rounded-[2.5rem] border border-border bg-white overflow-hidden grid lg:grid-cols-[1.35fr_1fr]">
        {/* Selection */}
        <div className="p-6 sm:p-8 md:p-10">
          <p className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Instant quote
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold leading-tight">
            Your flat price, right here
          </h2>
          <p className="mt-3 text-muted-foreground">
            Choose your service and home size — no forms, no in-home estimate. Everything you pick
            carries straight into booking.
          </p>

          {/* Service */}
          <div className="mt-7">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Service</div>
            <div className="flex flex-wrap gap-2">
              {SERVICE_RATES.map((r) => {
                const on = r.key === sel.service;
                return (
                  <button
                    key={r.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSel((p) => ({ ...p, service: r.key as ServiceKey }))}
                    className={`tap-target rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                      on
                        ? "bg-primary text-primary-foreground border-primary shadow-bloom"
                        : "bg-card text-foreground border-border hover:border-primary/60"
                    }`}
                  >
                    {serviceLabel(r.key)}
                    <span className={`ml-2 text-xs font-semibold ${on ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      ${r.base}+
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency */}
          <div className="mt-6">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              How often {recurring ? "" : "· one-time service"}
            </div>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_RATES.map((f) => {
                const on = frequency === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={on}
                    disabled={!recurring && f.key !== "One-time"}
                    onClick={() => setSel((p) => ({ ...p, frequency: f.key }))}
                    className={`tap-target rounded-full border px-4 py-2.5 text-sm font-bold transition disabled:opacity-40 ${
                      on
                        ? "bg-laurel text-white border-laurel"
                        : "bg-card text-foreground border-border hover:border-primary/60"
                    }`}
                  >
                    {f.key}
                    {f.discount > 0 && (
                      <span className={`ml-2 text-xs font-semibold ${on ? "text-white/80" : "text-primary"}`}>
                        save {Math.round(f.discount * 100)}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7">
            <HomeDetailsPicker
              bedrooms={sel.bedrooms}
              bathrooms={sel.bathrooms}
              addons={sel.addons}
              pets={sel.pets}
              onChange={(patch) => setSel((p) => ({ ...p, ...patch } as QuoteSelection))}
              addonColumns="sm:grid-cols-2 xl:grid-cols-3"
            />
          </div>
        </div>

        {/* Live estimate */}
        <aside className="bg-laurel text-white p-6 sm:p-8 md:p-10">
          <div className="lg:sticky lg:top-24">
          <div className="text-xs font-bold uppercase tracking-wider text-white/70">Your estimate</div>
          <div className="mt-2 font-display text-5xl font-semibold leading-none">${quote.total}</div>
          <div className="text-white/70 text-sm mt-1">– ${quote.high} depending on condition</div>
          <p className="mt-3 text-sm text-white/85">
            {serviceLabel(sel.service)} · {countLabel(sel.bedrooms)} bd / {countLabel(sel.bathrooms)} ba · {frequency}
          </p>

          <ul className="mt-6 space-y-2 text-sm border-t border-white/20 pt-5">
            {quote.savings > 0 && (
              <li className="flex justify-between font-bold">
                <span>{frequency} savings</span>
                <span>−${quote.savings}</span>
              </li>
            )}
            {extras.map((a) => (
              <li key={a.key} className="flex justify-between text-white/85">
                <span>+ {a.label}</span>
                <span>${a.price}</span>
              </li>
            ))}
            {sel.pets && (
              <li className="text-white/70 text-xs">Pet-safe products included — no extra charge.</li>
            )}
          </ul>

          <Link
            to="/booking"
            search={search}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition"
          >
            Continue to booking <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={PHONE_HREF}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/60 px-6 py-3.5 font-bold hover:bg-white/10 transition"
          >
            <Phone className="h-4 w-4" /> Call {PHONE_DISPLAY}
          </a>
          <p className="mt-4 flex items-start gap-2 text-xs text-white/75">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            No card required. Nothing is charged until the day of service, and every visit is backed by
            the 24-hour Magnolia Guarantee.
          </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
