import { SITE, callout, esc, firstName, isBlank, paragraph, renderLayout, val } from "./layout";
import type { Rendered } from "./templates";

export type FacebookQuoteInviteInput = {
  name: string;
  service?: string | null;
  homeSize?: string | null;
  quoteUrl: string;
};

/**
 * First reply to a Facebook Lead Ads lead: warm intro from Maggie, then a single
 * ask — finish the instant quote form to see the flat rate.
 */
export function facebookQuoteInvite(i: FacebookQuoteInviteInput): Rendered {
  const first = firstName(i.name);
  const svc = isBlank(i.service) ? null : val(i.service);
  const size = isBlank(i.homeSize) ? null : val(i.homeSize);
  const ctaUrl = isBlank(i.quoteUrl) ? `${SITE.url}/quote` : String(i.quoteUrl).trim();

  const body = `
    ${paragraph(`Hi <strong>${esc(first)}</strong>, it's Maggie with Magnolia Maids — thanks for raising your hand on our Facebook ad.`)}
    ${paragraph(
      svc
        ? `You mentioned <strong>${esc(svc)}</strong>${size ? ` for a ${esc(size)} home` : ""}. To give you an exact flat rate, I just need a few quick details about your home.`
        : `To give you an exact flat rate, I just need a few quick details about your home.`,
    )}
    ${paragraph(`Tap the button below to finish your instant quote — bedrooms, bathrooms and any add-ons. It takes under a minute and the price updates as you tap.`)}
    ${callout("What happens next", "Finish the form and we'll confirm your price and hold a spot on the calendar — no walkthrough, no sales call, no obligation.")}
    ${paragraph(`Prefer to talk it through? Call or text <strong>${esc(SITE.phone)}</strong> and a real person here in Durant will answer.`)}
  `;

  return {
    subject: `${first}, finish your Magnolia Maids quote (1 minute)`,
    html: renderLayout(body, {
      preview: `Finish your instant quote and see your exact flat-rate price.`,
      heroEmoji: "🌸",
      heroTitle: "Finish your instant quote",
      heroSubtitle: "A minute of details, then your exact flat rate.",
      ctaLabel: "Complete my quote",
      ctaUrl,
      footerNote:
        "— Maggie & the Magnolia Maids team · Upscale home cleaning for Durant, Bryan County and Lake Texoma.",
    }),
  };
}
