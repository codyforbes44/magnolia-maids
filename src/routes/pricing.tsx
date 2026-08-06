import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { useInViewOnce, useCountUp } from "@/hooks/useInViewOnce";
import { Check, Minus, Plus, Sparkles, Waves, Star, ShieldCheck, Clock, Leaf, X } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Magnolia Maids" },
      { name: "description", content: "Simple, transparent pricing for Durant house cleaning. No surprise fees, ever." },
      { property: "og:title", content: "Transparent Cleaning Pricing — Magnolia Maids" },
      { property: "og:description", content: "Fresh, Bright, and Deep packages with clear per-home pricing." },
      { property: "og:url", content: "/pricing" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Do I need to be home?", acceptedAnswer: { "@type": "Answer", text: "Nope. Most Magnolia Maids clients give us a code or lockbox. We text a photo when we lock up." } },
            { "@type": "Question", name: "What if I'm not happy?", acceptedAnswer: { "@type": "Answer", text: "Our 24-hour Sparkle Guarantee: tell us within a day and we'll re-clean the area free." } },
            { "@type": "Question", name: "Are supplies included?", acceptedAnswer: { "@type": "Answer", text: "Yes — pro-grade products, microfiber, and vacuums. Eco or fragrance-free on request." } },
            { "@type": "Question", name: "Can I skip a visit?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Pause, skip, or reschedule from your booking email. No fees." } },
            { "@type": "Question", name: "Do prices change over time?", acceptedAnswer: { "@type": "Answer", text: "Your rate is locked as long as your plan is active. Add a bedroom and we'll re-quote first." } },
          ],
        }),
      },
    ],
  }),
});

type Frequency = "one" | "monthly" | "biweekly" | "weekly";

const FREQS: { id: Frequency; label: string; sub: string; discount: number; badge?: string }[] = [
  { id: "one", label: "One-time", sub: "Single visit", discount: 0 },
  { id: "monthly", label: "Monthly", sub: "Every 4 weeks", discount: 0.1, badge: "Save 10%" },
  { id: "biweekly", label: "Biweekly", sub: "Every 2 weeks", discount: 0.15, badge: "Save 15%" },
  { id: "weekly", label: "Weekly", sub: "Every week", discount: 0.2, badge: "Best value" },
];

const TIERS = [
  {
    id: "fresh",
    name: "Fresh",
    tagline: "Weekly upkeep",
    base: 119,
    perBed: 20,
    perBath: 15,
    emoji: "🌿",
    features: ["Dust, vacuum, mop", "Kitchen & bathrooms", "Trash & tidy", "Eco products available", "Same crew each visit"],
  },
  {
    id: "bright",
    name: "Bright",
    tagline: "Biweekly favorite",
    base: 179,
    perBed: 25,
    perBath: 20,
    emoji: "✨",
    highlight: true,
    features: ["Everything in Fresh", "Inside microwave", "Baseboards & vents", "Beds made, linens changed", "Interior door wipe-down"],
  },
  {
    id: "deep",
    name: "Deep",
    tagline: "Seasonal reset",
    base: 279,
    perBed: 35,
    perBath: 30,
    emoji: "💎",
    features: ["Everything in Bright", "Inside oven & fridge", "Tile & grout scrub", "Windows & tracks", "Cabinet fronts detailed"],
  },
] as const;

const COMPARE_ROWS: { label: string; values: [boolean | string, boolean | string, boolean | string] }[] = [
  { label: "Dust, vacuum & mop", values: [true, true, true] },
  { label: "Kitchen & bathrooms", values: [true, true, true] },
  { label: "Eco products option", values: [true, true, true] },
  { label: "Baseboards & vents", values: [false, true, true] },
  { label: "Inside microwave", values: [false, true, true] },
  { label: "Linens & beds made", values: [false, true, true] },
  { label: "Inside oven & fridge", values: [false, false, true] },
  { label: "Tile & grout scrub", values: [false, false, true] },
  { label: "Windows & tracks", values: [false, false, true] },
  { label: "Avg. visit length", values: ["2h", "3h", "5h"] },
];

const FAQS = [
  { q: "Do I need to be home?", a: "Nope. Most Magnolia Maids clients give us a code or lockbox. We text a photo when we lock up." },
  { q: "What if I'm not happy?", a: "Our 24-hour Sparkle Guarantee: tell us within a day and we'll re-clean the area free." },
  { q: "Are supplies included?", a: "Yes — pro-grade products, microfiber, and vacuums. Eco or fragrance-free on request." },
  { q: "Can I skip a visit?", a: "Absolutely. Pause, skip, or reschedule from your booking email. No fees." },
  { q: "Do prices change over time?", a: "Your rate is locked as long as your plan is active. Add a bedroom and we'll re-quote first." },
];

function PricingPage() {
  const [freq, setFreq] = useState<Frequency>("biweekly");
  const [beds, setBeds] = useState(2);
  const [baths, setBaths] = useState(2);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const discount = FREQS.find((f) => f.id === freq)!.discount;

  const priced = useMemo(
    () =>
      TIERS.map((t) => {
        const raw = t.base + Math.max(0, beds - 2) * t.perBed + Math.max(0, baths - 2) * t.perBath;
        const final = Math.round(raw * (1 - discount));
        return { ...t, raw, final, saved: raw - final };
      }),
    [beds, baths, discount]
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ivory-wash">
        <div className="pointer-events-none absolute -top-16 -left-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider ring-1 ring-primary/20">
            <Sparkles className="h-3.5 w-3.5" /> Transparent pricing
          </span>
          <h1 className="mt-4 font-display text-5xl md:text-7xl font-extrabold tracking-tight">
            Sparkle-clean prices,{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-laurel">no surprises.</span>
              <span className="absolute inset-x-0 -bottom-1 h-3 bg-sunshine/60 -z-0 rounded-sm" />
            </span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground">
            Slide, tap, and see your flat rate update in real time. Recurring visits save up to <b className="text-foreground">20%</b>.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> 24hr Sparkle Guarantee</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-sunshine fill-sunshine" /> 4.9 avg rating</span>
            <span className="inline-flex items-center gap-1.5"><Leaf className="h-4 w-4 text-primary" /> Eco products on request</span>
          </div>
        </div>
      </section>

      {/* Interactive controls */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 -mt-8 md:-mt-12 relative z-10">
        <div className="rounded-3xl bg-card border border-border shadow-bloom p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
            {/* Frequency */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">How often?</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FREQS.map((f) => {
                  const active = freq === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFreq(f.id)}
                      className={
                        "relative rounded-2xl px-3 py-3 text-left transition border " +
                        (active
                          ? "bg-laurel text-white border-transparent shadow-bloom"
                          : "bg-secondary/40 border-border hover:border-primary/40")
                      }
                    >
                      <div className="text-sm font-bold">{f.label}</div>
                      <div className={"text-[11px] " + (active ? "text-white/80" : "text-muted-foreground")}>{f.sub}</div>
                      {f.badge && (
                        <span className={"absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full " + (active ? "bg-sunshine text-foreground" : "bg-accent text-accent-foreground")}>
                          {f.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:block h-24 w-px bg-border" />

            {/* Home size steppers */}
            <div className="grid grid-cols-2 gap-4">
              <Stepper label="Bedrooms" value={beds} onChange={setBeds} min={1} max={6} />
              <Stepper label="Bathrooms" value={baths} onChange={setBaths} min={1} max={5} />
            </div>
          </div>
        </div>
      </section>

      {/* Tier cards */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14 grid gap-6 md:grid-cols-3">
        {priced.map((t) => (
          <TierCard key={t.id} tier={t} discount={discount} />
        ))}
      </section>

      {/* Savings strip */}
      <SavingsStrip priced={priced} freq={freq} discount={discount} />

      {/* Comparison */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold">Compare what's inside</h2>
          <p className="mt-3 text-muted-foreground">Every checkmark is included in the flat rate. Zero upsells at your door.</p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid grid-cols-4 bg-ivory-wash text-sm font-bold">
            <div className="p-4 md:p-5 text-muted-foreground">Feature</div>
            {TIERS.map((t) => (
              <div key={t.id} className={"p-4 md:p-5 text-center " + ((t as { highlight?: boolean }).highlight ? "bg-laurel text-white" : "")}>
                <div className="text-lg">{t.emoji} {t.name}</div>
              </div>
            ))}
          </div>
          {COMPARE_ROWS.map((row, i) => (
            <div key={row.label} className={"grid grid-cols-4 items-center text-sm " + (i % 2 ? "bg-secondary/30" : "")}>
              <div className="p-4 md:p-5 font-medium">{row.label}</div>
              {row.values.map((v, j) => (
                <div key={j} className="p-4 md:p-5 text-center">
                  {v === true ? (
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  ) : v === false ? (
                    <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {v}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Guarantee band */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 pb-16">
        <div className="rounded-3xl bg-laurel text-white p-8 md:p-12 relative overflow-hidden">
          <Waves className="absolute -bottom-6 -right-6 h-48 w-48 text-white/10" />
          <div className="grid md:grid-cols-3 gap-8 relative">
            <Perk icon={<ShieldCheck className="h-6 w-6" />} title="24-hour Sparkle Guarantee" body="Not thrilled? We'll return within 24 hours and re-clean at no cost." />
            <Perk icon={<Sparkles className="h-6 w-6" />} title="Flat-rate, no upsells" body="You see the number before we arrive. What we quote is what you pay." />
            <Perk icon={<Leaf className="h-6 w-6" />} title="Eco & pet friendly" body="Non-toxic products on request — safe for tiny toes and wet noses." />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 md:px-8 pb-16">
        <div className="text-center mb-8">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold">Little questions, honest answers</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-bold">{item.q}</span>
                  <span className={"h-8 w-8 rounded-full bg-secondary flex items-center justify-center transition " + (open ? "rotate-45" : "")}>
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                {open && <div className="px-5 pb-5 text-muted-foreground">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 pb-24">
        <div className="rounded-3xl bg-ivory-wash p-10 md:p-14 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 left-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
          <h3 className="font-display text-3xl md:text-4xl font-extrabold">Ready when you are.</h3>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Grab an instant quote, pick a day, and let Magnolia Maids handle the rest.</p>
          <Link to="/booking" className="mt-6 inline-flex items-center gap-2 rounded-full bg-laurel text-white px-8 py-4 font-bold shadow-bloom hover:brightness-110 transition">
            Get my instant quote <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{label}</div>
      <div className="flex items-center gap-2 rounded-2xl bg-secondary/40 border border-border p-1.5">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-10 w-10 rounded-xl bg-card border border-border hover:border-primary/40 flex items-center justify-center transition disabled:opacity-40"
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center">
          <div className="font-display text-2xl font-extrabold leading-none">{value}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{value === 1 ? label.slice(0, -1) : label}</div>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-10 w-10 rounded-xl bg-card border border-border hover:border-primary/40 flex items-center justify-center transition disabled:opacity-40"
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TierCard({ tier, discount }: { tier: (typeof TIERS)[number] & { final: number; raw: number; saved: number }; discount: number }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const price = useCountUp(tier.final, inView, 700);
  const highlight = (tier as { highlight?: boolean }).highlight === true;
  return (
    <div
      ref={ref}
      className={
        "relative rounded-3xl border p-8 flex flex-col transition-transform duration-300 hover:-translate-y-1 " +
        (highlight
          ? "bg-laurel text-white border-transparent shadow-bloom md:-translate-y-3"
          : "bg-card border-border hover:shadow-bloom")
      }
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sunshine text-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
          ⭐ Most popular
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-extrabold">
          <span className="mr-1">{tier.emoji}</span> {tier.name}
        </h2>
        <span className={highlight ? "text-white/80 text-sm" : "text-muted-foreground text-sm"}>{tier.tagline}</span>
      </div>
      <div className="mt-5 flex items-end gap-1">
        <span className="font-display text-5xl font-extrabold tracking-tight">${price}</span>
        <span className={(highlight ? "text-white/80" : "text-muted-foreground") + " mb-2"}>/ visit</span>
      </div>
      {discount > 0 && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className={highlight ? "line-through text-white/60" : "line-through text-muted-foreground"}>${tier.raw}</span>
          <span className={"font-bold px-2 py-0.5 rounded-full " + (highlight ? "bg-sunshine text-foreground" : "bg-primary/10 text-primary")}>
            You save ${tier.saved}
          </span>
        </div>
      )}
      <ul className="mt-6 space-y-3 text-sm flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className={"h-4 w-4 mt-0.5 shrink-0 " + (highlight ? "text-sunshine" : "text-primary")} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/booking"
        className={
          "mt-8 inline-flex justify-center rounded-full px-6 py-3 font-bold transition " +
          (highlight
            ? "bg-white text-primary hover:bg-secondary"
            : "bg-accent text-accent-foreground hover:brightness-105")
        }
      >
        Book {tier.name}
      </Link>
    </div>
  );
}

function SavingsStrip({ priced, freq, discount }: { priced: { final: number; name: string }[]; freq: Frequency; discount: number }) {
  if (discount === 0) return null;
  const bright = priced.find((p) => p.name === "Bright")!;
  const visitsPerYear = freq === "weekly" ? 52 : freq === "biweekly" ? 26 : 12;
  const yearly = bright.final * visitsPerYear;
  const saved = Math.round((bright.final / (1 - discount)) * visitsPerYear - yearly);
  return (
    <section className="mx-auto max-w-6xl px-5 md:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-accent/20 to-sunshine/20 border border-border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold uppercase tracking-wider text-primary">Recurring savings</div>
          <div className="mt-1 font-display text-2xl md:text-3xl font-extrabold">
            You'd save <span className="text-laurel">${saved}</span> per year on Bright.
          </div>
          <div className="text-sm text-muted-foreground">{visitsPerYear} visits × ${bright.final} = ${yearly.toLocaleString()} annually.</div>
        </div>
        <Link to="/booking" className="rounded-full bg-laurel text-white px-6 py-3 font-bold hover:brightness-110 transition whitespace-nowrap">
          Lock in this rate
        </Link>
      </div>
    </section>
  );
}

function Perk({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center mb-3">{icon}</div>
      <div className="font-display text-xl font-extrabold">{title}</div>
      <p className="mt-1 text-white/80 text-sm">{body}</p>
    </div>
  );
}