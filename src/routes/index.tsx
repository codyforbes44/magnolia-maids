import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { localBusinessSchema, SITE_URL } from "@/lib/structured-data";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
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
      { property: "og:url", content: "https://magnolia-maids.lovable.app/" },
      { property: "og:image", content: "https://magnolia-maids.lovable.app/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnolia-maids.lovable.app/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnolia-maids.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(localBusinessSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "Magnolia Maids",
          url: `${SITE_URL}/`,
          publisher: { "@id": `${SITE_URL}/#localbusiness` },
        }),
      },
    ],
  }),
});

const services = [
  { icon: Home, title: "Standard Clean", desc: "The refresh your home deserves every week or two.", from: "$129", features: ["Kitchen & baths", "Dust & vacuum", "Trash & tidy"] },
  { icon: Sparkles, title: "Deep Clean", desc: "Top-to-bottom detail work, perfect for first visits.", from: "$219", features: ["Baseboards & vents", "Inside appliances", "Grout scrub"] },
  { icon: KeyRound, title: "Airbnb Turnover", desc: "Guest-ready resets between stays, on your schedule.", from: "$119", features: ["Same-day flips", "Linen swap & staging", "Photo checklist"] },
  { icon: Building2, title: "Move In / Out", desc: "Hand over — or move into — a spotless space.", from: "$279", features: ["Cabinets in/out", "Windows & tracks", "Deep sanitize"] },
  { icon: PartyPopper, title: "Post-Party", desc: "We handle the mess so you can enjoy the memories.", from: "$169", features: ["Same-day slots", "Dish reset", "Odor removal"] },
];

const steps = [
  { n: "01", title: "Tell us about your home", desc: "Share size, rooms, and preferences in under 60 seconds.", emoji: "🏡" },
  { n: "02", title: "Choose your standing day", desc: "Weekly, biweekly, monthly, or one-time — you decide.", emoji: "🗓️" },
  { n: "03", title: "Your crew arrives", desc: "The same vetted, uniformed team, on time, every visit.", emoji: "🤍" },
];

const reviews = [
  { name: "Katherine B.", area: "Westwood", quote: "Every surface gleams and nothing is out of place. It feels like a hotel suite I actually live in.", emoji: "🤍" },
  { name: "Wade H.", area: "Silo", quote: "Booking took two minutes and the crew handled our post-reception house beautifully.", emoji: "🌿" },
  { name: "Priya S.", area: "Rock Creek", quote: "Plant-based products, impeccable manners, pricing I can see up front.", emoji: "🌸" },
  { name: "Delia M.", area: "Caddo", quote: "They treated my mother's home with real care. Quiet, thorough, kind.", emoji: "🤍" },
  { name: "Ashley K.", area: "Lake Texoma", quote: "Our lake house turns over spotless between guests, every single time.", emoji: "🌿" },
  { name: "Noah P.", area: "Calera", quote: "The standing weekly visit is worth every dollar. Saturdays are ours again.", emoji: "🌸" },
];

const neighborhoods = [
  "Downtown Durant", "Westwood", "Rock Creek", "Bryan Heights", "Silo",
  "Calera", "Caddo", "Mead", "Achille", "Colbert",
  "Bokchito", "Lake Texoma",
];

const faqs = [
  { q: "Do I need to be home during the cleaning?", a: "Nope! Most of our clients hand us a code or key. We lock up when we're done and send a photo recap." },
  { q: "What products do you use?", a: "Eco-friendly, pet-safe, plant-based cleaners by default. Have preferences? Just tell us in the booking notes." },
  { q: "Can I reschedule?", a: "Absolutely — up to 24 hours before, no charge. Life happens." },
  { q: "Are you insured?", a: "Fully insured, bonded, and background-checked. Every crew member." },
];

function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const stats = useInViewOnce<HTMLDivElement>();
  const homes = useCountUp(2400, stats.inView);
  const rating = useCountUp(49, stats.inView);
  const years = useCountUp(7, stats.inView);
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
        <div className="relative mx-auto max-w-7xl px-5 md:px-8 pt-14 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-border px-3 py-1 text-xs font-bold text-primary backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Grand Opening · September 1, 2026 · 8:00 AM CST · Durant, OK
            </span>
            <h1 className="mt-5 font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05]">
              A quietly<br />
              immaculate home,<br />
              <span className="text-laurel">every single week.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Magnolia Maids brings white-glove residential cleaning to Durant and Bryan County.
              We open <strong className="text-foreground">September 1, 2026 at 8:00 AM CST</strong> — reserve now for founding-member rates.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition">
                Reserve my Sept 1 slot <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-white text-foreground border border-border px-6 py-3.5 font-bold hover:bg-secondary transition">
                <Play className="h-4 w-4 text-primary" /> Get an instant quote
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {["🤍", "🌿", "✨", "🌸"].map((e, i) => (
                  <span key={i} className="h-9 w-9 grid place-items-center rounded-full bg-white ring-2 ring-white shadow-md text-lg">{e}</span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-accent">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  <span className="ml-1 font-bold text-foreground">4.9</span>
                </div>
                <div className="text-xs">Founding members already on the list</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-laurel rounded-[3rem] rotate-3 opacity-20 blur-2xl" />
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-bloom ring-1 ring-border">
              <img src={durantHome} alt="Sunlit, immaculately clean Durant living room with white magnolias" width={1200} height={859} fetchPriority="high" decoding="async" className="w-full h-[420px] md:h-[520px] object-cover" />
            </div>
            <img loading="lazy" decoding="async" src={mascot} alt="Magnolia Maids magnolia bloom mark" className="absolute -bottom-8 -left-6 md:-left-12 w-32 md:w-44 animate-bob drop-shadow-2xl" />
            <div className="absolute -top-4 right-6 bg-white rounded-2xl shadow-xl border border-border px-4 py-3 rotate-3 min-w-[170px]">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Opening day</div>
              <div className="font-display font-bold">Tue · Sept 1, 2026 · 8:00 AM</div>
              <div key={tick} className="text-[11px] text-muted-foreground animate-rise">First slot: {openings[tick]}</div>
            </div>
            <div className="absolute bottom-6 right-4 bg-white rounded-2xl shadow-xl border border-border px-4 py-3 -rotate-2">
              <div className="text-xs text-muted-foreground">Founding rate · 2BR</div>
              <div className="font-display font-bold text-primary">$129 <span className="text-xs font-normal text-muted-foreground line-through">$149</span></div>
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

      {/* STATS */}
      <section ref={stats.ref} className="mx-auto max-w-7xl px-5 md:px-8 pt-16 md:pt-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { v: homes.toLocaleString() + "+", l: "Durant homes cleaned" },
            { v: (rating / 10).toFixed(1) + "★", l: "Average rating" },
            { v: years + " yrs", l: "Serving Southern Oklahoma" },
            { v: hoods + "+", l: "Neighborhoods covered" },
          ].map((s) => (
            <div key={s.l} className="rounded-3xl bg-card border border-border p-6 text-center hover:-translate-y-1 transition">
              <div className="font-display text-3xl md:text-4xl font-semibold text-laurel">{s.v}</div>
              <div className="mt-1 text-xs md:text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-wider">The standard</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold leading-tight">
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
            <Link to="/booking" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-110 transition">
              Book my cleaning <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <BeforeAfter before={beforeImg} after={afterImg} alt="Durant living room before and after cleaning" className="h-[420px] md:h-[520px]" />
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-wider">Services</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold">Care for every kind of Durant home</h2>
          </div>
          <Link to="/services" className="text-primary font-bold inline-flex min-h-11 items-center gap-1 hover:gap-2 transition-all">
            See all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {services.map((s) => (
            <Link to="/booking" key={s.title} className="group relative overflow-hidden rounded-3xl bg-card border border-border p-6 hover:shadow-bloom hover:-translate-y-1.5 transition block">
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
                <ul className="mt-4 space-y-1.5 max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-500">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-foreground/80">
                      <Check className="h-3.5 w-3.5 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-sm font-bold text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  Book now <ArrowRight className="h-4 w-4" />
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
        <div className="relative mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur border border-white/25 px-3 py-1 text-xs font-bold">
              <KeyRound className="h-3.5 w-3.5" /> New for hosts · Live Sept 1, 2026
            </span>
            <h2 className="mt-5 font-display text-4xl md:text-5xl font-semibold leading-[1.05]">
              Airbnb Turnover<br />
              <span className="text-accent">Specialists</span>
            </h2>
            <p className="mt-5 text-white/90 text-lg max-w-lg">
              A trained Magnolia Maids crew built for short-term rentals. Same-day flips,
              hotel-grade linen swaps, staged photos before check-in, and instant
              restock alerts — so you get 5-star reviews on autopilot.
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
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-6 py-3.5 font-bold shadow-bloom hover:bg-secondary transition">
                Book Airbnb Turnover <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/airbnb-turnover" className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/30 text-white px-6 py-3.5 font-bold hover:bg-white/20 transition">
                Explore turnover service
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-white/10 rounded-[3rem] blur-2xl" />
            <div className="relative rounded-[2rem] bg-white text-foreground p-6 md:p-8 shadow-bloom">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <KeyRound className="h-4 w-4" /> Turn #248 · Westwood Loft
                </div>
                <span className="text-xs font-bold rounded-full bg-secondary text-primary px-2.5 py-1">Live</span>
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
                  <div className="font-bold">"Guest already left a 5★."</div>
                  <div className="text-xs text-muted-foreground">— Marcus, Superhost · 42 turns with Magnolia Maids</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-primary font-bold text-sm uppercase tracking-wider">How it works</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold">
              Three easy waves and you're done
            </h2>
            <p className="mt-3 text-muted-foreground">From "ugh, look at this place" to "wow" in about a day.</p>
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

      {/* REVIEWS MARQUEE */}
      <section className="py-20 md:py-28 overflow-hidden">
        <div className="text-center max-w-2xl mx-auto px-5">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Neighborly love</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold">Durant neighbors, real reviews</h2>
        </div>
        <div className="mt-12 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex gap-6 w-max animate-marquee">
            {[...reviews, ...reviews].map((r, i) => (
              <figure key={i} className="w-[340px] shrink-0 rounded-3xl bg-card border border-border p-6 shadow-sm hover:shadow-bloom transition">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 text-accent">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <span className="text-xl">{r.emoji}</span>
                </div>
                <blockquote className="mt-3 text-base leading-relaxed">"{r.quote}"</blockquote>
                <figcaption className="mt-5 text-sm flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-primary font-bold text-xs">{r.name.charAt(0)}</span>
                  <span><span className="font-bold">{r.name}</span> <span className="text-muted-foreground">· {r.area}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-20 md:pb-28">
        <div className="rounded-[2.5rem] border border-border bg-white p-8 md:p-12">
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

      {/* FAQ */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-4xl px-5 md:px-8 py-20 md:py-28">
          <div className="text-center">
            <p className="text-primary font-bold text-sm uppercase tracking-wider">Curious?</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold">Quick answers</h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={f.q}
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full text-left rounded-2xl bg-white border border-border p-5 hover:border-primary transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-display text-lg font-bold">{f.q}</span>
                    <span className={`grid place-items-center h-8 w-8 rounded-full bg-secondary text-primary transition ${open ? "rotate-45" : ""}`}>+</span>
                  </div>
                  <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden text-muted-foreground">{f.a}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-laurel text-white p-10 md:p-16">
          <div aria-hidden className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute -top-16 -left-10 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          </div>
          <img loading="lazy" decoding="async" src={mascot} alt="" aria-hidden className="hidden md:block absolute -right-6 -bottom-8 w-64 lg:w-80 animate-bob" />
          <div className="max-w-xl relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-bold">
              <Heart className="h-3.5 w-3.5" /> 24-hour Magnolia Guarantee
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              Ready for a sparkling clean home?
            </h2>
            <p className="mt-4 text-white/90 text-lg">
              Magnolia Maids is standing by. Book in under two minutes and pick a time that fits your week.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-6 py-3.5 font-bold hover:bg-secondary transition">
                Book a Cleaning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 text-white px-6 py-3.5 font-bold hover:bg-white/10 transition">
                See Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      </main>
      <ShareButtons path="/" title={"House Cleaning in Durant, OK | Magnolia Maids"} description={"Upscale house cleaning for Durant, Bryan County, and Lake Texoma homes."} />
      <SiteFooter />
    </div>
  );
}
