import { PartnerPerk } from "@/components/PartnerPerk";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Flower2, Phone } from "lucide-react";
import { HomeDetailsPicker } from "@/components/HomeDetailsPicker";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import { QuoteProgress, QUOTE_STEPS } from "@/components/quote/QuoteProgress";
import { QuoteSummaryCard, StickyQuoteBar } from "@/components/quote/QuoteSummary";
import { AnimatedPrice } from "@/components/quote/QuotePrice";
import { QuoteContactForm } from "@/components/quote/QuoteContactForm";
import { validateContact, type ContactForm } from "@/components/quote/quote-schema";
import { submitQuoteRequest } from "@/lib/quote-request.functions";
import { getAttribution } from "@/lib/attribution";
import { trackNextdoorEvent } from "@/components/NextdoorTracking";
import {
  FREQUENCY_RATES,
  SERVICE_RATES,
  addonLabels,
  countLabel,
  fromQuoteSearch,
  getServiceRate,
  quoteVisit,
  serviceLabel,
  sqftLabel,
  type AddonKey,
  type FrequencyKey,
  type QuoteSelection,
  type ServiceKey,
} from "@/lib/pricing";

const searchSchema = z.object({
  service: z.string().optional(),
  frequency: z.string().optional(),
  beds: z.coerce.number().optional(),
  baths: z.coerce.number().optional(),
  sqft: z.string().optional(),
  addons: z.string().optional(),
  pets: z.coerce.boolean().optional(),
  name: z.string().optional(),
});

export const Route = createFileRoute("/quote")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Instant Cleaning Quote | Magnolia Maids Durant, OK" },
      {
        name: "description",
        content:
          "Get your flat-rate Magnolia Maids cleaning price in 30 seconds — pick your service, home size, and add-ons.",
      },
      { property: "og:title", content: "Instant Cleaning Quote | Magnolia Maids" },
      { property: "og:description", content: "Your Durant, OK cleaning price in 30 seconds." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://magnoliamaids.pro/quote" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/quote" }],
  }),
  component: QuoteOnlyPage,
});

function QuoteOnlyPage() {
  const search = Route.useSearch();
  const [sel, setSel] = useState<QuoteSelection>(() => fromQuoteSearch(search));
  const sendRequest = useServerFn(submitQuoteRequest);
  const topRef = useRef<HTMLDivElement>(null);

  // Leads arriving with service + size prefilled start on "Your home".
  const [step, setStep] = useState(() => (search.service ? 1 : 0));

  const [form, setForm] = useState<ContactForm>({
    name: search.name ?? "",
    email: "",
    phone: "",
    address: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
    smsConsent: false,
    contactPref: "email",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sqftError, setSqftError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const recurring = getServiceRate(sel.service).recurring;
  const frequency: FrequencyKey = recurring ? sel.frequency : "One-time";

  const quote = useMemo(
    () =>
      quoteVisit({
        service: sel.service,
        frequency,
        bedrooms: sel.bedrooms,
        bathrooms: sel.bathrooms,
        sqft: sel.sqft,
        addons: sel.addons,
      }),
    [sel.service, frequency, sel.bedrooms, sel.bathrooms, sel.sqft, sel.addons],
  );

  const addons = addonLabels(sel.addons);
  const summaryLine = `${serviceLabel(sel.service)} · ${countLabel(sel.bedrooms)} bd / ${countLabel(
    sel.bathrooms,
  )} ba${sel.sqft ? ` · ${sqftLabel(sel.sqft)}` : ""}${recurring ? ` · ${frequency}` : ""}`;

  function goTo(next: number) {
    setStep(next);
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function blurField(key: keyof ContactForm) {
    const next = validateContact(form);
    setErrors((e) => ({ ...e, [key]: next[key] ?? "" }));
  }

  async function submit() {
    if (!sel.sqft) {
      setSqftError("Pick your home size to continue.");
      goTo(1);
      return;
    }
    const next = validateContact(form);
    setErrors(next);
    const firstKey = Object.keys(next)[0];
    if (firstKey) {
      document
        .querySelector(`[data-field="${firstKey}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setSendError(null);
    try {
      await sendRequest({
        data: {
          ...form,
          service: serviceLabel(sel.service),
          frequency: recurring ? frequency : "One-time",
          bedrooms: countLabel(sel.bedrooms),
          bathrooms: countLabel(sel.bathrooms),
          notes: [form.notes, `Home size: ${sqftLabel(sel.sqft)}`].filter(Boolean).join(" — "),
          addons: addons.join(", "),
          pets: Boolean(sel.pets),
          estimate: `$${quote.total}`,
          attribution: getAttribution(),
        },
      });
      trackNextdoorEvent("LEAD", { value: quote.total, currency: "USD" });
      setSent(true);
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong. Please call us.");
    } finally {
      setSubmitting(false);
    }
  }

  function primaryAction() {
    if (step === 1 && !sel.sqft) {
      setSqftError("Pick your home size to continue.");
      document.querySelector('[data-field="sqft"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (step < QUOTE_STEPS.length - 1) goTo(step + 1);
    else void submit();
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <main className="bg-secondary/40 px-4 py-10">
        <div ref={topRef} className="mx-auto w-full max-w-xl">
          <div className="rounded-3xl border border-laurel/40 bg-card p-6 text-center shadow-sm sm:p-8">
            <CheckCircle2 className="mx-auto h-10 w-10 text-laurel" />
            <h1 className="mt-3 font-display text-2xl font-bold">Your quote is with our team</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A real person in Durant will reach out within one business hour to confirm your date.
              Nothing is booked and nothing is charged.
            </p>
            <dl className="mt-6 space-y-2 rounded-2xl bg-secondary/60 p-4 text-left text-sm">
              <Row label="Service" value={summaryLine} />
              {addons.length > 0 && <Row label="Add-ons" value={addons.join(", ")} />}
              {form.preferredDate && (
                <Row label="Preferred" value={`${form.preferredDate}${form.preferredTime ? ` · ${form.preferredTime}` : ""}`} />
              )}
              <Row label="Estimate" value={`$${quote.total}`} />
            </dl>
            <a
              href={PHONE_HREF}
              className="tap-target mt-6 inline-flex items-center gap-2 rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary"
            >
              <Phone className="h-4 w-4" /> Call {PHONE_DISPLAY}
            </a>
          </div>
          <PartnerPerk variant="strip" className="mt-4 text-left" />
        </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="bg-secondary/40 px-4 py-6 pb-32 sm:py-10 lg:pb-10">
      <div ref={topRef} className="mx-auto w-full max-w-5xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
            <Flower2 className="h-4 w-4 shrink-0" /> MAGNOLIA MAIDS · INSTANT QUOTE
          </span>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <QuoteProgress step={step} onJump={goTo} />

            {step === 0 && (
              <section className="mt-6" aria-labelledby="step-service">
                <h1 id="step-service" className="font-display text-xl font-bold">
                  What kind of clean do you need?
                </h1>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {SERVICE_RATES.map((r) => {
                    const on = r.key === sel.service;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSel((s) => ({ ...s, service: r.key as ServiceKey }))}
                        className={`tap-target rounded-2xl border px-4 py-3.5 text-left transition ${
                          on ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <span className="block text-sm font-bold">{serviceLabel(r.key)}</span>
                        <span className="text-xs text-muted-foreground">from ${r.base}</span>
                      </button>
                    );
                  })}
                </div>

                {recurring && (
                  <>
                    <h2 className="mt-7 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      How often?
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {FREQUENCY_RATES.map((f) => {
                        const on = f.key === frequency;
                        return (
                          <button
                            key={f.key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setSel((s) => ({ ...s, frequency: f.key }))}
                            className={`tap-target rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            {f.key}
                            {f.discount > 0 ? ` · save ${Math.round(f.discount * 100)}%` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>
            )}

            {step === 1 && (
              <section className="mt-6" aria-labelledby="step-home">
                <h1 id="step-home" className="font-display text-xl font-bold">
                  Tell us about your home
                </h1>
                <div className="mt-4">
                  <HomeDetailsPicker
                    bedrooms={sel.bedrooms}
                    bathrooms={sel.bathrooms}
                    addons={sel.addons}
                    pets={sel.pets}
                    sqft={sel.sqft}
                    sqftError={sqftError}
                    onChange={(patch) => {
                      if (patch.sqft) setSqftError(null);
                      setSel((s) => ({
                        ...s,
                        ...patch,
                        addons: (patch.addons ?? s.addons) as AddonKey[],
                      }));
                    }}
                  />
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="mt-6" aria-labelledby="step-send">
                <h1 id="step-send" className="font-display text-xl font-bold">
                  Where should we send it?
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll follow up to confirm your date — no payment and nothing booked yet.
                </p>
                <div className="mt-4">
                  <QuoteContactForm
                    form={form}
                    errors={errors}
                    onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                    onBlurField={blurField}
                  />
                </div>
                {sendError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
                  >
                    {sendError}
                  </p>
                )}
              </section>
            )}

            {/* Mobile inline price so the number is never a surprise */}
            <div className="mt-7 rounded-2xl bg-secondary/60 p-4 text-center lg:hidden">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {summaryLine}
              </div>
              <div className="mt-1 font-display text-4xl font-bold">
                <AnimatedPrice total={quote.total} />
              </div>
              {quote.savings > 0 && (
                <div className="mt-1 text-sm font-semibold text-laurel">
                  You save ${quote.savings} per visit
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  className="tap-target inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-3 text-sm font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={primaryAction}
                disabled={submitting}
                className="tap-target hidden w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-bloom transition hover:brightness-105 disabled:opacity-60 lg:inline-flex"
              >
                {step < QUOTE_STEPS.length - 1
                  ? "Continue"
                  : submitting
                    ? "Sending…"
                    : "Send"}
                {!submitting && <ArrowRight className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <QuoteSummaryCard
            total={quote.total}
            savings={quote.savings}
            line={summaryLine}
            addons={addons}
          />
        </div>

        <PartnerPerk variant="strip" className="mt-6" />
      </div>

      <StickyQuoteBar
        total={quote.total}
        line={summaryLine}
        actionLabel={step < QUOTE_STEPS.length - 1 ? "Continue" : submitting ? "Sending…" : "Send"}
        onAction={primaryAction}
        disabled={submitting}
      />
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-semibold">{value}</dd>
    </div>
  );
}
