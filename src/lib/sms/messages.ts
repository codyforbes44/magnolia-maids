import { SITE } from "../email/layout";

export type SmsBookingDetails = {
  id: string;
  name: string;
  service: string;
  frequency: string;
  bedrooms: string;
  bathrooms: string;
  preferredDay?: string | null;
  preferredTime?: string | null;
  estimate?: string | null;
  address?: string | null;
};

export type SmsReminderDetails = SmsBookingDetails & {
  /** Human time slot, e.g. "8:00 AM - 12:00 PM". */
  timeWindow?: string | null;
};

export type SmsCrewDetails = {
  name: string;
  /** E.g. "8:45-9:15 AM" or "between 9 and 11 AM". */
  eta: string;
};

export type SmsCompletionDetails = {
  name: string;
  service?: string | null;
  /** Review link (Google / Yelp / direct). */
  reviewUrl?: string | null;
};

export type SmsQuoteDetails = {
  name: string;
  /** Direct URL to the instant quote page. */
  quoteUrl: string;
  /** Optional estimate already prepared for the lead. */
  estimate?: string | null;
};

const ref = (id: string) => id.slice(0, 8).toUpperCase();
const firstName = (name: string) => name.trim().split(" ")[0] || "there";

/** Formats a requested day/time into a friendly, compact line. */
function whenLine(preferredDay?: string | null, preferredTime?: string | null): string {
  if (preferredDay && preferredTime) return `${preferredDay} · ${preferredTime}`;
  if (preferredDay) return preferredDay;
  return "day + time TBD";
}

/**
 * Booking confirmation texted to the customer immediately after they submit.
 * Warm, botanical, and clearly sets next steps.
 */
export function bookingConfirmationSms(b: SmsBookingDetails): string {
  return [
    `Hi ${firstName(b.name)} — Magnolia Maids here. We received your ${b.service.toLowerCase()} request. 🌿`,
    `${b.frequency} · ${b.bedrooms} bd/${b.bathrooms} ba`,
    `Requested: ${whenLine(b.preferredDay, b.preferredTime)}`,
    b.estimate ? `Estimate: ${b.estimate}` : null,
    `Next: we'll confirm your arrival window within 1 business hour. Nothing is charged today.`,
    `Questions? Call or text ${SITE.phone}. Ref #${ref(b.id)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Internal heads-up text to the Magnolia Maids dispatch line.
 */
export function bookingAlertSms(b: SmsBookingDetails & { phone?: string | null }): string {
  return [
    `New Magnolia Maids request — Ref #${ref(b.id)}`,
    `${b.name} · ${b.service} · ${b.frequency}`,
    `${b.bedrooms}bd/${b.bathrooms}ba · ${whenLine(b.preferredDay, b.preferredTime)}`,
    b.phone ? `Phone: ${b.phone}` : null,
    b.estimate ? `Estimate: ${b.estimate}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * 1-day appointment reminder for customers who have opted in to SMS.
 * Mirrors the email reminder but keeps it short and actionable.
 */
export function appointmentReminderSms(b: SmsReminderDetails): string {
  const time = b.timeWindow ?? b.preferredTime ?? "flexible arrival window";
  return [
    `Reminder, ${firstName(b.name)} — your Magnolia Maids clean is tomorrow. 🌸`,
    `${b.service} · ${b.frequency}`,
    `Arrival: ${time}`,
    b.address ? `At: ${b.address}` : null,
    `Need to reschedule? Call or text ${SITE.phone} as soon as possible. Ref #${ref(b.id)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Morning-of ETA alert once a crew is routed and has a reliable window.
 */
export function crewEtaSms(d: SmsCrewDetails): string {
  return `Good morning, ${firstName(d.name)} — your Magnolia Maids crew is on the way and expects to arrive ${d.eta}. We'll text you when we're pulling up. Need anything? ${SITE.phone}`;
}

/**
 * Arrival "we're here" text.
 */
export function crewArrivedSms(d: SmsCrewDetails): string {
  return `Hi ${firstName(d.name)}, your Magnolia Maids crew has arrived and is getting started. Sit back and enjoy the fresh, clean feeling. ✨`;
}

/**
 * Post-completion thank-you + review request.
 */
export function completionSms(d: SmsCompletionDetails): string {
  const lines = [
    `Your clean is complete — thank you for welcoming Magnolia Maids into your home, ${firstName(d.name)}. 🌿`,
    d.service ? `Service: ${d.service}` : null,
    `We'd love your feedback if you have a moment.`,
    d.reviewUrl ? d.reviewUrl : null,
    `Questions? ${SITE.phone}`,
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * Follow-up text for a lead who requested a quote but hasn't completed it.
 * Drives them to the distraction-free instant quote page.
 */
export function quoteFollowUpSms(d: SmsQuoteDetails): string {
  const lines = [
    `Hi ${firstName(d.name)} — thanks for reaching out to Magnolia Maids.`,
    d.estimate ? `Your custom estimate starts at ${d.estimate}.` : null,
    `Complete your instant quote in about 60 seconds and we'll lock in your arrival window:`,
    d.quoteUrl,
    `Questions? ${SITE.phone}`,
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * STOP/UNSUBSCRIBE auto-reply — required by carriers and A2P 10DLC compliance.
 */
export function optOutConfirmationSms(): string {
  return "You're unsubscribed. You won't receive text messages from Magnolia Maids again. Reply START to resubscribe.";
}

/**
 * START/YES/SUBSCRIBE auto-reply.
 */
export function optInWelcomeSms(): string {
  return "Welcome back! You'll receive appointment confirmations, reminders, and crew ETA texts from Magnolia Maids. Reply STOP anytime.";
}

/**
 * HELP/INFO auto-reply.
 */
export function helpSms(): string {
  return `Magnolia Maids — upscale house cleaning in Durant, OK. Call or text ${SITE.phone}. Hours: Mon-Sat 8am-6pm. Reply STOP to unsubscribe. Msg & data rates may apply.`;
}

/**
 * Fallback for unknown inbound keywords.
 */
export function fallbackInboundSms(): string {
  return `Thanks for texting Magnolia Maids. For help, reply HELP. To stop texts, reply STOP. ${SITE.phone}`;
}
