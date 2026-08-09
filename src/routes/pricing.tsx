import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { QuoteCallCTA } from "@/components/QuoteCallCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountPromo } from "@/components/AccountPromo";
import { ShareButtons } from "@/components/ShareButtons";
import { useInViewOnce, useCountUp } from "@/hooks/useInViewOnce";
import { Check, Minus, Plus, Sparkles, Flower2, Star, ShieldCheck, Clock, Leaf, X } from "lucide-react";
import { breadcrumbSchema, businessRef, areaServed, SERVICE_CATALOG, SITE_URL } from "@/lib/structured-data";
import {
  getServiceRate, FREQUENCY_RATES, INCLUDED_BEDROOMS, INCLUDED_BATHROOMS,
  addonsTotal, toQuoteSearch, clampBaths, countLabel,
  type AddonKey, type FrequencyKey, type ServiceKey, type QuoteSearch,
} from "@/lib/pricing";
import { AddonPicker } from "@/components/HomeDetailsPicker";
import { HeroBackground } from "@/components/HeroBackground";
import heroPricing from "@/assets/hero-pricing.webp";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "House Cleaning Prices in Durant, OK | Magnolia Maids" },
      { name: "description", content: "Transparent house cleaning prices for Durant, OK homes. Weekly, biweekly, monthly, and one-time rates with no surprise fees or contracts." },
      { name: "keywords", content: "house cleaning prices Durant OK, maid service cost Durant Oklahoma, cleaning rates Bryan County, weekly cleaning service Durant" },
      { property: "og:title", content: "House Cleaning Prices in Durant, OK | Magnolia Maids" },
      { property: "og:description", content: "Fresh, Bright, and Deep packages with clear per-home pricing for Durant and Bryan County." },
      { property: "og:url", content: "https://magnoliamaids.pro/pricing" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "House Cleaning Prices in Durant, OK", path: "/pricing" },
        ])),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "OfferCatalog",
          name: "House cleaning prices in Durant, OK",
          url: `${SITE_URL}/pricing`,
          provider: businessRef,
          areaServed,
          itemListElement: SERVICE_CATALOG.map((s, i) => ({
            "@type": "Offer",
            position: i + 1,
            price: s.price,
            priceCurrency: "USD",
            availability: "https://schema.org/PreOrder",
            url: `${SITE_URL}/booking`,
            itemOffered: { "@type": "Service", name: s.name, description: s.description, provider: businessRef, areaServed },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Do I need to be home?", acceptedAnswer: { "@type": "Answer", text: "Nope. Most Magnolia Maids clients give us a code or lockbox. We text a photo when we lock up." } },
            { "@type": "Question", name: "What if I'm not happy?", acceptedAnswer: { "@type": "Answer", text: "Our 24-hour Magnolia Guarantee: tell us within a day and we'll re-clean the area free." } },
            { "@type": "Question", name: "Are supplies included?", acceptedAnswer: { "@type": "Answer", text: "Yes — pro-grade products, microfiber, and vacuums. Eco or fragrance-free on request." } },
            { "@type": "Question", name: "Can I skip a visit?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Pause, skip, or reschedule from your booking email. No fees." } },
            { "@type": "Question", name: "Do prices change over time?", acceptedAnswer: { "@type": "Answer", text: "Your rate is locked as long as your plan is active. Add a bedroom and we'll re-quote first." } },
          ],
        }),
      },
    ],
  }),
});

type Frequency = "one" | "monthly" | "biweekly" | "weekly";

const DISC = (k: "One-time" | "Monthly" | "Biweekly" | "Weekly") =>
  FREQUENCY_RATES.find((f) => f.key === k)!.discount;

const FREQS: { id: Frequency; label: string; sub: string; discount: number; badge?: string }[] = [
  { id: "one", label: "One-time", sub: "Single visit", discount: DISC("One-time") },
  { id: "monthly", label: "Monthly", sub: "Every 4 weeks", discount: DISC("Monthly"), badge: `Save ${Math.round(DISC("Monthly") * 100)}%` },
  { id: "biweekly", label: "Biweekly", sub: "Every 2 weeks", discount: DISC("Biweekly"), badge: `Save ${Math.round(DISC("Biweekly") * 100)}%` },
  { id: "weekly", label: "Weekly", sub: "Every week", discount: DISC("Weekly"), badge: "Best value" },
];

const TIERS = [
  {
    id: "fresh",
    name: "Fresh",
    service: "Standard Clean" as ServiceKey,
    tagline: "Weekly upkeep",
    base: getServiceRate("Standard Clean").base,
    perBed: getServiceRate("Standard Clean").perBed,
    perBath: getServiceRate("Standard Clean").perBath,
    emoji: "🌿",
    features: ["Dust, vacuum, mop", "Kitchen & bathrooms", "Trash & tidy", "Eco products available", "Same crew each visit"],
  },
  {
    id: "bright",
    name: "Bright",
    service: "Bright Clean" as ServiceKey,
    tagline: "Most complete upkeep",
    base: getServiceRate("Bright Clean").base,
    perBed: getServiceRate("Bright Clean").perBed,
    perBath: getServiceRate("Bright Clean").perBath,
    emoji: "✨",
    highlight: true,
    features: ["Everything in Fresh", "Inside microwave", "Baseboards & vents", "Beds made, linens changed", "Interior door wipe-down"],
  },
  {
    id: "deep",
    name: "Deep",
    service: "Deep Clean" as ServiceKey,
    tagline: "Seasonal reset",
    base: getServiceRate("Deep Clean").base,
    perBed: getServiceRate("Deep Clean").perBed,
    perBath: getServiceRate("Deep Clean").perBath,
    emoji: "💎",
    features: ["Everything in Bright", "Inside oven & fridge", "Tile & grout scrub", "Windows & tracks", "Cabinet fronts detailed"],
  },
] as const;

const COMPARE_ROWS: { label: string; values: [boolean | string, boolean | string, boolean | string] }[] = [
  { label: "Dust, vacuum & mop", values: [true, true, true] },
  { label: "Kitchen & bathrooms", values: [true, true, true] },
  { label: "Eco products option", values: [true, true, true] },
  { label: "Baseboards & vents", values: [false, true, true] },
  { label: "Inside microwave", values: [false, true, true] },
  { label: "Linens & beds made", values: [false, true, true] },
  { label: "Inside oven & fridge", values: [false, false, true] },
  { label: "Tile & grout scrub", values: [false, false, true] },
  { label: "Windows & tracks", values: [false, false, true] },
  { label: "Avg. visit length", values: ["2h", "3h", "5h"] },
];

const FAQS = [
  { q: "Do I need to be home?", a: "Nope. Most Magnolia Maids clients give us a code or lockbox. We text a photo when we lock up." },
  { q: "What if I'm not happy?", a: "Our 24-hour Magnolia Guarantee: tell us within a day and we'll re-clean the area free." },
  { q: "Are supplies included?", a: "Yes — pro-grade products, microfiber, and vacuums. Eco or fragrance-free on request." },
  { q: "Can I skip a visit?", a: "Absolutely. Pause, skip, or reschedule from your booking email. No fees." },
  { q: "Do prices change over time?", a: "Your rate is locked as long as your plan is active. Add a bedroom and we'll re-quote first." },
];

function PricingPage() {
  const [freq, setFreq] = useState<Frequency>("biweekly");
  const [beds, setBeds] = useState(2);
  const [baths, setBaths] = useState(2);
  const [addons, setAddons] = useState<AddonKey[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const discount = FREQS.find((f) => f.id === freq)!.discount;
  const frequencyKey: FrequencyKey =
    freq === "one" ? "One-time" : freq === "monthly" ? "Monthly" : freq === "weekly" ? "Weekly" : "Biweekly";
  const extras = useMemo(() => addonsTotal(addons), [addons]);
  const toggleAddon = (key: AddonKey) =>
    setAddons((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));

  const priced = useMemo(
    () =>
      TIERS.map((t) => {
        const raw =
          t.base +
          Math.max(0, beds - INCLUDED_BEDROOMS) * t.perBed +
          Math.max(0, baths - INCLUDED_BATHROOMS) * t.perBath;
        const discounted = Math.round(raw * (1 - discount));
        const final = discounted + extras;
        return {
          ...t,
          raw: raw + extras,
          final,
          saved: raw - discounted,
          search: toQuoteSearch({
            service: t.service,
            frequency: getServiceRate(t.service).recurring ? frequencyKey : "One-time",
            bedrooms: beds,
            bathrooms: baths,
            addons,
          }),
        };
      }),
    [beds, baths, discount, extras, addons, frequencyKey]
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ivory-wash">
        <HeroBackground src={heroPricing} position="center 45%" />
        <div className="pointer-events-none absolute -top-16 -left-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider ring-1 ring-primary/20">
            <Sparkles className="h-3.5 w-3.5" /> Transparent pricing
          </span>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight">
            House Cleaning Prices in{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-laurel">Durant, OK</span>
              <span className="absolute inset-x-0 -bottom-1 h-3 bg-champagne/60 -z-0 rounded-sm" />
            </span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground">
            Slide, tap, and see your flat rate update in real time. Recurring visits save up to <b className="text-foreground">20%</b>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Every rate includes a {INCLUDED_BEDROOMS} bedroom / {INCLUDED_BATHROOMS} bathroom home — extra rooms are priced per room, never per hour.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> 24hr Magnolia Guarantee</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-champagne fill-champagne" /> Founding-member rates</span>
            <span className="inline-flex items-center gap-1.5"><Leaf className="h-4 w-4 text-primary" /> Eco products on request</span>
          </div>
        </div>
      </section>

      {/* Interactive controls */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 -mt-8 md:-mt-12 relative z-10">
        <div className="rounded-3xl bg-card border border-border shadow-bloom p-4 sm:p-6 md:p-8">
          <h2 className="sr-only">Build your Durant cleaning quote</h2>
          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
            {/* Frequency */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">How often?</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FREQS.map((f) => {
                  const active = freq === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFreq(f.id)}
                      className={
                        "relative rounded-2xl px-3 py-3 text-left transition border " +
                        (active
                          ? "bg-laurel text-white border-transparent shadow-bloom"
                          : "bg-secondary/40 border-border hover:border-primary/40")
                      }
                    >
                      <div className="text-sm font-bold">{f.label}</div>
                      <div className={"text-[11px] " + (active ? "text-white/80" : "text-muted-foreground")}>{f.sub}</div>
                      {f.badge && (
                        <span className={"absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full " + (active ? "bg-champagne text-foreground" : "bg-accent text-accent-foreground")}>
                          {f.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:block h-24 w-px bg-border" />

            {/* Home size steppers */}
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
              <Stepper label="Bedrooms" value={beds} onChange={setBeds} min={1} max={6} />
              <Stepper label="Bathrooms" value={baths} onChange={(n) => setBaths(clampBaths(n))} min={1} max={6} step={0.5} />
            </div>
          </div>

          {/* Add-ons — same catalog the booking wizard uses */}
          <div className="mt-6 border-t border-border pt-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add-ons (optional)</div>
              <span className="text-xs text-muted-foreground">
                {extras > 0 ? `+$${extras} added to every tier` : "Tap to add · price updates live"}
              </span>
            </div>
            <AddonPicker selected={addons} onToggle={toggleAddon} />
          </div>
        </div>
      </section>

      {/* Tier cards */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 py-14">
        <h2 className="sr-only">Cleaning plans and flat rates</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {priced.map((t) => (
            <TierCard key={t.id} tier={t} discount={discount} />
          ))}
        </div>
      </section>

      {/* Savings strip */}
      <SavingsStrip priced={priced} freq={freq} discount={discount} />

      {/* Comparison */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Compare what's inside</h2>
          <p className="mt-3 text-muted-foreground">Every checkmark is included in the flat rate. Zero upsells at your door.</p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid grid-cols-[1.3fr_repeat(3,minmax(0,1fr))] bg-ivory-wash text-xs sm:text-sm font-bold">
            <div className="p-3 md:p-5 text-muted-foreground">Feature</div>
            {TIERS.map((t) => (
              <div key={t.id} className={"p-3 md:p-5 text-center " + ((t as { highlight?: boolean }).highlight ? "bg-laurel text-white" : "")}>
                <div className="text-sm sm:text-lg leading-tight">
                  <span className="block sm:inline">{t.emoji}</span> {t.name}
                </div>
              </div>
            ))}
          </div>
          {COMPARE_ROWS.map((row, i) => (
            <div key={row.label} className={"grid grid-cols-[1.3fr_repeat(3,minmax(0,1fr))] items-center text-xs sm:text-sm " + (i % 2 ? "bg-secondary/30" : "")}>
              <div className="p-3 md:p-5 font-medium">{row.label}</div>
              {row.values.map((v, j) => (
                <div key={j} className="p-3 md:p-5 text-center">
                  {v === true ? (
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  ) : v === false ? (
                    <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1 text-muted-foreground"><Clock className="hidden sm:block h-3.5 w-3.5" /> {v}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Guarantee band */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 pb-16">
        <div className="rounded-3xl bg-laurel text-white p-8 md:p-12 relative overflow-hidden">
          <Flower2 className="absolute -bottom-6 -right-6 h-48 w-48 text-white/10" />
          <div className="grid md:grid-cols-3 gap-8 relative">
            <Perk icon={<ShieldCheck className="h-6 w-6" />} title="24-hour Magnolia Guarantee" body="Not thrilled? We'll return within 24 hours and re-clean at no cost." />
            <Perk icon={<Sparkles className="h-6 w-6" />} title="Flat-rate, no upsells" body="You see the number before we arrive. What we quote is what you pay." />
            <Perk icon={<Leaf className="h-6 w-6" />} title="Eco & pet friendly" body="Non-toxic products on request — safe for tiny toes and wet noses." />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-5 md:px-8 pb-16">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Little questions, honest answers</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-bold">{item.q}</span>
                  <span className={"h-8 w-8 rounded-full bg-secondary flex items-center justify-center transition " + (open ? "rotate-45" : "")}>
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                {open && <div className="px-5 pb-5 text-muted-foreground">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 pb-24">
        <div className="rounded-3xl bg-ivory-wash p-10 md:p-14 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 left-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
          <h3 className="font-display text-3xl md:text-4xl font-semibold">Ready when you are.</h3>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Your {countLabel(beds)} bd / {countLabel(baths)} ba setup carries straight into booking — pick a day and you're done.
          </p>
          <Link to="/booking" search={priced[1]!.search} className="mt-6 inline-flex items-center gap-2 rounded-full bg-laurel text-white px-8 py-4 font-bold shadow-bloom hover:brightness-110 transition">
            Continue to booking <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <QuoteCallCTA
        heading="See your exact price in about 60 seconds"
        body="Every quote is flat-rate and shown before you book. Questions? Call our Durant team."
      />
      <ShareButtons path="/pricing" title={"Cleaning Prices in Durant, OK | Magnolia Maids"} description={"Transparent flat-rate house cleaning pricing for Durant homes."} />
      <SiteFooter />
    </div>
  );
}

function Stepper({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{label}</div>
      <div className="flex items-center gap-2 rounded-2xl bg-secondary/40 border border-border p-1.5">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="h-11 w-11 shrink-0 md:h-10 md:w-10 rounded-xl bg-card border border-border hover:border-primary/40 flex items-center justify-center transition disabled:opacity-40"
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center">
          <div className="font-display text-2xl font-semibold leading-none tabular-nums">{countLabel(value)}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{value === 1 ? label.slice(0, -1) : label}</div>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="h-11 w-11 shrink-0 md:h-10 md:w-10 rounded-xl bg-card border border-border hover:border-primary/40 flex items-center justify-center transition disabled:opacity-40"
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TierCard({ tier, discount }: { tier: (typeof TIERS)[number] & { final: number; raw: number; saved: number; search: QuoteSearch }; discount: number }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const price = useCountUp(tier.final, inView, 700);
  const highlight = (tier as { highlight?: boolean }).highlight === true;
  return (
    <div
      ref={ref}
      className={
        "relative rounded-3xl border p-8 flex flex-col transition-transform duration-300 hover:-translate-y-1 " +
        (highlight
          ? "bg-laurel text-white border-transparent shadow-bloom md:-translate-y-3"
          : "bg-card border-border hover:shadow-bloom")
      }
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-champagne text-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
          ⭐ Best value
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-semibold">
          <span className="mr-1">{tier.emoji}</span> {tier.name}
        </h2>
        <span className={highlight ? "text-white/80 text-sm" : "text-muted-foreground text-sm"}>{tier.tagline}</span>
      </div>
      <div className="mt-5 flex items-end gap-1">
        <span className="font-display text-5xl font-semibold tracking-tight">${price}</span>
        <span className={(highlight ? "text-white/80" : "text-muted-foreground") + " mb-2"}>/ visit</span>
      </div>
      {discount > 0 && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className={highlight ? "line-through text-white/60" : "line-through text-muted-foreground"}>${tier.raw}</span>
          <span className={"font-bold px-2 py-0.5 rounded-full " + (highlight ? "bg-champagne text-foreground" : "bg-primary/10 text-primary")}>
            You save ${tier.saved}
          </span>
        </div>
      )}
      <ul className="mt-6 space-y-3 text-sm flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className={"h-4 w-4 mt-0.5 shrink-0 " + (highlight ? "text-champagne" : "text-primary")} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/booking"
        search={tier.search}
        className={
          "mt-8 inline-flex justify-center rounded-full px-6 py-3 font-bold transition " +
          (highlight
            ? "bg-white text-primary hover:bg-secondary"
            : "bg-accent text-accent-foreground hover:brightness-105")
        }
      >
        Continue with {tier.name} — ${tier.final}
      </Link>
    </div>
  );
}

function SavingsStrip({ priced, freq, discount }: { priced: { final: number; name: string; search: QuoteSearch }[]; freq: Frequency; discount: number }) {
  if (discount === 0) return null;
  const bright = priced.find((p) => p.name === "Bright")!;
  const visitsPerYear = freq === "weekly" ? 52 : freq === "biweekly" ? 26 : 12;
  const yearly = bright.final * visitsPerYear;
  const saved = Math.round((bright.final / (1 - discount)) * visitsPerYear - yearly);
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-accent/20 to-champagne/20 border border-border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold uppercase tracking-wider text-primary">Recurring savings</div>
          <div className="mt-1 font-display text-2xl md:text-3xl font-semibold">
            You'd save <span className="text-laurel">${saved}</span> per year on Bright.
          </div>
          <div className="text-sm text-muted-foreground">{visitsPerYear} visits × ${bright.final} = ${yearly.toLocaleString()} annually.</div>
        </div>
        <Link to="/booking" search={bright.search} className="rounded-full bg-laurel text-white px-6 py-3 font-bold hover:brightness-110 transition whitespace-nowrap">
          Lock in this rate
        </Link>
      </div>
    </section>
  );
}

function Perk({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center mb-3">{icon}</div>
      <div className="font-display text-xl font-semibold">{title}</div>
      <p className="mt-1 text-white/80 text-sm">{body}</p>
    </div>
  );
}