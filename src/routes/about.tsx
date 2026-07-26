import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import mascot from "@/assets/splash-mascot.png";
import { Heart, Leaf, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Splash — Splash" },
      { name: "description", content: "Meet Splash, our friendly dolphin mascot, and the local Miami team behind Splash." },
      { property: "og:title", content: "Meet Splash — Splash" },
      { property: "og:description", content: "The story behind Miami's friendliest house cleaning service." },
      { property: "og:url", content: "/about" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="bg-sky-wash">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-wider">Meet Splash</p>
            <h1 className="mt-3 font-display text-5xl md:text-6xl font-extrabold leading-[1.05]">
              A friendly dolphin with a very tidy secret.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg">
              Splash grew up in Biscayne Bay dreaming of sparkling reefs — and sparkling homes.
              He's the face of Splash, cheering on a local crew that treats every house like their own.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-ocean rounded-full blur-3xl opacity-30" />
            <img src={mascot} alt="Splash the dolphin waving" className="relative mx-auto w-72 md:w-96 animate-bob" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 md:px-8 py-20 grid gap-6 md:grid-cols-3">
        {[
          { icon: Heart, title: "Kindness first", desc: "We hire for warmth, then train for the details." },
          { icon: Leaf, title: "Better for the bay", desc: "Eco-safe products keep your home and Miami's water clean." },
          { icon: Users, title: "Locally owned", desc: "Born in Miami, run by Miamians. Splash wouldn't have it any other way." },
        ].map((v) => (
          <div key={v.title} className="rounded-3xl bg-card border border-border p-7">
            <span className="grid place-items-center h-12 w-12 rounded-2xl bg-secondary text-primary">
              <v.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 font-display text-xl font-bold">{v.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm">{v.desc}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-24">
        <div className="rounded-3xl bg-ocean text-white p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">Say hi to Splash</h2>
          <p className="mt-3 text-white/90">Book your first cleaning and see the Splash difference.</p>
          <Link to="/booking" className="mt-6 inline-flex rounded-full bg-white text-primary px-6 py-3.5 font-bold hover:bg-secondary transition">Book a Cleaning</Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}