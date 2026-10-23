import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { QuoteCallCTA } from "@/components/QuoteCallCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { HeroBackground } from "@/components/HeroBackground";
import mascot from "@/assets/magnolia-mark.webp";
import heroEvent from "@/assets/hero-post-event.webp";
import { serviceSchema, breadcrumbSchema } from "@/lib/structured-data";
import {
  getServiceRate,
  priceHome,
  priceHostWeekend,
  HOST_WEEKEND_DISCOUNT,
  INCLUDED_BEDROOMS,
  INCLUDED_BATHROOMS,
} from "@/lib/pricing";
import {
  PartyPopper,
  GraduationCap,
  Church,
  Heart,
  Trees,
  Snowflake,
  Flower2,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const PRE_BASE = getServiceRate("Pre-Event Prep").base;
const POST_BASE = getServiceRate("Post-Party").base;
const BUNDLE = priceHostWeekend({ bedrooms: 3, bathrooms: 2 });
const POST_3BD = priceHome({ service: "Post-Party", frequency: "One-time", bedrooms: 3, bathrooms: 2 }).total;

const FAQS = [
  {
    q: "How soon after my event can you clean?",
    a: "Same day or next morning in Durant, Calera, Silo, and Caddo. Graduation and holiday weekends book out first, so reserve your date as soon as you set the party date.",
  },
  {
    q: "What does a Post-Event Clean include?",
    a: `Dishes and glassware, kitchen and counters, all bathrooms, floors vacuumed and mopped, trash and recycling out, spot stain treatment on carpet and upholstery, and full deodorizing. Flat rate starts at $${POST_BASE} for a ${INCLUDED_BEDROOMS} bedroom / ${INCLUDED_BATHROOMS} bathroom home.`,
  },
  {
    q: "Can you clean before the party instead?",
    a: `Yes — Pre-Event Prep starts at $${PRE_BASE} and focuses on what guests actually see: entry, guest bath, guest room, kitchen, dining, and the porch or patio. We schedule it the day before so nothing has time to get dusty again.`,
  },
  {
    q: "What is the Host Weekend bundle?",
    a: `Pre-Event Prep before your guests arrive plus a Post-Event Clean after they leave, booked together for ${Math.round(HOST_WEEKEND_DISCOUNT * 100)}% off the combined total. A 3 bed / 2 bath Durant home runs about $${BUNDLE.total} for both visits instead of $${BUNDLE.raw}.`,
  },
  {
    q: "Do you handle graduation and SOSU family weekends?",
    a: "We do. Southeastern Oklahoma State University graduation, move-in, and homecoming weekends fill the calendar fast, along with hunting-camp weekends and wedding-weekend house rentals. Booking two weeks out is safest for those dates.",
  },
  {
    q: "Is there a limit on how big the mess can be?",
    a: "No, but very heavy events (large receptions, red wine on light carpet, outdoor mud) can price up to about 15% above the flat rate. We tell you before we start, never after.",
  },
  {
    q: "Do you clean the porch, patio, or garage?",
    a: "Porch and patio sweeps are included when the event used them. Garages and detached shops are quoted separately — just mention them when you book.",
  },
];

const EVENTS = [
  { icon: GraduationCap, title: "Graduation parties", desc: "SOSU and Durant High weekends with a houseful of out-of-town family." },
  { icon: Snowflake, title: "Holiday gatherings", desc: "Thanksgiving, Christmas, and New Year's — the full kitchen and dining reset." },
  { icon: Church, title: "Church & community", desc: "Small-group nights, potlucks, and fellowship dinners hosted at home." },
  { icon: Heart, title: "Wedding weekends", desc: "Rehearsal dinners, showers, and rented houses that need a spotless handoff." },
  { icon: Trees, title: "Lake & hunting weekends", desc: "Lake Texoma cabins and hunting camps after a long weekend of company." },
  { icon: PartyPopper, title: "Birthdays & reunions", desc: "Family reunions, milestone birthdays, and anniversary dinners." },
];

const TIMELINE = [
  { t: "Step 1", title: "Walk & triage", desc: "Crew walks the space with you and flags anything time-sensitive — spills, stains, food left out." },
  { t: "Step 2", title: "Kitchen first", desc: "Dishes, glassware, counters, sink, stovetop, and the fridge overflow from the party." },
  { t: "Step 3", title: "Trash & recycling", desc: "Bagged, hauled to the bin, and liners replaced throughout the house." },
  { t: "Step 4", title: "Bathrooms", desc: "Every bath guests used gets sanitized, restocked, and reset." },
  { t: "Step 5", title: "Floors & surfaces", desc: "Vacuum, mop, and wipe down every surface company touched." },
  { t: "Step 6", title: "Stains & odor", desc: "Spot treatment on carpet and upholstery, then deodorize and air out." },
  { t: "Step 7", title: "Final walkthrough", desc: "You inspect. Anything missed is re-cleaned within 24 hours, free." },
];

export const Route = createFileRoute("/post-event-cleaning")({
  component: PostEventPage,
  head: () => ({
    meta: [
      { title: "Post-Event & Party Cleaning in Durant, OK | Magnolia Maids" },
      {
        name: "description",
        content: `Same or next-day post-event cleaning in Durant, OK from $${POST_BASE}, plus pre-event prep from $${PRE_BASE}. Graduations, holidays, reunions, and wedding weekends across Bryan County.`,
      },
      { name: "keywords", content: "post party cleaning Durant OK, after party cleaners Bryan County, event cleaning Durant Oklahoma, graduation party cleanup, holiday cleaning service Durant" },
      { property: "og:title", content: "Post-Event & Party Cleaning in Durant, OK | Magnolia Maids" },
      { property: "og:description", content: "Before the guests arrive and after they leave — event cleaning for Durant, Calera, Caddo, Silo, and Lake Texoma homes." },
      { property: "og:url", content: "https://magnoliamaids.pro/post-event-cleaning" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/post-event-cleaning" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceSchema({
            name: "Post-Event Cleaning",
            description:
              "Same or next-day cleaning after graduations, holidays, church gatherings, reunions, and wedding weekends in Durant, OK and Bryan County, plus pre-event prep before guests arrive.",
            price: POST_BASE,
            url: "/post-event-cleaning",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Post-Event Cleaning in Durant, OK", path: "/post-event-cleaning" },
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

function PostEventPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-sage text-white">
        <HeroBackground src={heroEvent} tone="dark" position="center 55%" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold tracking-wide">
              <PartyPopper className="h-3.5 w-3.5" /> EVENT CLEANING · DURANT &amp; BRYAN COUNTY
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-semibold leading-[1.05]">
              You host. <span className="text-accent-strong">We handle</span> the before and after.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/90 max-w-xl">
              Graduation lunches, holiday dinners, church gatherings, reunions, wedding weekends — Magnolia Maids
              gets the house guest-ready beforehand and back to normal the morning after.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-white shadow-bloom hover:scale-[1.02] transition"
              >
                Reserve your event date <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/30 px-7 py-3.5 font-semibold hover:bg-white/20 transition"
              >
                See pricing
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/85">
              <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> Same or next-day slots</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Insured &amp; bonded</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> 24-Hour Magnolia Guarantee</span>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-2xl">
              <div className="text-xs uppercase tracking-wider text-white/70">Host Weekend bundle</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="inline-flex items-center gap-2"><Flower2 className="h-4 w-4" /> Pre-Event Prep</span>
                  <span className="font-semibold tabular-nums">${BUNDLE.pre}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="inline-flex items-center gap-2"><PartyPopper className="h-4 w-4" /> Post-Event Clean</span>
                  <span className="font-semibold tabular-nums">${BUNDLE.post}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-accent/90 px-4 py-3">
                  <span className="font-semibold">Booked together</span>
                  <span className="font-display text-2xl font-semibold tabular-nums">${BUNDLE.total}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/75">
                Example for a 3 bed / 2 bath Durant home — saves ${BUNDLE.savings} ({Math.round(HOST_WEEKEND_DISCOUNT * 100)}% off both visits).
              </p>
            </div>
            <img loading="lazy" decoding="async" src={mascot} alt="" className="absolute -bottom-6 -left-6 h-24 w-24 animate-float" />
          </div>
        </div>
      </section>

      {/* EVENT TYPES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground">The gatherings Durant actually hosts.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We built this service around the Bryan County calendar — graduation season, deer camp, the holidays, and
            everything in between.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((e) => (
            <div key={e.title} className="rounded-3xl border border-border bg-card p-6 hover:shadow-bloom hover:-translate-y-1 transition">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/10 text-laurel">
                <e.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-foreground">{e.title}</h3>
              <p className="mt-2 text-muted-foreground">{e.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-gradient-to-b from-sky/30 to-transparent">
        <div className="mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground text-center">How the morning after goes.</h2>
          <p className="mt-3 text-center text-lg text-muted-foreground">A fixed order so nothing gets missed — and nothing gets cleaned twice.</p>
          <ol className="mt-10 space-y-3">
            {TIMELINE.map((s) => (
              <li key={s.t} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <span className="shrink-0 rounded-full bg-accent/15 text-laurel text-xs font-bold px-3 py-1 h-fit">{s.t}</span>
                <div>
                  <div className="font-display text-lg font-bold text-foreground">{s.title}</div>
                  <p className="mt-1 text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="rounded-[2rem] bg-gradient-to-br from-laurel to-primary text-white p-8 md:p-14 grid lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl md:text-5xl font-semibold">Flat rates, set before the party.</h2>
            <p className="mt-4 text-white/90 text-lg max-w-xl">
              Every rate includes a {INCLUDED_BEDROOMS} bedroom / {INCLUDED_BATHROOMS} bathroom home. Larger homes add
              only for the extra rooms — no hourly surprises the morning after.
            </p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-white/95">
              {[
                `Pre-Event Prep · from $${PRE_BASE}`,
                `Post-Event Clean · from $${POST_BASE}`,
                `3 bd / 2 ba post-event · $${POST_3BD}`,
                `Host Weekend bundle · ${Math.round(HOST_WEEKEND_DISCOUNT * 100)}% off both`,
                "Stain & odor treatment · included",
                "Same or next-day slot · included",
              ].map((l) => (
                <li key={l} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> {l}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white text-foreground p-6 shadow-xl">
            <div className="text-xs font-semibold text-laurel uppercase tracking-wider">Flat rate</div>
            <div className="mt-2 font-display text-5xl font-semibold">
              ${POST_BASE}<span className="text-lg text-muted-foreground font-semibold">/event</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">One flat price, quoted before you book.</p>
            <Link
              to="/booking"
              className="mt-5 w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 font-bold hover:scale-[1.02] transition"
            >
              Reserve your date <ArrowRight className="h-4 w-4" />
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
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-semibold text-foreground">Event cleaning, answered.</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="rounded-[2rem] bg-gradient-to-br from-accent to-primary text-white p-10 md:p-16 text-center relative overflow-hidden">
          <img loading="lazy" decoding="async" src={mascot} alt="" className="absolute -bottom-6 -right-6 h-32 w-32 opacity-40 animate-float" />
          <h2 className="font-display text-3xl md:text-5xl font-semibold">Know your date? Claim the crew.</h2>
          <p className="mt-4 text-white/90 text-lg max-w-xl mx-auto">
            Graduation and holiday weekends fill first in Durant. Reserve your event date now and we'll confirm the
            crew and time within the hour.
          </p>
          <Link
            to="/booking"
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white text-laurel px-8 py-4 font-bold shadow-xl hover:scale-[1.02] transition"
          >
            Reserve your event date <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <QuoteCallCTA
        heading="Quote your event weekend now"
        body="Pre-Event Prep, Post-Event Clean, or both for 10% off. Call to lock a date around your event."
      />
      <ShareButtons
        path="/post-event-cleaning"
        title={"Post-Event & Party Cleaning in Durant, OK | Magnolia Maids"}
        description={"Pre-event prep and same or next-day post-event cleaning for Durant and Bryan County homes."}
      />
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