import { SITE, callout, esc, heading, kvTable, nextSteps, paragraph, renderLayout } from "./layout";
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
    ["Property", p.propertyName],
    ["Address", p.propertyAddress || "—"],
    ["Total units", p.totalUnits ?? "—"],
    ["Unit mix", unitMix(p)],
    ["Turns per month", p.turnsPerMonth || "—"],
    ["Turnaround needed", p.turnaround || "—"],
    ["Access method", p.accessMethod || "—"],
    ["Trash-out", p.needsTrashOut ? "Yes" : "No"],
    ["Carpet care", p.needsCarpetCare ? "Yes" : "No"],
    ["Target start", p.startDate || "—"],
    ["Contact", `${p.contactName}${p.contactRole ? ` — ${p.contactRole}` : ""}`],
    ["Company", p.company || "—"],
    ["Email", p.email],
    ["Phone", p.phone || "—"],
    ["Notes", p.notes || "—"],
  ]);
}

/** Internal alert: a property manager asked for a unit-turn proposal. */
export function propertyInquiryAdmin(p: PropertyInquiry): Rendered {
  const body = `
    ${paragraph(`<strong>${esc(p.contactName)}</strong>${p.company ? ` at ${esc(p.company)}` : ""} requested a unit-turn proposal for <strong>${esc(p.propertyName)}</strong>.`)}
    ${callout(
      "Price this contract",
      `${p.totalUnits ? `${p.totalUnits} units` : "Unit count not given"}${p.turnsPerMonth ? ` · about ${esc(p.turnsPerMonth)} turns per month` : ""}. Call ${esc(p.phone || p.email)} to schedule the walk-through.`,
      "warn",
    )}
    ${heading("Property intake")}
    ${rows(p)}
  `;
  return {
    subject: `🏢 Property turnover proposal: ${p.propertyName}${p.totalUnits ? ` · ${p.totalUnits} units` : ""}`,
    html: renderLayout(body, {
      preview: `${p.propertyName} — ${p.contactName}`,
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
