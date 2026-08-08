import { BRAND, displayName, esc, isBlank, kvTable, paragraph, renderLayout, val } from "./layout";
import { campaignThankYou } from "./campaign-thankyou";
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
    ["Campaign", val(l.campaignLabel, "Not specified")],
    ["Name", val(l.name, "Not provided")],
    ["Email", val(l.email, "Not provided")],
    ["Phone", val(l.phone, "Not provided")],
    ["Home size", val(l.homeSize, "Not provided")],
    ["Target date", val(l.preferredDate, "Flexible")],
    ["Referred neighbor", val(l.referralName, "—")],
    ["Message", val(l.message, "None added")],
  ]);
}

export function campaignLeadCustomer(l: CampaignLead): Rendered {
  return campaignThankYou(l);
}

export function campaignLeadAdmin(l: CampaignLead): Rendered {
  const who = displayName(l.name, "A visitor");
  const label = val(l.campaignLabel, "a campaign page");
  const body = `
    ${paragraph(`<strong>New campaign lead</strong> from the <em>${esc(label)}</em> landing page.`)}
    ${leadRows(l)}
  `;
  return {
    subject: `✨ New lead · ${label} · ${who}`,
    html: renderLayout(body, {
      preview: `${who} — ${label}`,
      heroEmoji: "✨",
      heroTitle: "New campaign lead",
      heroSubtitle: label,
      accent: BRAND.forest,
      ctaLabel: "Reply to lead",
      ctaUrl: isBlank(l.email) ? "" : `mailto:${val(l.email)}`,
    }),
  };
}
