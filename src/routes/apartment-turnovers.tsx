import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Camera,
  FileSpreadsheet,
  KeyRound,
  Phone,
  ShieldCheck,
  Sparkles,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { HeroBackground } from "@/components/HeroBackground";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import { getAttribution } from "@/lib/attribution";
import { trackNextdoorEvent } from "@/components/NextdoorTracking";
import { propertyInquirySchema, submitPropertyInquiry } from "@/lib/property-inquiry.functions";
import { ContactPrefPicker } from "@/components/ContactPrefPicker";
import type { ContactPref } from "@/lib/contact-pref";
import { breadcrumbSchema, serviceSchema } from "@/lib/structured-data";
import heroApartments from "@/assets/hero-apartment-turnovers.jpg";
import mascot from "@/assets/magnolia-mark.webp";

const VALUE = [
  {
    icon: CalendarClock,
    title: "Turns that keep pace with leasing",
    desc: "Standing crews reserved for your property, with same-week and next-day turns when a notice lands unexpectedly.",
  },
  {
    icon: Camera,
    title: "Photo proof on every unit",
    desc: "Each completed unit is documented against the rent-ready checklist so your leasing office can approve without a second walk.",
  },
  {
    icon: FileSpreadsheet,
    title: "One invoice, per-unit pricing",
    desc: "Rates set by floor plan and condition tier, consolidated into a single monthly invoice with unit numbers itemized.",
  },
  {
    icon: ShieldCheck,
    title: "Insured, bonded, background-checked",
    desc: "Certificate of insurance naming your ownership entity, and the same vetted Durant crew in your buildings every week.",
  },
];

const CHECKLIST = [
  "Inside all cabinets, drawers, closets, and pantry",
  "Inside fridge, oven, range hood, microwave, dishwasher",
  "Tub, shower, tile, grout, toilet, vanity, and mirrors",
  "Windows, sills, tracks, and blinds",
  "Baseboards, door frames, switch plates, and vents",
  "Light fixtures, ceiling fans, and smoke detector wipe",
  "Balcony or patio swept, exterior door and threshold",
  "Floors vacuumed, mopped, and edge-detailed",
  "Final walk against your rent-ready punch list",
];

const ADDONS = [
  { icon: Trash2, title: "Trash-out & haul away", desc: "Abandoned furniture, bagged debris, and left-behind belongings cleared before the clean starts." },
  { icon: Sparkles, title: "Carpet & flooring care", desc: "Carpet shampoo, spot treatment, and hard-floor scrub scheduled in the same turn window." },
  { icon: KeyRound, title: "Common areas & amenities", desc: "Breezeways, laundry rooms, clubhouse, gym, and leasing office on a recurring schedule." },
  { icon: ClipboardCheck, title: "Make-ready punch support", desc: "Post-paint and post-maintenance dust-outs so the unit shows the same day the trade finishes." },
];

const STEPS = [
  { t: "Step 1", title: "Send your property details", desc: "Unit count, floor-plan mix, and how fast units need to be rent-ready. Two minutes on the form below." },
  { t: "Step 2", title: "Walk one vacant unit", desc: "A crew lead walks a typical vacant with you so the per-unit rate reflects your real turn condition." },
  { t: "Step 3", title: "Written per-unit proposal", desc: "Pricing by floor plan and condition tier, turnaround commitment, insurance certificate, invoicing terms." },
  { t: "Step 4", title: "Standing turn schedule", desc: "You send the notice list; we schedule, clean, photograph, and report back — every unit, every month." },
];

const FAQS = [
  {
    q: "How is apartment turnover cleaning priced?",
    a: "By the unit, not by the hour — a flat rate per floor plan (studio, 1 bed, 2 bed, 3 bed+) set after we walk a typical vacant at your property. Heavy-condition units and trash-outs are quoted as a separate tier up front so there are no surprise invoices.",
  },
  {
    q: "How fast can a unit be turned?",
    a: "Standard turn is same-day or next-day once maintenance and paint are finished. For properties on a standing schedule we hold crew capacity around the first and last week of the month, when Durant notice volume peaks.",
  },
  {
    q: "Do you handle multiple units at once?",
    a: "Yes. We staff by volume — several units in a single day for end-of-month blocks, and multi-building portfolios across Durant, Calera, Caddo, Silo, Kingston, Mead, and Lake Texoma.",
  },
  {
    q: "Can you work with our rent-ready checklist?",
    a: "We clean to your checklist, not ours. Send the punch list your leasing office grades against and we build the crew card from it, then photograph each line item on completion.",
  },
  {
    q: "Do you clean common areas and the leasing office?",
    a: "Yes — breezeways, stairwells, laundry rooms, clubhouse, fitness room, and the leasing office can run on a weekly or biweekly schedule alongside your unit turns.",
  },
  {
    q: "Are you insured, and can you name our ownership entity?",
    a: "We are insured and bonded, every cleaner is background-checked, and we provide a certificate of insurance naming your ownership or management entity before the first turn.",
  },
  {
    q: "Do you serve student and short-term rental portfolios?",
    a: "Yes. SOSU-area student housing, corporate rentals, and Lake Texoma short-term portfolios all run on the same per-unit turnover model.",
  },
];

const TITLE = "Apartment Turnover Cleaning in Durant | Magnolia Maids";
const DESC =
  "Per-unit move-in and move-out turnover cleaning for Durant, OK apartment complexes. Photo-verified rent-ready units and one monthly invoice.";

export const Route = createFileRoute("/apartment-turnovers")({
  component: ApartmentTurnoversPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      {
        name: "keywords",
        content:
          "apartment turnover cleaning Durant OK, make ready cleaning Durant Oklahoma, property management cleaning Bryan County, unit turn cleaning Durant, rental turnover cleaners Durant OK",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "https://magnoliamaids.pro/apartment-turnovers" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/apartment-turnovers" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceSchema({
            name: "Apartment & Property Turnover Cleaning",
            description:
              "Per-unit move-in and move-out turnover cleaning for apartment complexes, rental portfolios, and property managers in Durant, OK and Bryan County, with photo-verified rent-ready checklists and consolidated monthly invoicing.",
            url: "/apartment-turnovers",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Apartment & Property Turnovers", path: "/apartment-turnovers" },
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

function PropertyIntakeForm() {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactPref, setContactPref] = useState<ContactPref>("email");
  const send = useServerFn(submitPropertyInquiry);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) || "");
    const num = (k: string) => Number(fd.get(k) || 0);

    const payload = {
      propertyName: str("propertyName"),
      propertyAddress: str("propertyAddress"),
      totalUnits: num("totalUnits"),
      unitsStudio: num("unitsStudio"),
      units1bd: num("units1bd"),
      units2bd: num("units2bd"),
      units3bdPlus: num("units3bdPlus"),
      turnsPerMonth: str("turnsPerMonth"),
      turnaround: str("turnaround"),
      accessMethod: str("accessMethod"),
      needsTrashOut: fd.get("needsTrashOut") === "on",
      needsCarpetCare: fd.get("needsCarpetCare") === "on",
      startDate: str("startDate"),
      contactName: str("contactName"),
      contactRole: str("contactRole"),
      company: str("company"),
      email: str("email"),
      phone: str("phone"),
      notes: str("notes"),
      contactPref,
    };

    const parsed = propertyInquirySchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
      return;
    }

    setSending(true);
    try {
      await send({ data: { ...parsed.data, attribution: getAttribution() } });
      trackNextdoorEvent("LEAD");
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
          Your property details are in. 🤍
        </h3>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          An account lead will call the same business day to confirm your unit mix and schedule a walk-through of one
          vacant unit. A recap is already in your inbox.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={PHONE_HREF}
            className="tap-target inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-accent-foreground transition hover:brightness-105"
          >
            <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
          </a>
          <Link
            to="/services"
            className="tap-target inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-foreground ring-1 ring-border transition hover:bg-secondary"
          >
            See all services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-border bg-card p-6 shadow-bloom md:p-8"
      noValidate
    >
      <h3 className="font-display text-2xl font-semibold text-foreground">Request a per-unit proposal</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Two minutes now, written pricing back within one business day. No obligation, no hourly meter.
      </p>

      <div className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property name" htmlFor="propertyName" required>
            <input id="propertyName" name="propertyName" required className={inputCls} placeholder="Magnolia Ridge Apartments" />
          </Field>
          <Field label="Management company" htmlFor="company">
            <input id="company" name="company" className={inputCls} placeholder="Texoma Property Group" />
          </Field>
        </div>

        <Field label="Property address" htmlFor="propertyAddress">
          <input id="propertyAddress" name="propertyAddress" className={inputCls} placeholder="1200 W Main St, Durant, OK" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Total units" htmlFor="totalUnits">
            <input id="totalUnits" name="totalUnits" type="number" min={0} inputMode="numeric" className={inputCls} placeholder="96" />
          </Field>
          <Field label="Turns per month (typical)" htmlFor="turnsPerMonth">
            <select id="turnsPerMonth" name="turnsPerMonth" className={inputCls} defaultValue="">
              <option value="">Select</option>
              <option>1–3</option>
              <option>4–8</option>
              <option>9–15</option>
              <option>16–30</option>
              <option>30+</option>
              <option>Seasonal / varies</option>
            </select>
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-foreground">
            Unit mix <span className="font-normal text-muted-foreground">(optional)</span>
          </legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["unitsStudio", "Studio"],
              ["units1bd", "1 bed"],
              ["units2bd", "2 bed"],
              ["units3bdPlus", "3 bed+"],
            ].map(([name, label]) => (
              <label key={name} htmlFor={name} className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
                <input
                  id={name}
                  name={name}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  defaultValue={0}
                  className={inputCls}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Turnaround needed" htmlFor="turnaround">
            <select id="turnaround" name="turnaround" className={inputCls} defaultValue="">
              <option value="">Select</option>
              <option>Same day</option>
              <option>Next day</option>
              <option>Within 48 hours</option>
              <option>Within a week</option>
              <option>Flexible</option>
            </select>
          </Field>
          <Field label="Unit access" htmlFor="accessMethod">
            <select id="accessMethod" name="accessMethod" className={inputCls} defaultValue="">
              <option value="">Select</option>
              <option>Leasing office key pickup</option>
              <option>Lockbox</option>
              <option>Smart lock / code</option>
              <option>Maintenance lets us in</option>
              <option>Other</option>
            </select>
          </Field>
        </div>

        <fieldset className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">Also needed</legend>
          <div className="mt-1 space-y-2">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="needsTrashOut" className="h-4 w-4 rounded border-border" />
              Trash-out / haul away on some units
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="needsCarpetCare" className="h-4 w-4 rounded border-border" />
              Carpet shampoo or hard-floor scrub
            </label>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="contactName" required>
            <input id="contactName" name="contactName" required className={inputCls} placeholder="Taylor Nguyen" />
          </Field>
          <Field label="Your role" htmlFor="contactRole">
            <input id="contactRole" name="contactRole" className={inputCls} placeholder="Property manager" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" required>
            <input id="email" name="email" type="email" required className={inputCls} placeholder="you@company.com" />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <input id="phone" name="phone" type="tel" className={inputCls} placeholder="(580) 555-0123" />
          </Field>
        </div>

        <Field label="Target start date" htmlFor="startDate">
          <input id="startDate" name="startDate" type="date" className={inputCls} />
        </Field>

        <Field label="Anything else we should price?" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className={inputCls}
            placeholder="Common areas, post-paint dust-outs, your rent-ready checklist, end-of-month volume…"
          />
        </Field>

        <ContactPrefPicker value={contactPref} onChange={setContactPref} />

        <button
          type="submit"
          disabled={sending}
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-4 text-base font-bold text-accent-foreground transition hover:brightness-105 disabled:opacity-60"
        >
          {sending ? "Sending…" : "Request my per-unit proposal"} <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Prefer to talk it through?{" "}
          <a href={PHONE_HREF} className="font-semibold text-foreground underline">
            {PHONE_DISPLAY}
          </a>
        </p>
      </div>
    </form>
  );
}

function ApartmentTurnoversPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-laurel via-primary to-sage text-white">
        <HeroBackground src={heroApartments} tone="dark" position="center 55%" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-5 md:px-8 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur">
              <Building2 className="h-3.5 w-3.5" /> PROPERTY MANAGEMENT · DURANT &amp; BRYAN COUNTY
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
              Apartment turnovers, <span className="text-accent-strong">rent-ready</span> on your schedule.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90 md:text-xl">
              Move-in and move-out unit cleaning for Durant apartment complexes, duplexes, and rental portfolios —
              priced per unit, photographed on completion, invoiced once a month.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#proposal"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-white shadow-bloom transition hover:scale-[1.02]"
              >
                Request a per-unit proposal <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={PHONE_HREF}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 font-semibold backdrop-blur transition hover:bg-white/20"
              >
                <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/85">
              <span className="inline-flex items-center gap-2"><Camera className="h-4 w-4" /> Photo-verified units</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Insured &amp; bonded</span>
              <span className="inline-flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> One monthly invoice</span>
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-white/20 bg-white/10 p-6 backdrop-blur md:p-8">
            <div className="text-xs uppercase tracking-wider text-white/70">Built for portfolios</div>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Per-unit flat rates by floor plan — never hourly",
                "Same-day and next-day turns during notice season",
                "Trash-outs, carpet care, and post-paint dust-outs",
                "Common areas, clubhouse, and leasing office add-ons",
                "Certificate of insurance naming your entity",
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

      {/* VALUE */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-5 md:px-8 md:py-20">
        <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Why Durant property managers hand us the keys
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A vacant unit costs rent every day it sits. Our whole model is built to shorten that gap without giving up the
          standard your leasing office grades against.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border/60 bg-card p-6">
              <v.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CHECKLIST */}
      <section className="bg-secondary/50 py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-5 md:px-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              What a rent-ready turn includes
            </h2>
            <p className="mt-3 text-muted-foreground">
              This is the baseline on every unit. Send us your own punch list and we'll build the crew card from yours
              instead.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {CHECKLIST.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-laurel" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ADDONS.map((a) => (
              <div key={a.title} className="rounded-2xl border border-border/60 bg-card p-5">
                <a.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-semibold text-foreground">{a.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-5 md:px-8 md:py-20">
        <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">How onboarding works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.t} className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-brass">{s.t}</div>
              <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section id="proposal" className="scroll-mt-20 bg-secondary/50 py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-5 md:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Tell us about your property
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every portfolio prices differently, so we quote after we understand your unit mix and turn condition —
              never from a generic rate card.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              {[
                "Written per-unit pricing within one business day",
                "Walk-through of one vacant before anything is signed",
                "No contracts required to start — earn the volume",
                "Serving Durant, Calera, Caddo, Silo, Mead, Kingston, and Lake Texoma",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-laurel" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ShareButtons
                path="/apartment-turnovers"
                title="Apartment turnover cleaning in Durant, OK"
              />
            </div>
          </div>
          <PropertyIntakeForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-5 md:px-8 md:py-20">
        <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Property turnover questions
        </h2>
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
          <h3 className="font-display text-2xl font-semibold md:text-3xl">Have units sitting vacant right now?</h3>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Call the property turnover desk and we'll get a crew scheduled while the proposal is being written.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={PHONE_HREF}
              className="tap-target inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-white"
            >
              <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
            </a>
            <Link
              to="/move-out-cleaning"
              className="tap-target inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 font-semibold backdrop-blur transition hover:bg-white/20"
            >
              Single-home move-outs
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
