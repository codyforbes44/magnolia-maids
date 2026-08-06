import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HelpCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import { faqPageSchema } from "@/lib/faq";
import { businessRef, SITE_URL } from "@/lib/structured-data";

const URL = `${SITE_URL}/faq`;
const TITLE = "House Cleaning FAQ — Durant, OK | Magnolia Maids";
const DESCRIPTION =
  "Answers on flat-rate cleaning prices, recurring discounts, scheduling, Airbnb turnovers, and what's included for Durant and Bryan County homes.";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(faqPageSchema(URL)) },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "FAQ", item: URL },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${URL}#webpage`,
          url: URL,
          name: TITLE,
          description: DESCRIPTION,
          about: businessRef,
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <main>
        <section className="bg-ivory-wash">
          <div className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 pt-12 pb-14 md:pt-20 md:pb-24">
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">Home</Link>
              <span className="px-2" aria-hidden="true">/</span>
              <span className="text-foreground font-semibold">FAQ</span>
            </nav>

            <header className="mt-6 text-center">
              <p className="text-primary font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2">
                <HelpCircle className="h-4 w-4" aria-hidden="true" /> Frequently asked questions
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
                House cleaning questions, answered
              </h1>
              <p className="mt-3 text-muted-foreground">
                Everything Durant and Bryan County homeowners ask us about pricing, scheduling, and
                what a Magnolia Maids visit includes — no fine print.
              </p>
            </header>

            <FaqAccordion />

            <div className="mt-10 rounded-3xl border border-border bg-white p-6 text-center">
              <p className="font-display text-xl font-bold">Still have a question?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Get a flat price in seconds or talk to a real person in Durant.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  to="/booking"
                  className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition"
                >
                  Get an instant quote <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href={PHONE_HREF}
                  className="tap-target inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 font-bold hover:border-primary transition"
                >
                  Call {PHONE_DISPLAY}
                </a>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
              <Link to="/pricing" className="tap-target rounded-full border border-border bg-white px-4 py-2.5 font-bold hover:border-primary transition">See pricing</Link>
              <Link to="/services" className="tap-target rounded-full border border-border bg-white px-4 py-2.5 font-bold hover:border-primary transition">All services</Link>
              <Link to="/airbnb-turnover" className="tap-target rounded-full border border-border bg-white px-4 py-2.5 font-bold hover:border-primary transition">Airbnb turnovers</Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
