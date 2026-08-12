import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Info,
  LayoutDashboard,
  MapPin,
  MessagesSquare,
  Phone,
  Sparkles,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroBackground } from "@/components/HeroBackground";
import { ShareButtons } from "@/components/ShareButtons";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import { breadcrumbSchema } from "@/lib/structured-data";
import { getAttribution } from "@/lib/attribution";
import { franchiseInquirySchema, submitFranchiseInquiry } from "@/lib/franchise.functions";
import { ContactPrefPicker } from "@/components/ContactPrefPicker";
import type { ContactPref } from "@/lib/contact-pref";
import heroFranchise from "@/assets/hero-franchise.jpg";
import mascot from "@/assets/magnolia-mark-sm.webp";

const TITLE = "Franchise Interest — Own a Magnolia Maids | Durant, OK";
const DESC =
  "Magnolia Maids is exploring franchising. Register early interest in bringing our upscale house cleaning brand and operations to your market.";

const DISCLAIMER =
  "This website and its contents are for informational purposes only and are not an offer to sell, or the solicitation of an offer to buy, a franchise. Magnolia Maids does not currently have a registered Franchise Disclosure Document. Any franchise offering would be made only through an FDD delivered in compliance with applicable federal and state law.";

const PILLARS = [
  {
    icon: Sparkles,
    title: "A brand people trust in the room",
    desc: "Botanical, upscale, and quietly premium — built to win the homes that never shop on price alone.",
  },
  {
    icon: LayoutDashboard,
    title: "Software we actually run on",
    desc: "Instant quoting, online booking, customer accounts, lead follow-up automation, and an admin dashboard — not a binder and a spreadsheet.",
  },
  {
    icon: BadgeCheck,
    title: "A documented operating system",
    desc: "Hiring, training, checklists, quality photos, pricing logic, and service recovery written down the way we run Durant every day.",
  },
  {
    icon: Building2,
    title: "More than one revenue line",
    desc: "Recurring homes plus Airbnb turnovers, post-event resets, move-outs, and apartment turn contracts that fill the calendar.",
  },
];

const SYSTEM = [
  "Per-service flat-rate pricing model with published rate logic",
  "Instant online quote and booking flow that converts without a phone call",
  "Customer dashboard for history, entry notes, pets, and reschedules",
  "Lead capture, automated follow-up email sequences, and a CRM-style admin",
  "Field checklists for standard, deep, Airbnb, event, move-out, and unit turns",
  "Hiring funnel, applicant tracking, and crew onboarding materials",
  "Local SEO, review generation, and social campaign templates",
  "Quality assurance with photo verification on completion",
];

const STAGES = [
  { t: "Stage 1", title: "Register interest", desc: "Tell us your market and background. No cost, no obligation, nothing to sign." },
  { t: "Stage 2", title: "Introductory call", desc: "A conversation about your goals and whether ownership fits — not a sales pitch." },
  { t: "Stage 3", title: "Discovery", desc: "We walk you through how Durant runs: the manual, the crews, the software, the numbers we can share." },
  { t: "Stage 4", title: "Formal review", desc: "If and when the program opens, complete disclosure documents are reviewed with your own attorney first." },
];

const FIT = [
  "You want to build a team, not buy yourself a job",
  "You are community-minded and comfortable being the local face",
  "You care about the quality of a finished home, not just the invoice",
  "You have — or can assemble — the capital to fund a launch and payroll runway",
  "You are prepared to follow a system rather than reinvent one",
];

const FAQS = [
  {
    q: "Is Magnolia Maids selling franchises right now?",
    a: "No. We are exploring franchising and building the program. Nothing on this page is an offer to sell a franchise, and no franchise can be offered or sold until a Franchise Disclosure Document exists and applicable state requirements are met.",
  },
  {
    q: "What does registering interest actually do?",
    a: "It puts you on the early-interest list and starts a conversation. You will hear from us about your market, your background, and what you are looking for. There is no fee, no commitment, and no obligation on either side.",
  },
  {
    q: "Can you tell me the investment, fees, or earnings?",
    a: "Not yet — and we will not guess. Any figures about investment, fees, or financial performance would have to be presented in a Franchise Disclosure Document. We will not quote numbers before that document exists.",
  },
  {
    q: "Which markets are you thinking about first?",
    a: "Southern Oklahoma and North Texas are the natural next steps because our supply chain, recruiting, and brand recognition already reach there. That said, we want to hear from strong operators in any market.",
  },
  {
    q: "Do I need cleaning industry experience?",
    a: "No. Operators who are strong at hiring, local relationships, and service standards tend to do best. The cleaning craft is teachable; caring about the customer is not.",
  },
  {
    q: "What happens to the Durant location?",
    a: "It stays company-owned and operating. Durant is the proving ground — every process we would license is one we run ourselves first.",
  },
];

export const Route = createFileRoute("/franchise")({
  component: FranchisePage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      {
        name: "keywords",
        content:
          "Magnolia Maids franchise, cleaning franchise opportunity Oklahoma, house cleaning business ownership, maid service franchise Texoma",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "https://magnoliamaids.pro/franchise" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/franchise" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
            { name: "Franchise interest", path: "/franchise" },
          ]),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
});

const inputCls =
  "w-full rounded-2xl border border-border bg-white px-4 py-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}{" "}
        {required ? (
          <span className="text-accent-strong">*</span>
        ) : (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </span>
      {children}
    </label>
  );
}

function FranchiseInterestForm() {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactPref, setContactPref] = useState<ContactPref>("email");
  const send = useServerFn(submitFranchiseInquiry);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) || "");

    const payload = {
      name: str("name"),
      email: str("email"),
      phone: str("phone"),
      targetCity: str("targetCity"),
      targetState: str("targetState"),
      timeline: str("timeline"),
      capitalBand: str("capitalBand"),
      background: str("background"),
      why: str("why"),
      contactPref,
    };

    const parsed = franchiseInquirySchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
      return;
    }

    setSending(true);
    try {
      await send({ data: { ...parsed.data, attribution: getAttribution() } });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error(`Couldn't send that — please call ${PHONE_DISPLAY}.`);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-bloom md:p-10">
        <img loading="lazy" decoding="async" src={mascot} alt="" className="mx-auto w-20 animate-bob" />
        <h3 className="mt-4 font-display text-2xl font-semibold text-foreground md:text-3xl">
          You're on the early-interest list. 🤍
        </h3>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          We'll reach out personally to learn about your market. A recap of what you sent is already in your inbox —
          nothing is committed and nothing is owed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/about"
            className="tap-target inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-accent-foreground transition hover:brightness-105"
          >
            Meet Magnolia Maids <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={PHONE_HREF}
            className="tap-target inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-foreground ring-1 ring-border transition hover:bg-secondary"
          >
            <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-bloom md:p-8" noValidate>
      <h3 className="font-display text-2xl font-semibold text-foreground">Register your interest</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        No cost, no commitment, and nothing to sign. This simply starts a conversation.
      </p>

      <div className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="name" required>
            <input id="name" name="name" required autoComplete="name" className={inputCls} placeholder="Jordan Ellis" />
          </Field>
          <Field label="Email" htmlFor="email" required>
            <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" className={inputCls} placeholder="you@example.com" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone">
            <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className={inputCls} placeholder="(580) 555-0142" />
          </Field>
          <Field label="Timeline" htmlFor="timeline">
            <select id="timeline" name="timeline" className={inputCls} defaultValue="">
              <option value="">Select</option>
              <option>Just exploring</option>
              <option>Within 6 months</option>
              <option>6–12 months</option>
              <option>12+ months</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City you'd serve" htmlFor="targetCity">
            <input id="targetCity" name="targetCity" className={inputCls} placeholder="Sherman" />
          </Field>
          <Field label="State" htmlFor="targetState">
            <input id="targetState" name="targetState" className={inputCls} placeholder="TX" />
          </Field>
        </div>

        <Field label="Capital available to invest" htmlFor="capitalBand">
          <select id="capitalBand" name="capitalBand" className={inputCls} defaultValue="">
            <option value="">Prefer not to say</option>
            <option>Under $50k</option>
            <option>$50k–$100k</option>
            <option>$100k–$250k</option>
            <option>$250k+</option>
            <option>Still determining</option>
          </select>
        </Field>

        <Field label="Your background" htmlFor="background">
          <textarea id="background" name="background" rows={3} className={inputCls} placeholder="Operations, ownership, service industry, management experience…" />
        </Field>

        <Field label="Why Magnolia Maids?" htmlFor="why">
          <textarea id="why" name="why" rows={3} className={inputCls} placeholder="What draws you to this brand and this business?" />
        </Field>
      </div>

      <ContactPrefPicker className="mt-6" value={contactPref} onChange={setContactPref} />

      <button
        type="submit"
        disabled={sending}
        className="tap-target mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-accent-foreground shadow-bloom transition hover:brightness-105 disabled:opacity-60"
      >
        {sending ? "Sending…" : "Register interest"} <ArrowRight className="h-4 w-4" />
      </button>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
    </form>
  );
}

function FranchisePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-sage text-white">
        <HeroBackground src={heroFranchise} tone="dark" position="center 60%" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-5 md:px-8 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur">
              <MapPin className="h-3.5 w-3.5" /> EARLY INTEREST · NOT AN OFFER TO SELL A FRANCHISE
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
              Bring Magnolia Maids <span className="text-accent-strong">to your town.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90 md:text-xl">
              We built an upscale cleaning company in Durant, Oklahoma with a documented operating system and software
              we run ourselves. Now we're exploring who should carry it next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#interest"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-white shadow-bloom transition hover:scale-[1.02]"
              >
                Register your interest <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={PHONE_HREF}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 font-semibold backdrop-blur transition hover:bg-white/20"
              >
                <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/85">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4" /> Documented playbook</span>
              <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Proprietary software</span>
              <span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" /> No obligation</span>
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-white/20 bg-white/10 p-6 backdrop-blur md:p-8">
            <div className="text-xs uppercase tracking-wider text-white/70">Where we are today</div>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              Magnolia Maids is <strong>exploring franchising</strong>. There is no Franchise Disclosure Document yet,
              so we are not selling anything and will not quote fees or earnings. What we are doing is meeting the kind
              of owners we'd want to hand the name to.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                "Company-owned Durant location as the proving ground",
                "Operations manual written from how we actually run",
                "Technology stack included, not sold separately",
                "Conversations first — paperwork only if the program opens",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                  <span className="text-white/90">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* DISCLAIMER BAR */}
      <div className="border-b border-border/60 bg-secondary/60">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-4 sm:px-5 md:px-8">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </div>

      {/* PILLARS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-5 md:px-8 md:py-20">
        <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          What an owner would actually be carrying
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Not a logo and a phone number. A brand, a way of working, and the tools that make it repeatable in a second
          market.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border/60 bg-card p-6">
              <p.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SYSTEM + FIT */}
      <section className="bg-secondary/50 py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-5 md:px-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">The Magnolia Maids system</h2>
            <p className="mt-3 text-muted-foreground">
              Every item below is something we run in Durant today — that's the only reason it's on this list.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {SYSTEM.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-laurel" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8">
            <h3 className="font-display text-2xl font-semibold text-foreground">Who this tends to fit</h3>
            <ul className="mt-5 space-y-3">
              {FIT.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-secondary/70 p-4 text-sm text-muted-foreground">
              If you're already running a cleaning company and thinking about converting, we'd like to hear from you
              too — that conversation is a different one, and a good one.
            </p>
          </div>
        </div>
      </section>

      {/* STAGES */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-5 md:px-8 md:py-20">
        <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">How the conversation goes</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {STAGES.map((s) => (
            <div key={s.t} className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-brass">{s.t}</div>
              <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section id="interest" className="scroll-mt-20 bg-secondary/50 py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-5 md:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Tell us about your market
            </h2>
            <p className="mt-3 text-muted-foreground">
              We're building the early-interest list now so the first calls happen with people we already know when the
              program is ready.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              {[
                "A real person reads every submission",
                "No fees, no deposits, nothing to sign",
                "We won't quote investment or earnings before an FDD exists",
                "Southern Oklahoma and North Texas first — but tell us your market anyway",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-laurel" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ShareButtons path="/franchise" title="Own a Magnolia Maids location" />
            </div>
          </div>
          <FranchiseInterestForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-5 md:px-8 md:py-20">
        <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">Franchise questions</h2>
        <div className="mt-8 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="tap-target flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-semibold text-foreground">{f.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-gradient-to-br from-laurel to-primary p-8 text-center text-white">
          <MessagesSquare className="mx-auto h-6 w-6" />
          <h3 className="mt-3 font-display text-2xl font-semibold md:text-3xl">Rather just talk it through?</h3>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Call and ask for ownership inquiries. We'll be straight with you about where the program stands.
          </p>
          <a
            href={PHONE_HREF}
            className="tap-target mt-5 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-bold text-primary transition hover:bg-secondary"
          >
            <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
