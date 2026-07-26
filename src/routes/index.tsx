import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import mascot from "@/assets/splash-mascot.png";
import miamiHome from "@/assets/miami-home.jpg";
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
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Maid 4 Miami — Friendly House Cleaning in Miami, FL" },
      { name: "description", content: "Book trusted local house cleaners in Miami. Transparent pricing, eco-friendly options, and a friendly dolphin mascot named Splash." },
      { property: "og:title", content: "Maid 4 Miami — Clean Homes. Happy People. Miami Style." },
      { property: "og:description", content: "Reliable, eco-friendly house cleaning in Miami with transparent pricing." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Maid 4 Miami",
          description: "Residential house cleaning service in Miami, FL.",
          areaServed: "Miami, FL",
          telephone: "+1-305-555-0142",
          address: { "@type": "PostalAddress", addressLocality: "Miami", addressRegion: "FL", addressCountry: "US" },
          priceRange: "$$",
        }),
      },
    ],
  }),
});

const services = [
  { icon: Home, title: "Standard Clean", desc: "The refresh your home deserves every week or two." },
  { icon: Sparkles, title: "Deep Clean", desc: "Top-to-bottom detail work, perfect for first visits." },
  { icon: Building2, title: "Move In / Out", desc: "Hand over — or move into — a spotless space." },
  { icon: PartyPopper, title: "Post-Party", desc: "We handle the mess so you can enjoy the memories." },
];

const steps = [
  { n: "01", title: "Tell us about your home", desc: "Share size, rooms, and vibe in under 60 seconds." },
  { n: "02", title: "Pick a time that works", desc: "Weekly, biweekly, monthly, or one-time — you choose." },
  { n: "03", title: "Splash sends the crew", desc: "A vetted local team arrives on time, every time." },
];

const reviews = [
  { name: "Isabela R.", area: "Brickell", quote: "My condo has never smelled this fresh. Splash's team is the real deal." },
  { name: "Marcus T.", area: "Coconut Grove", quote: "Booking took two minutes. They handled the post-birthday chaos beautifully." },
  { name: "Priya S.", area: "Wynwood", quote: "Eco products, friendly folks, transparent pricing. Exactly what I wanted." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-sky-wash">
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.85 0.12 200 / 0.5), transparent 45%), radial-gradient(circle at 85% 60%, oklch(0.88 0.16 90 / 0.35), transparent 40%)" }} />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8 pt-14 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-border px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Miami's friendliest cleaners
            </span>
            <h1 className="mt-5 font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.02]">
              Clean homes.<br />
              Happy people.<br />
              <span className="text-ocean">Miami style.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Splash and our local crew make it easy to come home to sparkling floors,
              fresh linens, and that just-cleaned smell. Transparent pricing, eco-friendly
              products, flexible scheduling.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-splash hover:brightness-105 transition">
                Book a Cleaning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full bg-white text-foreground border border-border px-6 py-3.5 font-bold hover:bg-secondary transition">
                Get a Free Quote
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 text-accent">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <span><b className="text-foreground">4.9/5</b> from 800+ Miami neighbors</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-ocean rounded-[3rem] rotate-3 opacity-20 blur-2xl" />
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-splash ring-1 ring-border">
              <img src={miamiHome} alt="Sunlit clean Miami living room" width={1600} height={1200} className="w-full h-[420px] md:h-[520px] object-cover" />
            </div>
            <img src={mascot} alt="Splash the dolphin mascot waving hello" className="absolute -bottom-8 -left-6 md:-left-12 w-40 md:w-56 animate-bob drop-shadow-2xl" />
            <div className="absolute -top-4 right-6 bg-white rounded-2xl shadow-xl border border-border px-4 py-3 rotate-3">
              <div className="text-xs text-muted-foreground">Today's opening</div>
              <div className="font-display font-bold">Tue · 10:30 AM</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: ShieldCheck, label: "Insured & vetted" },
            { icon: Leaf, label: "Eco-friendly products" },
            { icon: CalendarCheck, label: "Flexible scheduling" },
            { icon: Sparkles, label: "100% happiness guarantee" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-3">
              <span className="grid place-items-center h-10 w-10 rounded-full bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-semibold text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-wider">Services</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold">Cleanings for every kind of Miami home</h2>
          </div>
          <Link to="/services" className="text-primary font-bold inline-flex items-center gap-1 hover:gap-2 transition-all">
            See all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div key={s.title} className="group rounded-3xl bg-card border border-border p-6 hover:shadow-splash hover:-translate-y-1 transition">
              <span className="grid place-items-center h-12 w-12 rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-sky-wash">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-primary font-bold text-sm uppercase tracking-wider">How it works</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold">
              Three easy waves and you're done
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-3xl bg-white border border-border p-8">
                <div className="font-display text-6xl font-extrabold text-ocean opacity-80">{s.n}</div>
                <h3 className="mt-3 font-display text-2xl font-bold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Neighborly love</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold">Miami neighbors, real reviews</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="rounded-3xl bg-card border border-border p-7">
              <div className="flex gap-1 text-accent">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-4 text-lg leading-relaxed">"{r.quote}"</blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-bold">{r.name}</span>{" "}
                <span className="text-muted-foreground">· {r.area}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ocean text-white p-10 md:p-16">
          <img src={mascot} alt="" aria-hidden className="hidden md:block absolute -right-6 -bottom-8 w-64 lg:w-80 animate-bob" />
          <div className="max-w-xl relative">
            <h2 className="font-display text-4xl md:text-5xl font-extrabold leading-tight">
              Ready for a sparkling clean home?
            </h2>
            <p className="mt-4 text-white/90 text-lg">
              Splash is standing by. Book in under two minutes and pick a time that fits your week.
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

      <SiteFooter />
    </div>
  );
}
