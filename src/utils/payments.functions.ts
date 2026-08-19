import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type Stripe from "stripe";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
  isTaxConfigurationError,
} from "@/lib/stripe.server";
import {
  type FrequencyKey,
  type ServiceKey,
  type SqftBandKey,
  SERVICE_RATES,
  priceHome,
  serviceLabel,
  sqftLabel,
} from "@/lib/pricing";

function assertEnv(value: unknown): StripeEnv {
  if (value !== "sandbox" && value !== "live") throw new Error("Invalid payment environment");
  return value;
}

/** Recurring plans map onto Stripe billing intervals. */
const PLAN_INTERVALS: Record<string, { interval: "week" | "month"; count: number; label: string }> = {
  Weekly: { interval: "week", count: 1, label: "every week" },
  Biweekly: { interval: "week", count: 2, label: "every 2 weeks" },
  Monthly: { interval: "month", count: 1, label: "every month" },
};

type CheckoutResult = { clientSecret: string } | { error: string };

/**
 * Stripe calculates and collects tax when the account is configured for it.
 * If tax isn't set up yet (pre go-live), retry once without it so the customer
 * can still pay.
 */
async function createSessionWithTaxFallback(
  stripe: Stripe,
  params: Stripe.Checkout.SessionCreateParams,
): Promise<Stripe.Checkout.Session> {
  try {
    return await stripe.checkout.sessions.create({ ...params, automatic_tax: { enabled: true } });
  } catch (error) {
    if (!isTaxConfigurationError(error)) throw error;
    console.warn("[payments] automatic tax unavailable, continuing without it");
    return stripe.checkout.sessions.create(params);
  }
}

async function resolveOrCreateCustomer(
  stripe: Stripe,
  options: { email?: string; userId?: string; name?: string; phone?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.name && { name: options.name }),
    ...(options.phone && { phone: options.phone }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

/* ------------------------------------------------------------------ *
 * Invoice payment links — the office sends a link after the clean.
 * ------------------------------------------------------------------ */

export type PublicPaymentLink = {
  token: string;
  customerName: string;
  description: string;
  amountCents: number;
  currency: string;
  status: string;
  paidAt: string | null;
};

export const getPaymentLink = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => {
    if (!/^[a-zA-Z0-9]{16,64}$/.test(data.token ?? "")) throw new Error("Invalid link");
    return data;
  })
  .handler(async ({ data }): Promise<{ link: PublicPaymentLink } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("payment_links")
      .select("token, customer_name, description, amount_cents, currency, status, paid_at")
      .eq("token", data.token)
      .maybeSingle();
    if (error) return { error: "We couldn't load that invoice." };
    if (!row) return { error: "This payment link is no longer available." };
    return {
      link: {
        token: row.token,
        customerName: row.customer_name,
        description: row.description,
        amountCents: row.amount_cents,
        currency: row.currency,
        status: row.status,
        paidAt: row.paid_at,
      },
    };
  });

export const createInvoiceCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9]{16,64}$/.test(data.token ?? "")) throw new Error("Invalid link");
    if (!/^https?:\/\//.test(data.returnUrl ?? "")) throw new Error("Invalid return URL");
    return { ...data, environment: assertEnv(data.environment) };
  })
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link } = await supabaseAdmin
      .from("payment_links")
      .select("id, token, customer_name, customer_email, customer_phone, description, amount_cents, currency, status")
      .eq("token", data.token)
      .maybeSingle();

    if (!link) return { error: "This payment link is no longer available." };
    if (link.status === "paid") return { error: "This invoice has already been paid. Thank you!" };
    if (link.status === "void") return { error: "This payment link was cancelled. Please contact the office." };

    try {
      const stripe = createStripeClient(data.environment);
      const customerId = await resolveOrCreateCustomer(stripe, {
        email: link.customer_email ?? undefined,
        name: link.customer_name,
        phone: link.customer_phone ?? undefined,
      });

      const session = await createSessionWithTaxFallback(stripe, {
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        customer_update: { address: "auto", name: "auto" },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: link.currency,
              unit_amount: link.amount_cents,
              tax_behavior: "exclusive",
              product_data: { name: link.description },
            },
          },
        ],
        payment_intent_data: { description: link.description },
        metadata: { paymentLinkId: link.id, paymentLinkToken: link.token, kind: "invoice" },
      });

      await supabaseAdmin
        .from("payment_links")
        .update({ stripe_session_id: session.id, environment: data.environment })
        .eq("id", link.id);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      console.error("[payments] invoice checkout failed", error);
      return { error: getStripeErrorMessage(error) };
    }
  });

/* ------------------------------------------------------------------ *
 * Recurring cleaning plans — priced from the shared pricing engine.
 * ------------------------------------------------------------------ */

export type PlanQuote = {
  service: ServiceKey;
  frequency: FrequencyKey;
  perVisit: number;
  intervalLabel: string;
  sizeLabel: string | null;
};

const planInput = (data: {
  service: string;
  frequency: string;
  bedrooms: number;
  bathrooms: number;
  sqft?: string | null;
}) => {
  const rate = SERVICE_RATES.find((r) => r.key === data.service);
  if (!rate) throw new Error("Unknown service");
  if (!rate.recurring) throw new Error("That service isn't available as a recurring plan");
  if (!PLAN_INTERVALS[data.frequency]) throw new Error("Choose a weekly, biweekly or monthly plan");
  const bedrooms = Math.min(8, Math.max(0, Number(data.bedrooms) || 0));
  const bathrooms = Math.min(8, Math.max(1, Number(data.bathrooms) || 1));
  const sqft = (["s", "m", "l", "xl", "xxl"] as const).includes(data.sqft as SqftBandKey)
    ? (data.sqft as SqftBandKey)
    : null;
  return {
    service: data.service as ServiceKey,
    frequency: data.frequency as FrequencyKey,
    bedrooms,
    bathrooms,
    sqft,
  };
};

export const quotePlan = createServerFn({ method: "POST" })
  .inputValidator(planInput)
  .handler(async ({ data }): Promise<PlanQuote> => {
    const price = priceHome(data);
    return {
      service: data.service,
      frequency: data.frequency,
      perVisit: price.total,
      intervalLabel: PLAN_INTERVALS[data.frequency]!.label,
      sizeLabel: sqftLabel(data.sqft),
    };
  });

export const createPlanCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      service: string;
      frequency: string;
      bedrooms: number;
      bathrooms: number;
      sqft?: string | null;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!/^https?:\/\//.test(data.returnUrl ?? "")) throw new Error("Invalid return URL");
      return { ...planInput(data), returnUrl: data.returnUrl, environment: assertEnv(data.environment) };
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { supabase, userId } = context;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Price is always recomputed server-side — the browser never sets it.
    const price = priceHome(data);
    const plan = PLAN_INTERVALS[data.frequency]!;
    const environment = data.environment;

    try {
      const stripe = createStripeClient(environment);
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("full_name, phone")
        .eq("id", userId)
        .maybeSingle();

      const customerId = await resolveOrCreateCustomer(stripe, {
        userId,
        email: user?.email ?? undefined,
        name: profile?.full_name ?? undefined,
        phone: profile?.phone ?? undefined,
      });

      const sizeNote = sqftLabel(data.sqft);
      const planName = `${serviceLabel(data.service)} — ${data.frequency.toLowerCase()} plan`;
      const homeSummary = [`${data.bedrooms} bd / ${data.bathrooms} ba`, sizeNote]
        .filter(Boolean)
        .join(" · ");

      const session = await createSessionWithTaxFallback(stripe, {
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        customer_update: { address: "auto", name: "auto" },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: price.total * 100,
              tax_behavior: "exclusive",
              recurring: { interval: plan.interval, interval_count: plan.count },
              product_data: { name: planName },
            },
          },
        ],
        metadata: { userId, kind: "plan", planName, homeSummary },
        subscription_data: {
          metadata: {
            userId,
            planName,
            service: data.service,
            frequency: data.frequency,
            bedrooms: String(data.bedrooms),
            bathrooms: String(data.bathrooms),
            sqft: data.sqft ?? "",
          },
        },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      console.error("[payments] plan checkout failed", error);
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => ({
    ...data,
    environment: assertEnv(data.environment),
  }))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) return { error: "No plan found on your account yet." };

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });