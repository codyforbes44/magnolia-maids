import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { useInViewOnce, useCountUp } from "@/hooks/useInViewOnce";
import mascot from "@/assets/magnolia-mark.png";
import miamiHome from "@/assets/durant-home.jpg";
import {
  Heart, Leaf, Users, Sparkles, ShieldCheck, Waves, Star,
  MapPin, HandHeart, Recycle, Award, PawPrint, Sun, Briefcase, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/about/")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Magnolia Maids — Magnolia Maids" },
      { name: "description", content: "Meet Magnolia Maids, our magnolia bloom mark, and the local Durant team behind Magnolia Maids." },
      { property: "og:title", content: "Meet Magnolia Maids — Magnolia Maids" },
      { property: "og:description", content: "The story behind Durant's friendliest house cleaning service." },
      { property: "og:url", content: "/about" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

const VALUES = [
  { icon: Heart, title: "Kindness first", desc: "We hire for warmth, then train for the details. Every crew member is background-checked and trained in-house.", color: "text-coral" },
  { icon: Leaf, title: "Better for the bay", desc: "Eco-safe, non-toxic products by default. What rinses down your drain ends up in our ocean — so we choose carefully.", color: "text-primary" },
  { icon: Users, title: "Locally owned", desc: "Born in Durant, run by Durant locals. No franchise scripts, no call-center runaround — just neighbors helping neighbors.", color: "text-laurel" },
  { icon: ShieldCheck, title: "Insured & bonded", desc: "Fully insured for peace of mind. We treat your home like it's our own — because to us, it kind of is.", color: "text-primary" },
];

const TIMELINE = [
  { year: "2019", title: "A quiet idea", body: "Founder Maya scrubs her first Airbnb between shifts. The idea: cleaning that feels like a friend showed up." },
  { year: "2021", title: "Magnolia Maids is born", body: "A single magnolia bloom, a brass bucket, and a promise: honest prices, warm crews, sparkling homes." },
  { year: "2023", title: "1,000 happy homes", body: "Magnolia Maids crosses a thousand cleanings across Westwood, Silo, Rock Creek, and beyond." },
  { year: "2025", title: "Team of 24 Durant locals", body: "A tight-knit crew, top-rated on every platform, still answering the phone ourselves." },
];

const CREW = [
  { name: "Maya R.", role: "Founder", emoji: "🌿", tag: "Coffee before conversation" },
  { name: "Jorge L.", role: "Operations", emoji: "🧽", tag: "Playlist connoisseur" },
  { name: "Sofia P.", role: "Team lead", emoji: "🌿", tag: "Baseboard whisperer" },
  { name: "Andre K.", role: "Team lead", emoji: "✨", tag: "Fold-a-fitted-sheet champion" },
];

const PROMISES = [
  { icon: Sparkles, text: "Flat-rate, no surprises" },
  { icon: ShieldCheck, text: "24-hour Sparkle Guarantee" },
  { icon: Recycle, text: "Eco products on request" },
  { icon: PawPrint, text: "Pet & kid friendly" },
  { icon: Sun, text: "Same crew every visit" },
  { icon: HandHeart, text: "Tipping never expected" },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SiteNav />

      {/* Hero */}
      <section className="relative bg-ivory-wash overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        <Waves className="absolute bottom-0 left-0 right-0 w-full h-20 text-white/40 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider ring-1 ring-primary/20">
              <Waves className="h-3.5 w-3.5" /> Our story
            </span>
            <h1 className="mt-4 font-display text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight">
              A Southern classic with a{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-laurel">very tidy secret.</span>
                <span className="absolute inset-x-0 -bottom-1 h-3 bg-sunshine/60 -z-0 rounded-sm" />
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Magnolia Maids grew up in Blue River dreaming of sparkling reefs — and sparkling homes.
              He's the face of a local crew that treats every house like their own.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-laurel text-white px-6 py-3.5 font-bold shadow-bloom hover:brightness-110 transition">
                Book with Magnolia Maids <Sparkles className="h-4 w-4" />
              </Link>
              <Link to="/services" className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-6 py-3.5 font-bold ring-1 ring-primary/20 hover:bg-secondary transition">
                See what we do
              </Link>
              <Link to="/about/careers" className="inline-flex items-center gap-2 rounded-full bg-coral text-white px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition">
                <Briefcase className="h-4 w-4" /> We're hiring
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-laurel rounded-full blur-3xl opacity-30" />
            <div className="absolute -top-4 -right-2 rounded-2xl bg-white/90 backdrop-blur px-4 py-2 shadow-bloom rotate-6">
              <div className="flex items-center gap-1 text-sunshine">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-sunshine" />)}
              </div>
              <div className="text-xs font-bold mt-0.5">4.9 · 800+ reviews</div>
            </div>
            <div className="absolute -bottom-2 -left-2 rounded-2xl bg-white/90 backdrop-blur px-4 py-2 shadow-bloom -rotate-6">
              <div className="text-xs font-bold text-primary">Made with 💙 in Durant</div>
            </div>
            <img src={mascot} alt="Magnolia Maids magnolia bloom mark" className="relative mx-auto w-72 md:w-96 animate-bob" />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <StatsStrip />

      {/* Story + photo */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
          <img src={miamiHome} alt="A bright Durant living room" className="relative rounded-3xl shadow-bloom w-full aspect-[4/5] object-cover" />
          <div className="absolute -bottom-6 -right-6 rounded-2xl bg-laurel text-white p-5 shadow-bloom max-w-[220px]">
            <div className="text-3xl">🤍</div>
            <div className="mt-1 text-sm font-bold">"Every home tells a story. We just tidy the pages."</div>
          </div>
        </div>
        <div>
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Why we started Magnolia Maids</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold leading-tight">
            Cleaning shouldn't feel like a chore — for you or for us.
          </h2>
          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>Magnolia Maids started in 2019 when our founder Maya kept hearing the same story: cleaners that ghosted, surprise fees, uneven results, no one who cared about the little things.</p>
            <p>So she built the anti-that. A crew paid a living wage. Products safe for kids, pets, and Blue River. Prices you see before we knock. And a mascot who reminds everyone — including us — to keep it playful.</p>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center text-2xl">👋</div>
            <div>
              <div className="font-bold">Maya Rodriguez</div>
              <div className="text-sm text-muted-foreground">Founder & Head of Sparkle</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-8">
        <div className="text-center mb-10">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">What we believe</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold">Four values, held tight.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="group rounded-3xl bg-card border border-border p-7 hover:-translate-y-1 hover:shadow-bloom transition-all">
              <span className={"grid place-items-center h-14 w-14 rounded-2xl bg-secondary " + v.color + " group-hover:scale-110 transition"}>
                <v.icon className="h-7 w-7" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">{v.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-5xl px-5 md:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">The swim so far</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold">From one bucket to a full pod.</h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-accent to-sunshine" />
          <div className="space-y-10">
            {TIMELINE.map((t, i) => (
              <div key={t.year} className={"relative grid md:grid-cols-2 gap-6 md:gap-12 items-center " + (i % 2 ? "md:[&>*:first-child]:order-2" : "")}>
                <div className={"pl-12 md:pl-0 " + (i % 2 ? "md:text-left md:pl-12" : "md:text-right md:pr-12")}>
                  <div className="inline-flex items-center gap-2 rounded-full bg-laurel text-white px-3 py-1 text-xs font-bold">{t.year}</div>
                  <h3 className="mt-3 font-display text-2xl font-semibold">{t.title}</h3>
                  <p className="mt-2 text-muted-foreground">{t.body}</p>
                </div>
                <div className="hidden md:block" />
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white border-4 border-primary shadow-bloom grid place-items-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crew */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-8">
        <div className="text-center mb-10">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">The pod</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold">The people behind the bloom.</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CREW.map((m) => (
            <div key={m.name} className="group rounded-3xl bg-gradient-to-br from-secondary to-white border border-border p-6 text-center hover:-translate-y-1 transition">
              <div className="mx-auto h-20 w-20 rounded-full bg-laurel text-white grid place-items-center text-3xl shadow-bloom group-hover:scale-110 transition">
                {m.emoji}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{m.name}</h3>
              <div className="text-sm text-primary font-bold">{m.role}</div>
              <div className="mt-2 text-xs text-muted-foreground italic">"{m.tag}"</div>
            </div>
          ))}
        </div>
      </section>

      {/* Promises */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-20">
        <div className="rounded-3xl bg-card border border-border p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
              <Award className="h-3.5 w-3.5" /> The Magnolia Maids promise
            </div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-semibold">Six little things we'll always do.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((p) => (
              <div key={p.text} className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-4 py-3">
                <span className="h-10 w-10 rounded-xl bg-laurel text-white grid place-items-center shrink-0">
                  <p.icon className="h-5 w-5" />
                </span>
                <span className="font-bold text-sm">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 pb-16">
        <div className="rounded-3xl bg-ivory-wash p-8 md:p-12 text-center">
          <MapPin className="h-8 w-8 text-primary mx-auto" />
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-semibold">Where you'll find us</h2>
          <p className="mt-2 text-muted-foreground">Magnolia Maids serves homes across the greater Durant area.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["Westwood", "Silo", "Bryan Heights", "Rock Creek", "Calera", "Mead", "Downtown", "Colbert", "Lake Texoma", "Caddo", "Achille", "Bokchito"].map((n) => (
              <span key={n} className="rounded-full bg-white border border-border px-4 py-2 text-sm font-bold hover:bg-laurel hover:text-white hover:border-transparent transition cursor-default">
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-24">
        <div className="relative rounded-3xl bg-laurel text-white p-10 md:p-16 text-center overflow-hidden">
          <Waves className="absolute -bottom-8 -right-8 h-64 w-64 text-white/10" />
          <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-sunshine/30 blur-3xl" />
          <div className="relative">
            <img src={mascot} alt="" className="mx-auto w-24 animate-bob" />
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-semibold">Say hi to Magnolia Maids</h2>
            <p className="mt-3 text-white/90 max-w-xl mx-auto">Book your first cleaning and see what a white-glove crew — can do.</p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-7 py-3.5 font-bold hover:bg-secondary transition">
                Book a cleaning <Sparkles className="h-4 w-4" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white px-7 py-3.5 font-bold ring-1 ring-white/30 hover:bg-white/20 transition">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function StatsStrip() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const homes = useCountUp(3200, inView);
  const crew = useCountUp(24, inView);
  const rating = useCountUp(49, inView);
  const years = useCountUp(6, inView);
  return (
    <section ref={ref} className="mx-auto max-w-6xl px-5 md:px-8 -mt-8 md:-mt-12 relative z-10">
      <div className="rounded-3xl bg-card border border-border shadow-bloom p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { v: `${homes.toLocaleString()}+`, l: "Homes cleaned" },
          { v: `${crew}`, l: "Local crew" },
          { v: `${(rating / 10).toFixed(1)}★`, l: "Avg. rating" },
          { v: `${years} yrs`, l: "In Durant" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="font-display text-3xl md:text-4xl font-semibold text-laurel">{s.v}</div>
            <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}