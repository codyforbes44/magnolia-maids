import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  FREQUENCY_RATES,
  INCLUDED_BATHROOMS,
  INCLUDED_BEDROOMS,
  SERVICE_RATES,
  ADDONS,
  getAddon,
  addonsTotal,
  addonLabels,
  quoteVisit,
  getServiceRate,
  serviceLabel,
  type FrequencyKey,
  type ServiceKey,
} from "@/lib/pricing";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

/** Loose aliases so the voice agent can pass what the caller actually said. */
const SERVICE_ALIASES: Record<string, ServiceKey> = {
  standard: "Standard Clean",
  "standard clean": "Standard Clean",
  regular: "Standard Clean",
  recurring: "Standard Clean",
  residential: "Standard Clean",
  bright: "Bright Clean",
  "bright clean": "Bright Clean",
  "mid tier": "Bright Clean",
  "enhanced": "Bright Clean",
  deep: "Deep Clean",
  "deep clean": "Deep Clean",
  airbnb: "Airbnb Turnover",
  "airbnb turnover": "Airbnb Turnover",
  turnover: "Airbnb Turnover",
  "short term rental": "Airbnb Turnover",
  "move in": "Move In / Out",
  "move out": "Move In / Out",
  "move in / out": "Move In / Out",
  "move in / move out": "Move In / Out",
  "move in/move out": "Move In / Out",
  moving: "Move In / Out",
  "post party": "Post-Party",
  "post-party": "Post-Party",
  party: "Post-Party",
  "post event": "Post-Party",
  "post-event": "Post-Party",
  "post event clean": "Post-Party",
  "post-event clean": "Post-Party",
  "after party": "Post-Party",
  event: "Post-Party",
  "pre event": "Pre-Event Prep",
  "pre-event": "Pre-Event Prep",
  "pre event prep": "Pre-Event Prep",
  "pre-event prep": "Pre-Event Prep",
  "before party": "Pre-Event Prep",
  "party prep": "Pre-Event Prep",
};

const FREQUENCY_ALIASES: Record<string, FrequencyKey> = {
  "one time": "One-time",
  "one-time": "One-time",
  once: "One-time",
  single: "One-time",
  monthly: "Monthly",
  month: "Monthly",
  "every month": "Monthly",
  biweekly: "Biweekly",
  "bi-weekly": "Biweekly",
  "every two weeks": "Biweekly",
  "every other week": "Biweekly",
  "twice a month": "Biweekly",
  weekly: "Weekly",
  week: "Weekly",
  "every week": "Weekly",
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
}

function resolveService(input: string): ServiceKey | null {
  const n = normalize(input);
  const exact = SERVICE_RATES.find((r) => normalize(r.key) === n);
  if (exact) return exact.key;
  return SERVICE_ALIASES[n] ?? null;
}

function resolveFrequency(input: string | undefined): FrequencyKey {
  if (!input) return "One-time";
  const n = normalize(input);
  const exact = FREQUENCY_RATES.find((f) => normalize(f.key) === n);
  if (exact) return exact.key;
  return FREQUENCY_ALIASES[n] ?? "One-time";
}

const QuoteInput = z.object({
  service: z.string(),
  bedrooms: z.coerce.number().min(0).max(12),
  bathrooms: z.coerce.number().min(0).max(12),
  frequency: z.string().optional(),
  /** Comma-separated keys or an array: eco, fridge, oven, laundry, windows, bath. */
  addons: z.union([z.string(), z.array(z.string())]).optional(),
});

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: n % 1 === 0 ? 0 : 2 })}`;
}

function buildQuote(raw: unknown) {
  const parsed = QuoteInput.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        ok: false,
        error:
          "Provide service (Standard Clean, Bright Clean, Deep Clean, Airbnb Turnover, Move In / Out, Pre-Event Prep, Post-Event Clean), bedrooms, bathrooms, and optionally frequency.",
      },
    };
  }

  const service = resolveService(parsed.data.service);
  if (!service) {
    return {
      status: 400,
      body: {
        ok: false,
        error: `Unknown service "${parsed.data.service}".`,
        valid_services: SERVICE_RATES.map((r) => r.key),
      },
    };
  }

  const frequency = resolveFrequency(parsed.data.frequency);
  const rate = getServiceRate(service);
  const { bedrooms, bathrooms } = parsed.data;
  const addons = (Array.isArray(parsed.data.addons)
    ? parsed.data.addons
    : String(parsed.data.addons ?? "").split(",")
  )
    .map((a) => normalize(a).replace(/\s+/g, ""))
    .filter((a) => !!getAddon(a));
  const extraBeds = Math.max(0, bedrooms - INCLUDED_BEDROOMS);
  const extraBaths = Math.max(0, bathrooms - INCLUDED_BATHROOMS);
  const price = quoteVisit({ service, frequency, bedrooms, bathrooms, addons });

  const lineItems = [
    `Base ${service} (includes ${INCLUDED_BEDROOMS}bd/${INCLUDED_BATHROOMS}ba): ${usd(rate.base)}`,
    ...(extraBeds > 0 ? [`${extraBeds} extra bedroom${extraBeds === 1 ? "" : "s"} x ${usd(rate.perBed)}: ${usd(extraBeds * rate.perBed)}`] : []),
    ...(extraBaths > 0 ? [`${extraBaths} extra bathroom${extraBaths === 1 ? "" : "s"} x ${usd(rate.perBath)}: ${usd(extraBaths * rate.perBath)}`] : []),
    ...(price.discount > 0 ? [`${frequency} discount ${Math.round(price.discount * 100)}%: -${usd(price.savings)}`] : []),
    ...addonLabels(addons).map((label, i) => `Add-on ${label}: ${usd(addonsTotal([addons[i]!]))}`),
  ];

  const discountNote = rate.recurring
    ? price.discount > 0
      ? `${frequency} plan saves ${Math.round(price.discount * 100)}%.`
      : "Recurring plans save 10–20%; ask if they'd like weekly, biweekly, or monthly."
    : `${service} is a one-time service, so no frequency discount applies.`;

  return {
    status: 200,
    body: {
      ok: true,
      service,
      service_label: serviceLabel(service),
      frequency,
      bedrooms,
      bathrooms,
      extra_bedrooms: extraBeds,
      extra_bathrooms: extraBaths,
      subtotal: price.raw,
      discount_percent: Math.round(price.discount * 100),
      savings: price.savings,
      addons,
      addons_total: price.extras,
      valid_addons: ADDONS.map((a) => ({ key: a.key, label: a.label, price: a.price })),
      total: price.total,
      range_high: price.high,
      line_items: lineItems,
      /** Read this aloud. It is already rounded to whole dollars. */
      spoken_total: `$${price.total}`,
      say: `${serviceLabel(service)}${price.discount > 0 ? ` on a ${frequency.toLowerCase()} plan` : ""} for a ${bedrooms} bedroom, ${bathrooms} bathroom home is $${price.total}.`,
      note: `${discountNote} Final price can run up to about 15% higher (to $${price.high}) for condition, pets, or heavy build-up. Quote whole dollars only — never cents.`,
    },
  };
}

export const Route = createFileRoute("/api/public/quote")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const { status, body } = buildQuote({
          service: url.searchParams.get("service") ?? "",
          bedrooms: url.searchParams.get("bedrooms") ?? "",
          bathrooms: url.searchParams.get("bathrooms") ?? "",
          frequency: url.searchParams.get("frequency") ?? undefined,
        });
        return Response.json(body, { status, headers: CORS });
      },
      POST: async ({ request }) => {
        let payload: unknown = null;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400, headers: CORS });
        }
        const { status, body } = buildQuote(payload);
        return Response.json(body, { status, headers: CORS });
      },
    },
  },
});