import { createFileRoute, Link } from "@tanstack/react-router";
import { breadcrumbSchema, localBusinessSchema, SITE_URL } from "@/lib/structured-data";
import { SiteNav } from "@/components/SiteNav";
import { QuoteCallCTA } from "@/components/QuoteCallCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountPromo } from "@/components/AccountPromo";
import { ShareButtons } from "@/components/ShareButtons";
import { useInViewOnce, useCountUp } from "@/hooks/useInViewOnce";
import mascot from "@/assets/astro-mark.webp";
import dallasHome from "@/assets/dallas-home.jpg";
import heroAbout from "@/assets/hero-about.webp";
import { HeroBackground } from "@/components/HeroBackground";
import {Heart,Leaf,Users,Sparkles,ShieldCheck,Star,MapPin,HandHeart,Recycle,Award,PawPrint,Sun,Briefcase,ArrowRight} from "lucide-react";

export const Route = createFileRoute("/about/")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Our Dallas, TX Cleaning Company | Astro Maids" },
      { name: "description", content: "Meet the locally owned team behind Astro Maids — background-checked, insured house cleaners serving North Dallas, the Park Cities, and Collin County homes." },
      { name: "keywords", content: "local cleaning company Dallas TX, insured house cleaners Dallas, family owned maid service North Dallas Texas" },
      { property: "og:title", content: "About Our Dallas, TX Cleaning Company | Astro Maids" },
      { property: "og:description", content: "Locally owned, meticulously trained, and devoted to immaculate Dallas homes." },
      { property: "og:url", content: "https://magnoliamaids.pro/about" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-astro-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-astro-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About Astro Maids", path: "/about" },
        ])),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${SITE_URL}/about`,
          name: "About Astro Maids — Dallas, TX",
          mainEntity: localBusinessSchema,
        }),
      },
    ],
  }),
});

const VALUES = [
  { icon: Heart, title: "Kindness first", desc: "We hire for warmth, then train for the details. Every crew member is background-checked and trained in-house.", color: "text-accent" },
  { icon: Leaf, title: "Gentler by design", desc: "Eco-safe, non-toxic products by default. What rinses down your drain reaches Blue River and Collin County — so we choose carefully.", color: "text-primary" },
  { icon: Users, title: "Locally owned", desc: "Born in Dallas, run by Dallas locals. No call-center runaround and no absentee ownership — just neighbors helping neighbors.", color: "text-brand" },
  { icon: ShieldCheck, title: "Insured & bonded", desc: "Fully insured for peace of mind. We treat your home like it's our own — because to us, it kind of is.", color: "text-primary" },
];

const TIMELINE = [
  { year: "The idea", title: "A standard worth building", body: "A Dallas family kept hearing the same thing from neighbors: cleaning here is hit or miss, and nobody quotes an honest price up front." },
  { year: "2026", title: "Astro Maids is founded", body: "A clean star mark, a polished silver bucket, and a promise: flat pricing, trained crews, and immaculate homes." },
  { year: "Opened", title: "Doors open in Dallas", body: "In-house training on the Astro checklist, plus background checks, insurance, and bonding before a single home is booked." },
  { year: "Now", title: "Cleaning across North Dallas", body: "Standing weekly, biweekly, and monthly days across Dallas, North Dallas, and the Collin County suburbs." },
];


const PROMISES = [
  { icon: Sparkles, text: "Flat-rate, no surprises" },
  { icon: ShieldCheck, text: "24-hour Astro Guarantee" },
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
      <section className="relative bg-brand-wash overflow-hidden">
        <HeroBackground src={heroAbout} position="center 55%" />
        <div className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        <Star className="absolute bottom-0 left-0 right-0 w-full h-20 text-primary-foreground/40 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-24 grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-card/70 backdrop-blur px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider ring-1 ring-primary/20">
              <Star className="h-3.5 w-3.5" /> Our story
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
              About{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-brand">Astro Maids</span>
                <span className="absolute inset-x-0 -bottom-1 h-3 bg-silver/50 -z-0 rounded-sm" />
              </span>
            </h1>
            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-lg">
              Astro Maids is a locally owned Dallas cleaning company built on quiet
              precision — a trained crew who treat every home the way they'd treat their own.
            </p>
            <div className="mt-7 sm:mt-8 grid gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
              <Link to="/booking" className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-band text-primary-foreground px-6 py-3.5 font-bold shadow-brand hover:brightness-110 transition">
                Book with Astro Maids <Sparkles className="h-4 w-4" />
              </Link>
              <Link to="/services" className="inline-flex items-center justify-center gap-2 rounded-full bg-card text-primary px-6 py-3.5 font-bold ring-1 ring-primary/20 hover:bg-secondary transition">
                See what we do
              </Link>
              <Link to="/about/careers" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-brand hover:brightness-105 transition">
                <Briefcase className="h-4 w-4" /> We're hiring
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-brand-band rounded-full blur-3xl opacity-30" />
            <div className="absolute -top-4 -right-2 rounded-2xl bg-card/90 backdrop-blur px-4 py-2 shadow-brand rotate-6">
              <div className="flex items-center gap-1 text-silver">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-silver" />)}
              </div>
              <div className="text-xs font-bold mt-0.5">Grand opening December 1, 2026 · Founder rate for our first 100 clients</div>
            </div>
            <div className="absolute -bottom-2 -left-2 rounded-2xl bg-card/90 backdrop-blur px-4 py-2 shadow-brand -rotate-6">
              <div className="text-xs font-bold text-primary">Locally owned · Dallas, TX</div>
            </div>
            <img loading="lazy" decoding="async" src={mascot} alt="Astro Maids star and orbit mark" className="relative mx-auto w-56 sm:w-72 md:w-96 animate-bob" />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <StatsStrip />

      {/* Story + photo */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-20 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
          <img loading="lazy" decoding="async" src={dallasHome} alt="A bright Dallas living room" className="relative rounded-3xl shadow-brand w-full aspect-[4/5] object-cover" />
          <div className="absolute -bottom-4 right-2 sm:-bottom-6 sm:-right-6 rounded-2xl bg-brand-band text-primary-foreground p-4 sm:p-5 shadow-brand max-w-[200px] sm:max-w-[220px]">
            <div className="text-2xl sm:text-3xl">🤍</div>
            <div className="mt-1 text-sm font-bold">"A home should feel as good as it looks."</div>
          </div>
        </div>
        <div>
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Why we started Astro Maids</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
            Cleaning shouldn't feel like a chore — for you or for us.
          </h2>
          <div className="mt-5 sm:mt-6 space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>Astro Maids was founded in 2026 after our founder Maya kept hearing the same story around Dallas: cleaners who ghosted, surprise fees, uneven results, and no one who cared about the small details.</p>
            <p>So we built the opposite. A crew paid a living wage and trained in-house. Products safe for children, pets, and our waterways. Pricing you see before we knock. And a standard of finish that holds on the fiftieth visit as firmly as the first.</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">What we believe</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Four values, held tight.</h2>
        </div>
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="group rounded-2xl sm:rounded-3xl bg-card border border-border p-5 sm:p-7 hover:-translate-y-1 hover:shadow-brand transition-all">
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
      <section className="mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-12 md:py-20">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">The swim so far</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">From one bucket to a full pod.</h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-accent to-silver" />
          <div className="space-y-8 md:space-y-10">
            {TIMELINE.map((t, i) => (
              <div key={t.year} className={"relative grid md:grid-cols-2 gap-6 md:gap-12 items-center " + (i % 2 ? "md:[&>*:first-child]:order-2" : "")}>
                <div className={"pl-12 md:pl-0 " + (i % 2 ? "md:text-left md:pl-12" : "md:text-right md:pr-12")}>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-band text-primary-foreground px-3 py-1 text-xs font-bold">{t.year}</div>
                  <h3 className="mt-3 font-display text-xl sm:text-2xl font-semibold">{t.title}</h3>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground">{t.body}</p>
                </div>
                <div className="hidden md:block" />
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-card border-4 border-primary shadow-brand grid place-items-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Promises */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 py-12 md:py-20">
        <div className="rounded-2xl sm:rounded-3xl bg-card border border-border p-5 sm:p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
              <Award className="h-3.5 w-3.5" /> The Astro Maids promise
            </div>
            <h2 className="mt-4 font-display text-2xl sm:text-3xl md:text-4xl font-semibold">Six little things we'll always do.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((p) => (
              <div key={p.text} className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-4 py-3">
                <span className="h-10 w-10 rounded-xl bg-brand-band text-primary-foreground grid place-items-center shrink-0">
                  <p.icon className="h-5 w-5" />
                </span>
                <span className="font-bold text-sm">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 pb-12 md:pb-16">
        <div className="rounded-2xl sm:rounded-3xl bg-brand-wash p-6 sm:p-8 md:p-12 text-center">
          <MapPin className="h-8 w-8 text-primary mx-auto" />
          <h2 className="mt-3 font-display text-2xl sm:text-3xl md:text-4xl font-semibold">Where you'll find us</h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">Astro Maids serves homes across the greater Dallas area.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["Highland Park", "University Park", "Preston Hollow", "Bluffview", "Turtle Creek", "Prestonwood", "Plano", "Frisco", "Allen", "McKinney", "Addison", "Richardson", "Southlake"].map((n) => (
              <span key={n} className="rounded-full bg-card border border-border px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold hover:bg-brand-band hover:text-primary-foreground hover:border-transparent transition cursor-default">
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pb-16 md:pb-24">
        <div className="relative rounded-2xl sm:rounded-3xl bg-brand-band text-primary-foreground p-6 sm:p-10 md:p-16 text-center overflow-hidden">
          <Star className="absolute -bottom-8 -right-8 h-64 w-64 text-primary-foreground/10" />
          <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-silver/30 blur-3xl" />
          <div className="relative">
            <img loading="lazy" decoding="async" src={mascot} alt="" className="mx-auto w-24 animate-bob" />
            <h2 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Say hi to Astro Maids</h2>
            <p className="mt-3 text-sm sm:text-base text-primary-foreground/90 max-w-xl mx-auto">Book your first cleaning and see what a white-glove crew can do.</p>
            <div className="mt-6 grid gap-2.5 sm:flex sm:flex-wrap sm:gap-3 sm:justify-center">
              <Link to="/booking" className="inline-flex items-center justify-center gap-2 rounded-full bg-card text-primary px-7 py-3.5 font-bold hover:bg-secondary transition">
                Book a cleaning <Sparkles className="h-4 w-4" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-full bg-card/10 text-primary-foreground px-7 py-3.5 font-bold ring-1 ring-card/30 hover:bg-card/20 transition">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pb-8">
        <AccountPromo variant="strip" />
      </section>
      <QuoteCallCTA
        heading="Meet us at your front door"
        body="Get an instant quote online, or call and talk to a real person here in Dallas."
      />
      <ShareButtons path="/about" title={"About Astro Maids | Dallas, TX"} description={"Meet the upscale Dallas house cleaning team behind Astro Maids."} />
      <SiteFooter />
    </div>
  );
}

function StatsStrip() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const hoods = useCountUp(12, inView);
  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 -mt-8 md:-mt-12 relative z-10">
      <div className="rounded-2xl sm:rounded-3xl bg-card border border-border shadow-brand p-5 sm:p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { v: "Mon–Fri", l: "8:00 AM–5:00 PM CST" },
          { v: `${hoods}+`, l: "Communities served" },
          { v: "100%", l: "Locally owned" },
          { v: "24 hr", l: "Astro Guarantee" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-brand">{s.v}</div>
            <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}