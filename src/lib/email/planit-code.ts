import { planitPerkBlock } from "./partner-perk";
import { BRAND, SITE, esc, firstName, heading, nextSteps, paragraph, renderLayout } from "./layout";
import type { Rendered } from "./templates";
import { PLANIT, planitClaimUrl } from "../partners";

export type PlanitCodeRequest = { email: string; name?: string | null };

const STEPS = [
  { title: "Book a recurring cleaning", detail: "Weekly, biweekly, or monthly — the perk starts with your first visit." },
  { title: "Open plan.It", detail: `Head to <a href="${PLANIT.url}" style="color:${BRAND.primary};">plan.It</a> and create your free account.` },
  { title: "Enter your code at checkout", detail: "The Family plan applies at $0 — no card required." },
  { title: "Invite your household", detail: `Add up to ${PLANIT.seats} seats for shared lists, bills, appointments, and tasks.` },
];

/** Sent to a visitor who asks for the plan.It Family code from /planit-family. */
export function planitCodeCustomer(req: PlanitCodeRequest, code: string): Rendered {
  const body = `
    ${paragraph(`Hi ${esc(firstName(req.name))}, here is your plan.It ${esc(PLANIT.plan)} redemption code and how to use it.`)}
    ${planitPerkBlock(code)}
    ${heading("How to redeem")}
    ${nextSteps(STEPS)}
    ${paragraph(
      `The perk stays free as long as you're on a recurring Magnolia Maids plan. Questions? Just reply to this email or call <a href="tel:+15807450045" style="color:${BRAND.primary};">${SITE.phone}</a>.`,
    )}`;

  return {
    subject: `Your plan.It ${PLANIT.plan} code: ${code}`,
    html: renderLayout(body, {
      preview: `Your plan.It ${PLANIT.plan} redemption code and redemption steps.`,
      heroEmoji: "🎁",
      heroTitle: `plan.It ${PLANIT.plan} — free for you`,
      heroSubtitle: "Your redemption code and steps are below",
      accent: BRAND.primary,
      ctaLabel: "Redeem on plan.It",
      ctaUrl: planitClaimUrl(code),
      footerNote: "plan.It is our partner. We cover the Family plan while you're on a recurring cleaning plan.",
    }),
  };
}

/** Owner copy so Maggie/admin can follow up on the interest. */
export function planitCodeAdmin(req: PlanitCodeRequest, code: string): Rendered {
  const body = `
    ${paragraph(`Someone requested the plan.It ${esc(PLANIT.plan)} code from the perk page.`)}
    ${paragraph(`<strong>Email:</strong> ${esc(req.email)}<br /><strong>Name:</strong> ${esc(req.name || "—")}<br /><strong>Code sent:</strong> ${esc(code)}`)}`;
  return {
    subject: `plan.It code requested — ${req.email}`,
    html: renderLayout(body, {
      heroEmoji: "🎁",
      heroTitle: "plan.It code request",
      heroSubtitle: req.email,
      accent: BRAND.accent,
    }),
  };
}
