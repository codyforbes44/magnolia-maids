import {
  BRAND,
  SITE,
  callout,
  esc,
  firstName,
  heading,
  isBlank,
  kvTable,
  nextSteps,
  paragraph,
  referenceLine,
  renderLayout,
  val,
} from "./layout";
import type { Rendered } from "./templates";
import type { CampaignLead } from "./campaign";

type Step = { title: string; detail: string };

type CampaignEmailCopy = {
  emoji: string;
  accent: string;
  heroTitle: string;
  heroSubtitle: string;
  subject: (name: string) => string;
  preview: string;
  intro: (l: CampaignLead) => string;
  steps: (l: CampaignLead) => Step[];
  offerTitle: string;
  tip: string;
  /** Calendar event title placed on the hold the customer adds. */
  calendarTitle: string;
  calendarDetail: string;
};

const REPLY_LINE = `Prefer to talk it through? Call or text <strong>${esc(SITE.phone)}</strong>, or simply reply to this email — a Durant human reads every one.`;

export const CAMPAIGN_EMAIL_COPY: Record<string, CampaignEmailCopy> = {
  "summer-on-the-lake": {
    emoji: "🌊",
    accent: BRAND.sage,
    heroTitle: "Summer on the Lake",
    heroSubtitle: "Your turnover request is in.",
    subject: (name) => `🌊 Thank you, ${name} — your Lake Texoma turnover request`,
    preview: "We'll map your checkout windows and send a flat turnover quote.",
    intro: (l) =>
      `Hi <strong>${esc(l.name)}</strong> — thank you for trusting Magnolia Maids with your Lake Texoma property. We keep standing turnover windows open through the summer for hosts in Kingston, Cartwright, and Platter, and we've started holding one for you.`,
    steps: (l) => [
      {
        title: "We read your request (within 1 business hour)",
        detail: "No call center — a Durant coordinator reviews your property details personally.",
      },
      {
        title: "You get a flat turnover quote",
        detail: "Priced from the published rate card, so the number never moves after we arrive.",
      },
      {
        title: "We lock your checkout windows",
        detail: l.preferredDate
          ? `We have <strong>${esc(l.preferredDate)}</strong> noted and will confirm the recurring window around it.`
          : "Send your booking calendar and we'll map standing slots around your busiest weekends.",
      },
      {
        title: "Every turn is verified",
        detail: "Photos and a supply report land in your inbox after each visit — no drive-out required.",
      },
    ],
    offerTitle: "Your summer offer",
    tip: "Hosting back-to-back stays? Ask about the Host Weekend bundle when we call — it pairs the pre-arrival clean with the post-checkout reset.",
    calendarTitle: "Magnolia Maids — Lake Texoma turnover",
    calendarDetail: "Placeholder hold for your turnover clean. We'll confirm the exact window by email or text.",
  },
  "referral-week": {
    emoji: "💌",
    accent: BRAND.accent,
    heroTitle: "Referral Week",
    heroSubtitle: "Thank you for sending a neighbor our way.",
    subject: (name) => `💌 Thank you, ${name} — your referral is logged`,
    preview: "Your referral credit is reserved. Here's how it lands.",
    intro: (l) =>
      `Hi <strong>${esc(l.name)}</strong> — a referral from a Bryan County neighbor is the highest compliment a new cleaning company can get. Thank you. Your credit is reserved${l.referralName ? ` against <strong>${esc(l.referralName)}</strong>'s first clean` : ""}.`,
    steps: (l) => [
      {
        title: "We log your referral (within 1 business hour)",
        detail: "Your name is attached to the credit so nothing gets lost between visits.",
      },
      {
        title: "We reach out to your neighbor",
        detail: l.referralName
          ? `We'll introduce ourselves to <strong>${esc(l.referralName)}</strong> warmly — never a hard sell.`
          : "A short, friendly introduction — never a hard sell.",
      },
      {
        title: "Their first clean is discounted",
        detail: "The discount is applied at booking, before any card is charged.",
      },
      {
        title: "Your credit posts automatically",
        detail: "It comes off your next invoice the moment their first clean is complete.",
      },
    ],
    offerTitle: "Your referral offer",
    tip: "There's no cap. Every neighbor you send earns another credit, and you can stack them against a Deep Clean.",
    calendarTitle: "Magnolia Maids — clean with referral credit",
    calendarDetail: "Placeholder hold for your next clean. Your referral credit applies automatically.",
  },
  "holiday-ready": {
    emoji: "🕯️",
    accent: BRAND.primary,
    heroTitle: "Holiday Ready",
    heroSubtitle: "Your holiday clean request is in.",
    subject: (name) => `🕯️ Thank you, ${name} — your Holiday Ready request`,
    preview: "We'll confirm your pre-holiday date before the calendar fills.",
    intro: (l) =>
      `Hi <strong>${esc(l.name)}</strong> — thank you for planning ahead. December dates in Durant go quickly, so we prioritize Holiday Ready requests in the order they arrive, and yours is now in the queue.`,
    steps: (l) => [
      {
        title: "We confirm your details (within 1 business hour)",
        detail: "We check crew availability against the dates you've given us before anything else.",
      },
      {
        title: "You get a flat holiday quote",
        detail: "Deep Clean pricing straight from the published rate card — no seasonal surcharge.",
      },
      {
        title: "We hold your pre-holiday date",
        detail: l.preferredDate
          ? `We have <strong>${esc(l.preferredDate)}</strong> pencilled in and will confirm it in writing.`
          : "Tell us the day guests arrive and we'll work backward from it.",
      },
      {
        title: "Optional: the morning-after reset",
        detail: "Book the post-event reset at the same time and both visits are discounted.",
      },
    ],
    offerTitle: "Your holiday offer",
    tip: "Hosting more than one gathering? We can split the deep clean before and a lighter reset between events.",
    calendarTitle: "Magnolia Maids — Holiday Ready deep clean",
    calendarDetail: "Placeholder hold for your pre-holiday deep clean. We'll confirm the arrival window by email or text.",
  },
};

const FALLBACK: CampaignEmailCopy = {
  emoji: "🌿",
  accent: BRAND.sage,
  heroTitle: "Magnolia Maids",
  heroSubtitle: "Request received — we'll be right with you.",
  subject: (name) => `🌿 Thank you, ${name} — we've got your request`,
  preview: "Thanks for reaching out. We reply within one business hour.",
  intro: (l) => `Hi <strong>${esc(l.name)}</strong> — thanks for your interest in <strong>${esc(l.campaignLabel)}</strong> from Magnolia Maids.`,
  steps: (l) => [
    { title: "We confirm your details (within 1 business hour)", detail: "A real person in Durant reads this — no call center, no bots." },
    { title: "You get a flat quote", detail: "We price your home from the published rate card so the number never moves after we arrive." },
    {
      title: "We hold your date",
      detail: l.preferredDate
        ? `Tell us the day that works and we reserve the crew for it — we have <strong>${esc(l.preferredDate)}</strong> noted.`
        : "Tell us the day that works and we reserve the crew for it.",
    },
  ],
  offerTitle: "Your offer",
  tip: "Not sure which service fits? Reply with a photo or two and we'll tell you honestly.",
  calendarTitle: "Magnolia Maids — cleaning hold",
  calendarDetail: "Placeholder hold for your clean. We'll confirm the exact window by email or text.",
};

/** yyyymmdd for an all-day calendar event. */
function ymd(d: Date) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function calendarDates(preferredDate?: string | null) {
  const base =
    preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
      ? new Date(`${preferredDate}T00:00:00Z`)
      : new Date(Date.now() + 7 * 86400000);
  const start = new Date(base.getTime());
  const end = new Date(base.getTime() + 86400000);
  return { start: ymd(start), end: ymd(end), isPlaceholder: !preferredDate };
}

function calendarBlock(l: CampaignLead, copy: CampaignEmailCopy) {
  const { start, end, isPlaceholder } = calendarDates(l.preferredDate);
  const details = `${copy.calendarDetail}\n\nReference #${l.id}\nMagnolia Maids · ${SITE.phone}\n${SITE.url}${l.path}`;

  const googleUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(copy.calendarTitle)}` +
    `&dates=${start}/${end}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent("Durant, OK")}`;

  const icsUrl =
    `${SITE.url}/api/public/booking-hold.ics` +
    `?campaign=${encodeURIComponent(l.campaign)}&date=${encodeURIComponent(`${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}`)}&ref=${encodeURIComponent(l.id)}`;

  const bookUrl = `${SITE.url}/booking?campaign=${encodeURIComponent(l.campaign)}`;

  const btn = (href: string, label: string, filled: boolean) =>
    `<tr><td style="padding:5px 0;">
       <a href="${esc(href)}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:9999px;${
         filled
           ? `background:${copy.accent};color:#ffffff;`
           : `background:#ffffff;color:${BRAND.forest};border:1px solid ${BRAND.hairline};`
       }">${esc(label)}</a>
     </td></tr>`;

  return `
    ${heading("Put it on your calendar")}
    ${paragraph(
      isPlaceholder
        ? `We've set a <strong>placeholder hold</strong> one week out so the date doesn't slip. Add it now and we'll move it together once we speak.`
        : `Add your <strong>${esc(l.preferredDate ?? "")}</strong> hold so the date is blocked on your side too. We'll confirm the arrival window before then.`,
    )}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;">
      ${btn(bookUrl, "Confirm your booking", true)}
      ${btn(googleUrl, "Add to Google Calendar", false)}
      ${btn(icsUrl, "Add to Apple or Outlook (.ics)", false)}
    </table>
    <p style="margin:6px 0 0;color:${BRAND.muted};font-size:12px;font-family:Arial,Helvetica,sans-serif;">
      Adding the hold doesn't charge anything — it just reserves the day in your calendar.
    </p>
  `;
}

/** Branded, campaign-specific thank-you email sent to the visitor. */
export function campaignThankYou(l: CampaignLead): Rendered {
  const copy = CAMPAIGN_EMAIL_COPY[l.campaign] ?? FALLBACK;
  // Normalise first: blank or whitespace-only fields must never leak into the
  // greeting, the detail rows, or the calendar block.
  const lead: CampaignLead = {
    ...l,
    name: val(l.name, "there"),
    campaignLabel: val(l.campaignLabel, "Magnolia Maids"),
    offer: val(l.offer, ""),
    path: isBlank(l.path) ? "/quote" : String(l.path).trim(),
    phone: isBlank(l.phone) ? null : val(l.phone),
    homeSize: isBlank(l.homeSize) ? null : val(l.homeSize),
    preferredDate: isBlank(l.preferredDate) ? null : val(l.preferredDate),
    referralName: isBlank(l.referralName) ? null : val(l.referralName),
    message: isBlank(l.message) ? null : String(l.message).trim(),
  };

  const body = `
    ${paragraph(copy.intro(lead))}
    ${heading("What you submitted")}
    ${kvTable([
      ["Campaign", lead.campaignLabel],
      ["Name", val(lead.name, "Not provided")],
      ["Email", val(lead.email, "Not provided")],
      ["Phone", val(lead.phone, "Not provided")],
      ["Home size", val(lead.homeSize, "We'll confirm on the call")],
      ["Target date", val(lead.preferredDate, "Flexible")],
      ["Referred neighbor", val(lead.referralName, "—")],
      ["Message", val(lead.message, "None added")],
    ])}
    ${heading("What happens next")}
    ${nextSteps(copy.steps(lead))}
    ${callout(copy.offerTitle, esc(lead.offer), "success")}
    ${calendarBlock(lead, copy)}
    ${callout("One more thing", esc(copy.tip), "info")}
    ${paragraph(REPLY_LINE)}
    ${referenceLine(val(lead.id, ""))}
  `;

  return {
    subject: copy.subject(firstName(lead.name)),
    html: renderLayout(body, {
      preview: copy.preview,
      heroEmoji: copy.emoji,
      heroTitle: copy.heroTitle,
      heroSubtitle: copy.heroSubtitle,
      accent: copy.accent,
      footerNote: `Thank you for supporting a brand-new Durant business. — Maggie & the Magnolia Maids team`,
    }),
  };
}
