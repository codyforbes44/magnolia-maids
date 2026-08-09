import { SITE, callout, displayName, esc, heading, joinParts, kvTable, nextSteps, paragraph, renderLayout, val } from "./layout";
import type { Rendered } from "./templates";

export type FranchiseInquiry = {
  name: string;
  email: string;
  phone?: string | null;
  targetCity?: string | null;
  targetState?: string | null;
  timeline?: string | null;
  capitalBand?: string | null;
  background?: string | null;
  why?: string | null;
};

const DISCLAIMER =
  "This message is for information only. It is not an offer to sell or the solicitation of an offer to buy a franchise. A franchise may only be offered through a Franchise Disclosure Document in states where Magnolia Maids is registered or exempt.";

function market(f: FranchiseInquiry) {
  return joinParts([f.targetCity, f.targetState], ", ", "Not specified");
}

function rows(f: FranchiseInquiry) {
  return kvTable([
    ["Name", val(f.name, "Not provided")],
    ["Email", val(f.email, "Not provided")],
    ["Phone", val(f.phone, "Not provided")],
    ["Market of interest", market(f)],
    ["Timeline", val(f.timeline, "Not specified")],
    ["Capital available", val(f.capitalBand, "Not specified")],
    ["Background", val(f.background, "Not provided")],
    ["Why Magnolia Maids", val(f.why, "Not provided")],
  ]);
}

/** Internal alert: someone asked about owning a Magnolia Maids location. */
export function franchiseInquiryAdmin(f: FranchiseInquiry): Rendered {
  const who = displayName(f.name, "Someone");
  const body = `
    ${paragraph(`<strong>${esc(who)}</strong> asked about owning a Magnolia Maids location in <strong>${esc(market(f))}</strong>.`)}
    ${callout(
      "Qualify before you talk numbers",
      "No FDD exists yet — keep the intro call to their background, market, and motivation. Do not quote fees, royalties, or earnings.",
      "warn",
    )}
    ${heading("Candidate intake")}
    ${rows(f)}
  `;
  return {
    subject: `🌿 Franchise interest: ${who}${f.targetCity ? ` · ${val(f.targetCity)}` : ""}`,
    html: renderLayout(body, {
      preview: `Franchise interest from ${who}`,
      heroEmoji: "🌿",
      heroTitle: "New franchise interest",
      heroSubtitle: "Ownership candidate pipeline",
      ctaLabel: "Open admin dashboard",
      ctaUrl: `${SITE.url}/admin/franchise`,
      footerNote: DISCLAIMER,
    }),
  };
}

/** Candidate confirmation: we received their interest, here's what happens next. */
export function franchiseInquiryCandidate(f: FranchiseInquiry): Rendered {
  const body = `
    ${paragraph(`Thank you, ${esc(displayName(f.name))} — we received your interest in bringing Magnolia Maids to <strong>${esc(market(f))}</strong>.`)}
    ${callout(
      "Where we are today",
      "Magnolia Maids is in the early stages of building its franchise program. We are getting to know serious candidates now so that when the program opens, the first conversations are already underway.",
      "success",
    )}
    ${heading("What you told us")}
    ${rows(f)}
    ${nextSteps([
      { title: "Intro conversation", detail: "A short call about your market, your background, and what you want out of ownership." },
      { title: "Discovery", detail: "We walk you through how the Durant operation actually runs — the manual, the crews, the software, the customer experience." },
      { title: "Formal review", detail: "If and when the franchise program opens, you review complete disclosure documents with your own attorney before anything is signed." },
    ])}
    ${paragraph("In the meantime, the best way to understand the brand is to see how we serve customers every day.")}
  `;
  return {
    subject: "We received your Magnolia Maids ownership interest",
    html: renderLayout(body, {
      preview: "Thanks for your interest in owning a Magnolia Maids location.",
      heroEmoji: "🤍",
      heroTitle: "Thanks for reaching out",
      heroSubtitle: "Magnolia Maids ownership",
      ctaLabel: "See how we serve customers",
      ctaUrl: `${SITE.url}/services`,
      footerNote: DISCLAIMER,
    }),
  };
}
