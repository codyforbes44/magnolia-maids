import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowRight, Phone, ShieldCheck, Flower2 } from "lucide-react";
import { HomeDetailsPicker } from "@/components/HomeDetailsPicker";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import {
  FREQUENCY_RATES,
  SERVICE_RATES,
  addonLabels,
  countLabel,
  fromQuoteSearch,
  getServiceRate,
  quoteVisit,
  serviceLabel,
  toQuoteSearch,
  type AddonKey,
  type FrequencyKey,
  type QuoteSelection,
  type ServiceKey,
} from "@/lib/pricing";

const searchSchema = z.object({
  service: z.string().optional(),
  frequency: z.string().optional(),
  beds: z.coerce.number().optional(),
  baths: z.coerce.number().optional(),
  addons: z.string().optional(),
  pets: z.coerce.boolean().optional(),
  name: z.string().optional(),
});

export const Route = createFileRoute("/quote")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Instant Cleaning Quote | Magnolia Maids Durant, OK" },
      {
        name: "description",
        content: "Get your flat-rate Magnolia Maids cleaning price in 30 seconds — pick your service, home size, and add-ons.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Instant Cleaning Quote | Magnolia Maids" },
      { property: "og:description", content: "Your Durant, OK cleaning price in 30 seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuoteOnlyPage,
});

function QuoteOnlyPage() {
  const search = Route.useSearch();
  const [sel, setSel] = useState<QuoteSelection>(() => fromQuoteSearch(search));
  const firstName = (search.name ?? "").trim().split(/\s+/)[0] ?? "";

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

  const bookingSearch = toQuoteSearch({ ...sel, frequency });

  return (
    <main className="min-h-screen bg-secondary/40 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
            <Flower2 className="h-4 w-4" /> Magnolia Maids · Durant, OK
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-foreground">
            {firstName ? `${firstName}, here's your price` : "Your instant cleaning price"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Flat rate, no walkthrough required. Adjust anything below and the price updates live.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-white p-5 sm:p-8 shadow-sm">
          {/* Service */}
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Service</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {SERVICE_RATES.map((r) => {
              const on = r.key === sel.service;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSel((s) => ({ ...s, service: r.key as ServiceKey }))}
                  className={`tap-target rounded-2xl border px-4 py-3 text-left transition ${
                    on ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="block text-sm font-bold">{serviceLabel(r.key)}</span>
                  <span className="text-xs text-muted-foreground">from ${r.base}</span>
                </button>
              );
            })}
          </div>

          {/* Frequency */}
          {recurring && (
            <>
              <div className="mt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">How often</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {FREQUENCY_RATES.map((f) => {
                  const on = f.key === frequency;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setSel((s) => ({ ...s, frequency: f.key }))}
                      className={`tap-target rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"
                      }`}
                    >
                      {f.key}
                      {f.discount > 0 ? ` · save ${Math.round(f.discount * 100)}%` : ""}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Home details */}
          <div className="mt-6">
            <HomeDetailsPicker
              bedrooms={sel.bedrooms}
              bathrooms={sel.bathrooms}
              addons={sel.addons}
              pets={sel.pets}
              onChange={(patch) =>
                setSel((s) => ({
                  ...s,
                  ...patch,
                  addons: (patch.addons ?? s.addons) as AddonKey[],
                }))
              }
            />
          </div>

          {/* Price */}
          <div className="mt-8 rounded-2xl bg-secondary/60 p-5 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {serviceLabel(sel.service)} · {countLabel(sel.bedrooms)} bd / {countLabel(sel.bathrooms)} ba
              {recurring ? ` · ${frequency}` : ""}
            </div>
            <div className="mt-1 font-display text-5xl font-bold text-foreground">${quote.total}</div>
            {quote.savings > 0 && (
              <div className="mt-1 text-sm font-semibold text-laurel">You save ${quote.savings} per visit</div>
            )}
            {sel.addons.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">Includes {addonLabels(sel.addons).join(", ")}</div>
            )}
          </div>

          <Link
            to="/booking"
            search={bookingSearch}
            className="tap-target mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-bloom transition hover:brightness-105"
          >
            Book this clean <ArrowRight className="h-5 w-5" />
          </Link>

          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-center">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Insured, background-checked local team
            </span>
            <span className="hidden sm:inline">·</span>
            <a href={PHONE_HREF} className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <Phone className="h-4 w-4" /> Prefer to talk? {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}