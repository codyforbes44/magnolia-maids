import { SITE, callout, esc, paragraph, renderLayout } from "./layout";
import type { Rendered } from "./templates";

export type InstantQuoteFollowupInput = {
  name: string;
  service?: string | null;
  homeSize?: string | null;
  quoteUrl: string;
};

/**
 * Sent by an admin to a Facebook lead: one job, drive them to the
 * distraction-free /quote page and get a number on the screen.
 */
export function instantQuoteFollowup(i: InstantQuoteFollowupInput): Rendered {
  const first = (i.name || "there").trim().split(/\s+/)[0] || "there";
  const svc = i.service?.trim();

  const body = `
    ${paragraph(`Hi <strong>${esc(first)}</strong> — thanks for reaching out to Magnolia Maids on Facebook.`)}
    ${paragraph(
      svc
        ? `You asked about <strong>${esc(svc)}</strong>${i.homeSize ? ` for a ${esc(i.homeSize)} home` : ""}. Rather than trade messages, here's a page that gives you the exact flat rate in about 30 seconds.`
        : `Rather than trade messages back and forth, here's a page that gives you your exact flat rate in about 30 seconds.`,
    )}
    ${paragraph(`Pick your service, home size, and any add-ons — the price updates as you tap. No walkthrough, no sales call, no obligation.`)}
    ${callout("Founding-member pricing", "Book before our September 1, 2026 grand opening and lock in 20% off your first three visits.", "warn")}
    ${paragraph(`Rather just talk it through? Call or text <strong>${esc(SITE.phone)}</strong> and a real person in Durant will answer.`)}
  `;

  return {
    subject: `${first}, your Magnolia Maids price in 30 seconds`,
    html: renderLayout(body, {
      preview: `See your exact flat-rate cleaning price — takes about 30 seconds.`,
      heroEmoji: "🌿",
      heroTitle: "See your price in 30 seconds",
      heroSubtitle: "Flat rate. No walkthrough. No obligation.",
      ctaLabel: "Get my instant price",
      ctaUrl: i.quoteUrl,
      footerNote: "Upscale home cleaning for Durant, Bryan County and Lake Texoma.",
    }),
  };
}