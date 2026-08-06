import { BRAND, SITE, callout, esc, heading, kvTable, nextSteps, paragraph, referenceLine, renderLayout } from "./layout";
import type { Rendered } from "./templates";

export type CampaignLead = {
  id: string;
  campaign: string;
  campaignLabel: string;
  offer: string;
  path: string;
  name: string;
  email: string;
  phone?: string | null;
  homeSize?: string | null;
  preferredDate?: string | null;
  referralName?: string | null;
  message?: string | null;
};

function leadRows(l: CampaignLead) {
  return kvTable([
    ["Campaign", l.campaignLabel],
    ["Name", l.name],
    ["Email", l.email],
    ["Phone", l.phone ?? "—"],
    ["Home size", l.homeSize ?? "—"],
    ["Target date", l.preferredDate ?? "—"],
    ["Referred neighbor", l.referralName ?? "—"],
    ["Message", l.message ?? "—"],
  ]);
}

export function campaignLeadCustomer(l: CampaignLead): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(l.name)}</strong> — thanks for your interest in <strong>${esc(l.campaignLabel)}</strong> from Magnolia Maids. 🌿`)}
    ${heading("What you submitted")}
    ${leadRows(l)}
    ${heading("What happens next")}
    ${nextSteps([
      { title: "We confirm your details (within 1 business hour)", detail: "A real person in Durant reads this — no call center, no bots." },
      { title: "You get a flat quote", detail: "We price your home from the published rate card so the number never moves after we arrive." },
      { title: "We hold your date", detail: `Tell us the day that works and we reserve the crew for it${l.preferredDate ? ` — we have <strong>${esc(l.preferredDate)}</strong> noted.` : "."}` },
    ])}
    ${callout("Your offer", esc(l.offer), "success")}
    ${paragraph(`Prefer to talk it through? Call or text <strong>(580) 745-0045</strong>, or just reply to this email.`)}
    ${referenceLine(l.id)}
  `;
  return {
    subject: `🌿 ${l.campaignLabel} — we've got your request`,
    html: renderLayout(body, {
      preview: `Thanks for reaching out about ${l.campaignLabel}. We reply within one business hour.`,
      heroEmoji: "🌿",
      heroTitle: l.campaignLabel,
      heroSubtitle: "Request received — we'll be right with you.",
      accent: BRAND.sage,
      ctaLabel: "See the offer",
      ctaUrl: `${SITE.url}${l.path}`,
    }),
  };
}

export function campaignLeadAdmin(l: CampaignLead): Rendered {
  const body = `
    ${paragraph(`<strong>New campaign lead</strong> from the <em>${esc(l.campaignLabel)}</em> landing page.`)}
    ${leadRows(l)}
  `;
  return {
    subject: `✨ New lead · ${l.campaignLabel} · ${l.name}`,
    html: renderLayout(body, {
      preview: `${l.name} — ${l.campaignLabel}`,
      heroEmoji: "✨",
      heroTitle: "New campaign lead",
      heroSubtitle: l.campaignLabel,
      accent: BRAND.forest,
      ctaLabel: "Reply to lead",
      ctaUrl: `mailto:${l.email}`,
    }),
  };
}
