import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { QuoteCallCTA } from "@/components/QuoteCallCTA";
import { HeroBackground } from "@/components/HeroBackground";
import heroCommunity from "@/assets/hero-community.jpg";
import { ATTRACTIONS, SEASON_TIPS } from "@/lib/community";
import { getDurantWeather } from "@/lib/weather.functions";
import { breadcrumbSchema, SITE_URL } from "@/lib/structured-data";
import {
  ArrowRight,
  CloudSun,
  Droplets,
  ExternalLink,
  MapPin,
  Sailboat,
  Thermometer,
  Wind,
} from "lucide-react";

const TITLE = "Durant, OK Community Guide | Weather & Lake Texoma";
const DESCRIPTION =
  "Live Durant, OK weather, Lake Texoma attractions, and seasonal home-care tips from Magnolia Maids — the local guide for Bryan County residents and lake hosts.";
const URL = `${SITE_URL}/community`;
const OG_IMAGE = `${SITE_URL}/og-magnolia-maids.jpg`;

const weatherQueryOptions = queryOptions({
  queryKey: ["durant-weather"],
  queryFn: () => getDurantWeather(),
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "Durant OK weather, Lake Texoma attractions, Bryan County community guide, things to do Durant Oklahoma",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Community", path: "/community" },
          ]),
        ),
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(weatherQueryOptions);
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-24" role="alert">
        <h1 className="font-display text-3xl font-semibold">This page didn't load</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
        <Link to="/" className="mt-6 inline-flex text-primary font-semibold">
          Back home
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
  component: CommunityPage,
});

function WeatherPanel() {
  const { data } = useSuspenseQuery(weatherQueryOptions);
  const { current, periods, error } = data;
  const daily = periods.filter((p) => p.isDaytime).slice(0, 5);

  const updated = current?.observedAt ?? data.fetchedAt;
  const updatedLabel = new Date(updated).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  if (error) {
    return (
      <div className="rounded-[2rem] border border-border bg-card p-7 md:p-10">
        <h3 className="font-display text-xl font-semibold">Durant weather is offline right now</h3>
        <p className="mt-2 text-muted-foreground">
          We pull conditions live from the National Weather Service and it isn't answering at the
          moment. Try again shortly, or check{" "}
          <a
            href="https://forecast.weather.gov/MapClick.php?lat=33.9937&lon=-96.3708"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-2"
          >
            the official Durant forecast
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {current && (
        <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Durant right now
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-display text-5xl md:text-6xl font-semibold text-laurel">
                  {current.temperatureF !== null ? `${current.temperatureF}°` : "—"}
                </span>
                <span className="text-lg text-muted-foreground">{current.description ?? ""}</span>
              </div>
            </div>
            <dl className="flex flex-wrap gap-x-7 gap-y-3 text-sm">
              {current.feelsLikeF !== null && (
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <dt className="text-muted-foreground">Feels like</dt>
                  <dd className="font-semibold">{current.feelsLikeF}°F</dd>
                </div>
              )}
              {current.humidity !== null && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <dt className="text-muted-foreground">Humidity</dt>
                  <dd className="font-semibold">{current.humidity}%</dd>
                </div>
              )}
              {current.windMph !== null && (
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <dt className="text-muted-foreground">Wind</dt>
                  <dd className="font-semibold">
                    {current.windMph} mph {current.windDirection ?? ""}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {daily.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {daily.map((p) => (
            <li key={p.name} className="rounded-3xl border border-border bg-card p-5">
              <div className="text-sm font-bold text-laurel">{p.name}</div>
              <div className="mt-2 font-display text-3xl font-semibold">
                {p.temperatureF !== null ? `${p.temperatureF}°` : "—"}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {p.shortForecast}
              </p>
              {p.precipChance !== null && p.precipChance > 0 && (
                <p className="mt-2 text-xs font-semibold text-primary">
                  {p.precipChance}% chance of rain
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Conditions from the{" "}
        <a
          href="https://www.weather.gov/oun/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          National Weather Service (Norman, OK)
        </a>
        , station KDUA. Updated {updatedLabel} CT.
      </p>
    </div>
  );
}

function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-sage text-white">
        <HeroBackground src={heroCommunity} tone="dark" position="center 60%" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold tracking-wide">
            <Sailboat className="h-3.5 w-3.5" aria-hidden="true" /> COMMUNITY
          </span>
          <h1 className="mt-5 font-display text-4xl md:text-5xl font-semibold leading-[1.05] text-balance">
            Living well around <span className="text-accent-strong">Durant &amp; Lake Texoma</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base md:text-lg text-white/90">
            Today's forecast, the places we love on the water, and what each season does to a home
            in Bryan County — gathered by the crew that cleans here every week.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              to="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-7 py-3.5 font-bold shadow-bloom hover:brightness-105 transition"
            >
              Get an instant quote <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#weather"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 backdrop-blur px-7 py-3.5 font-bold ring-1 ring-white/25 hover:bg-white/25 transition"
            >
              See today's weather
            </a>
          </div>
        </div>
      </section>

      {/* WEATHER */}
      <section id="weather" className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
            <CloudSun className="h-4 w-4" aria-hidden="true" /> Durant weather
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold">
            What the sky is doing over Bryan County.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Straight from the National Weather Service — no app, no sign-in.
          </p>
        </div>
        <div className="mt-8">
          <WeatherPanel />
        </div>
      </section>

      {/* SEASONAL TIPS */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold">
              What the forecast means for your home.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Oklahoma weather leaves a mark indoors. Here's what we see most, season by season.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SEASON_TIPS.map((t) => (
              <article key={t.season} className="rounded-3xl border border-border bg-card p-6 flex flex-col">
                <div className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t.season} · {t.months}
                </div>
                <h3 className="mt-2 font-display text-xl font-bold">{t.headline}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{t.body}</p>
                <Link
                  to={t.cta.to}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2.5 transition-all"
                >
                  {t.cta.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ATTRACTIONS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
            <MapPin className="h-4 w-4" aria-hidden="true" /> Lake Texoma &amp; Durant
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold">
            Places worth the drive.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Hours, fees, and lake levels change with the season, so every entry links to the
            official source — check it before you load the truck.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ATTRACTIONS.map((a) => (
            <article key={a.name} className="rounded-3xl border border-border bg-card p-6 flex flex-col">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {a.kind}
              </div>
              <h3 className="mt-2 font-display text-xl font-bold">{a.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{a.blurb}</p>
              <a
                href={a.source}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4"
              >
                {a.sourceLabel} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* LAKE WEEKEND */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold">
              Hosting on the water this weekend?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Lake houses fill up fast between Memorial Day and October. These are the services
              built for that rhythm.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Airbnb turnovers",
                body: "Same-day resets between guests, linens included, photo-verified when we leave.",
                to: "/airbnb-turnover",
              },
              {
                title: "Post-event cleaning",
                body: "After the party, the reunion, or the tournament weekend — we handle the aftermath.",
                to: "/post-event-cleaning",
              },
              {
                title: "Summer on the Lake",
                body: "Our seasonal plan for lake houses that see guests every weekend all summer.",
                to: "/summer-on-the-lake",
              },
            ].map((c) => (
              <Link
                key={c.title}
                to={c.to}
                className="group rounded-3xl border border-border bg-card p-6 hover:shadow-bloom hover:-translate-y-1 transition"
              >
                <h3 className="font-display text-xl font-bold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHERE WE CLEAN */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
        <div className="rounded-[2rem] border border-border bg-card p-7 md:p-10">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">Where we clean</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Durant and all of Bryan County, plus the Oklahoma shoreline of Lake Texoma — Kingston,
            Cartwright, Mead, and Platter. Flat rates, no travel fee.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/service-areas/$area"
              params={{ area: "bryan-county" }}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold hover:bg-secondary/70 transition"
            >
              Bryan County
            </Link>
            <Link
              to="/service-areas/$area"
              params={{ area: "lake-texoma" }}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold hover:bg-secondary/70 transition"
            >
              Lake Texoma
            </Link>
            <Link
              to="/service-areas"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold hover:bg-secondary/70 transition"
            >
              All service areas
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold hover:bg-secondary/70 transition"
            >
              Common questions
            </Link>
          </div>
        </div>
      </section>

      <QuoteCallCTA
        heading="Spend the weekend on the water, not on the floors"
        body="Flat pricing before you book — or call and we'll quote it with you over the phone."
      />

      <SiteFooter />
    </div>
  );
}