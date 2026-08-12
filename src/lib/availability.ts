import type { ServiceKey } from "@/lib/pricing";

/**
 * Scheduling rules for the booking wizard.
 * One source of truth for which days and time slots a visitor can pick.
 */

/** Grand opening — nothing can be scheduled before this date. */
export const OPENING_DATE = "2026-09-01";

/** How far out the calendar lets you book. */
export const MAX_DAYS_AHEAD = 90;

/** Lead time in days before the earliest bookable visit. */
const DEFAULT_LEAD_DAYS = 2;
const RUSH_LEAD_DAYS = 1;
/** Turnovers and post-event resets are time-sensitive, so they book sooner. */
const RUSH_SERVICES: ServiceKey[] = ["Airbnb Turnover", "Post-Party"];

/** Long jobs need a full crew day, so they start in the morning. */
const LONG_JOB_SERVICES: ServiceKey[] = ["Deep Clean", "Move In / Out"];

export type TimeSlot = {
  key: string;
  label: string;
  window: string;
  /** Day-of-week numbers (0 = Sunday) this slot runs. */
  days: number[];
};

/** Business hours: Mon–Fri 8am–5pm CST. Saturday windows are by-request only; closed Sunday. */
export const TIME_SLOTS: TimeSlot[] = [
  { key: "morning", label: "Morning", window: "8:00–11:00 AM", days: [1, 2, 3, 4, 5] },
  { key: "midday", label: "Midday", window: "11:00 AM–2:00 PM", days: [1, 2, 3, 4, 5] },
  { key: "afternoon", label: "Afternoon", window: "2:00–5:00 PM", days: [1, 2, 3, 4, 5] },
  { key: "sat-morning", label: "Saturday morning", window: "9:00 AM–12:00 PM", days: [6] },
  { key: "sat-midday", label: "Saturday midday", window: "12:00–3:00 PM", days: [6] },
];

/** Label stored on the booking record and shown in confirmation emails. */
export function slotLabel(slot: TimeSlot) {
  return `${slot.label} (${slot.window})`;
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function leadDays(service: ServiceKey) {
  return RUSH_SERVICES.includes(service) ? RUSH_LEAD_DAYS : DEFAULT_LEAD_DAYS;
}

/** First date a visitor may choose: today + lead time, never before opening day. */
export function earliestDate(service: ServiceKey, now = new Date()): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const withLead = addDays(today, leadDays(service));
  const opening = fromISODate(OPENING_DATE);
  return withLead > opening ? withLead : opening;
}

export function latestDate(service: ServiceKey, now = new Date()): Date {
  return addDays(earliestDate(service, now), MAX_DAYS_AHEAD);
}

export type DayCheck = { available: boolean; reason?: string };

export function checkDate(iso: string, service: ServiceKey, now = new Date()): DayCheck {
  if (!iso) return { available: false, reason: "Pick a date to see open windows." };
  const date = fromISODate(iso);
  if (Number.isNaN(date.getTime())) return { available: false, reason: "That date isn't valid." };
  if (date.getDay() === 0) return { available: false, reason: "We're closed on Sundays." };
  const min = earliestDate(service, now);
  if (date < min) {
    const opening = fromISODate(OPENING_DATE);
    return {
      available: false,
      reason:
        min.getTime() === opening.getTime()
          ? "Our first cleanings start on opening day, September 1, 2026."
          : `We need ${leadDays(service)} day${leadDays(service) === 1 ? "" : "s"} notice for this service.`,
    };
  }
  if (date > latestDate(service, now)) {
    return { available: false, reason: `We schedule up to ${MAX_DAYS_AHEAD} days out.` };
  }
  return { available: true };
}

export type SlotOption = { slot: TimeSlot; available: boolean; reason?: string };

/** Slots offered on a given date for a given service, with disabled reasons. */
export function slotsForDate(iso: string, service: ServiceKey, now = new Date()): SlotOption[] {
  const day = checkDate(iso, service, now);
  if (!day.available) return [];
  const dow = fromISODate(iso).getDay();
  const longJob = LONG_JOB_SERVICES.includes(service);
  return TIME_SLOTS.filter((s) => s.days.includes(dow)).map((slot) => {
    if (longJob && (slot.key === "afternoon" || slot.key === "sat-midday")) {
      return {
        slot,
        available: false,
        reason: "Needs a full crew day — choose an earlier window.",
      };
    }
    return { slot, available: true };
  });
}

/** Plain-language rules shown under the calendar. */
export function availabilityNotes(service: ServiceKey): string[] {
  const notes = [
    "Monday–Friday 8:00 AM–5:00 PM CST. Closed Saturday and Sunday — Saturday windows are by request only.",
    `${leadDays(service)}-day minimum notice${RUSH_SERVICES.includes(service) ? " — turnovers and post-event resets get next-day priority." : "."}`,
    "Arrival windows are 3 hours; we text an exact ETA the morning of your visit.",
  ];
  if (LONG_JOB_SERVICES.includes(service)) {
    notes.push("Deep cleans and move in / out visits take most of a day, so they start in a morning or midday window.");
  }
  return notes;
}