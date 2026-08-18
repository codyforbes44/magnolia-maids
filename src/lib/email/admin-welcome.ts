import { BRAND, SITE, esc, firstName, nextSteps, paragraph, renderLayout } from "./layout";
import type { Rendered } from "./templates";

export type AdminWelcomePayload = {
  name?: string | null;
  email: string;
  /** Optional personal line from the owner. */
  note?: string | null;
};

const LINKS: Array<{ label: string; path: string; blurb: string }> = [
  { label: "Comms hub", path: "/admin/hub", blurb: "Calls, texts, chats, email, Messenger and Slack in one place." },
  { label: "Leads", path: "/admin/leads", blurb: "Every quote request and campaign lead, with follow-up built in." },
  { label: "Bookings", path: "/admin/bookings", blurb: "Confirm, reschedule and track each clean." },
  { label: "Quote builder", path: "/admin/quote-builder", blurb: "Price a job live on the phone and print a formal quote." },
];

/** Warm first-login welcome for a new Magnolia Maids admin. */
export function renderAdminWelcome(p: AdminWelcomePayload): Rendered {
  const first = firstName(p.name, "there");

  const cards = LINKS.map(
    (l) => `
      <tr>
        <td style="padding:12px 14px;border:1px solid ${BRAND.hairline};border-radius:12px;background:${BRAND.softer};">
          <a href="${SITE.url}${l.path}" style="color:${BRAND.primary};font-weight:800;font-size:15px;text-decoration:none;">${esc(l.label)}</a>
          <div style="color:${BRAND.body};font-size:13px;line-height:1.5;margin-top:3px;">${esc(l.blurb)}</div>
        </td>
      </tr>
      <tr><td style="height:10px;line-height:10px;">&nbsp;</td></tr>`,
  ).join("");

  const body = `
    ${paragraph(`Welcome, ${esc(first)} — your Magnolia Maids admin account is live.`)}
    ${paragraph(
      `Sign in with <strong>${esc(p.email)}</strong> and you'll land in the same workspace the whole business runs on: every lead, booking, applicant and conversation, plus Maggie ready to answer calls and texts on your behalf.`,
    )}
    ${p.note ? paragraph(esc(p.note)) : ""}

    <h2 style="margin:20px 0 10px;color:${BRAND.ink};font-size:18px;font-weight:800;">Start here</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>

    ${nextSteps([
      { title: "Sign in", detail: `Use the button above, then choose “Continue with Google” or your password.` },
      { title: "Set your password", detail: `If you'd rather use a password, tap “Forgot password” on the sign-in page and we'll email you a reset link.` },
      { title: "Say hello in the hub", detail: `Open the Comms hub and send yourself a test text — it's the fastest way to see how the phone view works.` },
    ])}

    ${paragraph(
      `Anything you need, reply straight to this email or call ${esc(SITE.phone)}. Delighted to have you on the team.`,
    )}
  `;

  return {
    subject: `Welcome to Magnolia Maids, ${first} — your admin access is ready`,
    html: renderLayout(body, {
      preview: "Your Magnolia Maids admin account is ready — here's where to start.",
      heroTitle: `Welcome aboard, ${first}`,
      heroSubtitle: SITE.tagline,
      accent: BRAND.primary,
      ctaLabel: "Sign in to Magnolia Maids",
      ctaUrl: `${SITE.url}/auth`,
      footerNote: `Sent to ${p.email} because an admin account was created for you at ${SITE.name}.`,
    }),
  };
}
