import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { QuoteCallCTA, PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import { ShareButtons } from "@/components/ShareButtons";
import { HeroBackground } from "@/components/HeroBackground";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import heroDurant from "@/assets/durant-home.webp";
import heroLake from "@/assets/hero-summer-lake.jpg";
import mascot from "@/assets/magnolia-mark.webp";
import { SERVICE_AREA_PAGES, getServiceArea } from "@/lib/service-areas";
import { serviceSchema, breadcrumbSchema, SITE_URL } from "@/lib/structured-data";
import { ArrowRight, MapPin, Phone, ShieldCheck, Sparkles, CalendarCheck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/service-areas/$area")({
  loader: ({ params }) => {
    if (!getServiceArea(params.area)) throw notFound();
    return null;
  },
  head: ({ params }) => {
    const area = getServiceArea(params.area);
    if (!area) {
      return { meta: [{ title: "Service area not found | Magnolia Maids" }, { name: "robots", content: "noindex" }] };
    }
    const url = `${SITE_URL}/service-areas/${area.slug}`;
    const image = `${SITE_URL}/og-magnolia-maids.jpg`;
    return {
      meta: [
        { title: area.metaTitle },
        { name: "description", content: area.metaDescription },
        { name: "keywords", content: area.keywords },
        { property: "og:title", content: area.metaTitle },
        { property: "og:description", content: area.metaDescription },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            serviceSchema({
              name: `House Cleaning in ${area.name}`,
              description: area.metaDescription,
              url: `/service-areas/${area.slug}`,
            }),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Service Areas", path: "/service-areas" },
              { name: area.name, path: `/service-areas/${area.slug}` },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: area.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
  component: AreaPage,
});

function AreaPage() {
  const { area: slug } = Route.useParams();
  const area = getServiceArea(slug);
  if (!area) return null;
  const others = SERVICE_AREA_PAGES.filter((a) => a.slug !== area.slug);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-sage text-white">
        <HeroBackground src={area.heroImage === "lake" ? heroLake : heroDurant} tone="dark" position="center 55%" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold tracking-wide">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {area.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-semibold leading-[1.05]">
              {area.headline} <span className="text-accent-strong">{area.headlineAccent}</span>.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/90 max-w-xl">{area.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/quote"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-white shadow-bloom hover:scale-[1.02] transition"
              >
                Get your instant quote <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={PHONE_HREF}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/30 px-7 py-3.5 font-semibold hover:bg-white/20 transition"
              >
                <Phone className="h-4 w-4" aria-hidden="true" /> {PHONE_DISPLAY}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/85">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Insured &amp; bonded</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" aria-hidden="true" /> 24-Hour Magnolia Guarantee</span>
              <span className="inline-flex items-center gap-2"><CalendarCheck className="h-4 w-4" aria-hidden="true" /> Mon–Fri 8:00 AM–5:00 PM CST</span>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-2xl">
              <div className="text-xs uppercase tracking-wider text-white/70">Where we clean here</div>
              <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
                {area.towns.map((t) => (
                  <li key={t.name} className="rounded-2xl bg-white/10 px-4 py-2.5 font-semibold">
                    {t.name}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-white/75">No travel fee anywhere on this list.</p>
            </div>
            <img loading="lazy" decoding="async" src={mascot} alt="" className="absolute -bottom-6 -left-6 h-24 w-24 animate-float" />
          </div>
        </div>
      </section>

      {/* TOWNS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground">
            Communities we serve in {area.label}.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every address below is on a regular route, so you get consistent crews and consistent days.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {area.towns.map((t) => (
            <div key={t.name} className="rounded-3xl border border-border bg-card p-6 hover:shadow-bloom hover:-translate-y-1 transition">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sage/10 text-laurel">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-foreground">{t.name}</h3>
              <p className="mt-2 text-muted-foreground">{t.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="bg-gradient-to-b from-sky/30 to-transparent">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground text-center">
            Why {area.label} homes hire us.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {area.highlights.map((h) => (
              <div key={h.title} className="rounded-3xl bg-white border border-border p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-laurel" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">{h.title}</h3>
                    <p className="mt-2 text-muted-foreground">{h.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RHYTHM */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">Our week in {area.label}.</h2>
          <p className="mt-3 text-lg text-muted-foreground">Routes are set so your day and arrival window stay the same.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {area.rhythm.map((r) => (
            <div key={r.title} className="rounded-3xl border border-border bg-card p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-laurel">{r.title}</div>
              <p className="mt-2 text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
            Most-booked services in {area.label}.
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">Flat rates for a 2 bed / 2 bath home — your quote adjusts to your actual house.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {area.services.map((s) => (
              <div key={s.key} className="rounded-3xl border border-border bg-white p-6 flex flex-col">
                <h3 className="font-display text-lg font-bold text-foreground">{s.label}</h3>
                <p className="mt-2 flex-1 text-muted-foreground">{s.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/booking"
                    search={{ service: s.key }}
                    className="tap-target inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-bloom transition hover:brightness-105"
                  >
                    Book this <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    to={s.to}
                    className="tap-target inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/60"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground text-center">
          {area.label} cleaning questions.
        </h2>
        <Accordion type="single" collapsible defaultValue="faq-0" className="mt-8 space-y-3">
          {area.faqs.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`faq-${i}`}
              className="rounded-2xl bg-white border border-border px-5 border-b data-[state=open]:border-primary/60 transition"
            >
              <AccordionTrigger className="text-left font-display text-base sm:text-lg font-bold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-6 text-center text-muted-foreground">
          More answers on our{" "}
          <Link to="/faq" className="font-semibold text-laurel underline underline-offset-4">
            full FAQ page
          </Link>
          , or see{" "}
          <Link to="/pricing" className="font-semibold text-laurel underline underline-offset-4">
            pricing
          </Link>
          .
        </p>
      </section>

      {/* OTHER AREAS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 pb-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">Other areas we clean</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              to="/service-areas/$area"
              params={{ area: o.slug }}
              className="tap-target inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/60"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" /> {o.label}
            </Link>
          ))}
          <Link
            to="/service-areas"
            className="tap-target inline-flex items-center rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/60"
          >
            All service areas
          </Link>
        </div>
        <div className="mt-8">
          <ShareButtons
            path={`/service-areas/${area.slug}`}
            title={area.metaTitle}
            description={area.metaDescription}
          />
        </div>
      </section>

      <QuoteCallCTA
        heading={`Book a cleaning in ${area.label}`}
        body="Flat pricing before you book — or call and we'll quote it with you over the phone."
        className="pt-12"
      />
      <SiteFooter />
    </div>
  );
}