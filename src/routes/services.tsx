import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { QuoteCallCTA } from "@/components/QuoteCallCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountPromo } from "@/components/AccountPromo";
import { ShareButtons } from "@/components/ShareButtons";
import {
  Home, Sparkles, Building2, PartyPopper, Leaf, Shirt, Check, X,
  Minus, Plus, Clock, ArrowRight, ChevronRight, KeyRound, Camera, Timer, Flower2, Briefcase,
} from "lucide-react";
import { useMemo, useState } from "react";
import mascot from "@/assets/magnolia-mark.webp";
import heroServices from "@/assets/hero-services.webp";
import { HeroBackground } from "@/components/HeroBackground";
import { breadcrumbSchema, serviceSchema, SERVICE_CATALOG } from "@/lib/structured-data";
import {
  getServiceRate, quoteVisit, FREQUENCY_RATES, INCLUDED_BEDROOMS, INCLUDED_BATHROOMS,
  ADDONS, addonsTotal, toQuoteSearch, type AddonKey,
  type ServiceKey as CanonServiceKey, type FrequencyKey,
} from "@/lib/pricing";
import { AddonPicker } from "@/components/HomeDetailsPicker";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Cleaning Services in Durant, OK | Magnolia Maids" },
      { name: "description", content: "Standard, deep, move-in/out, Lake Texoma Airbnb turnover, event, and office cleaning across Durant, OK and Bryan County. Vetted, insured crews." },
      { name: "keywords", content: "cleaning services Durant OK, deep cleaning Durant, move out cleaning Durant Oklahoma, office cleaning Durant OK, commercial cleaning Bryan County, maid service Bryan County, house cleaners near me Durant" },
      { property: "og:title", content: "Cleaning Services in Durant, OK | Magnolia Maids" },
      { property: "og:description", content: "From weekly refreshes and deep cleans to move-outs and after-hours office cleaning, we handle every kind of Durant space." },
      { property: "og:url", content: "https://magnoliamaids.pro/services" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/services" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Cleaning Services in Durant, OK", path: "/services" },
        ])),
      },
      ...SERVICE_CATALOG.map((s) => ({
        type: "application/ld+json",
        children: JSON.stringify(serviceSchema({ name: s.name, description: s.description, price: s.price, url: "/services" })),
      })),
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "How do you calculate my price?", acceptedAnswer: { "@type": "Answer", text: "Base rate for the service, plus a small amount per bedroom and bathroom. Add-ons are optional. The number you see is the number you pay — no surprises." } },
            { "@type": "Question", name: "Do you bring supplies?", acceptedAnswer: { "@type": "Answer", text: "Yes — cleaners, cloths, tools, everything. Eco add-on swaps in plant-based products." } },
            { "@type": "Question", name: "What if I have a big house?", acceptedAnswer: { "@type": "Answer", text: "For homes over 4 bedrooms or specialty spaces, book and note it — we'll confirm a tailored estimate within an hour." } },
          ],
        }),
      },
    ],
  }),
});

type ServiceKey = "standard" | "deep" | "airbnb" | "move" | "prep" | "party" | "office";

/** Map page tabs → canonical rate keys in src/lib/pricing.ts. */
const CANON: Record<ServiceKey, CanonServiceKey> = {
  standard: "Standard Clean",
  deep: "Deep Clean",
  airbnb: "Airbnb Turnover",
  move: "Move In / Out",
  prep: "Pre-Event Prep",
  party: "Post-Party",
  office: "Office Cleaning",
};

const services: Record<ServiceKey, {
  icon: typeof Home; title: string; tag: string; desc: string;
  baseHours: number; hoursPerBed: number;
  best: string; items: string[]; color: string;
}> = {
  standard: {
    icon: Home, title: "Standard Clean", tag: "Signature plan",
    desc: "Weekly, biweekly, or monthly upkeep so your home always feels fresh.",
    baseHours: 1.5, hoursPerBed: 0.5,
    best: "Best for tidy homes on a regular rhythm",
    color: "primary",
    items: ["Dust & wipe all surfaces", "Vacuum & mop floors", "Kitchen & bathrooms refresh", "Beds made & trash out"],
  },
  deep: {
    icon: Sparkles, title: "Deep Clean", tag: "Best first visit",
    desc: "The full spa treatment — perfect for first visits or seasonal resets.",
    baseHours: 3, hoursPerBed: 0.75,
    best: "Best when it's been a minute since the last clean",
    color: "sage",
    items: ["Everything in Standard", "Baseboards, vents & fans", "Inside microwave & oven", "Tile, grout & shower scrub"],
  },
  airbnb: {
    icon: KeyRound, title: "Airbnb Turnover", tag: "Lake Texoma hosts",
    desc: "Guest-ready flips between stays for lake houses, cabins, and casino-corridor rentals — linens, staging photos, and restock alerts included.",
    baseHours: 1.5, hoursPerBed: 0.4,
    best: "Best for Lake Texoma hosts on tight weekend turnarounds",
    color: "sage",
    items: ["Same-day 2-hour flips", "Hotel-grade linen swap", "Sand & lake-grit entry reset", "Photo checklist per turn"],
  },
  move: {
    icon: Building2, title: "Move In / Out", tag: "Deposit-safe",
    desc: "Leave a spotless space — or move into one that already sparkles.",
    baseHours: 4, hoursPerBed: 1,
    best: "Best for empty homes ready for inspection",
    color: "forest",
    items: ["Inside all cabinets & drawers", "Inside fridge & appliances", "Windows, sills & tracks", "Guaranteed inspection-ready"],
  },
  prep: {
    icon: Flower2, title: "Pre-Event Prep", tag: "Before guests arrive",
    desc: "Guest-ready before the graduation lunch, holiday dinner, or family reunion rolls in.",
    baseHours: 2, hoursPerBed: 0.4,
    best: "Best for hosting weekends and out-of-town family",
    color: "sage",
    items: ["Guest bath & guest room detail", "Kitchen & dining reset", "Entry, porch & patio sweep", "Scheduled the day before"],
  },
  party: {
    icon: PartyPopper, title: "Post-Event Clean", tag: "Same or next day",
    desc: "Graduations, holidays, church and family gatherings, wedding weekends, tailgates — we handle the morning after.",
    baseHours: 2, hoursPerBed: 0.4,
    best: "Best for morning-after resets in Durant and Bryan County",
    color: "accent",
    items: ["Same or next-day slots", "Dishes, glassware & floors", "Stain treatment", "Deodorizing & fresh air"],
  },
  office: {
    icon: Briefcase, title: "Office Cleaning", tag: "Small business",
    desc: "Offices, clinics, salons, and Main Street storefronts in Durant — cleaned after hours or before you open.",
    baseHours: 2, hoursPerBed: 0.4,
    best: "Best for small business suites under 5,000 sq ft",
    color: "forest",
    items: ["After-hours & weekend crews", "Desks, breakroom & restrooms", "Trash, recycling & restock", "Insured, background-checked staff"],
  },
};

const compareRows = [
  // standard, deep, airbnb, move, prep, party, office
  ["Dust, vacuum, mop", true, true, true, true, true, false, true],
  ["Kitchen & baths refresh", true, true, true, true, true, true, true],
  ["Baseboards & vents", false, true, false, true, false, false, false],
  ["Inside oven & microwave", false, true, false, true, false, false, false],
  ["Inside cabinets & drawers", false, false, false, true, false, false, false],
  ["Interior windows & tracks", false, false, false, true, false, false, false],
  ["Linen swap & bed staging", false, false, true, false, true, false, false],
  ["Guest room & guest bath detail", false, false, true, false, true, false, false],
  ["Photo checklist per visit", false, false, true, false, false, false, true],
  ["Same or next-day availability", false, false, true, false, true, true, false],
  ["Stain & odor treatment", false, false, false, false, false, true, false],
  ["After-hours & weekend scheduling", false, false, true, false, false, true, true],
  ["Trash, recycling & supply restock", false, false, true, false, false, false, true],
] as const;

const timeline = [
  { t: "0:00", title: "Meet & greet", desc: "Crew arrives on time and walks the space with you." },
  { t: "0:05", title: "Prep the flow", desc: "Top-to-bottom, back-to-front — no re-cleaning." },
  { t: "0:30", title: "Kitchen & baths", desc: "The heavy hitters get the attention they deserve." },
  { t: "1:30", title: "Living zones", desc: "Dust, vacuum, mop, and make the beds sing." },
  { t: "—", title: "Final walkthrough", desc: "You inspect. Anything off? We stay until it's right." },
];

const faqs = [
  { q: "How do you calculate my price?", a: `Every flat rate includes a ${INCLUDED_BEDROOMS} bedroom / ${INCLUDED_BATHROOMS} bathroom home. We add a small amount only for bedrooms and bathrooms above that, then apply your recurring discount. Add-ons are optional. The number you see is the number you pay — no surprises.` },
  { q: "Do you bring supplies?", a: "Yes — cleaners, cloths, tools, everything. Eco add-on swaps in plant-based products." },
  { q: "What if I have a big house?", a: "For homes over 4 bedrooms or specialty spaces, book and note it — we'll confirm a tailored estimate within an hour." },
];

function ServicesPage() {
  const [active, setActive] = useState<ServiceKey>("standard");
  const [beds, setBeds] = useState(2);
  const [baths, setBaths] = useState(2);
  const [selected, setSelected] = useState<AddonKey[]>(["eco"]);
  const [frequency, setFrequency] = useState<FrequencyKey>("One-time");
  const svc = services[active];
  const rate = getServiceRate(CANON[active]);

  const quote = useMemo(
    () => quoteVisit({ service: CANON[active], frequency, bedrooms: beds, bathrooms: baths, addons: selected }),
    [active, frequency, beds, baths, selected],
  );

  const extraBeds = Math.max(0, beds - INCLUDED_BEDROOMS);
  const extraBaths = Math.max(0, baths - INCLUDED_BATHROOMS);
  const price = quote.total;

  /** Hand the whole configuration to the booking wizard. */
  const bookingSearch = toQuoteSearch({
    service: CANON[active],
    frequency,
    bedrooms: beds,
    bathrooms: baths,
    addons: selected,
  });

  const hours = useMemo(() => {
    const h = svc.baseHours + svc.hoursPerBed * (beds + baths * 0.6);
    return Math.round(h * 10) / 10;
  }, [svc, beds, baths]);

  const toggle = (id: AddonKey) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-ivory-wash">
        <HeroBackground src={heroServices} position="center 40%" />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-10 left-[8%] h-4 w-4 rounded-full bg-white/70 animate-float-slow" />
          <div className="absolute top-32 right-[14%] h-6 w-6 rounded-full bg-white/60 animate-float-slow" style={{ animationDelay: "1.4s" }} />
          <div className="absolute bottom-8 left-[35%] h-3 w-3 rounded-full bg-white/80 animate-float-slow" style={{ animationDelay: "0.7s" }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-24 text-center">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Services</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold">Our Cleaning Services in Durant, OK</h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground">
            Pick a service, tune it to your home, and see your price update instantly.
            No calls. No hidden fees.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-1.5 rounded-3xl border border-border bg-white p-1.5 shadow-sm sm:inline-flex sm:flex-wrap sm:justify-center sm:gap-1 sm:rounded-full">
            {(Object.keys(services) as ServiceKey[]).map((k) => {
              const s = services[k];
              const on = active === k;
              return (
                <button
                  key={k}
                  onClick={() => setActive(k)}
                  aria-pressed={on}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-[13px] font-bold transition last:odd:col-span-2 sm:px-4 sm:text-sm sm:last:odd:col-span-1 ${on ? "bg-primary text-primary-foreground shadow-bloom" : "text-foreground hover:bg-secondary"}`}
                >
                  <s.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
        <svg className="block w-full h-14 md:h-20 text-background" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
          <path fill="currentColor" d="M0,64L60,58.7C120,53,240,43,360,53.3C480,64,600,96,720,96C840,96,960,64,1080,58.7C1200,53,1320,75,1380,85.3L1440,96L1440,120L0,120Z" />
        </svg>
      </section>

      {/* INTERACTIVE BUILDER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pt-12 md:pt-16 pb-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT: config */}
          <div className="rounded-[2rem] bg-card border border-border p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-xs font-bold">
                  <Sparkles className="h-3.5 w-3.5" /> {svc.tag}
                </span>
                <h2 className="mt-3 font-display text-3xl md:text-4xl font-semibold flex items-center gap-3">
                  <svc.icon className="h-8 w-8 text-primary" /> {svc.title}
                </h2>
                <p className="mt-2 text-muted-foreground max-w-lg">{svc.desc}</p>
                <p className="mt-1 text-xs text-primary font-bold">{svc.best}</p>
              </div>
              <ul className="grid grid-cols-1 gap-2 text-sm">
                {svc.items.map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <span className="grid place-items-center h-5 w-5 rounded-full bg-secondary text-primary shrink-0"><Check className="h-3 w-3" /></span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>

            <div className="my-8 h-px bg-border" />

            {/* Home size */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Stepper label={active === "office" ? "Private offices / rooms" : "Bedrooms"} value={beds} setValue={setBeds} min={0} max={6} icon={active === "office" ? "🏢" : "🛏️"} />
              <Stepper label={active === "office" ? "Restrooms" : "Bathrooms"} value={baths} setValue={setBaths} min={1} max={6} icon={active === "office" ? "🚻" : "🛁"} />
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xl font-bold">Add-ons</h3>
                <span className="text-xs text-muted-foreground">Tap to add · price updates live</span>
              </div>
              <AddonPicker selected={selected} onToggle={toggle} />
            </div>
          </div>

          {/* RIGHT: estimate card */}
          <aside className="lg:sticky lg:top-24 self-start rounded-[2rem] bg-laurel text-white p-6 md:p-8 relative overflow-hidden">
            <img loading="lazy" decoding="async" src={mascot} alt="" aria-hidden className="hidden md:block absolute -right-6 -bottom-6 w-40 opacity-90 animate-bob" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest font-bold text-white/70">Your estimate</p>
              <div className="mt-2 flex items-end gap-2">
                <span key={price} className="font-display text-6xl md:text-7xl font-semibold animate-rise">${price}</span>
                <span className="mb-2 text-sm text-white/80">flat</span>
              </div>
              <div className="mt-1 text-white/80 text-sm flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> ~{hours} hrs on site
              </div>

              {rate.recurring && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-widest font-bold text-white/70">How often?</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {FREQUENCY_RATES.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFrequency(f.key)}
                        className={`tap-target rounded-full px-3 py-2 text-xs font-bold transition ${frequency === f.key ? "bg-white text-laurel" : "bg-white/15 text-white hover:bg-white/25"}`}
                      >
                        {f.key}{f.discount > 0 ? ` · ${Math.round(f.discount * 100)}%` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ul className="mt-6 space-y-1.5 text-sm text-white/90">
                <li className="flex justify-between"><span>{svc.title} base ({INCLUDED_BEDROOMS}bd/{INCLUDED_BATHROOMS}ba)</span><span>${rate.base}</span></li>
                {extraBeds > 0 && (
                  <li className="flex justify-between"><span>+{extraBeds} bedroom{extraBeds === 1 ? "" : "s"}</span><span>${extraBeds * rate.perBed}</span></li>
                )}
                {extraBaths > 0 && (
                  <li className="flex justify-between"><span>+{extraBaths} bathroom{extraBaths === 1 ? "" : "s"}</span><span>${Math.round(extraBaths * rate.perBath)}</span></li>
                )}
                {quote.discount > 0 && (
                  <li className="flex justify-between font-bold"><span>{frequency} discount ({Math.round(quote.discount * 100)}%)</span><span>−${quote.savings}</span></li>
                )}
                {ADDONS.filter((a) => selected.includes(a.key)).map((a) => (
                  <li key={a.key} className="flex justify-between"><span>+ {a.label}</span><span>${a.price}</span></li>
                ))}
              </ul>

              <Link to="/booking" search={bookingSearch} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition">
                Continue with this quote — ${price} <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-white/70 text-center">No card required. Your choices carry over to booking.</p>
            </div>
          </aside>
        </div>
      </section>

      {/* SPECIALTY STRIP */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Leaf, title: "Eco-friendly", desc: "Plant-based, pet-safe products by request." },
            { icon: Shirt, title: "Laundry & linens", desc: "Wash, fold, and fresh sheets on your bed." },
            { icon: PartyPopper, title: "Event resets", desc: "Graduations, holidays, reunions — before and after." },
            { icon: Building2, title: "Lake Texoma turnovers", desc: "Guest-ready in a two-hour window." },
          ].map((s) => (
            <div key={s.title} className="group rounded-2xl bg-white border border-border p-5 hover:-translate-y-1 hover:shadow-bloom transition">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/airbnb-turnover" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold hover:border-primary transition">
            Lake Texoma Airbnb turnovers <ChevronRight className="h-4 w-4 text-primary" />
          </Link>
          <Link to="/post-event-cleaning" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold hover:border-primary transition">
            Pre- &amp; post-event cleaning <ChevronRight className="h-4 w-4 text-primary" />
          </Link>
          <Link to="/move-out-cleaning" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold hover:border-primary transition">
            Move-out cleaning in Durant <ChevronRight className="h-4 w-4 text-primary" />
          </Link>
          <Link to="/apartment-turnovers" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold hover:border-primary transition">
            Apartment &amp; property turnovers <ChevronRight className="h-4 w-4 text-primary" />
          </Link>
        </div>
      </section>

      {/* COMPARE TABLE */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-primary font-bold text-sm uppercase tracking-wider">Compare</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">What's included?</h2>
          </div>
          {/* Mobile: per-service accordion cards (no horizontal scrolling). */}
          <div className="mt-8 space-y-3 md:hidden">
            {(Object.keys(services) as ServiceKey[]).map((k, col) => (
              <details key={k} open={active === k} className="rounded-2xl border border-border bg-white p-4 open:border-primary">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-bold">
                  {services[k].title}
                  <ChevronRight className="h-4 w-4 shrink-0 text-primary transition-transform [details[open]_&]:rotate-90" />
                </summary>
                <ul className="mt-3 space-y-2">
                  {compareRows.map((row, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span className={row[col + 1] ? "" : "text-muted-foreground"}>{row[0]}</span>
                      {row[col + 1] ? (
                        <span className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>
                      ) : (
                        <span className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><X className="h-3.5 w-3.5" /></span>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          <div className="mt-10 hidden overflow-x-auto rounded-3xl border border-border bg-white md:block">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-5 font-display text-sm uppercase tracking-wider text-muted-foreground">Feature</th>
                  {(Object.keys(services) as ServiceKey[]).map((k) => (
                    <th key={k} className={`p-5 font-display text-sm ${active === k ? "text-primary" : ""}`}>
                      <button onClick={() => setActive(k)} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 font-bold">
                        {services[k].title}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-5 text-sm font-semibold">{row[0]}</td>
                    {row.slice(1).map((v, j) => (
                      <td key={j} className="p-5">
                        {v ? (
                          <span className="inline-grid place-items-center h-6 w-6 rounded-full bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>
                        ) : (
                          <span className="inline-grid place-items-center h-6 w-6 rounded-full bg-muted text-muted-foreground"><X className="h-3.5 w-3.5" /></span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Visit day</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">A day with Magnolia Maids</h2>
          <p className="mt-3 text-muted-foreground">Here's exactly how the crew moves through your home.</p>
        </div>
        <ol className="mt-12 relative border-l-2 border-dashed border-primary/30 ml-4 space-y-8">
          {timeline.map((t, i) => (
            <li key={i} className="pl-6 relative">
              <span className="absolute -left-[13px] top-1 grid place-items-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-bloom">
                {i + 1}
              </span>
              <div className="rounded-2xl bg-card border border-border p-5 hover:-translate-y-1 hover:shadow-bloom transition">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary bg-secondary rounded-full px-2 py-0.5">{t.t}</span>
                  <h3 className="font-display text-xl font-bold">{t.title}</h3>
                </div>
                <p className="mt-2 text-muted-foreground text-sm">{t.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 pb-16">
        <div className="text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold">Good questions</h2>
        </div>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-white border border-border p-5 open:border-primary transition">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-lg font-bold list-none">
                {f.q}
                <ChevronRight className="h-5 w-5 text-primary transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-laurel text-white p-10 md:p-14 text-center">
          <img loading="lazy" decoding="async" src={mascot} alt="" aria-hidden className="hidden md:block absolute -right-4 -bottom-6 w-48 animate-bob" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Still not sure which one you need?</h2>
            <p className="mt-3 text-white/90">Magnolia Maids will help you pick — just tell us about your space.</p>
            <Link to="/booking" className="mt-6 inline-flex rounded-full bg-white text-primary px-6 py-3.5 font-bold hover:bg-secondary transition">Get a Free Quote</Link>
          </div>
        </div>
      </section>
      <QuoteCallCTA
        heading="Ready to book your Durant cleaning?"
        body="Pick a service, see the flat price instantly, or call and we'll help you choose."
      />
      <ShareButtons path="/services" title={"Cleaning Services in Durant, OK | Magnolia Maids"} description={"Deep cleans, recurring service, move-in/out, and Airbnb turnovers in Durant."} />
      <SiteFooter />
    </div>
  );
}

function Stepper({ label, value, setValue, min, max, icon }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number; icon: string }) {
  return (
    <div className="rounded-2xl bg-white border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{icon} {label}</span>
        <span className="text-xs text-muted-foreground">{min}–{max}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          onClick={() => setValue(Math.max(min, value - 1))}
          className="grid place-items-center h-11 w-11 rounded-full bg-secondary text-primary hover:bg-primary hover:text-primary-foreground transition disabled:opacity-40"
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-5 w-5" />
        </button>
        <div className="flex-1 flex justify-center gap-1.5">
          {Array.from({ length: max - min + 1 }).map((_, i) => {
            const n = min + i;
            const on = n <= value;
            return <span key={i} className={`h-2 flex-1 rounded-full transition ${on ? "bg-primary" : "bg-secondary"}`} />;
          })}
        </div>
        <span className="font-display text-3xl font-semibold w-10 text-center">{value}</span>
        <button
          onClick={() => setValue(Math.min(max, value + 1))}
          className="grid place-items-center h-11 w-11 rounded-full bg-secondary text-primary hover:bg-primary hover:text-primary-foreground transition disabled:opacity-40"
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}