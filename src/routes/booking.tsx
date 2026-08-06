import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import mascot from "@/assets/magnolia-mark.webp";
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
import { submitBooking } from "@/lib/bookings.functions";
import {
  SERVICE_RATES,
  FREQUENCY_RATES,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  bedroomCount,
  bathroomCount,
  priceHome,
  getServiceRate,
  type ServiceKey,
  type FrequencyKey,
} from "@/lib/pricing";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { breadcrumbSchema, businessRef, areaServed, SITE_URL } from "@/lib/structured-data";

export const Route = createFileRoute("/booking")({
  component: BookingPage,
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
  "Deep Clean": { blurb: "The works — baseboards, grout, inside cabinets.", icon: "✨" },
  "Airbnb Turnover": { blurb: "Guest-ready flips with linen swap and photo check.", icon: "🔑" },
  "Move In / Out": { blurb: "Leave it spotless. Start somewhere new.", icon: "📦" },
  "Post-Party": { blurb: "You had fun. We'll erase the evidence.", icon: "🎉" },
};

const SERVICES = SERVICE_RATES.map((r) => ({ ...r, ...SERVICE_COPY[r.key] }));

const FREQ_COPY: Record<FrequencyKey, { label: string; badge?: string }> = {
  "One-time": { label: "Just once" },
  Monthly: { label: "Every month" },
  Biweekly: { label: "Every 2 weeks", badge: "Popular" },
  Weekly: { label: "Every week", badge: "Best value" },
};

const FREQUENCIES = FREQUENCY_RATES.map((f) => ({ ...f, ...FREQ_COPY[f.key] }));

const BEDROOMS = BEDROOM_OPTIONS.map((b) => b.label);
const BATHROOMS = BATHROOM_OPTIONS.map((b) => b.label);
const TIMES = ["Morning (8am–12pm)", "Afternoon (12pm–4pm)", "Evening (4pm–7pm)", "Flexible"];

const STEPS = [
  { key: "service", label: "Service", icon: Sparkles },
  { key: "home", label: "Your home", icon: Home },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "contact", label: "Contact", icon: User },
] as const;

type Data = {
  service: ServiceKey;
  frequency: FrequencyKey;
  bedrooms: string;
  bathrooms: string;
  preferredDay: string;
  preferredTime: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

function estimate(d: Pick<Data, "service" | "frequency" | "bedrooms" | "bathrooms">) {
  const p = priceHome({
    service: d.service,
    frequency: d.frequency,
    bedrooms: bedroomCount(d.bedrooms),
    bathrooms: bathroomCount(d.bathrooms),
  });
  return { low: p.total, high: p.high, savings: p.savings };
}

function BookingPage() {
  const submit = useServerFn(submitBooking);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({
    service: "Standard Clean",
    frequency: "Biweekly",
    bedrooms: "2",
    bathrooms: "2",
    preferredDay: "",
    preferredTime: "Flexible",
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const price = useMemo(() => estimate(data), [data]);
  const update = <K extends keyof Data>(k: K, v: Data[K]) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const canAdvance = useMemo(() => {
    if (step === 0) return !!data.service && !!data.frequency;
    if (step === 1) return !!data.bedrooms && !!data.bathrooms;
    if (step === 2) return !!data.preferredTime;
    return true;
  }, [step, data]);

  const canSubmit =
    data.name.trim() && data.email.trim() && data.address.trim().length > 4;

  async function handleSubmit() {
    setError(null);
    setStatus("loading");
    try {
      await submit({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          service: data.service,
          frequency: data.frequency,
          preferredDay: data.preferredDay,
          preferredTime: data.preferredTime,
          notes: data.notes,
        },
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

      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 pt-12 md:pt-16 pb-6 text-center">
        <p className="text-primary font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 justify-center">
          <Flower2 className="h-4 w-4" /> Grand Opening · Sept 1, 2026 · 8:00 AM CST
        </p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold leading-[1.05]">
          Reserve your opening-<br />week cleaning.
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
          Design your visit in 60 seconds — no card required. Founding members get first pick of Sept 1 slots and locked-in pricing for a full year.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 pb-20 grid lg:grid-cols-[1.35fr_1fr] gap-8 items-start">
        <div className="rounded-[2rem] bg-card border border-border shadow-xl overflow-hidden">
          {status === "sent" ? (
            <SentPanel data={data} price={price} />
          ) : (
            <>
              <Stepper step={step} />
              <div className="p-6 md:p-10 min-h-[420px]">
                {step === 0 && <StepService data={data} update={update} />}
                {step === 1 && <StepHome data={data} update={update} />}
                {step === 2 && <StepSchedule data={data} update={update} />}
                {step === 3 && (
                  <StepContact data={data} update={update} error={error} />
                )}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 md:px-10 py-4">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
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
                    onClick={() => canAdvance && setStep((s) => s + 1)}
                    disabled={!canAdvance}
                    className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-bloom hover:brightness-105 transition disabled:opacity-50"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || status === "loading"}
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
              {data.service} · {data.bedrooms} bd / {data.bathrooms} ba · {data.frequency}
            </p>
            {price.savings > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-champagne text-foreground px-3 py-1 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" /> You save ${price.savings} per visit
              </div>
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

function Stepper({ step }: { step: number }) {
  const pct = ((step + 1) / STEPS.length) * 100;
  return (
    <div className="border-b border-border bg-secondary/30 px-6 md:px-10 pt-6 pb-4">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.key} className="flex items-center gap-2 min-w-0">
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
            </div>
          );
        })}
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
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
        eyebrow="Step 1"
        title="What kind of clean?"
        subtitle="Pick the vibe — we'll match the crew and time."
      />
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {SERVICES.map((s) => {
          const active = data.service === s.key;
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
                <div className="font-display font-semibold text-lg">{s.key}</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.blurb}</p>
              <div className="mt-3 text-xs font-bold text-primary">
                From ${s.base} <span className="font-medium text-muted-foreground">· 2 bd / 2 ba included</span>
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
            {data.service} is a one-time visit, so recurring discounts don't apply. Pair it with a
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
  update,
}: {
  data: Data;
  update: <K extends keyof Data>(k: K, v: Data[K]) => void;
}) {
  return (
    <div>
      <StepTitle
        eyebrow="Step 2"
        title="Tell us about your place."
        subtitle="This helps us bring the right crew and supplies."
      />
      <div className="mt-6 space-y-6">
        <ChipRow
          label="Bedrooms"
          options={BEDROOMS}
          value={data.bedrooms}
          onChange={(v) => update("bedrooms", v)}
        />
        <ChipRow
          label="Bathrooms"
          options={BATHROOMS}
          value={data.bathrooms}
          onChange={(v) => update("bathrooms", v)}
        />
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
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <StepTitle
        eyebrow="Step 3"
        title="When works for you?"
        subtitle="Pick a day and window. We'll confirm the exact slot."
      />
      <div className="mt-6 grid gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-bold">Preferred day</label>
          <input
            type="date"
            min={today}
            value={data.preferredDay}
            onChange={(e) => update("preferredDay", e.target.value)}
            className="rounded-2xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-bold">Preferred time</label>
          <div className="mt-2 grid sm:grid-cols-2 gap-2">
            {TIMES.map((t) => {
              const active = data.preferredTime === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => update("preferredTime", t)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold text-left transition ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-secondary/40"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepContact({
  data,
  update,
  error,
}: {
  data: Data;
  update: <K extends keyof Data>(k: K, v: Data[K]) => void;
  error: string | null;
}) {
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
            label="Full name"
            value={data.name}
            onChange={(v) => update("name", v)}
            placeholder="Isabela Rivera"
            required
          />
          <TextField
            label="Email"
            type="email"
            value={data.email}
            onChange={(v) => update("email", v)}
            placeholder="you@example.com"
            required
          />
        </div>
        <TextField
          label="Phone"
          type="tel"
          value={data.phone}
          onChange={(v) => update("phone", v)}
          placeholder="(580) 745-0045"
        />
        <div className="grid gap-1">
          <label className="text-sm font-bold">Home address</label>
          <AddressAutocomplete
            value={data.address}
            onChange={(v) => update("address", v)}
            required
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-bold">Anything else?</label>
          <textarea
            rows={3}
            value={data.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Pets, entry codes, tricky spots…"
            className="rounded-2xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive font-semibold">{error}</p>
        )}
      </div>
    </div>
  );
}

function SentPanel({
  data,
  price,
}: {
  data: Data;
  price: { low: number; high: number; savings: number };
}) {
  const isTurnover = data.service === "Airbnb Turnover";
  return (
    <div className="p-8 md:p-12 text-center">
      <img loading="lazy" decoding="async" src={mascot} alt="Magnolia Maids" className="w-32 mx-auto animate-bob" />
      <h2 className="mt-4 font-display text-3xl md:text-4xl font-semibold">
        Magnolia Maids got it! 🤍
      </h2>
      <p className="mt-3 text-muted-foreground max-w-md mx-auto">
        A friendly human will confirm your slot within the hour. Meanwhile, here's what we heard:
      </p>
      <div className="mt-6 mx-auto max-w-md text-left rounded-2xl border border-border bg-secondary/40 p-5 text-sm space-y-1">
        <div><span className="font-bold">Service:</span> {data.service} · {data.frequency}</div>
        <div><span className="font-bold">Home:</span> {data.bedrooms} bd / {data.bathrooms} ba</div>
        <div><span className="font-bold">When:</span> {data.preferredDay || "flexible"} · {data.preferredTime}</div>
        <div className="truncate"><span className="font-bold">Address:</span> {data.address}</div>
        <div><span className="font-bold">Estimate:</span> ${price.low}–${price.high}</div>
      </div>
      {isTurnover && <TurnoverTimeline data={data} />}
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

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-sm font-bold">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`min-w-[64px] rounded-xl border-2 px-4 py-2.5 font-bold text-sm transition ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border hover:border-primary/40 text-foreground/80"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-sm font-bold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
        className="rounded-2xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}