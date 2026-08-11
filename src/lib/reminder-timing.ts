import { SERVICE_RATES, type ServiceKey } from "@/lib/pricing";

/**
 * How far ahead of a visit each reminder goes out.
 * Days are sent at the local morning send hour; hours are sent relative to the
 * visit's arrival time.
 */
export type ReminderWindow = {
  daysBefore: number[];
  hoursBefore: number[];
};

export type ReminderTiming = {
  /** Applied to any service without its own override, and to campaign leads. */
  default: ReminderWindow;
  /** Per service-type overrides, keyed by ServiceKey. */
  services: Partial<Record<string, ReminderWindow>>;
  /** Local (America/Chicago) hour that day-based reminders are sent. */
  sendHour: number;
};

export const DEFAULT_REMINDER_TIMING: ReminderTiming = {
  default: { daysBefore: [1], hoursBefore: [] },
  services: {},
  sendHour: 9,
};

export const DAY_CHOICES = [1, 2, 3, 5, 7] as const;
export const HOUR_CHOICES = [1, 2, 3, 4, 6, 12, 24] as const;

export const REMINDER_SERVICE_KEYS: ServiceKey[] = SERVICE_RATES.map((s) => s.key);

const uniqSorted = (v: unknown): number[] =>
  Array.isArray(v)
    ? Array.from(new Set(v.map(Number).filter((n) => Number.isFinite(n) && n > 0))).sort((a, b) => b - a)
    : [];

function parseWindow(raw: unknown, fallback: ReminderWindow): ReminderWindow {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  return { daysBefore: uniqSorted(o["daysBefore"]), hoursBefore: uniqSorted(o["hoursBefore"]) };
}

/** Accepts the stored jsonb (or a JSON string) and returns a safe config. */
export function parseReminderTiming(raw: unknown): ReminderTiming {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_REMINDER_TIMING;
    }
  }
  if (!value || typeof value !== "object") return DEFAULT_REMINDER_TIMING;
  const o = value as Record<string, unknown>;
  const services: Partial<Record<string, ReminderWindow>> = {};
  const rawServices = (o["services"] ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(rawServices)) {
    services[k] = parseWindow(v, { daysBefore: [], hoursBefore: [] });
  }
  const sendHour = Number(o["sendHour"]);
  return {
    default: parseWindow(o["default"], DEFAULT_REMINDER_TIMING.default),
    services,
    sendHour: Number.isFinite(sendHour) && sendHour >= 0 && sendHour <= 23 ? sendHour : 9,
  };
}

/** The window that applies to a given service (falls back to the default). */
export function windowForService(timing: ReminderTiming, service?: string | null): ReminderWindow {
  const override = service ? timing.services[service] : undefined;
  if (!override) return timing.default;
  if (!override.daysBefore.length && !override.hoursBefore.length) return override;
  return override;
}

export function describeWindow(w: ReminderWindow): string {
  const parts = [
    ...w.daysBefore.map((d) => `${d} day${d === 1 ? "" : "s"} before`),
    ...w.hoursBefore.map((h) => `${h} hour${h === 1 ? "" : "s"} before`),
  ];
  return parts.length ? parts.join(" · ") : "No reminders";
}
