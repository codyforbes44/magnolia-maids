import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import mascot from "@/assets/magnolia-mark.png";
import {
  KeyRound,
  Timer,
  Camera,
  Sparkles,
  ShieldCheck,
  Star,
  CheckCircle2,
  ClipboardCheck,
  Bed,
  Package,
  MessageSquare,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/airbnb-turnover")({
  component: AirbnbTurnoverPage,
  head: () => ({
    meta: [
      { title: "Airbnb Turnover Cleaning in Durant | Magnolia Maids" },
      {
        name: "description",
        content:
          "Guest-ready Airbnb turnover cleaning in Durant from $119. 2-hour flips, hotel-grade linen swap, photo checklists, and restock alerts.",
      },
      { name: "keywords", content: "Airbnb cleaning Durant, short-term rental turnover, VRBO cleaning, vacation rental cleaners Lake Texoma, Airbnb turnover service" },
      { property: "og:title", content: "Airbnb Turnover Cleaning in Durant | Magnolia Maids" },
      { property: "og:description", content: "Same-day 2-hour flips, linen swap, and photo checklists for Durant short-term rental hosts." },
      { property: "og:url", content: "/airbnb-turnover" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/airbnb-turnover" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Airbnb Turnover Cleaning",
          provider: {
            "@type": "LocalBusiness",
            name: "Magnolia Maids",
            areaServed: "Durant, OK",
          },
          areaServed: { "@type": "City", name: "Durant" },
          offers: {
            "@type": "Offer",
            price: "119",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }),
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

const FAQS = [
  {
    q: "How fast can Magnolia Maids turn over my Airbnb between guests?",
    a: "Our standard flip is 2 hours for a 1–2 bedroom unit. For tight same-day turnarounds (11am checkout, 4pm check-in), we dispatch a two-person crew so you never miss a booking window.",
  },
  {
    q: "Do you provide linens and towels?",
    a: "Yes. We stock hotel-grade white linens and towels, swap them each turn, and launder the used set. You can also opt to use your own inventory — we'll rotate and track it for you.",
  },
  {
    q: "How do I know the property is truly guest-ready?",
    a: "Every turnover ends with a photo checklist sent straight to your phone: staged beds, bathrooms, kitchen, living areas, and the welcome setup. If anything's off, you see it before your guest does.",
  },
  {
    q: "What if you find damage or missing items?",
    a: "We send an instant restock and damage alert with photos and notes. That gives you time to file with Airbnb's AirCover or VRBO's damage protection before the next guest arrives.",
  },
  {
    q: "Which Durant neighborhoods do you cover?",
    a: "All of the greater Durant area — Westwood, Downtown, Lake Texoma, Lake Texoma, Rock Creek, Calera, Caddo, Bryan Heights, Silo, and Colbert. Ask us about Bokchito and Kingston.",
  },
  {
    q: "Can I schedule recurring turnovers automatically?",
    a: "Absolutely. Connect your calendar or send us your booking pattern and we'll auto-schedule turns as reservations come in. Most hosts save 10–15% on a recurring plan.",
  },
  {
    q: "How much does an Airbnb turnover cost?",
    a: "Turnovers start at $119 for a studio and scale with bedrooms and bathrooms. Most 2BR/2BA Durant units run $159–$189 per flip, all-in with linens, restock check, and photo report.",
  },
  {
    q: "Are you insured and background-checked?",
    a: "Yes. Magnolia Maids is fully insured and bonded, and every crew member is background-checked and trained on our Airbnb-specific turnover playbook.",
  },
];

const PERKS = [
  { icon: Timer, title: "2-hour same-day flips", desc: "Tight 11→4 checkouts handled by two-person crews." },
  { icon: Bed, title: "Hotel-grade linen swap", desc: "White linens & towels stocked, laundered, and rotated." },
  { icon: Camera, title: "Photo checklist per turn", desc: "Every room, every stage — proof it's guest-ready." },
  { icon: Package, title: "Restock & damage alerts", desc: "Instant notes with photos so nothing surprises your guest." },
  { icon: ClipboardCheck, title: "Consumables tracked", desc: "Coffee, TP, soap, shampoo — flagged before you run out." },
  { icon: MessageSquare, title: "Direct crew chat", desc: "Text your dedicated turnover team any time." },
];

const STEPS = [
  { n: "01", t: "Send your listing", d: "Share address, access code, and your turn playbook." },
  { n: "02", t: "We sync your calendar", d: "Turns auto-schedule the moment a booking lands." },
  { n: "03", t: "Crew flips the unit", d: "Clean, stage, restock, and photograph every room." },
  { n: "04", t: "You get the green light", d: "Photo checklist arrives — guest can check in." },
];

const REVIEWS = [
  { name: "Marisol · Westwood host", stars: 5, text: "Magnolia Maids saved my 5★ streak. Same-day flips, gorgeous photos, and my linens never look worn." },
  { name: "Diego · 12 units in Lake Texoma", stars: 5, text: "The restock alerts alone pay for the service. My superhost status has never been safer." },
  { name: "Priya · Rock Creek loft", stars: 5, text: "Guests keep mentioning the crisp beds. That's Magnolia Maids." },
];

function AirbnbTurnoverPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-turquoise text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold tracking-wide">
              <KeyRound className="h-3.5 w-3.5" /> AIRBNB TURNOVER · LAKE TEXOMA
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-semibold leading-[1.05]">
              Guest-ready in <span className="text-accent-strong">2 hours</span>, every single turn.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/90 max-w-xl">
              Magnolia Maids is Durant's short-term rental turnover crew — hotel-grade linens, photo checklists, and restock alerts so your 5-star streak stays untouched.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-white shadow-bloom hover:scale-[1.02] transition"
              >
                Book Airbnb Turnover <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/30 px-7 py-3.5 font-semibold hover:bg-white/20 transition"
              >
                See pricing
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/85">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Insured & bonded</span>
              <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 fill-current text-accent" /> 4.9 from 300+ hosts</span>
              <span className="inline-flex items-center gap-2"><Timer className="h-4 w-4" /> Same-day flips</span>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-2xl">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Live turnover · Westwood 2BR</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> In progress</span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { t: "11:04 AM", l: "Checkout scan complete", done: true },
                  { t: "11:22 AM", l: "Linens & towels swapped", done: true },
                  { t: "12:10 PM", l: "Bathrooms sanitized", done: true },
                  { t: "12:45 PM", l: "Kitchen restocked", done: true },
                  { t: "1:15 PM", l: "Staging + photo checklist", done: false },
                  { t: "1:30 PM", l: "Guest-ready ✔", done: false },
                ].map((s) => (
                  <div key={s.l} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                    <CheckCircle2 className={`h-5 w-5 ${s.done ? "text-emerald-300" : "text-white/40"}`} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{s.l}</div>
                      <div className="text-xs text-white/60">{s.t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <img src={mascot} alt="Magnolia Maids mascot" className="absolute -bottom-6 -left-6 h-24 w-24 animate-float" />
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground">Everything Durant hosts need in one turn.</h2>
          <p className="mt-4 text-lg text-muted-foreground">A turnover service built specifically for Airbnb, VRBO, and short-term rental hosts — not a house cleaning bolted onto short-term rentals.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-3xl border border-border bg-card p-6 hover:shadow-bloom hover:-translate-y-1 transition">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-turquoise/10 text-laurel">
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-foreground">{p.title}</h3>
              <p className="mt-2 text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gradient-to-b from-sky/30 to-transparent">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-20">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground text-center">How a Magnolia Maids turnover works</h2>
          <p className="mt-3 text-center text-lg text-muted-foreground">Set it up once. Your calendar handles the rest.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl bg-card border border-border p-6 relative">
                <span className="absolute -top-4 left-6 rounded-full bg-accent text-accent-foreground text-xs font-semibold px-3 py-1">{s.n}</span>
                <h3 className="mt-2 font-display text-lg font-bold text-foreground">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-5 md:px-8 py-20">
        <div className="rounded-[2rem] bg-gradient-to-br from-laurel to-primary text-white p-8 md:p-14 grid lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl md:text-5xl font-semibold">Transparent turnover pricing.</h2>
            <p className="mt-4 text-white/90 text-lg max-w-xl">Flat-rate per flip. Linens, restock check, and photo report included. Recurring hosts save up to 15%.</p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-white/95">
              {[
                "Studio · from $119",
                "1 BR / 1 BA · from $139",
                "2 BR / 2 BA · from $169",
                "3 BR / 2 BA · from $209",
                "Add linen inventory · +$25",
                "Same-day rush flip · +$40",
              ].map((l) => (
                <li key={l} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> {l}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white text-foreground p-6 shadow-xl">
            <div className="text-xs font-semibold text-laurel uppercase tracking-wider">Founding host rate</div>
            <div className="mt-2 font-display text-5xl font-semibold">$119<span className="text-lg text-muted-foreground font-semibold">/flip</span></div>
            <p className="mt-2 text-sm text-muted-foreground">Lock in launch pricing before Oct 1, 2026.</p>
            <Link
              to="/booking"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 font-bold hover:scale-[1.02] transition"
            >
              Book Airbnb Turnover <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20">
        <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground text-center">Durant hosts love the handoff.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <div key={r.name} className="rounded-3xl bg-card border border-border p-6">
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: r.stars }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3 text-foreground">"{r.text}"</p>
              <div className="mt-4 text-sm font-semibold text-muted-foreground">{r.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gradient-to-b from-transparent to-sky/30">
        <div className="mx-auto max-w-4xl px-5 md:px-8 py-20">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 text-laurel px-4 py-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> FAQ
            </span>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-semibold text-foreground">Airbnb turnover, answered.</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20">
        <div className="rounded-[2rem] bg-gradient-to-br from-accent to-primary text-white p-10 md:p-16 text-center relative overflow-hidden">
          <img src={mascot} alt="" className="absolute -bottom-6 -right-6 h-32 w-32 opacity-40 animate-float" />
          <h2 className="font-display text-3xl md:text-5xl font-semibold">Ready for your next 5-star flip?</h2>
          <p className="mt-4 text-white/90 text-lg max-w-xl mx-auto">Book your first Magnolia Maids turnover today. Set-up takes 60 seconds and your next guest walks into a hotel-grade home.</p>
          <Link
            to="/booking"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-laurel px-8 py-4 font-bold shadow-xl hover:scale-[1.02] transition"
          >
            Book Airbnb Turnover <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

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
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-lg font-bold text-foreground">{q}</span>
        <ChevronDown className={`h-5 w-5 text-laurel transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 pb-5 text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}