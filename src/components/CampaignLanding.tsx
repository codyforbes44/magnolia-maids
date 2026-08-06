import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroBackground } from "@/components/HeroBackground";
import { ShareButtons } from "@/components/ShareButtons";
import { QuoteCallCTA, PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import { CampaignLeadForm } from "@/components/CampaignLeadForm";
import type { CampaignContent } from "@/lib/campaigns";
import mascot from "@/assets/magnolia-mark.webp";
import { ArrowRight, CalendarDays, CheckCircle2, ChevronDown, Phone, Sparkles } from "lucide-react";

export function CampaignLanding({ campaign, hero }: { campaign: CampaignContent; hero: string }) {
  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-sage text-white">
        <HeroBackground src={hero} tone="dark" position="center 55%" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-24 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold tracking-wide">
              <Sparkles className="h-3.5 w-3.5" /> {campaign.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-semibold leading-[1.05]">
              {campaign.headline} <span className="text-accent-strong">{campaign.headlineAccent}</span>
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/90 max-w-xl">{campaign.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#lead"
                className="tap-target inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-accent-foreground shadow-bloom hover:scale-[1.02] transition"
              >
                {campaign.primaryCta} <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={PHONE_HREF}
                className="tap-target inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/30 px-7 py-3.5 font-semibold hover:bg-white/20 transition"
              >
                <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/90">
              {campaign.proof.map((p) => (
                <li key={p} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-2xl">
              <div className="text-xs uppercase tracking-wider text-white/75">{campaign.offerCard.title}</div>
              <div className="mt-3 space-y-3 text-sm">
                {campaign.offerCard.lines.map((l, i) => (
                  <div
                    key={l.label}
                    className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ${
                      i === campaign.offerCard.lines.length - 1 ? "bg-accent/90" : "bg-white/10"
                    }`}
                  >
                    <span className="font-medium">{l.label}</span>
                    <span className="font-semibold tabular-nums whitespace-nowrap">{l.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-white/80">{campaign.offerCard.note}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/75">
                <CalendarDays className="h-3.5 w-3.5" /> Runs {campaign.season}
              </div>
            </div>
            <img
              loading="lazy"
              decoding="async"
              src={mascot}
              alt=""
              className="pointer-events-none absolute -top-8 -right-4 h-20 w-20 opacity-90 animate-float"
            />
          </div>
        </div>
      </section>

      {/* VALUE POINTS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {campaign.points.map((p) => (
            <div key={p.title} className="rounded-3xl border border-border bg-card p-6 hover:shadow-bloom hover:-translate-y-1 transition">
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">{p.title}</h2>
              <p className="mt-3 text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gradient-to-b from-sky/30 to-transparent">
        <div className="mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground text-center">How it works</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {campaign.steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-laurel font-bold">{i + 1}</span>
                <div className="mt-3 font-display text-lg font-bold text-foreground">{s.title}</div>
                <p className="mt-2 text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* LEAD FORM */}
      <section id="lead" className="scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-5 items-start">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground">{campaign.label}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{campaign.offer}</p>
            <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
              Prefer to talk? Call or text{" "}
              <a href={PHONE_HREF} className="font-semibold text-laurel underline underline-offset-4">
                {PHONE_DISPLAY}
              </a>{" "}
              — or{" "}
              <Link to="/booking" className="font-semibold text-laurel underline underline-offset-4">
                build a full estimate
              </Link>{" "}
              in about 60 seconds.
            </div>
            <ShareButtons
              className="mt-6"
              path={campaign.path}
              title={campaign.seo.title}
              description={campaign.seo.description}
            />
          </div>
          <div className="lg:col-span-3">
            <CampaignLeadForm campaign={campaign} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gradient-to-b from-transparent to-sky/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 py-16 md:py-20">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground text-center">Questions, answered.</h2>
          <div className="mt-10 space-y-3">
            {campaign.faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      <QuoteCallCTA
        heading={`Ready for ${campaign.label}?`}
        body="Flat pricing before you book — or call and we'll quote it with you over the phone."
      />
      <SiteFooter />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="tap-target w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold text-foreground hover:bg-secondary/50 transition"
      >
        {q}
        <ChevronDown className={`h-5 w-5 shrink-0 text-laurel transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-5 text-muted-foreground">{a}</p>}
    </div>
  );
}
