import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import mascot from "@/assets/magnolia-mark.webp";
import heroBooking from "@/assets/hero-booking.webp";
import { HeroBackground } from "@/components/HeroBackground";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Home,
  CalendarDays,
  User,
  ArrowRight,
  ArrowLeft,
  Flower2,
  ShieldCheck,
} from "lucide-react";
import { Clock3 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  availabilityNotes,
  checkDate,
  earliestDate,
  fromISODate,
  latestDate,
  slotLabel,
  slotsForDate,
  toISODate,
} from "@/lib/availability";
import { submitBooking } from "@/lib/bookings.functions";
import {
  SERVICE_RATES,
  FREQUENCY_RATES,
  quoteVisit,
  addonLabels,
  addonsTotal,
  countLabel,
  fromQuoteSearch,
  clampBeds,
  clampBaths,
  getServiceRate,
  serviceLabel,
  INCLUDED_BEDROOMS,
  INCLUDED_BATHROOMS,
  type AddonKey,
  type QuoteSearch,
  type ServiceKey,
  type FrequencyKey,
} from "@/lib/pricing";
import { HomeDetailsPicker } from "@/components/HomeDetailsPicker";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { breadcrumbSchema, businessRef, areaServed, SITE_URL } from "@/lib/structured-data";

export const Route = createFileRoute("/booking")({
  component: BookingPage,
  // Every price surface on the site links here with the visitor's choices
  // already attached, so nothing is asked twice.
  validateSearch: (search: Record<string, unknown>): QuoteSearch => ({
    service: typeof search['service'] === "string" ? search['service'] : undefined,
    frequency: typeof search['frequency'] === "string" ? search['frequency'] : undefined,
    beds: search['beds'] === undefined ? undefined : Number(search['beds']),
    baths: search['baths'] === undefined ? undefined : Number(search['baths']),
    addons: typeof search['addons'] === "string" ? search['addons'] : undefined,
    pets: search['pets'] === true || search['pets'] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book House Cleaning in Durant, OK | Magnolia Maids" },
      { name: "description", content: "Get a free house cleaning quote for your Durant, OK home in 60 seconds and lock in founding-member pricing for our September 1, 2026 opening." },
      { name: "keywords", content: "book house cleaning Durant OK, free cleaning quote Durant Oklahoma, schedule maid service Bryan County" },
      { property: "og:title", content: "Book House Cleaning in Durant, OK | Magnolia Maids" },
      { property: "og:description", content: "Founding rates are limited. Reserve your Sept 1, 2026 Durant cleaning today." },
      { property: "og:url", content: "https://magnoliamaids.pro/booking" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/booking" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Book a Cleaning in Durant, OK", path: "/booking" },
        ])),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          url: `${SITE_URL}/booking`,
          name: "Book House Cleaning in Durant, OK",
          about: businessRef,
          potentialAction: {
            "@type": "ReserveAction",
            target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/booking` },
            result: { "@type": "Reservation", name: "House cleaning appointment", provider: businessRef },
          },
          mainEntity: {
            "@type": "Service",
            name: "Residential house cleaning",
            provider: businessRef,
            areaServed,
          },
        }),
      },
    ],
  }),
});

const SERVICE_COPY: Record<ServiceKey, { blurb: string; icon: string }> = {
  "Standard Clean": { blurb: "Fresh, top-to-bottom tidy for a happy home.", icon: "🧼" },
  "Bright Clean": { blurb: "Standard plus baseboards, vents, linens and detail work.", icon: "🌟" },
  "Deep Clean": { blurb: "The works — baseboards, grout, inside cabinets.", icon: "✨" },
  "Airbnb Turnover": { blurb: "Guest-ready flips with linen swap and photo check.", icon: "🔑" },
  "Move In / Out": { blurb: "Leave it spotless. Start somewhere new.", icon: "📦" },
  "Pre-Event Prep": { blurb: "Guest-ready before the graduation, holiday, or reunion.", icon: "🌿" },
  "Post-Party": { blurb: "You hosted. We'll handle the morning after.", icon: "🎉" },
  "Office Cleaning": { blurb: "Offices, clinics, and storefronts — after hours or before you open.", icon: "🏢" },
};

const SERVICES = SERVICE_RATES.map((r) => ({ ...r, ...SERVICE_COPY[r.key], label: serviceLabel(r.key) }));

const FREQ_COPY: Record<FrequencyKey, { label: string; badge?: string }> = {
  "One-time": { label: "Just once" },
  Monthly: { label: "Every month" },
  Biweekly: { label: "Every 2 weeks", badge: "Popular" },
  Weekly: { label: "Every week", badge: "Best value" },
};

const FREQUENCIES = FREQUENCY_RATES.map((f) => ({ ...f, ...FREQ_COPY[f.key] }));

const STEPS = [
  { key: "home", label: "Your home", icon: Home },
  { key: "service", label: "Service", icon: Sparkles },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "contact", label: "Contact", icon: User },
] as const;

type Data = {
  service: ServiceKey;
  frequency: FrequencyKey;
  bedrooms: number;
  bathrooms: number;
  addons: AddonKey[];
  pets: boolean;
  preferredDay: string;
  preferredTime: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

function estimate(d: Pick<Data, "service" | "frequency" | "bedrooms" | "bathrooms" | "addons">) {
  const p = quoteVisit({
    service: d.service,
    frequency: d.frequency,
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    addons: d.addons,
  });
  return { low: p.total, high: p.high, savings: p.savings, extras: p.extras };
}

/** Everything the visitor told us up front, folded into the crew's notes. */
function detailNotes(d: Data) {
  const parts: string[] = [];
  const adds = addonLabels(d.addons);
  if (adds.length) parts.push(`Add-ons: ${adds.join(", ")}`);
  if (d.pets) parts.push("Pets in the home");
  if (d.notes.trim()) parts.push(d.notes.trim());
  return parts.join("\n");
}

/** Contact-step validation. Runs on blur and on every submit attempt. */
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Please enter your full name." })
    .max(100, { message: "Name must be under 100 characters." }),
  email: z
    .string()
    .trim()
    .min(1, { message: "We need an email to send your confirmation." })
    .email({ message: "That email doesn't look right — check for typos." })
    .max(255, { message: "Email must be under 255 characters." }),
  phone: z
    .string()
    .trim()
    .max(20, { message: "Phone number is too long." })
    .refine((v) => v === "" || v.replace(/\D/g, "").length === 10, {
      message: "Enter a 10-digit US phone number.",
    }),
  address: z
    .string()
    .trim()
    .min(8, { message: "Add your street address so we can route a crew." })
    .max(200, { message: "Address must be under 200 characters." }),
  notes: z.string().trim().max(1000, { message: "Notes must be under 1000 characters." }),
});

type ContactField = keyof z.infer<typeof contactSchema>;

function contactErrors(d: Data): Partial<Record<ContactField, string>> {
  const result = contactSchema.safeParse({
    name: d.name,
    email: d.email,
    phone: d.phone,
    address: d.address,
    notes: d.notes,
  });
  if (result.success) return {};
  const out: Partial<Record<ContactField, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as ContactField;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Pretty-prints a US number as the visitor types: (580) 745-0045 */
function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const STEP_HINTS = [
  "Tell us the size of your home.",
  "Choose a service and how often.",
  "Pick an open date and arrival window.",
  "Add your contact and address details.",
];

function BookingPage() {
  const search = Route.useSearch();
  const initial = useMemo(() => fromQuoteSearch(search), [search]);
  const submit = useServerFn(submitBooking);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ confirmationSent: boolean; textSent: boolean }>({
    confirmationSent: false,
    textSent: false,
  });
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<Data>({
    service: initial.service,
    frequency: initial.frequency,
    bedrooms: initial.bedrooms,
    bathrooms: initial.bathrooms,
    addons: initial.addons,
    pets: initial.pets,
    preferredDay: "",
    preferredTime: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const price = useMemo(() => estimate(data), [data]);
  const update = <K extends keyof Data>(k: K, v: Data[K]) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const errors = useMemo(() => contactErrors(data), [data]);
  const showError = (f: ContactField) => (attempted || touched[f] ? errors[f] : undefined);
  const markTouched = (f: ContactField) => setTouched((t) => ({ ...t, [f]: true }));

  const canAdvance = useMemo(() => {
    if (step === 0) return data.bedrooms >= 0 && data.bathrooms >= 1;
    if (step === 1) return !!data.service && !!data.frequency;
    if (step === 2)
      return (
        !!data.preferredDay &&
        checkDate(data.preferredDay, data.service).available &&
        !!data.preferredTime
      );
    return true;
  }, [step, data]);

  const canSubmit = Object.keys(errors).length === 0;

  /** Keeps the visitor oriented — the top of the card, not the top of the page. */
  function goToStep(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  }

  async function handleSubmit() {
    setAttempted(true);
    if (!canSubmit) {
      const first = (["name", "email", "phone", "address", "notes"] as ContactField[]).find((f) => errors[f]);
      if (first) document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setError(null);
    setStatus("loading");
    try {
      const res = await submit({
        data: {
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          address: data.address.trim(),
          bedrooms: countLabel(data.bedrooms),
          bathrooms: countLabel(data.bathrooms),
          service: data.service,
          frequency: data.frequency,
          preferredDay: data.preferredDay,
          preferredTime: data.preferredTime,
          notes: detailNotes(data),
        },
      });
      setSent({
        confirmationSent: Boolean(res?.confirmationSent),
        textSent: Boolean(res?.textSent),
      });
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="relative overflow-hidden bg-ivory-wash">
        <HeroBackground src={heroBooking} position="center 55%" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-5 md:px-8 pt-12 md:pt-16 pb-6 text-center">
        <p className="text-primary font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 justify-center">
          <Flower2 className="h-4 w-4" /> Grand Opening · Sept 1, 2026 · 8:00 AM CST
        </p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold leading-[1.05]">
          Reserve your opening-<br />week cleaning.
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
          Design your visit in 60 seconds — no card required. Founding members get first pick of Sept 1 slots and locked-in pricing for a full year.
        </p>
        <p className="mt-4 text-sm">
          <span className="text-muted-foreground">Prefer to talk it through? </span>
          <a href="tel:+15807450045" className="tap-target inline-flex items-center gap-1.5 font-bold text-primary underline underline-offset-4">
            Call (580) 745-0045
          </a>
        </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 pb-20 grid lg:grid-cols-[1.35fr_1fr] gap-8 items-start">
        <div ref={cardRef} className="rounded-[2rem] bg-card border border-border shadow-xl overflow-hidden">
          {status === "sent" ? (
            <SentPanel data={data} price={price} sent={sent} />
          ) : (
            <>
              <Stepper step={step} onJump={goToStep} />
              <div className="p-5 sm:p-6 md:p-10 min-h-[420px] pb-4 md:pb-10">
                {step === 0 && <StepHome data={data} setData={setData} />}
                {step === 1 && <StepService data={data} update={update} />}
                {step === 2 && <StepSchedule data={data} update={update} />}
                {step === 3 && (
                  <StepContact
                    data={data}
                    update={update}
                    error={error}
                    showError={showError}
                    markTouched={markTouched}
                  />
                )}
              </div>
              <div className="hidden md:flex items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 md:px-10 py-4">
                <button
                  type="button"
                  onClick={() => goToStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-foreground/70 hover:text-foreground disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Step {step + 1} of {STEPS.length}
                </div>
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => canAdvance && goToStep(step + 1)}
                    disabled={!canAdvance}
                    className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-bloom hover:brightness-105 transition disabled:opacity-50"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={status === "loading"}
                    className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-bold shadow-bloom hover:brightness-105 transition disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Booking…</>
                    ) : (
                      <>Book with Magnolia Maids <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                )}
              </div>

              {/* Mobile: price + primary action always within thumb reach. */}
              <div className="md:hidden sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {step === STEPS.length - 1 && attempted && !canSubmit && (
                  <p className="mb-2 text-xs font-semibold text-destructive">
                    Please fix the highlighted fields to finish booking.
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                    aria-label="Previous step"
                    className="tap-target inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 disabled:opacity-40"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="font-display text-xl font-semibold tabular-nums">
                      ${price.low}<span className="text-xs font-medium text-muted-foreground">–${price.high}</span>
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {serviceLabel(data.service)} · {countLabel(data.bedrooms)}bd/{countLabel(data.bathrooms)}ba
                    </div>
                  </div>
                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => canAdvance && goToStep(step + 1)}
                      disabled={!canAdvance}
                      className="tap-target inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-bloom disabled:opacity-50"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={status === "loading"}
                      className="tap-target inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom disabled:opacity-60"
                    >
                      {status === "loading" ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Booking…</>
                      ) : (
                        <>Book now <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="rounded-[2rem] bg-laurel text-white p-6 md:p-8 shadow-xl overflow-hidden relative">
            <div className="pointer-events-none absolute -top-6 -right-6 overflow-hidden opacity-20">
              <img loading="lazy" decoding="async" src={mascot} alt="" className="w-32 sm:w-48" />
            </div>
            <p className="text-white/70 text-xs uppercase tracking-wider font-bold">
              Your estimate
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-5xl font-semibold tabular-nums">
                ${price.low}
              </span>
              <span className="text-white/70 text-sm">– ${price.high}</span>
            </div>
            <p className="mt-1 text-xs text-white/80">
              {serviceLabel(data.service)} · {countLabel(data.bedrooms)} bd / {countLabel(data.bathrooms)} ba · {data.frequency}
            </p>
            {price.savings > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-champagne text-foreground px-3 py-1 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" /> You save ${price.savings} per visit
              </div>
            )}
            {data.addons.length > 0 && (
              <ul className="mt-4 space-y-1 text-xs text-white/85 relative">
                {addonLabels(data.addons).map((label, i) => (
                  <li key={label} className="flex justify-between gap-3">
                    <span>+ {label}</span>
                    <span>${addonsTotal([data.addons[i]])}</span>
                  </li>
                ))}
              </ul>
            )}
            {data.pets && (
              <p className="mt-2 text-xs text-white/70 relative">Pet-safe products included — no extra charge.</p>
            )}
            <ul className="mt-6 space-y-2 text-sm text-white/90 relative">
              {[
                "Vetted, insured local crew",
                "Flat-rate pricing — no surprises",
                "Reschedule or cancel free with 24 hours' notice",
                "24-hour Magnolia Guarantee",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-champagne shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 flex gap-3 items-start">
            <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-bold">Instant hold, no charge</div>
              <p className="text-muted-foreground text-xs mt-1">
                We'll confirm your slot within the hour. Nothing charged until the day of service.
              </p>
            </div>
          </div>
        </aside>
      </section>
      <SiteFooter />
    </div>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  const pct = ((step + 1) / STEPS.length) * 100;
  return (
    <div className="border-b border-border bg-secondary/30 px-5 sm:px-6 md:px-10 pt-5 md:pt-6 pb-4">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => done && onJump(i)}
              disabled={!done}
              aria-current={active ? "step" : undefined}
              aria-label={`Step ${i + 1}: ${s.label}`}
              className="flex items-center gap-2 min-w-0 disabled:cursor-default"
            >
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground scale-110 shadow-bloom"
                    : done
                    ? "bg-accent text-accent-foreground"
                    : "bg-background border border-border text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`hidden md:block text-xs font-bold uppercase tracking-wider truncate ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-muted-foreground md:hidden">
        Step {step + 1} of {STEPS.length} · {STEPS[step].label} — {STEP_HINTS[step]}
      </p>
    </div>
  );
}

function StepService({
  data,
  update,
}: {
  data: Data;
  update: <K extends keyof Data>(k: K, v: Data[K]) => void;
}) {
  return (
    <div>
      <StepTitle
        eyebrow="Step 2"
        title="What kind of clean?"
        subtitle={`Prices below are for your ${countLabel(data.bedrooms)} bd / ${countLabel(data.bathrooms)} ba home${data.addons.length ? " including add-ons" : ""}.`}
      />
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {SERVICES.map((s) => {
          const active = data.service === s.key;
          const q = quoteVisit({
            service: s.key,
            frequency: s.recurring ? data.frequency : "One-time",
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            addons: data.addons,
          });
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                update("service", s.key);
                if (!s.recurring) update("frequency", "One-time");
              }}
              className={`text-left rounded-2xl border-2 p-4 transition ${
                active
                  ? "border-primary bg-primary/5 shadow-bloom"
                  : "border-border hover:border-primary/40 hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{s.icon}</div>
                <div className="font-display font-semibold text-lg">{s.label}</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.blurb}</p>
              <div className="mt-3 text-sm font-bold text-primary">
                ${q.total}
                <span className="font-medium text-muted-foreground text-xs">
                  {" "}
                  per visit · your home
                  {s.recurring && q.savings > 0 ? ` · saves $${q.savings}` : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          How often?
        </h3>
        {!getServiceRate(data.service).recurring && (
          <p className="mt-2 text-xs text-muted-foreground">
            {serviceLabel(data.service)} is a one-time visit, so recurring discounts don't apply. Pair it with a
            Standard Clean plan afterward to save up to 20%.
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          {FREQUENCIES.map((f) => {
            const active = data.frequency === f.key;
            const disabled = !getServiceRate(data.service).recurring && f.key !== "One-time";
            return (
              <button
                key={f.key}
                type="button"
                disabled={disabled}
                onClick={() => update("frequency", f.key)}
                className={`relative rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                  disabled
                    ? "border-border/60 text-muted-foreground/50 cursor-not-allowed"
                    : active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-primary/40 text-foreground/80"
                }`}
              >
                {f.badge && !disabled && (
                  <span className="absolute -top-2 right-2 rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[10px] font-bold">
                    {f.badge}
                  </span>
                )}
                {f.label}
                {f.discount > 0 && !disabled && (
                  <div className="mt-0.5 text-[11px] text-primary font-bold">
                    Save {Math.round(f.discount * 100)}%
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepHome({
  data,
  setData,
}: {
  data: Data;
  setData: React.Dispatch<React.SetStateAction<Data>>;
}) {
  return (
    <div>
      <StepTitle
        eyebrow="Step 1"
        title="Start with your home."
        subtitle="Bedrooms, bathrooms, and any extras — your price builds from here."
      />
      <div className="mt-6">
        <HomeDetailsPicker
          bedrooms={data.bedrooms}
          bathrooms={data.bathrooms}
          addons={data.addons}
          pets={data.pets}
          addonColumns="sm:grid-cols-2"
          onChange={(patch) =>
            setData((prev) => ({
              ...prev,
              ...(patch.bedrooms !== undefined ? { bedrooms: clampBeds(patch.bedrooms) } : {}),
              ...(patch.bathrooms !== undefined ? { bathrooms: clampBaths(patch.bathrooms) } : {}),
              ...(patch.addons !== undefined ? { addons: patch.addons } : {}),
              ...(patch.pets !== undefined ? { pets: patch.pets } : {}),
            }))
          }
        />
        <p className="mt-4 text-xs text-muted-foreground">
          Every rate includes a {INCLUDED_BEDROOMS} bedroom / {INCLUDED_BATHROOMS} bathroom home. Extra rooms are priced per room, never per hour.
        </p>
      </div>
    </div>
  );
}

function StepSchedule({
  data,
  update,
}: {
  data: Data;
  update: <K extends keyof Data>(k: K, v: Data[K]) => void;
}) {
  const min = earliestDate(data.service);
  const max = latestDate(data.service);
  const selected = data.preferredDay ? fromISODate(data.preferredDay) : undefined;
  const dayCheck = checkDate(data.preferredDay, data.service);
  const slots = slotsForDate(data.preferredDay, data.service);
  const notes = availabilityNotes(data.service);

  function pickDate(d: Date | undefined) {
    if (!d) return;
    const iso = toISODate(d);
    update("preferredDay", iso);
    // Clear a slot that isn't offered on the new date.
    const next = slotsForDate(iso, data.service);
    if (!next.some((s) => s.available && slotLabel(s.slot) === data.preferredTime)) {
      update("preferredTime", "");
    }
  }

  return (
    <div>
      <StepTitle
        eyebrow="Step 3"
        title="Pick your cleaning date and window."
        subtitle="Only open days and windows are selectable — what you choose is what we hold."
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[auto,1fr]">
        <div
          role="group"
          aria-label="Choose your cleaning date"
          className="rounded-3xl border border-border bg-card p-2 sm:p-3 w-fit mx-auto lg:mx-0"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={pickDate}
            defaultMonth={selected ?? min}
            startMonth={min}
            endMonth={max}
            disabled={(d) => !checkDate(toISODate(d), data.service).available}
            className="[--cell-size:2.5rem]"
          />
        </div>

        <div>
          <div className="text-sm font-bold">
            {data.preferredDay && dayCheck.available
              ? `Available windows · ${fromISODate(data.preferredDay).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}`
              : "Available windows"}
          </div>

          {!data.preferredDay || !dayCheck.available ? (
            <p className="mt-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
              {dayCheck.reason ?? "Choose a date on the calendar to see open arrival windows."}
            </p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {slots.map(({ slot, available, reason }) => {
                const label = slotLabel(slot);
                const active = data.preferredTime === label;
                return (
                  <button
                    key={slot.key}
                    type="button"
                    disabled={!available}
                    aria-pressed={active}
                    onClick={() => update("preferredTime", label)}
                    className={`tap-target rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "border-primary bg-primary/5"
                        : available
                          ? "border-border hover:border-primary/40 hover:bg-secondary/40"
                          : "border-border/60 bg-muted/40 text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <div>{slot.label}</div>
                    <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                      {available ? slot.window : reason}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            {notes.map((n) => (
              <li key={n} className="flex gap-2">
                <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StepContact({
  data,
  update,
  error,
  showError,
  markTouched,
}: {
  data: Data;
  update: <K extends keyof Data>(k: K, v: Data[K]) => void;
  error: string | null;
  showError: (f: ContactField) => string | undefined;
  markTouched: (f: ContactField) => void;
}) {
  const addressError = showError("address");
  return (
    <div>
      <StepTitle
        eyebrow="Step 4"
        title="Where should Magnolia Maids meet you?"
        subtitle="We'll text your crew's ETA the morning of."
      />
      <div className="mt-6 grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField
            id="field-name"
            label="Full name"
            value={data.name}
            onChange={(v) => update("name", v)}
            onBlur={() => markTouched("name")}
            error={showError("name")}
            placeholder="Isabela Rivera"
            autoComplete="name"
            enterKeyHint="next"
            required
          />
          <TextField
            id="field-email"
            label="Email"
            type="email"
            value={data.email}
            onChange={(v) => update("email", v)}
            onBlur={() => markTouched("email")}
            error={showError("email")}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            required
          />
        </div>
        <TextField
          id="field-phone"
          label="Phone"
          type="tel"
          value={data.phone}
          onChange={(v) => update("phone", formatPhone(v))}
          onBlur={() => markTouched("phone")}
          error={showError("phone")}
          hint="Optional — we'll text an instant confirmation and your crew's ETA."
          placeholder="(580) 745-0045"
          autoComplete="tel"
          inputMode="tel"
          enterKeyHint="next"
        />
        <div className="grid gap-1">
          <label htmlFor="field-address" className="text-sm font-bold">
            Home address <span className="text-destructive">*</span>
          </label>
          <AddressAutocomplete
            id="field-address"
            value={data.address}
            onChange={(v) => update("address", v)}
            required
          />
          {addressError && (
            <p className="text-xs font-semibold text-destructive">{addressError}</p>
          )}
        </div>
        <div className="grid gap-1">
          <label htmlFor="field-notes" className="text-sm font-bold">Anything else?</label>
          <textarea
            id="field-notes"
            rows={3}
            maxLength={1000}
            value={data.notes}
            onChange={(e) => update("notes", e.target.value)}
            onBlur={() => markTouched("notes")}
            placeholder="Pets, entry codes, tricky spots…"
            className="rounded-2xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function SentPanel({
  data,
  price,
  sent,
}: {
  data: Data;
  price: { low: number; high: number; savings: number; extras: number };
  sent: { confirmationSent: boolean; textSent: boolean };
}) {
  const isTurnover = data.service === "Airbnb Turnover";
  return (
    <div className="p-8 md:p-12 text-center">
      <img loading="lazy" decoding="async" src={mascot} alt="Magnolia Maids" className="w-32 mx-auto animate-bob" />
      <h2 className="mt-4 font-display text-3xl md:text-4xl font-semibold">
        Magnolia Maids got it! 🤍
      </h2>
      <p className="mt-3 text-muted-foreground max-w-md mx-auto">
        {sent.confirmationSent
          ? `A recap just landed in your inbox${sent.textSent ? " and your phone" : ""}. A friendly human will confirm your slot within the hour.`
          : "A friendly human will confirm your slot within the hour."}{" "}
        Meanwhile, here's what we heard:
      </p>
      <div className="mt-6 mx-auto max-w-md text-left rounded-2xl border border-border bg-secondary/40 p-5 text-sm space-y-1">
        <div><span className="font-bold">Service:</span> {serviceLabel(data.service)} · {data.frequency}</div>
        <div><span className="font-bold">Home:</span> {countLabel(data.bedrooms)} bd / {countLabel(data.bathrooms)} ba{data.pets ? " · pets" : ""}</div>
        {data.addons.length > 0 && (
          <div><span className="font-bold">Add-ons:</span> {addonLabels(data.addons).join(", ")} (+${price.extras})</div>
        )}
        <div>
          <span className="font-bold">When:</span>{" "}
          {data.preferredDay
            ? fromISODate(data.preferredDay).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
            : "not set"}
          {data.preferredTime ? ` · ${data.preferredTime}` : ""}
        </div>
        <div className="truncate"><span className="font-bold">Address:</span> {data.address}</div>
        <div><span className="font-bold">Estimate:</span> ${price.low}–${price.high}</div>
      </div>
      {isTurnover && <TurnoverTimeline data={data} />}
      <div className="mt-6 mx-auto max-w-md text-left rounded-2xl border border-primary/25 bg-primary/5 p-5 text-sm">
        <p className="font-bold">What happens next</p>
        <ol className="mt-2 space-y-1.5 text-muted-foreground list-decimal pl-4">
          <li>We confirm your exact arrival window {data.phone ? "by text" : "by email"} within 1 business hour.</li>
          <li>You get written confirmation with your flat rate and cleaner's name.</li>
          <li>Cleaning day — we bring every supply. Payment is due the day of service.</li>
          <li>Your 24-hour Magnolia Guarantee starts the moment we finish.</li>
        </ol>
      </div>
    </div>
  );
}

const TURNOVER_STAGES: {
  key: string;
  label: string;
  detail: string;
  icon: string;
}[] = [
  { key: "received", label: "Reservation received", detail: "We logged your turnover in the dispatch board.", icon: "📥" },
  { key: "confirmed", label: "Host details confirmed", detail: "Access, linen closet & Wi-Fi verified with you.", icon: "🔑" },
  { key: "assigned", label: "Turnover crew assigned", detail: "Your dedicated 2-person Magnolia Maids team is locked in.", icon: "👥" },
  { key: "checkout", label: "Guest check-out inspection", detail: "Damage sweep, lost & found logged, photos taken.", icon: "🔍" },
  { key: "cleaning", label: "Deep turnover cleaning", detail: "Bath refresh, kitchen reset, floors & surfaces.", icon: "🧼" },
  { key: "linens", label: "Linen swap & restock", detail: "Hotel-fold beds, fresh towels, consumables topped up.", icon: "🛏️" },
  { key: "photos", label: "Photo checklist uploaded", detail: "Full staging photos delivered to your inbox.", icon: "📸" },
  { key: "ready", label: "Guest-ready ✓", detail: "Magnolia Maids out — your listing is 5-star ready.", icon: "✅" },
];

function TurnoverTimeline({ data }: { data: Data }) {
  // Demo real-time progression: auto-advance every ~6s so hosts see it move.
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (active >= TURNOVER_STAGES.length - 1) return;
    const t = setTimeout(() => setActive((a) => a + 1), 6000);
    return () => clearTimeout(t);
  }, [active]);

  const eta = useMemo(() => {
    const base = data.preferredDay
      ? new Date(`${data.preferredDay}T12:00:00`)
      : new Date(Date.now() + 24 * 3600 * 1000);
    const label = base.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return label;
  }, [data.preferredDay]);

  const pct = ((active + 1) / TURNOVER_STAGES.length) * 100;
  const current = TURNOVER_STAGES[active];

  return (
    <div className="mt-8 mx-auto max-w-xl text-left rounded-[1.75rem] border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 shadow-bloom">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Live turnover status
          </span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          Target flip · {eta}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-display text-xl font-semibold">
            {current.icon} {current.label}
          </div>
          <div className="text-xs font-bold text-muted-foreground tabular-nums">
            Step {active + 1}/{TURNOVER_STAGES.length}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{current.detail}</p>
        <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="mt-6 space-y-3">
        {TURNOVER_STAGES.map((s, i) => {
          const done = i < active;
          const isActive = i === active;
          return (
            <li key={s.key} className="flex gap-3 items-start">
              <div
                className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  done
                    ? "bg-accent text-accent-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground scale-110 shadow-bloom"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-sm font-bold ${
                    isActive ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </div>
                <div className="text-xs text-muted-foreground">{s.detail}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 rounded-2xl bg-laurel text-white p-4 text-xs flex items-start gap-2">
        <Flower2 className="h-4 w-4 mt-0.5 shrink-0 text-champagne" />
        <div>
          You'll get SMS + email pings at every step. Reply <span className="font-bold">STATUS</span> anytime for a live update, or forward this page to your co-host.
        </div>
      </div>
    </div>
  );
}

function StepTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-3xl md:text-4xl font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  type = "text",
  placeholder,
  required,
  autoComplete,
  inputMode,
  enterKeyHint,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | undefined;
  hint?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  enterKeyHint?: React.HTMLAttributes<HTMLInputElement>["enterKeyHint"];
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-bold">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-12 rounded-2xl border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 ${
          error
            ? "border-destructive focus:ring-destructive/40"
            : "border-input focus:ring-ring"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}