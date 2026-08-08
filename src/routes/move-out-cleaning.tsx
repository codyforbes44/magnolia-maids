import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { QuoteCallCTA } from "@/components/QuoteCallCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { HeroBackground } from "@/components/HeroBackground";
import mascot from "@/assets/magnolia-mark.webp";
import heroMove from "@/assets/hero-move-out.jpg";
import { serviceSchema, breadcrumbSchema } from "@/lib/structured-data";
import {
  getServiceRate,
  priceHome,
  INCLUDED_BEDROOMS,
  INCLUDED_BATHROOMS,
} from "@/lib/pricing";
import {
  Building2,
  KeyRound,
  Boxes,
  Home,
  ClipboardCheck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const RATE = getServiceRate("Move In / Out");
const MOVE_BASE = RATE.base;
const MOVE_3BD = priceHome({ service: "Move In / Out", frequency: "One-time", bedrooms: 3, bathrooms: 2 }).total;
const MOVE_4BD = priceHome({ service: "Move In / Out", frequency: "One-time", bedrooms: 4, bathrooms: 3 }).total;

const AUDIENCES = [
  { icon: KeyRound, title: "Tenants chasing a deposit", desc: "Durant apartments, duplexes, and rentals cleaned to the standard the walkthrough actually grades." },
  { icon: Building2, title: "Property managers", desc: "Standing turn crews for Bryan County units between leases — one invoice, photo proof per unit." },
  { icon: Home, title: "Home sellers & buyers", desc: "Spotless for listing photos and closing day, or move into a house cleaned before your boxes land." },
  { icon: Boxes, title: "Military & relocation moves", desc: "Out-of-state closings, SOSU staff relocations, and lake-house handoffs on a firm move date." },
];

const CHECKLIST = [
  "Inside all cabinets, drawers, and closets",
  "Inside fridge, oven, microwave, and dishwasher",
  "Windows, sills, and tracks",
  "Baseboards, door frames, switch plates, and vents",
  "Bathrooms: tub, tile, grout, toilet, and mirrors",
  "Light fixtures, ceiling fans, and blinds",
  "Cabinet fronts, counters, and backsplash degrease",
  "Floors vacuumed, mopped, and edge-detailed",
];

const STEPS = [
  { t: "Step 1", title: "Book your move date", desc: "Pick the day after the truck leaves (or before it arrives). Flat rate quoted up front from your bedroom and bathroom count." },
  { t: "Step 2", title: "Empty-home deep pass", desc: "We work an empty house top to bottom — inside cabinets, appliances, and every surface a walkthrough touches." },
  { t: "Step 3", title: "Inspection walkthrough", desc: "Crew lead walks the unit against the move-out checklist your landlord or manager uses." },
  { t: "Step 4", title: "Deposit-safe guarantee", desc: "If your landlord or buyer flags anything we cleaned, we return within 24 hours at no charge." },
];

const FAQS = [
  {
    q: "How much does move-out cleaning cost in Durant, OK?",
    a: `Flat rate from $${MOVE_BASE} for a ${INCLUDED_BEDROOMS} bedroom / ${INCLUDED_BATHROOMS} bathroom home. A 3 bed / 2 bath runs about $${MOVE_3BD} and a 4 bed / 3 bath about $${MOVE_4BD}. Extra bedrooms add $${RATE.perBed} and extra bathrooms $${RATE.perBath} — no hourly meter.`,
  },
  {
    q: "Will this get my security deposit back?",
    a: "We clean to the standard on a typical Bryan County move-out checklist — inside cabinets, appliances, windows, tracks, and baseboards. If your landlord or property manager flags something we cleaned, we come back within 24 hours free under the Magnolia Guarantee. Damage, repairs, and unpaid rent are between you and your landlord.",
  },
  {
    q: "Should the house be empty first?",
    a: "Yes. Move-out cleaning is priced for an empty home so we can reach inside every cabinet, closet, and appliance. If furniture or boxes are still in place, tell us when you book and we'll quote the added time honestly.",
  },
  {
    q: "Do you clean before I move in, too?",
    a: "Same service, opposite direction. Move-in cleans are the most common request we get from Durant buyers and renters who don't want to unpack into someone else's dust.",
  },
  {
    q: "How far ahead should I book?",
    a: "End of month and the first weekend of the month fill first in Durant, Calera, Caddo, Silo, and around Lake Texoma. Two weeks out is safest; we do take same-week moves when a slot opens.",
  },
  {
    q: "Do you work with property managers on multiple units?",
    a: "Yes. We run recurring turn schedules for Bryan County rentals and short-term properties, with per-unit photo checklists and consolidated monthly invoicing. Call and we'll set the standing schedule.",
  },
  {
    q: "Is carpet shampoo or garage cleaning included?",
    a: "Carpet shampoo, exterior windows, and garages or detached shops are quoted separately. Mention them when you book and we'll price them with the clean instead of surprising you after.",
  },
];

const TITLE = "Move-Out Cleaning in Durant, OK | Deposit-Safe | Magnolia Maids";
const DESC = `Deposit-safe move-out and move-in cleaning in Durant, OK from $${MOVE_BASE} flat. Inside cabinets, appliances, windows, and tracks — inspection-ready for tenants, buyers, and Bryan County property managers.`;

export const Route = createFileRoute("/move-out-cleaning")({
  component: MoveOutPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      {
        name: "keywords",
        content:
          "move out cleaning Durant OK, move in cleaning Durant Oklahoma, deposit cleaning Bryan County, apartment move out cleaners Durant, rental turnover cleaning Durant OK",
      },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content: `Inspection-ready move-out and move-in cleaning for Durant and Bryan County. Flat rate from $${MOVE_BASE}, 24-hour guarantee.`,
      },
      { property: "og:url", content: "https://magnoliamaids.pro/move-out-cleaning" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/move-out-cleaning" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceSchema({
            name: "Move-Out & Move-In Cleaning",
            description:
              "Deposit-safe move-out and move-in cleaning for empty homes, apartments, and rental turnovers in Durant, OK and Bryan County — inside cabinets, appliances, windows, and tracks, with a 24-hour inspection guarantee.",
            price: MOVE_BASE,
            url: "/move-out-cleaning",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Move-Out Cleaning in Durant, OK", path: "/move-out-cleaning" },
          ]),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
});

function MoveOutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-sage text-white">
        <HeroBackground src={heroMove} tone="dark" position="center 60%" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold tracking-wide">
              <Building2 className="h-3.5 w-3.5" /> DEPOSIT-SAFE · DURANT &amp; BRYAN COUNTY
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-semibold leading-[1.05]">
              Move-Out Cleaning in Durant, OK — <span className="text-accent-strong">inspection-ready</span>, deposit-safe.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/90 max-w-xl">
              Hand the keys back to a house that passes the walkthrough the first time. Inside every cabinet, every
              appliance, every window track — flat rate from ${MOVE_BASE}, backed by our 24-hour guarantee.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-white shadow-bloom hover:scale-[1.02] transition"
              >
                Book your move-out clean <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/30 px-7 py-3.5 font-semibold hover:bg-white/20 transition"
              >
                See flat pricing
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/85">
              <span className="inline-flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Inspection checklist walk</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Insured &amp; bonded</span>
              <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> 24-Hour Magnolia Guarantee</span>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[2rem] bg-white/10 backdrop-blur border border-white/20 p-6 md:p-8">
              <div className="text-xs uppercase tracking-wider text-white/70">Flat move-out rates</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span>{INCLUDED_BEDROOMS} bd / {INCLUDED_BATHROOMS} ba</span>
                  <span className="font-semibold tabular-nums">${MOVE_BASE}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span>3 bd / 2 ba</span>
                  <span className="font-semibold tabular-nums">${MOVE_3BD}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-accent/90 px-4 py-3">
                  <span className="font-semibold">4 bd / 3 ba</span>
                  <span className="font-display text-2xl font-semibold tabular-nums">${MOVE_4BD}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/75">
                Empty-home pricing. Extra bedrooms ${RATE.perBed}, extra bathrooms ${RATE.perBath}. No hourly meter.
              </p>
            </div>
            <img loading="lazy" decoding="async" src={mascot} alt="" className="absolute -bottom-6 -left-6 h-24 w-24 animate-float" />
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground">Built for the Durant move-out walkthrough.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tenants, landlords, sellers, and relocating families across Durant, Calera, Caddo, Silo, Kingston, and
            Lake Texoma — all graded by the same clipboard.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="rounded-3xl border border-border bg-card p-6 hover:shadow-bloom hover:-translate-y-1 transition">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/10 text-laurel">
                <a.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-foreground">{a.title}</h3>
              <p className="mt-2 text-muted-foreground">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CHECKLIST */}
      <section className="bg-gradient-to-b from-sky/30 to-transparent">
        <div className="mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground text-center">What the deposit-safe clean covers.</h2>
          <p className="mt-3 text-center text-lg text-muted-foreground">
            The list a landlord or buyer's agent actually checks — not a surface tidy.
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {CHECKLIST.map((c) => (
              <li key={c} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-laurel" />
                <span className="text-foreground">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* STEPS */}
      <section className="mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground text-center">How the handoff works.</h2>
        <ol className="mt-10 space-y-3">
          {STEPS.map((s) => (
            <li key={s.t} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="shrink-0 rounded-full bg-accent/15 text-laurel text-xs font-bold px-3 py-1 h-fit">{s.t}</span>
              <div>
                <div className="font-display text-lg font-bold text-foreground">{s.title}</div>
                <p className="mt-1 text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="rounded-[2rem] bg-gradient-to-br from-laurel to-primary text-white p-8 md:p-14 grid lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl md:text-5xl font-semibold">Flat rate, quoted before we start.</h2>
            <p className="mt-4 text-white/90 text-lg max-w-xl">
              Every move-out rate includes a {INCLUDED_BEDROOMS} bedroom / {INCLUDED_BATHROOMS} bathroom home. Larger
              homes add only for the extra rooms — the number you see when you book is the number you pay.
            </p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-white/95">
              {[
                `Move-out or move-in · from $${MOVE_BASE}`,
                `3 bd / 2 ba empty home · $${MOVE_3BD}`,
                `4 bd / 3 ba empty home · $${MOVE_4BD}`,
                "Inside cabinets & appliances · included",
                "Windows, sills & tracks · included",
                "24-hour re-clean guarantee · included",
              ].map((l) => (
                <li key={l} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> {l}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white text-foreground p-6 shadow-xl">
            <div className="text-xs font-semibold text-laurel uppercase tracking-wider">Deposit-safe flat rate</div>
            <div className="mt-2 font-display text-5xl font-semibold">
              ${MOVE_BASE}<span className="text-lg text-muted-foreground font-semibold">/move</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Empty {INCLUDED_BEDROOMS} bd / {INCLUDED_BATHROOMS} ba home in Durant.</p>
            <Link
              to="/booking"
              className="mt-5 w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 font-bold hover:scale-[1.02] transition"
            >
              Book your move date <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pricing" className="mt-3 block text-center text-sm font-semibold text-laurel underline underline-offset-4">
              Build a full estimate
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gradient-to-b from-transparent to-sky/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-sage/15 text-laurel px-4 py-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> FAQ
            </span>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-semibold text-foreground">Move-out cleaning, answered.</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/services" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-primary transition">
              Compare all services <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <Link to="/airbnb-turnover" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-primary transition">
              Airbnb turnover cleaning <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <Link to="/service-areas/$area" params={{ area: "bryan-county" }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-primary transition">
              Bryan County service area <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="rounded-[2rem] bg-gradient-to-br from-accent to-primary text-white p-10 md:p-16 text-center relative overflow-hidden">
          <img loading="lazy" decoding="async" src={mascot} alt="" className="absolute -bottom-6 -right-6 h-32 w-32 opacity-40 animate-float" />
          <h2 className="font-display text-3xl md:text-5xl font-semibold">Got a move date? Lock the crew.</h2>
          <p className="mt-4 text-white/90 text-lg max-w-xl mx-auto">
            End-of-month slots go first across Durant and Bryan County. Reserve your move-out clean and we'll confirm
            the crew and arrival window within the hour.
          </p>
          <Link
            to="/booking"
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white text-laurel px-8 py-4 font-bold shadow-xl hover:scale-[1.02] transition"
          >
            Book your move-out clean <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <QuoteCallCTA
        heading="Quote your move-out clean now"
        body="Flat rate by bedroom and bathroom count, deposit-safe checklist, 24-hour guarantee. Call to grab an end-of-month slot."
      />
      <ShareButtons path="/move-out-cleaning" title={TITLE} description={DESC} />
      <SiteFooter />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex min-h-11 items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-lg font-bold text-foreground">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-laurel transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-6 pb-6 text-muted-foreground">{a}</p>}
    </div>
  );
}
