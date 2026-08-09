import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { localBusinessSchema, SITE_URL } from "@/lib/structured-data";
import { ADDONS, FREQUENCY_RATES, getServiceRate, priceHostWeekend, toQuoteSearch, type ServiceKey } from "@/lib/pricing";
import { CAMPAIGNS } from "@/lib/campaigns";
import { InstantQuote } from "@/components/InstantQuote";
import { FaqAccordion } from "@/components/FaqAccordion";
import { AccountPromo } from "@/components/AccountPromo";
import { faqPageSchema } from "@/lib/faq";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { QuoteCallCTA, PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import { BeforeAfter } from "@/components/BeforeAfter";
import { useInViewOnce, useCountUp } from "@/hooks/useInViewOnce";
import { useEffect, useState } from "react";
import mascot from "@/assets/magnolia-mark.webp";
import durantHome from "@/assets/durant-home.webp";
import beforeImg from "@/assets/before.webp";
import afterImg from "@/assets/after.webp";
import {
  Sparkles,
  CalendarCheck,
  Leaf,
  ShieldCheck,
  Star,
  Home,
  Building2,
  PartyPopper,
  ArrowRight,
  Clock,
  MapPin,
  Heart,
  Play,
  Check,
  Flower2,
  KeyRound,
  Camera,
  Timer,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "House Cleaning in Durant, OK | Magnolia Maids" },
      { name: "description", content: "Upscale house cleaning service in Durant, OK, serving Bryan County and Lake Texoma. Opening September 1, 2026 at 8am CST — reserve founding-member pricing today." },
      { name: "keywords", content: "house cleaning Durant OK, maid service Durant Oklahoma, cleaning service Bryan County, deep cleaning Durant, Lake Texoma house cleaners, recurring maid service Durant" },
      { property: "og:title", content: "House Cleaning in Durant, OK | Magnolia Maids" },
      { property: "og:description", content: "Refined, eco-conscious home cleaning for Durant and Bryan County. Founding-member pricing before our September 1, 2026 8:00 AM CST opening." },
      { property: "og:url", content: "https://magnoliamaids.pro/" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(localBusinessSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          ...faqPageSchema(`${SITE_URL}/`),
          about: { "@id": `${SITE_URL}/#localbusiness` },
          inLanguage: "en-US",
        }),
      },
    ],
  }),
});

const rate = (k: Parameters<typeof getServiceRate>[0]) => `$${getServiceRate(k).base}`;

const services: { icon: typeof Home; key: ServiceKey; title: string; desc: string; from: string; features: string[] }[] = [
  { icon: Home, key: "Standard Clean", title: "Standard Clean", desc: "The every-week or every-other-week refresh most Durant homes run on.", from: rate("Standard Clean"), features: ["Kitchen & baths", "Dust & vacuum", "Trash & tidy"] },
  { icon: Flower2, key: "Bright Clean", title: "Bright Clean", desc: "A standard clean plus the detail work — our most-requested tier.", from: rate("Bright Clean"), features: ["Baseboards & doors", "Interior windows", "Appliance fronts"] },
  { icon: Sparkles, key: "Deep Clean", title: "Deep Clean", desc: "Top-to-bottom detail work, ideal for a first visit or spring reset.", from: rate("Deep Clean"), features: ["Vents & light fixtures", "Inside appliances", "Grout scrub"] },
  { icon: KeyRound, key: "Airbnb Turnover", title: "Airbnb Turnover", desc: "Guest-ready resets for Lake Texoma cabins and in-town rentals.", from: rate("Airbnb Turnover"), features: ["Same-day flips", "Linen swap & staging", "Photo checklist"] },
  { icon: Building2, key: "Move In / Out", title: "Move In / Out", desc: "Hand over — or move into — a spotless space anywhere in Bryan County.", from: rate("Move In / Out"), features: ["Cabinets in/out", "Windows & tracks", "Deep sanitize"] },
  { icon: Star, key: "Pre-Event Prep", title: "Pre-Event Prep", desc: "Guest-ready before the graduation party, reunion, or game-day crowd.", from: rate("Pre-Event Prep"), features: ["Entry & guest bath focus", "Kitchen staging", "Evening arrivals"] },
  { icon: PartyPopper, key: "Post-Party", title: "Post-Event Clean", desc: "We handle the morning-after mess so you can enjoy the memories.", from: rate("Post-Party"), features: ["Same-day slots", "Dish & glassware reset", "Odor removal"] },
];

const steps = [
  { n: "01", title: "Tell us about your home", desc: "Share size, rooms, and preferences in under 60 seconds — you'll see the flat price instantly.", emoji: "🏡" },
  { n: "02", title: "Choose your standing day", desc: "Weekly, biweekly, or monthly saves 20%, 15%, or 10%. One-time visits welcome too.", emoji: "🗓️" },
  { n: "03", title: "Your crew arrives", desc: "The same vetted, uniformed Durant team, on time, every visit.", emoji: "🤍" },
];

const promises = [
  { title: "Flat, upfront pricing", body: "You see the full price before you book. No hourly surprises, no add-on games.", emoji: "🤍" },
  { title: "24-hour Magnolia Guarantee", body: "If something isn't right, tell us within 24 hours and we return and re-clean it free.", emoji: "🌿" },
  { title: "Vetted, insured crews", body: "Every teammate is background-checked, W-2 employed, trained in-house, and fully insured.", emoji: "🌸" },
  { title: "The same crew each visit", body: "Recurring clients keep the same team, so your preferences are never re-explained.", emoji: "🤍" },
  { title: "Eco-safe by default", body: "Plant-based, pet- and kid-safe products unless you ask for something specific.", emoji: "🌿" },
  { title: "Easy rescheduling", body: "Change or cancel up to 24 hours ahead at no charge. Life in Durant happens.", emoji: "🌸" },
];

const neighborhoods = [
  "Downtown Durant", "Westwood", "Rock Creek", "Bryan Heights", "SOSU campus area",
  "Silo", "Calera", "Caddo", "Mead", "Achille",
  "Colbert", "Bokchito", "Cartwright", "Kingston", "Platter",
  "Lake Texoma",
];



function Index() {
  const stats = useInViewOnce<HTMLDivElement>();
  const hoods = useCountUp(12, stats.inView);

  // Live "openings today" ticker
  const openings = ["Tue · 8:00 AM", "Tue · 10:30 AM", "Wed · 9:00 AM", "Wed · 2:30 PM", "Thu · 11:00 AM"];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % openings.length), 2600);
    return () => clearInterval(id);
  }, [openings.length]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ivory-wash">
        <div className="absolute inset-0 opacity-60 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 18% 18%, oklch(0.94 0.03 130 / 0.7), transparent 48%), radial-gradient(circle at 88% 65%, oklch(0.93 0.05 88 / 0.45), transparent 42%)" }} />
        {/* MOBILE HERO — photo-first, single screen */}
        <div className="relative md:hidden">
          <div className="relative h-[30vh] min-h-[190px] max-h-[260px] overflow-hidden">
            <img
              src={durantHome}
              alt="Sunlit, immaculately clean Durant living room with white magnolias"
              width={1200}
              height={859}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, color-mix(in oklab, var(--forest) 22%, transparent) 0%, transparent 45%, var(--background) 100%)",
              }}
            />
            <span className="absolute left-4 top-4 inline-flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full bg-white/90 border border-border px-3 py-1 text-[11px] font-bold text-primary backdrop-blur">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="truncate">Opening Sep 1, 2026 · Durant, OK</span>
            </span>
          </div>

          <div className="relative px-4 pb-8 -mt-2">
            <h1 className="font-display text-[2rem] font-semibold leading-[1.1] text-balance">
              House Cleaning in Durant, OK{" "}
              <span className="text-laurel">— quietly immaculate, every week.</span>
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              White-glove residential cleaning for Durant and Bryan County.
            </p>

            <div className="mt-5">
              <a
                href="#instant-quote"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 font-bold shadow-bloom"
              >
                Get my instant price <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-3">
              <Link
                to="/booking"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary underline underline-offset-4"
              >
                Or reserve my Sept 1 slot <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <p className="mt-3 text-[13px] text-muted-foreground">
              Standard clean from{" "}
              <strong className="text-foreground">${getServiceRate("Standard Clean").base}</strong>{" "}
              · flat price, no hourly surprises
            </p>

            <ul className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { icon: ShieldCheck, label: "Insured & vetted" },
                { icon: Leaf, label: "Eco-safe products" },
                { icon: Sparkles, label: "24-hr guarantee" },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-foreground/80 backdrop-blur"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {label}
                </li>
              ))}
            </ul>

            <div aria-hidden className="mt-5 flex justify-center">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-white/70 text-primary animate-bob">
                <ArrowRight className="h-4 w-4 rotate-90" />
              </span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pt-10 pb-14 md:pt-24 md:pb-28 hidden md:grid md:grid-cols-2 gap-10 md:gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-border px-3 py-1 text-xs font-bold text-primary backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Grand Opening · September 1, 2026 · 8:00 AM CST · Durant, OK
            </span>
            <p className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08]">
              House Cleaning in{" "}
              <span className="whitespace-nowrap">Durant, OK</span>{" "}
              <span className="text-laurel">— quietly immaculate, every week.</span>
            </p>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-lg">
              Magnolia Maids brings white-glove residential cleaning to Durant and Bryan County.
              We open <strong className="text-foreground">September 1, 2026 at 8:00 AM CST</strong> — reserve now for founding-member rates.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Link to="/booking" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition">
                Reserve my Sept 1 slot <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#instant-quote" className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-foreground border border-border px-6 py-3.5 font-bold hover:bg-secondary transition">
                <Play className="h-4 w-4 text-primary" /> Get an instant quote
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-4 sm:gap-5 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {["🤍", "🌿", "✨", "🌸"].map((e, i) => (
                  <span key={i} className="h-9 w-9 grid place-items-center rounded-full bg-white ring-2 ring-white shadow-md text-lg">{e}</span>
                ))}
              </div>
              <div>
                <div className="font-bold text-foreground">Now reserving founding-member slots</div>
                <div className="text-xs">Brand-new local company · opening day September 1, 2026</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-laurel rounded-[3rem] rotate-3 opacity-20 blur-2xl" />
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-bloom ring-1 ring-border">
              <img src={durantHome} alt="Sunlit, immaculately clean Durant living room with white magnolias" width={1200} height={859} fetchPriority="high" decoding="async" className="w-full h-[300px] sm:h-[420px] md:h-[520px] object-cover" />
            </div>
            <img loading="lazy" decoding="async" src={mascot} alt="Magnolia Maids magnolia bloom mark" className="absolute -bottom-6 -left-3 w-24 sm:-bottom-8 sm:-left-6 sm:w-32 md:-left-12 md:w-44 animate-bob drop-shadow-2xl" />
            <div className="absolute -top-4 right-3 sm:right-6 bg-white rounded-2xl shadow-xl border border-border px-3 py-2 sm:px-4 sm:py-3 rotate-3 min-w-[150px] sm:min-w-[170px]">
              <div className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Opening day</div>
              <div className="font-display text-sm sm:text-base font-bold">Tue · Sept 1, 2026 · 8:00 AM</div>
              <div key={tick} className="text-[11px] text-muted-foreground animate-rise">First slot: {openings[tick]}</div>
            </div>
            <div className="absolute bottom-6 right-4 bg-white rounded-2xl shadow-xl border border-border px-4 py-3 -rotate-2">
            <div className="text-xs text-muted-foreground">Flat founding rate · 2bd/2ba</div>
              <div className="font-display font-bold text-primary">
                ${getServiceRate("Standard Clean").base}
                <span className="ml-1 text-xs font-normal text-muted-foreground">standard clean</span>
              </div>
            </div>
          </div>
        </div>
        {/* soft divider */}
        <svg className="block w-full h-12 md:h-16 text-white" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
          <path fill="currentColor" d="M0,96L360,72C720,48,1080,48,1440,72L1440,120L0,120Z" />
        </svg>
      </section>

      {/* TRUST BAR */}
      <section className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
          {[
            { icon: ShieldCheck, label: "Insured & vetted" },
            { icon: Leaf, label: "Eco-friendly products" },
            { icon: CalendarCheck, label: "Flexible scheduling" },
            { icon: Sparkles, label: "24-hour Magnolia Guarantee" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="group flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3">
              <span className="grid shrink-0 place-items-center h-10 w-10 rounded-full bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-semibold text-xs md:text-sm text-balance">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* INSTANT QUOTE */}
      <InstantQuote />

      {/* STATS */}
      <section ref={stats.ref} className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pt-16 md:pt-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { v: "Sept 1", l: "Grand opening, 2026" },
            { v: hoods + "+", l: "Bryan County communities served" },
            { v: `$${getServiceRate("Standard Clean").base}`, l: "Founding standard clean" },
            { v: "24 hr", l: "Magnolia Guarantee" },
          ].map((s) => (
            <div key={s.l} className="rounded-3xl bg-card border border-border p-6 text-center hover:-translate-y-1 transition">
              <div className="font-display text-3xl md:text-4xl font-semibold text-laurel">{s.v}</div>
              <div className="mt-1 text-xs md:text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-wider">The standard</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
              Slide to see the difference
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              A real Magnolia Maids visit, start to finish. Drag the handle to reveal the
              after — this is the standard we hold on every home.
            </p>
            <ul className="mt-6 space-y-3">
              {["Every surface, corner to corner", "Fresh linens & fluffed pillows", "Streak-free glass, spotless kitchen"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-secondary text-primary shrink-0"><Check className="h-3.5 w-3.5" /></span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Link to="/booking" className="tap-target mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-110 transition">
              Book my cleaning <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <BeforeAfter before={beforeImg} after={afterImg} alt="Durant living room before and after cleaning" className="h-[280px] sm:h-[380px] md:h-[520px]" />
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-wider">Services</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Care for every kind of Durant home</h2>
          </div>
          <Link to="/services" className="text-primary font-bold inline-flex min-h-11 items-center gap-1 hover:gap-2 transition-all">
            See all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((s) => (
            <Link
              to="/booking"
              search={toQuoteSearch({ service: s.key })}
              key={s.title}
              className="group relative overflow-hidden rounded-3xl bg-card border border-border p-6 hover:shadow-bloom hover:-translate-y-1.5 transition block"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <span className="grid place-items-center h-12 w-12 rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">from <span className="text-primary text-base">{s.from}</span></span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                <ul className="mt-4 space-y-1.5 overflow-hidden transition-all duration-500 md:max-h-0 md:group-hover:max-h-40">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-foreground/80">
                      <Check className="h-3.5 w-3.5 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-sm font-bold text-primary inline-flex items-center gap-1 transition md:opacity-0 md:group-hover:opacity-100">
                  Quote &amp; book <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
        </div>
      </section>

      {/* AIRBNB HOSTS FEATURE */}
      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-sage text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 15% 20%, white, transparent 40%), radial-gradient(circle at 85% 70%, white, transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur border border-white/25 px-3 py-1 text-xs font-bold">
              <KeyRound className="h-3.5 w-3.5" /> New for hosts · Live Sept 1, 2026
            </span>
            <h2 className="mt-5 font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.05]">
              Airbnb Turnover<br />
              <span className="text-accent">Specialists</span>
            </h2>
            <p className="mt-5 text-white/90 text-lg max-w-lg">
              A trained Magnolia Maids crew built for short-term rentals. Same-day flips,
              hotel-grade linen swaps, staged photos before check-in, and instant
              restock alerts — so every guest walks into a spotless home.
            </p>
            <ul className="mt-8 grid sm:grid-cols-2 gap-3">
              {[
                { icon: Timer, t: "2-hour guaranteed flips" },
                { icon: Camera, t: "Photo checklist per turn" },
                { icon: Sparkles, t: "Hotel-grade linen swap" },
                { icon: ShieldCheck, t: "Restock & damage alerts" },
              ].map(({ icon: Icon, t }) => (
                <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur border border-white/15 px-4 py-3 text-sm font-semibold">
                  <span className="grid place-items-center h-8 w-8 rounded-xl bg-white text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Link to="/booking" search={toQuoteSearch({ service: "Airbnb Turnover" })} className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white text-primary px-6 py-3.5 font-bold shadow-bloom hover:bg-secondary transition">
                Book Airbnb Turnover <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/airbnb-turnover" className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/30 text-white px-6 py-3.5 font-bold hover:bg-white/20 transition">
                Explore turnover service
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-white/10 rounded-[3rem] blur-2xl" />
            <div className="relative rounded-[2rem] bg-white text-foreground p-6 md:p-8 shadow-bloom">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <KeyRound className="h-4 w-4" /> Sample turn · Lake Texoma cabin
                </div>
                <span className="text-xs font-bold rounded-full bg-secondary text-primary px-2.5 py-1">Example</span>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { t: "Checkout confirmed", d: "11:03 AM", ok: true },
                  { t: "Crew en route", d: "11:18 AM", ok: true },
                  { t: "Linen swap complete", d: "11:52 AM", ok: true },
                  { t: "Kitchen & bath reset", d: "12:24 PM", ok: true },
                  { t: "Staging photos sent", d: "12:41 PM", ok: false },
                  { t: "Ready for guest", d: "1:00 PM", ok: false },
                ].map((row) => (
                  <div key={row.t} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`grid place-items-center h-7 w-7 rounded-full ${row.ok ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
                        {row.ok ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </span>
                      <span className="text-sm font-semibold">{row.t}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{row.d}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-ivory-wash border border-border p-4 flex items-center gap-3">
                <img loading="lazy" decoding="async" src={mascot} alt="" className="h-12 w-12" />
                <div className="text-sm">
                  <div className="font-bold">Backed by the 24-hour Magnolia Guarantee</div>
                  <div className="text-xs text-muted-foreground">Not guest-ready? Tell us within 24 hours and we re-clean free.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOST WEEKEND / EVENTS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-24">
        <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-border bg-white p-6 sm:p-8 md:p-12 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <PartyPopper className="h-4 w-4" /> Durant entertains
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
              The Host Weekend bundle
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Graduation at Durant High, a Southeastern homecoming weekend, a lake house full of
              family — book Pre-Event Prep before and a Post-Event Clean the morning after and
              save {Math.round(0.1 * 100)}% on both.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Prep visit the day before, staged for guests",
                "Morning-after reset with dish, glassware, and trash haul-out",
                "Same crew both visits — they already know your home",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-secondary text-primary shrink-0"><Check className="h-3.5 w-3.5" /></span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Link to="/post-event-cleaning" className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-110 transition">
                Explore event cleaning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/booking" search={toQuoteSearch({ service: "Pre-Event Prep" })} className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white text-foreground border border-border px-6 py-3.5 font-bold hover:bg-secondary transition">
                Reserve a date
              </Link>
            </div>
          </div>
          <div className="rounded-[1.75rem] sm:rounded-[2rem] bg-ivory-wash border border-border p-5 sm:p-6 md:p-8">
            <div className="text-sm font-bold text-primary">Example · 3 bedroom / 2 bath Durant home</div>
            {(() => {
              const b = priceHostWeekend({ bedrooms: 3, bathrooms: 2 });
              return (
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between"><dt>Pre-Event Prep</dt><dd className="font-semibold">${b.pre}</dd></div>
                  <div className="flex justify-between"><dt>Post-Event Clean</dt><dd className="font-semibold">${b.post}</dd></div>
                  <div className="flex justify-between text-muted-foreground"><dt>Bundle savings</dt><dd>−${b.savings}</dd></div>
                  <div className="flex justify-between border-t border-border pt-3 font-display text-xl font-bold">
                    <dt>Host Weekend total</dt><dd className="text-primary">${b.total}</dd>
                  </div>
                </dl>
              );
            })()}
            <p className="mt-4 text-xs text-muted-foreground">
              Flat pricing, quoted before you book. Backed by the 24-hour Magnolia Guarantee.
            </p>
          </div>
        </div>
      </section>

      {/* PROPERTY MANAGERS */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-24">
          <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-border bg-white p-6 sm:p-8 md:p-12 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4" /> For property managers
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
                Apartment &amp; rental unit turnovers
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Move-in and move-out cleaning for Durant apartment complexes, duplexes, and rental
                portfolios — priced per unit by floor plan, photographed on completion, and billed
                on one monthly invoice.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Same-day and next-day turns during notice season",
                  "Photo proof against your own rent-ready checklist",
                  "Trash-outs, carpet care, and common areas available",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="grid place-items-center h-6 w-6 rounded-full bg-secondary text-primary shrink-0"><Check className="h-3.5 w-3.5" /></span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <Link to="/apartment-turnovers" className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-110 transition">
                  Request a per-unit proposal <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/move-out-cleaning" className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white text-foreground border border-border px-6 py-3.5 font-bold hover:bg-secondary transition">
                  Single-home move-outs
                </Link>
              </div>
            </div>
            <div className="rounded-[1.75rem] sm:rounded-[2rem] bg-ivory-wash border border-border p-5 sm:p-6 md:p-8">
              <div className="text-sm font-bold text-primary">What a unit turn covers</div>
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  "Inside cabinets, closets, and every appliance",
                  "Tub, tile, grout, vanity, and mirrors",
                  "Windows, sills, tracks, blinds, and vents",
                  "Baseboards, switch plates, and fixtures",
                  "Floors vacuumed, mopped, and edge-detailed",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-muted-foreground">
                Quoted after we walk one vacant unit — never from a generic rate card, never hourly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-primary font-bold text-sm uppercase tracking-wider">How it works</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">
              Three simple steps and you're done
            </h2>
            <p className="mt-3 text-muted-foreground">Book online in about two minutes — no in-home estimate, no sales call.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3 relative">
            {steps.map((s, i) => (
              <div key={s.n} className="relative rounded-3xl bg-white border border-border p-8 hover:-translate-y-1 transition group">
                <div className="absolute -top-5 left-6 text-4xl select-none group-hover:animate-bob">{s.emoji}</div>
                <div className="font-display text-6xl font-semibold text-laurel opacity-80">{s.n}</div>
                <h3 className="mt-3 font-display text-2xl font-bold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div aria-hidden className="hidden md:block absolute top-1/2 -right-4 text-primary/40">
                    <Flower2 className="h-8 w-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMISES MARQUEE */}
      <section className="py-14 md:py-28 overflow-hidden">
        <div className="text-center max-w-2xl mx-auto px-5">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Our opening-day promises</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">What every Durant home gets</h2>
        </div>
        <div className="mt-12 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex gap-6 w-max animate-marquee">
            {[...promises, ...promises].map((r, i) => (
              <figure key={i} className="w-[270px] sm:w-[340px] shrink-0 rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-sm hover:shadow-bloom transition">
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg font-semibold">{r.title}</div>
                  <span className="text-xl">{r.emoji}</span>
                </div>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{r.body}</p>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pb-20 md:pb-28">
        <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-border bg-white p-6 sm:p-8 md:p-12">
          <div className="flex items-start gap-3 flex-wrap justify-between">
            <div>
              <p className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Where we clean
              </p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold">Serving your Durant neighborhood</h2>
            </div>
            <span className="text-sm text-muted-foreground">Don't see yours? <Link to="/booking" className="text-primary font-bold underline underline-offset-2 inline-flex min-h-11 items-center">Ask us →</Link></span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {neighborhoods.map((n) => (
              <span key={n} className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition cursor-default">
                <MapPin className="h-3.5 w-3.5" /> {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SEASONAL CAMPAIGNS */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-24">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p className="text-primary font-bold text-sm uppercase tracking-wider">Seasonal offers</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">
                What Durant is booking right now
              </h2>
            </div>
            <span className="text-sm text-muted-foreground max-w-sm">
              Limited-run offers for lake season, referrals, and the holidays — each with its own
              reservation form.
            </span>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {Object.values(CAMPAIGNS).map((c) => (
              <Link
                key={c.key}
                to={c.path}
                className="group rounded-3xl border border-border bg-card p-6 hover:shadow-bloom hover:-translate-y-1 transition flex flex-col"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{c.season}</span>
                <h3 className="mt-2 font-display text-2xl font-bold">{c.label}</h3>
                <p className="mt-3 text-sm text-muted-foreground flex-1">{c.offer}</p>
                <span className="mt-5 text-sm font-bold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  {c.primaryCta} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HIRING */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
        <div className="rounded-[2rem] border border-border bg-ivory-wash p-6 sm:p-7 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex-1">
            <p className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Heart className="h-4 w-4" /> We're hiring in Durant
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold leading-tight">
              Building our opening-day crew
            </h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              W-2 positions, paid training, daytime hours, and mileage covered. Apply before
              September 1 and clean with us from day one.
            </p>
          </div>
          <Link
            to="/about/careers"
            className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-110 transition md:shrink-0"
          >
            See open roles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-ivory-wash">
        <div className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
          <div className="text-center">
            <p className="text-primary font-bold text-sm uppercase tracking-wider">Curious?</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Quick answers</h2>
            <p className="mt-3 text-muted-foreground">
              Pricing, scheduling, and exactly what's included — no fine print.
            </p>
          </div>

          <FaqAccordion />

          <div className="mt-10 rounded-3xl border border-border bg-white p-6 text-center">
            <p className="font-display text-xl font-bold">Still have a question?</p>
            <p className="mt-1 text-sm text-muted-foreground">Get a flat price in seconds or talk to a real person in Durant.</p>
            <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
              <a
                href="#instant-quote"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition"
              >
                Get an instant quote <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={PHONE_HREF}
                className="tap-target inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 font-bold hover:border-primary transition"
              >
                Call {PHONE_DISPLAY}
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Want the full list?{" "}
              <Link to="/faq" className="font-bold text-primary underline underline-offset-4">
                Read every FAQ
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CLIENT DASHBOARD */}
      <section className="bg-ivory-wash">
        <AccountPromo
          heading="Your account, after you book"
          body="Every Durant client gets a free online dashboard — track visits, request changes, and keep entry, pet, and preference details on file."
        />
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pb-24">
        <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-laurel text-white p-7 sm:p-10 md:p-16">
          <div aria-hidden className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute -top-16 -left-10 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          </div>
          <img loading="lazy" decoding="async" src={mascot} alt="" aria-hidden className="hidden md:block absolute -right-6 -bottom-8 w-64 lg:w-80 animate-bob" />
          <div className="max-w-xl relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-bold">
              <Heart className="h-3.5 w-3.5" /> 24-hour Magnolia Guarantee
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
              Ready for a sparkling clean home?
            </h2>
            <p className="mt-4 text-white/90 text-lg">
              Magnolia Maids is standing by. Book in under two minutes and pick a time that fits your week.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Link to="/booking" className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white text-primary px-6 py-3.5 font-bold hover:bg-secondary transition">
                Book a Cleaning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/pricing" className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border-2 border-white/70 text-white px-6 py-3.5 font-bold hover:bg-white/10 transition">
                See Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      </main>
      <QuoteCallCTA
        heading="Get an instant quote for your Durant home"
        body="Flat pricing in about 60 seconds — no in-home estimate. Prefer to talk it through? Call us."
      />
      <ShareButtons path="/" title={"House Cleaning in Durant, OK | Magnolia Maids"} description={"Upscale house cleaning for Durant, Bryan County, and Lake Texoma homes."} />
      <SiteFooter />
    </div>
  );
}
