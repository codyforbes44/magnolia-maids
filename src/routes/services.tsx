import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Home, Sparkles, Building2, PartyPopper, Leaf, Shirt, Check } from "lucide-react";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services — Maid 4 Miami" },
      { name: "description", content: "Standard, deep, move-in/out, and specialty cleanings for Miami homes and condos." },
      { property: "og:title", content: "Cleaning Services in Miami — Maid 4 Miami" },
      { property: "og:description", content: "From weekly refreshes to deep cleans and move-outs, we handle every kind of Miami home." },
      { property: "og:url", content: "/services" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
});

const services = [
  { icon: Home, title: "Standard Clean", desc: "Weekly, biweekly, or monthly upkeep so your home always feels fresh.", items: ["Dust & wipe all surfaces", "Vacuum & mop floors", "Kitchen & bathrooms refresh", "Beds made, trash out"] },
  { icon: Sparkles, title: "Deep Clean", desc: "The full spa treatment — perfect for first visits or seasonal resets.", items: ["Everything in Standard", "Baseboards & vents", "Inside microwave & oven", "Detail scrub of tile & grout"] },
  { icon: Building2, title: "Move In / Move Out", desc: "Leave a spotless space — or move into one that already sparkles.", items: ["Inside all cabinets & drawers", "Inside fridge & appliances", "Windows & tracks", "Guaranteed inspection-ready"] },
  { icon: PartyPopper, title: "Post-Event", desc: "Enjoy the party. Splash handles the aftermath.", items: ["Same or next-day slots", "Stain treatment", "Dishes, glassware, floors", "Deodorizing & fresh air"] },
  { icon: Leaf, title: "Eco-Friendly Add-on", desc: "Plant-based products that are safe for kids, pets, and the bay.", items: ["EPA Safer Choice cleaners", "Microfiber only", "No harsh fragrances", "Reusable supplies"] },
  { icon: Shirt, title: "Laundry & Linens", desc: "Fresh sheets and folded laundry, ready when you get home.", items: ["Wash, dry, fold", "Linen change", "Delicate care", "Ironing on request"] },
];

function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="bg-sky-wash">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 text-center">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Services</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl font-extrabold">Pick your kind of clean</h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground">
            Every home is different. Whether it's a Brickell condo or a Coconut Grove bungalow,
            Splash's crew tailors the visit to you.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div key={s.title} className="rounded-3xl bg-card border border-border p-7 hover:shadow-splash hover:-translate-y-1 transition">
            <span className="grid place-items-center h-12 w-12 rounded-2xl bg-secondary text-primary">
              <s.icon className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold">{s.title}</h2>
            <p className="mt-2 text-muted-foreground">{s.desc}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {s.items.map((it) => (
                <li key={it} className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-20">
        <div className="rounded-3xl bg-ocean text-white p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">Not sure which one you need?</h2>
          <p className="mt-3 text-white/90">Splash will help you pick — just tell us about your space.</p>
          <Link to="/booking" className="mt-6 inline-flex rounded-full bg-white text-primary px-6 py-3.5 font-bold hover:bg-secondary transition">Get a Free Quote</Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}