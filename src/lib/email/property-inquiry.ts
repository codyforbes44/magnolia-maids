import { SITE, callout, displayName, esc, heading, isBlank, joinParts, kvTable, nextSteps, paragraph, renderLayout, val } from "./layout";
import type { Rendered } from "./templates";

export type PropertyInquiry = {
  propertyName: string;
  propertyAddress?: string | null;
  totalUnits?: number | null;
  unitsStudio: number;
  units1bd: number;
  units2bd: number;
  units3bdPlus: number;
  turnsPerMonth?: string | null;
  turnaround?: string | null;
  accessMethod?: string | null;
  needsTrashOut: boolean;
  needsCarpetCare: boolean;
  startDate?: string | null;
  contactName: string;
  contactRole?: string | null;
  company?: string | null;
  email: string;
  phone?: string | null;
  notes?: string | null;
};

function unitMix(p: PropertyInquiry) {
  const parts = [
    p.unitsStudio ? `${p.unitsStudio} studio` : null,
    p.units1bd ? `${p.units1bd} × 1 bed` : null,
    p.units2bd ? `${p.units2bd} × 2 bed` : null,
    p.units3bdPlus ? `${p.units3bdPlus} × 3+ bed` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Not specified";
}

function rows(p: PropertyInquiry) {
  return kvTable([
    ["Property", val(p.propertyName, "Not provided")],
    ["Address", val(p.propertyAddress, "Not provided")],
    ["Total units", val(p.totalUnits, "Not provided")],
    ["Unit mix", unitMix(p)],
    ["Turns per month", val(p.turnsPerMonth, "Not provided")],
    ["Turnaround needed", val(p.turnaround, "Not provided")],
    ["Access method", val(p.accessMethod, "Not provided")],
    ["Trash-out", p.needsTrashOut ? "Yes" : "No"],
    ["Carpet care", p.needsCarpetCare ? "Yes" : "No"],
    ["Target start", val(p.startDate, "Flexible")],
    ["Contact", joinParts([p.contactName, p.contactRole], " — ", "Not provided")],
    ["Company", val(p.company, "Not provided")],
    ["Email", val(p.email, "Not provided")],
    ["Phone", val(p.phone, "Not provided")],
    ["Notes", val(p.notes, "None added")],
  ]);
}

/** Internal alert: a property manager asked for a unit-turn proposal. */
export function propertyInquiryAdmin(p: PropertyInquiry): Rendered {
  const who = displayName(p.contactName, "A property manager");
  const property = val(p.propertyName, "an unnamed property");
  const reachAt = joinParts([p.phone, p.email], " / ", "");
  const body = `
    ${paragraph(`<strong>${esc(who)}</strong>${isBlank(p.company) ? "" : ` at ${esc(val(p.company))}`} requested a unit-turn proposal for <strong>${esc(property)}</strong>.`)}
    ${callout(
      "Price this contract",
      `${p.totalUnits ? `${p.totalUnits} units` : "Unit count not given"}${isBlank(p.turnsPerMonth) ? "" : ` · about ${esc(val(p.turnsPerMonth))} turns per month`}. ${reachAt ? `Call ${esc(reachAt)} to schedule the walk-through.` : "No phone or email captured — open the admin dashboard for this inquiry."}`,
      "warn",
    )}
    ${heading("Property intake")}
    ${rows(p)}
  `;
  return {
    subject: `🏢 Property turnover proposal: ${property}${p.totalUnits ? ` · ${p.totalUnits} units` : ""}`,
    html: renderLayout(body, {
      preview: joinParts([property, who], " — ", property),
      heroEmoji: "🏢",
      heroTitle: "New property turnover inquiry",
      heroSubtitle: "Apartment & property management",
      ctaLabel: "Open admin dashboard",
      ctaUrl: `${SITE.url}/admin/properties`,
    }),
  };
}

/** Manager confirmation: we have the property details, a proposal is coming. */
export function propertyInquiryManager(p: PropertyInquiry): Rendered {
  const body = `
    ${paragraph(`Thank you, ${esc(p.contactName)} — we have the details for <strong>${esc(p.propertyName)}</strong> and a Magnolia Maids account lead is reviewing them now.`)}
    ${callout(
      "What happens next",
      "We'll call you the same business day to confirm your unit mix and turnaround window, then walk one vacant unit before sending per-unit pricing in writing.",
      "success",
    )}
    ${heading("What you sent us")}
    ${rows(p)}
    ${nextSteps([
      { title: "Same-day callback", detail: "We confirm your unit mix, access method, and how quickly units must be rent-ready." },
      { title: "Walk-through", detail: "A crew lead walks one vacant unit so the per-unit rate reflects your real turn, not a guess." },
      { title: "Written proposal", detail: "Per-unit pricing by floor plan, turnaround commitment, insurance certificate, and monthly invoicing terms." },
    ])}
    ${paragraph(`Need us sooner? Call <a href="tel:+15807450045" style="color:${"#5a7d5a"};font-weight:600;">(580) 745-0045</a> and ask for the property turnover desk.`)}
  `;
  return {
    subject: `We received your turnover request — ${p.propertyName}`,
    html: renderLayout(body, {
      preview: "Your Magnolia Maids unit-turn proposal is being prepared.",
      heroEmoji: "🌿",
      heroTitle: "Your proposal is in progress",
      heroSubtitle: "Apartment & property turnovers · Durant, OK",
      ctaLabel: "See what a turn includes",
      ctaUrl: `${SITE.url}/apartment-turnovers`,
    }),
  };
}
