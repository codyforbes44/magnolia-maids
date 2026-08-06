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
  return campaignThankYou(l);
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
