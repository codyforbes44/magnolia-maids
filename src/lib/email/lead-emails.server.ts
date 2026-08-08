import type { Rendered } from "./templates";
import { applyOverride, loadOverride, type EmailOverride } from "./overrides.server";

export type LeadRow = {
  id: string;
  campaign: string;
  name: string;
  email: string;
  phone: string | null;
  home_size: string | null;
  preferred_date: string | null;
  referral_name: string | null;
  message: string | null;
};

/** Built-in templates that can be personalised with a campaign lead's details. */
export const LEAD_EMAIL_TEMPLATE_IDS = [
  "instant-quote-followup",
  "facebook-quote-invite",
  "campaign-lead-customer",
  "hold-reminder",
  "quote-followup",
  "review-request",
  "referral-thanks",
  "welcome-post-first-clean",
  "contact-acknowledgement",
] as const;

function prettyCampaign(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Best-effort service name pulled from Facebook lead messages ("Service: Deep Clean"). */
function leadService(lead: LeadRow) {
  return /Service:\s*([^·]+)/i.exec(lead.message ?? "")?.[1]?.trim() ?? null;
}

function quoteUrl(lead: LeadRow, siteUrl: string) {
  const url = new URL(`${siteUrl}/quote`);
  url.searchParams.set("name", lead.name);
  const beds = /(\d+(?:\.\d+)?)\s*bed/i.exec(lead.home_size ?? "")?.[1];
  const baths = /(\d+(?:\.\d+)?)\s*bath/i.exec(lead.home_size ?? "")?.[1];
  if (beds) url.searchParams.set("beds", beds);
  if (baths) url.searchParams.set("baths", baths);
  return url.toString();
}

/** Renders a built-in template with the lead's real details (no admin edits applied). */
export async function renderBaseForLead(templateId: string, lead: LeadRow): Promise<Rendered> {
  const { SITE } = await import("./layout");
  const { CAMPAIGNS } = await import("../campaigns");
  const meta = (CAMPAIGNS as Record<string, { label: string; offer: string; path: string }>)[
    lead.campaign
  ];
  const campaignLabel = meta?.label ?? prettyCampaign(lead.campaign);

  switch (templateId) {
    case "instant-quote-followup": {
      const { instantQuoteFollowup } = await import("./instant-quote");
      return instantQuoteFollowup({
        name: lead.name,
        service: leadService(lead),
        homeSize: lead.home_size,
        quoteUrl: quoteUrl(lead, SITE.url),
      });
    }
    case "facebook-quote-invite": {
      const { facebookQuoteInvite } = await import("./facebook-quote-invite");
      return facebookQuoteInvite({
        name: lead.name,
        service: leadService(lead),
        homeSize: lead.home_size,
        quoteUrl: quoteUrl(lead, SITE.url),
      });
    }
    case "campaign-lead-customer": {
      const { campaignLeadCustomer } = await import("./campaign");
      return campaignLeadCustomer({
        id: lead.id,
        campaign: lead.campaign,
        campaignLabel,
        offer: meta?.offer ?? "Founding-member pricing",
        path: meta?.path ?? "/quote",
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        homeSize: lead.home_size,
        preferredDate: lead.preferred_date,
        referralName: lead.referral_name,
        message: lead.message,
      });
    }
    case "hold-reminder": {
      const { holdReminder } = await import("./reminder");
      return holdReminder({
        id: lead.id,
        source: "campaign",
        campaign: lead.campaign,
        campaignLabel,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        holdDate: lead.preferred_date ?? "",
        placeholder: !lead.preferred_date,
        details: [
          ["Home size", lead.home_size],
          ["Offer", meta?.offer ?? null],
        ],
      });
    }
    default: {
      const t = await import("./templates");
      switch (templateId) {
        case "quote-followup":
          return t.quoteFollowup(lead.name, leadService(lead) ?? "a clean");
        case "review-request":
          return t.reviewRequest(lead.name);
        case "referral-thanks":
          return t.referralThanks(lead.name, lead.referral_name ?? undefined);
        case "welcome-post-first-clean":
          return t.welcomePostFirstClean(lead.name);
        case "contact-acknowledgement":
          return t.contactAcknowledgement(lead.name, lead.message ?? "your message");
        default:
          throw new Error("That template can't be sent to a lead");
      }
    }
  }
}

export type LeadEmailDraft = {
  subject?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaLabel?: string;
  introHtml?: string;
  bodyHtml?: string;
  footerNote?: string;
};

function draftOverride(draft: LeadEmailDraft): EmailOverride {
  const v = (s?: string) => (s && s.trim() ? s.trim() : null);
  return {
    template_id: "draft",
    subject: v(draft.subject),
    hero_title: v(draft.heroTitle),
    hero_subtitle: v(draft.heroSubtitle),
    cta_label: v(draft.ctaLabel),
    intro_html: v(draft.introHtml),
    body_html: v(draft.bodyHtml),
    footer_note: v(draft.footerNote),
    enabled: true,
  };
}

/**
 * Renders any lead-safe template (built-in or admin copy) for one lead:
 * base copy -> saved admin edits -> this send's one-off tweaks.
 */
export async function renderLeadEmail(
  templateId: string,
  lead: LeadRow,
  draft: LeadEmailDraft = {},
): Promise<Rendered> {
  const { isCustomId, loadCustomTemplate } = await import("./custom.server");

  let rendered: Rendered;
  if (isCustomId(templateId)) {
    const row = await loadCustomTemplate(templateId);
    if (!row) throw new Error("Template not found");
    rendered = applyOverride(await renderBaseForLead(row.base_template_id, lead), {
      template_id: row.id,
      subject: row.subject,
      hero_title: row.hero_title,
      hero_subtitle: row.hero_subtitle,
      cta_label: row.cta_label,
      intro_html: row.intro_html,
      body_html: row.body_html,
      footer_note: row.footer_note,
      enabled: true,
    });
  } else {
    rendered = applyOverride(
      await renderBaseForLead(templateId, lead),
      await loadOverride(templateId),
    );
  }

  return applyOverride(rendered, draftOverride(draft));
}