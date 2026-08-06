/**
 * Single source of truth for what the Magnolia Maids conversational agent knows.
 * Built from the live pricing table so the assistant can never quote stale rates.
 * Passed to ElevenLabs at session start as a prompt override.
 */
import { SERVICE_RATES, FREQUENCY_RATES, INCLUDED_BEDROOMS, INCLUDED_BATHROOMS } from "@/lib/pricing";

export const BUSINESS = {
  name: "Magnolia Maids",
  city: "Durant, Oklahoma",
  areas: "Bryan County — Durant, Calera, Caddo, Silo, Bokchito, Mead, and the Lake Texoma area",
  phone: "(580) 745-0045",
  email: "hello@magnoliamaids.pro",
  site: "https://magnoliamaids.pro",
  grandOpening: "September 1, 2026 at 8:00 AM CST",
  hours: "Mon–Fri 8:00 AM–6:00 PM CST, Sat 9:00 AM–4:00 PM CST, closed Sunday",
  guarantee: "The 24-Hour Magnolia Guarantee — if anything is missed, we re-clean it within 24 hours at no charge.",
  cancellation: "24-hour notice to cancel or reschedule without a fee.",
} as const;

export const PAGES = [
  { path: "/", what: "Home — services overview, grand-opening countdown, founding-member offer" },
  { path: "/services", what: "All services and what's included in each" },
  { path: "/pricing", what: "Flat-rate pricing builder and frequency discounts" },
  { path: "/airbnb-turnover", what: "Airbnb turnover specialist page + downloadable 8-stage checklist PDF" },
  { path: "/booking", what: "4-step booking wizard with live price estimate" },
  { path: "/about", what: "About Magnolia Maids" },
  { path: "/about/careers", what: "Careers — hiring house cleaners in Durant" },
  { path: "/privacy", what: "Privacy policy" },
  { path: "/terms", what: "Terms of service" },
  { path: "/cookies", what: "Cookie policy" },
];

function priceLines() {
  return SERVICE_RATES.map(
    (r) =>
      `- ${r.key}: $${r.base} flat for a ${INCLUDED_BEDROOMS}bd/${INCLUDED_BATHROOMS}ba home; +$${r.perBed} per extra bedroom, +$${r.perBath} per extra bathroom.${
        r.recurring ? " Recurring discounts apply." : " One-time service (no recurring discount)."
      }`,
  ).join("\n");
}

function frequencyLines() {
  return FREQUENCY_RATES.filter((f) => f.discount > 0)
    .map((f) => `- ${f.key}: ${Math.round(f.discount * 100)}% off`)
    .join("\n");
}

/** Current, machine-generated facts appended to the agent's base prompt. */
export function buildAgentKnowledge(): string {
  return `## LIVE BUSINESS DATA (authoritative — overrides anything else you were trained on)

Business: ${BUSINESS.name}, ${BUSINESS.city}
Service area: ${BUSINESS.areas}
Phone: ${BUSINESS.phone} | Email: ${BUSINESS.email} | Website: ${BUSINESS.site}
Grand opening: ${BUSINESS.grandOpening}. We are pre-launch: bookings are being reserved now at founding-member rates, first cleanings begin on opening day.
Hours: ${BUSINESS.hours}
Guarantee: ${BUSINESS.guarantee}
Cancellation: ${BUSINESS.cancellation}

### Current flat-rate pricing (all base rates include ${INCLUDED_BEDROOMS} bedrooms / ${INCLUDED_BATHROOMS} bathrooms)
${priceLines()}

### How to compute a quote (follow exactly)
extraBeds = max(0, bedrooms - 2); extraBaths = max(0, bathrooms - 2) counted as a DECIMAL (2.5 baths = 0.5 extra bath; 1.5 baths = 0 extra baths).
subtotal = base + extraBeds x perBed + extraBaths x perBath; total = round(subtotal x (1 - discount)).
Always quote WHOLE DOLLARS — never cents. Apply the discount to the subtotal, not the base. Homes under ${INCLUDED_BEDROOMS}bd/${INCLUDED_BATHROOMS}ba pay the base rate.
Worked example — Standard Clean, 4bd/2.5ba, biweekly: 129 + (2 x 20 = 40) + (0.5 x 15 = 7.50) = 176.50; 176.50 x 0.85 = 150.03 → quote $150.
Before saying a total, recompute it from your own line items and confirm they add up.
Final quotes may run up to ~15% higher for condition, pets, or heavy build-up. The booking page gives an exact live estimate.

### Recurring frequency discounts (Standard Clean and Airbnb Turnover only)
${frequencyLines()}

### Airbnb Turnover specialty
We are an Airbnb / short-term-rental turnover specialist: fast, guest-ready resets between stays, run on an 8-stage checklist (arrival + damage check, strip & laundry, kitchen reset, bathroom reset, living areas, restock consumables, staging photos, final walkthrough). Hosts can download the free checklist at ${BUSINESS.site}/airbnb-turnover.

### Site pages you can point people to
${PAGES.map((p) => `- ${BUSINESS.site}${p.path === "/" ? "" : p.path} — ${p.what}`).join("\n")}

### Truthfulness rules
- We are a brand-new business. Never invent review counts, star ratings, years in business, number of homes cleaned, or customer testimonials.
- Never quote a price that is not derived from the table above.
- If you don't know something, say so and offer a callback at ${BUSINESS.phone}.`;
}

export const FIRST_MESSAGE_TEXT =
  "Hi there! Welcome to Magnolia Maids 🌿 — serving Durant, OK and Bryan County. I can help you reserve a grand-opening slot, price a cleaning, or answer questions about our Airbnb turnover service. What would you like to do?";

export const FIRST_MESSAGE_VOICE =
  "Hi! Thank you for calling Magnolia Maids — your home care team in Durant, Oklahoma. I can help you book a cleaning, get a quick quote, or answer questions. What can I do for you today?";
