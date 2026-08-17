import { planitPerkBlock } from "./partner-perk";
import {
  SITE,
  callout,
  displayName,
  esc,
  firstName,
  heading,
  isBlank,
  joinParts,
  kvTable,
  paragraph,
  referenceLine,
  renderLayout,
  val,
} from "./layout";
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
    ["Service", val(q.service, "To be confirmed")],
    ["Frequency", val(q.frequency, "To be confirmed")],
    [
      "Home size",
      joinParts(
        [isBlank(q.bedrooms) ? null : `${val(q.bedrooms)} bed`, isBlank(q.bathrooms) ? null : `${val(q.bathrooms)} bath`],
        " · ",
        "Not provided",
      ),
    ],
    ["Add-ons", val(q.addons, "None selected")],
    ["Pets", q.pets ? "Yes" : "No"],
    ["Quoted price", val(q.estimate, "We'll confirm on the call")],
    ["Preferred day", val(q.preferredDate, "Flexible")],
    ["Preferred time", val(q.preferredTime, "Flexible")],
    ["Address", val(q.address, "Not provided")],
    ["Phone", val(q.phone, "Not provided")],
    ["Email", val(q.email, "Not provided")],
    ["Notes", val(q.notes, "None added")],
  ]);
}

/** Internal alert: a visitor priced a clean and asked for follow-up. */
export function quoteRequestAdmin(q: QuoteRequest): Rendered {
  const who = displayName(q.name, "A visitor");
  const service = val(q.service, "a clean");
  const estimate = val(q.estimate, "no price captured");
  const reachAt = val(joinParts([q.phone, q.email], " / ", ""), "");
  const body = `
    ${paragraph(`<strong>${esc(who)}</strong> priced a clean on the instant quote page and asked for booking follow-up.`)}
    ${callout(
      "Follow up to book",
      `Quoted ${esc(estimate)} for a ${esc(service)}. ${reachAt ? `Call or text ${esc(reachAt)} to confirm the date.` : "No phone or email was captured — check the admin dashboard for this lead."}`,
      "warn",
    )}
    ${heading("What they submitted")}
    ${rows(q)}
  `;
  return {
    subject: joinParts([`💬 Quote follow-up: ${who}`, q.service, q.estimate], " · ", `💬 Quote follow-up: ${who}`),
    html: renderLayout(body, {
      preview: joinParts([who, q.service, q.estimate], " — ", who),
      heroEmoji: "💬",
      heroTitle: "New quote follow-up request",
      heroSubtitle: "Instant quote page",
      ctaLabel: "Open admin dashboard",
      ctaUrl: `${SITE.url}/admin`,
    }),
  };
}

/** Visitor confirmation: we have their numbers, a human will confirm the date. */
export function quoteRequestCustomer(q: QuoteRequest, planitCode?: string): Rendered {
  const first = firstName(q.name);
  const estimate = val(q.estimate, "");
  const body = `
    ${paragraph(`Hi <strong>${esc(first)}</strong> — thanks for pricing your clean with Magnolia Maids. 🌿`)}
    ${paragraph(`A real person here in Durant will reach out within <strong>1 business hour</strong> to confirm your date and get you on the schedule. Nothing is booked or charged yet.`)}
    ${heading("Your quote")}
    ${rows(q)}
    ${planitPerkBlock(planitCode)}
    ${paragraph(`Need us sooner? Call or text <strong>${esc(SITE.phone)}</strong>.`)}
    ${referenceLine(val(q.email, ""))}
  `;
  return {
    subject: estimate ? `${first}, your Magnolia Maids quote — ${estimate}` : `${first}, your Magnolia Maids quote is on the way`,
    html: renderLayout(body, {
      preview: `We have your ${val(q.service, "cleaning")} quote — we'll confirm your date shortly.`,
      heroEmoji: "🌿",
      heroTitle: estimate ? `Your quote: ${estimate}` : "Your quote request is in",
      heroSubtitle: "We'll confirm your date within 1 business hour.",
      footerNote: "— Maggie & the Magnolia Maids team · Upscale home cleaning for Durant, Bryan County and Lake Texoma.",
    }),
  };
}