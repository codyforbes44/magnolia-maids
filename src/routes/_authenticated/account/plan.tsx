import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmbeddedCheckoutPanel } from "@/components/payments/EmbeddedCheckoutPanel";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { createPlanCheckout, createPortalSession, quotePlan, type PlanQuote } from "@/utils/payments.functions";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { SERVICE_RATES, SQFT_BANDS, serviceLabel, type ServiceKey, type SqftBandKey } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/account/plan")({
  head: () => ({
    meta: [
      { title: "My cleaning plan | Magnolia Maids" },
      { name: "description", content: "Start or manage your recurring Magnolia Maids cleaning plan." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "My cleaning plan | Magnolia Maids" },
      { property: "og:description", content: "Start or manage your recurring Magnolia Maids cleaning plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPlanPage,
});

const FREQUENCIES = ["Weekly", "Biweekly", "Monthly"] as const;

type PlanRow = {
  plan_label: string | null;
  price_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

function AccountPlanPage() {
  const recurringServices = useMemo(() => SERVICE_RATES.filter((r) => r.recurring), []);
  const [service, setService] = useState<ServiceKey>(recurringServices[0]?.key ?? "Standard Clean");
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>("Biweekly");
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [sqft, setSqft] = useState<SqftBandKey | "">("");
  const [quote, setQuote] = useState<PlanQuote | null>(null);
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runQuote = useServerFn(quotePlan);
  const startCheckout = useServerFn(createPlanCheckout);
  const openPortal = useServerFn(createPortalSession);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan_label, price_id, status, current_period_end, cancel_at_period_end")
        .eq("environment", paymentsConfigured() ? getStripeEnvironment() : "sandbox")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPlan((data as PlanRow) ?? null);
    })();
  }, []);

  useEffect(() => {
    let active = true;
    setCheckingOut(false);
    runQuote({ data: { service, frequency, bedrooms, bathrooms, sqft: sqft || null } })
      .then((q) => active && setQuote(q))
      .catch(() => active && setQuote(null));
    return () => {
      active = false;
    };
  }, [service, frequency, bedrooms, bathrooms, sqft, runQuote]);

  const fetchClientSecret = useCallback(async () => {
    const result = await startCheckout({
      data: {
        service,
        frequency,
        bedrooms,
        bathrooms,
        sqft: sqft || null,
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Checkout is temporarily unavailable. Please call the office.");
    return result.clientSecret;
  }, [service, frequency, bedrooms, bathrooms, sqft, startCheckout]);

  async function manageBilling() {
    setError(null);
    try {
      const result = await openPortal({
        data: { returnUrl: `${window.location.origin}/account/plan`, environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open billing.");
    }
  }

  const hasPlan = plan && ["active", "trialing", "past_due"].includes(plan.status);
  const selectClass =
    "min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground";

  return (
    <div className="grid gap-6">
      <PaymentTestModeBanner />

      <header>
        <h1 className="font-display text-2xl text-laurel md:text-3xl">My cleaning plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lock in a recurring visit and save — cancel or change any time.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      {hasPlan && (
        <section className="rounded-3xl border border-primary/30 bg-primary/5 p-5">
          <p className="flex items-center gap-2 font-display text-lg text-laurel">
            <CalendarCheck className="h-5 w-5" /> {plan?.plan_label ?? "Cleaning plan"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Status: {plan?.status}
            {plan?.current_period_end
              ? ` · renews ${new Date(plan.current_period_end).toLocaleDateString()}`
              : ""}
            {plan?.cancel_at_period_end ? " · cancels at period end" : ""}
          </p>
          <button
            onClick={manageBilling}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-laurel/40 px-5 font-semibold text-laurel hover:bg-laurel/10"
          >
            Manage billing <ExternalLink className="h-4 w-4" />
          </button>
        </section>
      )}

      <section className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
        <h2 className="font-display text-lg">{hasPlan ? "Change your plan" : "Build your plan"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold">Service</span>
            <select className={selectClass} value={service} onChange={(e) => setService(e.target.value as ServiceKey)}>
              {recurringServices.map((r) => (
                <option key={r.key} value={r.key}>
                  {serviceLabel(r.key)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold">How often</span>
            <select
              className={selectClass}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as (typeof FREQUENCIES)[number])}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold">Bedrooms</span>
            <select className={selectClass} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))}>
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Studio" : n}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold">Bathrooms</span>
            <select className={selectClass} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="font-semibold">Home size</span>
            <select className={selectClass} value={sqft} onChange={(e) => setSqft(e.target.value as SqftBandKey | "")}>
              <option value="">Not sure</option>
              {SQFT_BANDS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {quote && (
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-border/60 pt-4">
            <span className="text-sm text-muted-foreground">
              {quote.intervalLabel}
              {quote.sizeLabel ? ` · ${quote.sizeLabel}` : ""}
            </span>
            <span className="font-display text-3xl text-laurel">
              ${quote.perVisit}
              <span className="ml-1 text-sm text-muted-foreground">per visit</span>
            </span>
          </div>
        )}

        {!paymentsConfigured() ? (
          <p className="mt-5 rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
            Online plan signup isn’t available yet. Call (580) 745-0045 and we’ll set your schedule up by hand.
          </p>
        ) : checkingOut ? (
          <div className="mt-5">
            <EmbeddedCheckoutPanel
              checkoutKey={`${service}-${frequency}-${bedrooms}-${bathrooms}-${sqft}`}
              fetchClientSecret={fetchClientSecret}
            />
          </div>
        ) : (
          <button
            onClick={() => setCheckingOut(true)}
            className="mt-5 min-h-12 w-full rounded-full bg-laurel px-6 font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            {hasPlan ? "Start this plan instead" : "Start my plan"}
          </button>
        )}
      </section>
    </div>
  );
}