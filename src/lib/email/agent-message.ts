import { SITE, callout, displayName, esc, heading, kvTable, paragraph, renderLayout } from "./layout";
import type { Rendered } from "./templates";

export type AgentMessageInput = {
  name?: string | null;
  /** Plain-language body Maggie dictated on the call. */
  message: string;
  subject?: string | null;
  /** Optional quote/booking recap rows. */
  details?: Array<[string, string | number | null | undefined]>;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

/** Follow-up email sent by a voice agent during or right after a conversation. */
export function agentMessageEmail(i: AgentMessageInput): Rendered {
  const who = displayName(i.name);
  const paragraphs = i.message
    .split(/\n{2,}/)
    .map((p) => paragraph(esc(p.trim()).replace(/\n/g, "<br />")))
    .join("");

  const body = `
    ${paragraph(`Hi <strong>${esc(who)}</strong>, it's Maggie from Magnolia Maids 🌿`)}
    ${paragraphs}
    ${i.details?.length ? `${heading("Your details")}${kvTable(i.details)}` : ""}
    ${callout(
      "Questions?",
      `Call or text <a href="tel:${SITE.phoneHref}">${esc(SITE.phone)}</a> — we answer during business hours, and Maggie is on the site around the clock.`,
    )}
  `;

  return {
    subject: i.subject?.trim() || "Following up from your Magnolia Maids chat",
    html: renderLayout(body, {
      preheader: "Here are the details from your conversation with Maggie.",
      cta: i.ctaUrl ? { label: i.ctaLabel || "Get my instant quote", url: i.ctaUrl } : undefined,
    }),
  };
}
