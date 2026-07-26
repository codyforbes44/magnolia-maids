import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Maid 4 Miami" },
      { name: "description", content: "Simple, transparent pricing for Miami house cleaning. No surprise fees, ever." },
      { property: "og:title", content: "Transparent Cleaning Pricing — Maid 4 Miami" },
      { property: "og:description", content: "Fresh, Bright, and Deep packages with clear per-home pricing." },
      { property: "og:url", content: "/pricing" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
});

const tiers = [
  {
    name: "Fresh",
    price: 119,
    tagline: "Weekly upkeep",
    features: ["Up to 2 bed / 2 bath", "Dust, vacuum, mop", "Kitchen & bathrooms", "Trash & tidy", "Eco products available"],
  },
  {
    name: "Bright",
    price: 179,
    tagline: "Biweekly favorite",
    highlight: true,
    features: ["Up to 3 bed / 2 bath", "Everything in Fresh", "Inside microwave", "Baseboards & vents", "Beds made, linens changed"],
  },
  {
    name: "Deep",
    price: 279,
    tagline: "Seasonal reset",
    features: ["Up to 4 bed / 3 bath", "Everything in Bright", "Inside oven & fridge", "Tile & grout scrub", "Windows & tracks"],
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="bg-sky-wash">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 text-center">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Pricing</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl font-extrabold">Honest prices. No surprises.</h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground">
            Pick the package that fits your home. Bigger place? We'll quote it in under a minute.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-16 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={
              "relative rounded-3xl border p-8 flex flex-col " +
              (t.highlight
                ? "bg-ocean text-white border-transparent shadow-splash md:-translate-y-3"
                : "bg-card border-border")
            }
          >
            {t.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                Most popular
              </span>
            )}
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-extrabold">{t.name}</h2>
              <span className={t.highlight ? "text-white/80 text-sm" : "text-muted-foreground text-sm"}>{t.tagline}</span>
            </div>
            <div className="mt-4 flex items-end gap-1">
              <span className="font-display text-5xl font-extrabold">${t.price}</span>
              <span className={t.highlight ? "text-white/80 mb-2" : "text-muted-foreground mb-2"}>/ visit</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className={"h-4 w-4 mt-0.5 shrink-0 " + (t.highlight ? "text-sunshine" : "text-primary")} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/booking"
              className={
                "mt-8 inline-flex justify-center rounded-full px-6 py-3 font-bold transition " +
                (t.highlight
                  ? "bg-white text-primary hover:bg-secondary"
                  : "bg-accent text-accent-foreground hover:brightness-105")
              }
            >
              Book {t.name}
            </Link>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-3xl px-5 md:px-8 pb-24 text-center">
        <p className="text-muted-foreground">Recurring visits save up to 20%. Larger homes and specialty jobs get a custom quote — Splash promises transparent pricing every time.</p>
      </section>
      <SiteFooter />
    </div>
  );
}