import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { QuoteCallCTA } from "@/components/QuoteCallCTA";
import { HeroBackground } from "@/components/HeroBackground";
import heroDurant from "@/assets/durant-home.webp";
import { SERVICE_AREA_PAGES } from "@/lib/service-areas";
import { breadcrumbSchema, SITE_URL } from "@/lib/structured-data";
import { ArrowRight, MapPin } from "lucide-react";

const TITLE = "Service Areas | House Cleaning in Bryan County & Lake Texoma";
const DESCRIPTION =
  "Magnolia Maids cleans Durant and all of Bryan County, OK plus the Lake Texoma shoreline — Kingston, Cartwright, Mead, and Platter. Flat rates, no travel fee.";
const URL = `${SITE_URL}/service-areas`;

export const Route = createFileRoute("/service-areas/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "keywords", content: "house cleaning Bryan County OK, Lake Texoma cleaning service, Durant OK maid service areas" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${SITE_URL}/og-magnolia-maids.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}/og-magnolia-maids.jpg` },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Service Areas", path: "/service-areas" },
          ]),
        ),
      },
    ],
  }),
  component: ServiceAreasIndex,
});

function ServiceAreasIndex() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-sage text-white">
        <HeroBackground src={heroDurant} tone="dark" position="center 55%" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold tracking-wide">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> SERVICE AREAS
          </span>
          <h1 className="mt-5 font-display text-4xl md:text-5xl font-semibold leading-[1.05]">
            Where <span className="text-accent-strong">Magnolia Maids</span> cleans.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">{DESCRIPTION}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 py-16 grid gap-6 md:grid-cols-2">
        {SERVICE_AREA_PAGES.map((a) => (
          <div key={a.slug} className="rounded-3xl border border-border bg-card p-7 flex flex-col">
            <h2 className="font-display text-2xl font-bold text-foreground">{a.name}</h2>
            <p className="mt-3 flex-1 text-muted-foreground">{a.intro}</p>
            <ul className="mt-4 flex flex-wrap gap-2 text-sm">
              {a.towns.slice(0, 6).map((t) => (
                <li key={t.name} className="rounded-full bg-secondary/60 px-3 py-1 font-semibold text-foreground">
                  {t.name}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/service-areas/$area"
                params={{ area: a.slug }}
                className="tap-target inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-accent-foreground shadow-bloom transition hover:brightness-105"
              >
                {a.label} cleaning <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/booking"
                className="tap-target inline-flex items-center rounded-full border border-border px-6 py-3 font-semibold text-foreground transition hover:border-primary/60"
              >
                Book now
              </Link>
            </div>
          </div>
        ))}
      </section>

      <QuoteCallCTA heading="Not sure if we reach you?" body="Call us or start an instant quote — we'll confirm coverage before you book." />
      <SiteFooter />
    </div>
  );
}