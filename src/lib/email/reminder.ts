import {
  BRAND,
  SITE,
  callout,
  displayName,
  esc,
  heading,
  isBlank,
  kvTable,
  nextSteps,
  paragraph,
  referenceLine,
  renderLayout,
  val,
} from "./layout";
import { CAMPAIGN_EMAIL_COPY } from "./campaign-thankyou";
import type { Rendered } from "./templates";

export type ReminderLead = {
  id: string;
  source: "booking" | "campaign";
  /** Campaign key for campaign leads (e.g. "summer-on-the-lake"). */
  campaign?: string | null;
  campaignLabel?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  /** The tentative hold date used by the .ics flow (YYYY-MM-DD). */
  holdDate: string;
  /** True when the hold date was a placeholder, not a date the visitor chose. */
  placeholder: boolean;
  /** How far out the visit is, e.g. "tomorrow", "in 2 days", "in 2 hours". */
  leadTime?: string;
  details: Array<[string, string | null | undefined]>;
};

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function prettyDate(ymd: string): string {
  if (isBlank(ymd)) return "your upcoming date";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAY[dt.getUTCDay()]}, ${MONTH[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}

/**
 * Sent one day before the tentative hold date that the visitor added to their
 * calendar from the confirmation email.
 */
export function holdReminder(l: ReminderLead): Rendered {
  const copy = (l.campaign && CAMPAIGN_EMAIL_COPY[l.campaign]) || null;
  const accent = copy?.accent ?? BRAND.primary;
  const who = displayName(l.name);
  const hasDate = !isBlank(l.holdDate);
  const when = hasDate ? prettyDate(val(l.holdDate)) : "your upcoming date";
  const ref = val(l.id, "").slice(0, 8);
  const lead = l.leadTime ?? "tomorrow";
  const icsUrl = `${SITE.url}/api/public/booking-hold.ics?date=${encodeURIComponent(l.holdDate)}&ref=${encodeURIComponent(ref)}${l.campaign ? `&campaign=${encodeURIComponent(l.campaign)}` : ""}`;

  const intro = l.placeholder
    ? `Hi <strong>${esc(who)}</strong> — a quick nudge: the placeholder hold you added to your calendar lands <strong>${esc(lead)}${hasDate ? `, ${esc(when)}` : ""}</strong>. Nothing is locked in yet, so let's pick the real date together.`
    : `Hi <strong>${esc(who)}</strong> — just a friendly reminder that your Magnolia Maids hold is <strong>${esc(lead)}${hasDate ? `, ${esc(when)}` : ""}</strong>. Here's everything on file so there are no surprises.`;

  const steps = l.placeholder
    ? [
        { title: "Reply with your ideal date", detail: "One line is enough — we'll shape the crew schedule around it." },
        { title: "We confirm in writing", detail: "You'll get the arrival window and the flat price before anything is charged." },
        { title: "Your calendar updates", detail: "Re-download the hold below and the placeholder is replaced by the real date." },
      ]
    : [
        { title: "Confirm the arrival window", detail: `Reply or call and we'll pin the exact hour for your visit ${lead}.` },
        { title: "A quick prep pass", detail: "Clear countertops and floors where you can — everything else is on us." },
        { title: "Entry details", detail: "Let us know about the door code, lockbox, gate, or pets so the crew isn't held up." },
        { title: "The Magnolia Guarantee", detail: "Not happy with a room? Tell us within 24 hours and we return to reclean it free." },
      ];

  const body = `
    ${paragraph(intro)}
    ${heading("Your hold")}
    ${kvTable([
      ["Date", hasDate ? `${when} (${val(l.holdDate)})` : "To be confirmed"],
      ["Status", l.placeholder ? "Placeholder — not confirmed yet" : "Tentative — pending confirmation"],
      ...(isBlank(l.campaignLabel) ? [] : ([["Campaign", val(l.campaignLabel)]] as Array<[string, string]>)),
      ...l.details.filter(([k]) => !isBlank(k)),
    ])}
    ${heading(l.placeholder ? "Let's lock the date" : "Before we arrive")}
    ${nextSteps(steps)}
    ${callout(
      "Need to move it?",
      `No problem and no fee — reply to this email or call <strong>${esc(SITE.phone)}</strong> and we'll find another day. <a href="${esc(icsUrl)}" style="color:${accent};font-weight:700;">Re-download the calendar hold</a> if it fell off your calendar.`,
      l.placeholder ? "warn" : "info",
    )}
    ${paragraph(`Prefer to talk it through? Call or text <strong>${esc(SITE.phone)}</strong> — a Durant human reads and answers every message.`)}
    ${referenceLine(ref)}
  `;

  return {
    subject: l.placeholder
      ? `⏰ ${who}, your Magnolia Maids hold is ${lead} — let's confirm the date`
      : `⏰ Reminder: your Magnolia Maids clean is ${lead}${hasDate ? ` (${when})` : ""}`,
    html: renderLayout(body, {
      preview: `Your hold is ${lead}${hasDate ? `, ${when}` : ""}. Reply to confirm the arrival window.`,
      heroEmoji: "⏰",
      heroTitle: `Your hold is ${lead}`,
      heroSubtitle: hasDate ? when : "",
      accent,
      ctaLabel: "Confirm your booking",
      ctaUrl: `${SITE.url}/booking`,
      footerNote: "You're getting this one-time reminder because you added a tentative hold to your calendar.",
    }),
  };
}
