import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Home, Sparkles, Building2, PartyPopper, Leaf, Shirt, Check, X,
  Minus, Plus, Clock, ArrowRight, Refrigerator, Bath, WashingMachine,
  DoorOpen, Wind, ChevronRight, KeyRound, Camera, Timer,
} from "lucide-react";
import { useMemo, useState } from "react";
import mascot from "@/assets/magnolia-mark.png";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services — Magnolia Maids" },
      { name: "description", content: "Standard, deep, move-in/out, and specialty cleanings for Miami homes and condos." },
      { property: "og:title", content: "Cleaning Services in Miami — Magnolia Maids" },
      { property: "og:description", content: "From weekly refreshes to deep cleans and move-outs, we handle every kind of Miami home." },
      { property: "og:url", content: "/services" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
    scripts: [
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

type ServiceKey = "standard" | "deep" | "airbnb" | "move" | "party";

const services: Record<ServiceKey, {
  icon: typeof Home; title: string; tag: string; desc: string;
  base: number; perBed: number; perBath: number; baseHours: number; hoursPerBed: number;
  best: string; items: string[]; color: string;
}> = {
  standard: {
    icon: Home, title: "Standard Clean", tag: "Most booked",
    desc: "Weekly, biweekly, or monthly upkeep so your home always feels fresh.",
    base: 99, perBed: 20, perBath: 15, baseHours: 1.5, hoursPerBed: 0.5,
    best: "Best for tidy homes on a regular rhythm",
    color: "primary",
    items: ["Dust & wipe all surfaces", "Vacuum & mop floors", "Kitchen & bathrooms refresh", "Beds made & trash out"],
  },
  deep: {
    icon: Sparkles, title: "Deep Clean", tag: "First-visit favorite",
    desc: "The full spa treatment — perfect for first visits or seasonal resets.",
    base: 189, perBed: 35, perBath: 30, baseHours: 3, hoursPerBed: 0.75,
    best: "Best when it's been a minute since the last clean",
    color: "turquoise",
    items: ["Everything in Standard", "Baseboards, vents & fans", "Inside microwave & oven", "Tile, grout & shower scrub"],
  },
  airbnb: {
    icon: KeyRound, title: "Airbnb Turnover", tag: "Host favorite",
    desc: "Guest-ready flips between stays — linens, staging photos, and restock alerts included.",
    base: 119, perBed: 22, perBath: 18, baseHours: 1.5, hoursPerBed: 0.4,
    best: "Best for short-term rental hosts on tight turnarounds",
    color: "turquoise",
    items: ["Same-day 2-hour flips", "Hotel-grade linen swap", "Photo checklist per turn", "Restock & damage alerts"],
  },
  move: {
    icon: Building2, title: "Move In / Out", tag: "Deposit-safe",
    desc: "Leave a spotless space — or move into one that already sparkles.",
    base: 249, perBed: 45, perBath: 40, baseHours: 4, hoursPerBed: 1,
    best: "Best for empty homes ready for inspection",
    color: "deep-sea",
    items: ["Inside all cabinets & drawers", "Inside fridge & appliances", "Windows, sills & tracks", "Guaranteed inspection-ready"],
  },
  party: {
    icon: PartyPopper, title: "Post-Party", tag: "Same-day",
    desc: "Enjoy the party. Magnolia Maids handles the aftermath.",
    base: 139, perBed: 20, perBath: 15, baseHours: 2, hoursPerBed: 0.4,
    best: "Best for morning-after resets",
    color: "accent",
    items: ["Same or next-day slots", "Dishes, glassware & floors", "Stain treatment", "Deodorizing & fresh air"],
  },
};

const addons = [
  { id: "eco",  icon: Leaf, label: "Eco-friendly products", price: 15 },
  { id: "fridge", icon: Refrigerator, label: "Inside the fridge", price: 25 },
  { id: "oven", icon: Wind, label: "Inside the oven", price: 25 },
  { id: "laundry", icon: WashingMachine, label: "Laundry & linens", price: 35 },
  { id: "windows", icon: DoorOpen, label: "Interior windows", price: 30 },
  { id: "bath", icon: Bath, label: "Extra bath detail", price: 20 },
] as const;

const compareRows = [
  ["Dust, vacuum, mop", true, true, true, true, false],
  ["Kitchen & baths refresh", true, true, true, true, true],
  ["Baseboards & vents", false, true, false, true, false],
  ["Inside oven & microwave", false, true, false, true, false],
  ["Inside cabinets & drawers", false, false, false, true, false],
  ["Interior windows & tracks", false, false, false, true, false],
  ["Linen swap & bed staging", false, false, true, false, false],
  ["Photo checklist per visit", false, false, true, false, false],
  ["Same-day availability", false, false, true, false, true],
  ["Stain & odor treatment", false, false, false, false, true],
] as const;

const timeline = [
  { t: "0:00", title: "Meet & greet", desc: "Crew arrives on time and walks the space with you." },
  { t: "0:05", title: "Prep the flow", desc: "Top-to-bottom, back-to-front — no re-cleaning." },
  { t: "0:30", title: "Kitchen & baths", desc: "The heavy hitters get the attention they deserve." },
  { t: "1:30", title: "Living zones", desc: "Dust, vacuum, mop, and make the beds sing." },
  { t: "—", title: "Final walkthrough", desc: "You inspect. Anything off? We stay until it's right." },
];

const faqs = [
  { q: "How do you calculate my price?", a: "Base rate for the service, plus a small amount per bedroom and bathroom. Add-ons are optional. The number you see is the number you pay — no surprises." },
  { q: "Do you bring supplies?", a: "Yes — cleaners, cloths, tools, everything. Eco add-on swaps in plant-based products." },
  { q: "What if I have a big house?", a: "For homes over 4 bedrooms or specialty spaces, book and note it — we'll confirm a tailored estimate within an hour." },
];

function ServicesPage() {
  const [active, setActive] = useState<ServiceKey>("standard");
  const [beds, setBeds] = useState(2);
  const [baths, setBaths] = useState(2);
  const [selected, setSelected] = useState<Set<string>>(new Set(["eco"]));
  const svc = services[active];

  const price = useMemo(() => {
    const base = svc.base + svc.perBed * beds + svc.perBath * baths;
    const extras = addons.filter((a) => selected.has(a.id)).reduce((s, a) => s + a.price, 0);
    return base + extras;
  }, [svc, beds, baths, selected]);

  const hours = useMemo(() => {
    const h = svc.baseHours + svc.hoursPerBed * (beds + baths * 0.6);
    return Math.round(h * 10) / 10;
  }, [svc, beds, baths]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-ivory-wash">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-10 left-[8%] h-4 w-4 rounded-full bg-white/70 animate-float-slow" />
          <div className="absolute top-32 right-[14%] h-6 w-6 rounded-full bg-white/60 animate-float-slow" style={{ animationDelay: "1.4s" }} />
          <div className="absolute bottom-8 left-[35%] h-3 w-3 rounded-full bg-white/80 animate-float-slow" style={{ animationDelay: "0.7s" }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 text-center">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Services</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl font-extrabold">Build your kind of clean</h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground">
            Pick a service, tune it to your home, and see your price update instantly.
            No calls. No hidden fees.
          </p>
          <div className="mt-8 inline-flex flex-wrap justify-center gap-1 p-1.5 rounded-full bg-white border border-border shadow-sm">
            {(Object.keys(services) as ServiceKey[]).map((k) => {
              const s = services[k];
              const on = active === k;
              return (
                <button
                  key={k}
                  onClick={() => setActive(k)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${on ? "bg-primary text-primary-foreground shadow-bloom" : "text-foreground hover:bg-secondary"}`}
                >
                  <s.icon className="h-4 w-4" /> {s.title}
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
      <section className="mx-auto max-w-7xl px-5 md:px-8 pt-12 md:pt-16 pb-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT: config */}
          <div className="rounded-[2rem] bg-card border border-border p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-xs font-bold">
                  <Sparkles className="h-3.5 w-3.5" /> {svc.tag}
                </span>
                <h2 className="mt-3 font-display text-3xl md:text-4xl font-extrabold flex items-center gap-3">
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
              <Stepper label="Bedrooms" value={beds} setValue={setBeds} min={0} max={6} icon="🛏️" />
              <Stepper label="Bathrooms" value={baths} setValue={setBaths} min={1} max={6} icon="🛁" />
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xl font-bold">Add-ons</h3>
                <span className="text-xs text-muted-foreground">Tap to add · price updates live</span>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {addons.map((a) => {
                  const on = selected.has(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggle(a.id)}
                      className={`group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition ${on ? "border-primary bg-secondary shadow-bloom" : "border-border bg-white hover:border-primary/60"}`}
                    >
                      <span className={`grid place-items-center h-10 w-10 rounded-xl transition ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
                        <a.icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold leading-tight">{a.label}</span>
                        <span className="text-xs text-muted-foreground">+${a.price}</span>
                      </span>
                      <span className={`grid place-items-center h-6 w-6 rounded-full border transition ${on ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"}`}>
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: estimate card */}
          <aside className="lg:sticky lg:top-24 self-start rounded-[2rem] bg-laurel text-white p-6 md:p-8 relative overflow-hidden">
            <img src={mascot} alt="" aria-hidden className="hidden md:block absolute -right-6 -bottom-6 w-40 opacity-90 animate-bob" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest font-bold text-white/70">Your estimate</p>
              <div className="mt-2 flex items-end gap-2">
                <span key={price} className="font-display text-6xl md:text-7xl font-extrabold animate-rise">${price}</span>
                <span className="mb-2 text-sm text-white/80">flat</span>
              </div>
              <div className="mt-1 text-white/80 text-sm flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> ~{hours} hrs on site
              </div>

              <ul className="mt-6 space-y-1.5 text-sm text-white/90">
                <li className="flex justify-between"><span>{svc.title} base</span><span>${svc.base}</span></li>
                <li className="flex justify-between"><span>{beds} bedroom{beds === 1 ? "" : "s"}</span><span>${beds * svc.perBed}</span></li>
                <li className="flex justify-between"><span>{baths} bathroom{baths === 1 ? "" : "s"}</span><span>${baths * svc.perBath}</span></li>
                {addons.filter((a) => selected.has(a.id)).map((a) => (
                  <li key={a.id} className="flex justify-between"><span>+ {a.label}</span><span>${a.price}</span></li>
                ))}
              </ul>

              <Link to="/booking" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition">
                Book this clean <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-white/70 text-center">No card required. Confirm and pay after your visit.</p>
            </div>
          </aside>
        </div>
      </section>

      {/* SPECIALTY STRIP */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Leaf, title: "Eco-friendly", desc: "Plant-based, pet-safe products by request." },
            { icon: Shirt, title: "Laundry & linens", desc: "Wash, fold, and fresh sheets on your bed." },
            { icon: PartyPopper, title: "Event resets", desc: "Same-day help for the morning after." },
            { icon: Building2, title: "Airbnb turnovers", desc: "Guest-ready in a two-hour window." },
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
      </section>

      {/* COMPARE TABLE */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-primary font-bold text-sm uppercase tracking-wider">Compare</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold">What's included?</h2>
          </div>
          <div className="mt-10 overflow-x-auto rounded-3xl border border-border bg-white">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-5 font-display text-sm uppercase tracking-wider text-muted-foreground">Feature</th>
                  {(Object.keys(services) as ServiceKey[]).map((k) => (
                    <th key={k} className={`p-5 font-display text-sm ${active === k ? "text-primary" : ""}`}>
                      <button onClick={() => setActive(k)} className="inline-flex items-center gap-2 font-bold">
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
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Visit day</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold">A day with Magnolia Maids</h2>
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
      <section className="mx-auto max-w-4xl px-5 md:px-8 pb-16">
        <div className="text-center">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">Good questions</h2>
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
      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-laurel text-white p-10 md:p-14 text-center">
          <img src={mascot} alt="" aria-hidden className="hidden md:block absolute -right-4 -bottom-6 w-48 animate-bob" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">Still not sure which one you need?</h2>
            <p className="mt-3 text-white/90">Magnolia Maids will help you pick — just tell us about your space.</p>
            <Link to="/booking" className="mt-6 inline-flex rounded-full bg-white text-primary px-6 py-3.5 font-bold hover:bg-secondary transition">Get a Free Quote</Link>
          </div>
        </div>
      </section>
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
        <span className="font-display text-3xl font-extrabold w-10 text-center">{value}</span>
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