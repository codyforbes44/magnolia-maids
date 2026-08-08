import { SITE, callout, esc, heading, kvTable, paragraph, referenceLine, renderLayout } from "./layout";
import type { Rendered } from "./templates";

export type QuoteRequest = {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  service: string;
  frequency: string;
  bedrooms: string;
  bathrooms: string;
  addons: string;
  pets: boolean;
  estimate: string;
};

function rows(q: QuoteRequest) {
  return kvTable([
    ["Service", q.service],
    ["Frequency", q.frequency],
    ["Home size", `${q.bedrooms} bed · ${q.bathrooms} bath`],
    ["Add-ons", q.addons || "—"],
    ["Pets", q.pets ? "Yes" : "No"],
    ["Quoted price", q.estimate],
    ["Preferred day", q.preferredDate || "—"],
    ["Preferred time", q.preferredTime || "—"],
    ["Address", q.address || "—"],
    ["Phone", q.phone || "—"],
    ["Email", q.email],
    ["Notes", q.notes || "—"],
  ]);
}

/** Internal alert: a visitor priced a clean and asked for follow-up. */
export function quoteRequestAdmin(q: QuoteRequest): Rendered {
  const body = `
    ${paragraph(`<strong>${esc(q.name)}</strong> priced a clean on the instant quote page and asked for booking follow-up.`)}
    ${callout("Follow up to book", `Quoted ${esc(q.estimate)} for a ${esc(q.service)}. Call or text ${esc(q.phone || q.email)} to confirm the date.`, "warn")}
    ${heading("What they submitted")}
    ${rows(q)}
  `;
  return {
    subject: `💬 Quote follow-up: ${q.name} · ${q.service} · ${q.estimate}`,
    html: renderLayout(body, {
      preview: `${q.name} — ${q.service} — ${q.estimate}`,
      heroEmoji: "💬",
      heroTitle: "New quote follow-up request",
      heroSubtitle: "Instant quote page",
      ctaLabel: "Open admin dashboard",
      ctaUrl: `${SITE.url}/admin`,
    }),
  };
}

/** Visitor confirmation: we have their numbers, a human will confirm the date. */
export function quoteRequestCustomer(q: QuoteRequest): Rendered {
  const first = (q.name || "there").trim().split(/\s+/)[0] || "there";
  const body = `
    ${paragraph(`Hi <strong>${esc(first)}</strong> — thanks for pricing your clean with Magnolia Maids. 🌿`)}
    ${paragraph(`A real person here in Durant will reach out within <strong>1 business hour</strong> to confirm your date and get you on the schedule. Nothing is booked or charged yet.`)}
    ${heading("Your quote")}
    ${rows(q)}
    ${paragraph(`Need us sooner? Call or text <strong>${esc(SITE.phone)}</strong>.`)}
    ${referenceLine(q.email)}
  `;
  return {
    subject: `${first}, your Magnolia Maids quote — ${q.estimate}`,
    html: renderLayout(body, {
      preview: `We have your ${q.service} quote — we'll confirm your date shortly.`,
      heroEmoji: "🌿",
      heroTitle: `Your quote: ${q.estimate}`,
      heroSubtitle: "We'll confirm your date within 1 business hour.",
      footerNote: "— Maggie & the Magnolia Maids team · Upscale home cleaning for Durant, Bryan County and Lake Texoma.",
    }),
  };
}