/**
 * Configuration for automated follow-ups on unanswered calls and unread
 * conversation threads. Stored in business_settings under `hub_followups`.
 */
export type HubFollowupConfig = {
  enabled: boolean;
  /** Minutes after an unanswered call before each reminder goes out. */
  callSteps: number[];
  /** Minutes after an unread inbound message before each nudge goes out. */
  threadSteps: number[];
  /** Local (America/Chicago) hours during which reminders may send. */
  quietStartHour: number;
  quietEndHour: number;
  /** Include the voicemail / call transcript summary in the reminder text. */
  includeVoicemail: boolean;
  /** Fall back to email when the person can't be texted. */
  emailFallback: boolean;
  /** Safety valve so one run can never blast the whole database. */
  maxPerRun: number;
};

export const DEFAULT_HUB_FOLLOWUPS: HubFollowupConfig = {
  enabled: true,
  callSteps: [60, 1440],
  threadSteps: [120, 1440],
  quietStartHour: 8,
  quietEndHour: 20,
  includeVoicemail: true,
  emailFallback: true,
  maxPerRun: 25,
};

export const STEP_CHOICES = [15, 30, 60, 120, 240, 480, 1440, 2880, 4320] as const;

export function stepLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = minutes / 60;
    return `${Number.isInteger(h) ? h : h.toFixed(1)} hr`;
  }
  const d = minutes / 1440;
  return `${Number.isInteger(d) ? d : d.toFixed(1)} day${d === 1 ? "" : "s"}`;
}

const steps = (v: unknown, fallback: number[]): number[] => {
  if (!Array.isArray(v)) return fallback;
  const out = Array.from(
    new Set(v.map(Number).filter((n) => Number.isFinite(n) && n > 0 && n <= 20160)),
  ).sort((a, b) => a - b);
  return out;
};

const hour = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 23 ? Math.floor(n) : fallback;
};

export function parseHubFollowups(raw: unknown): HubFollowupConfig {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_HUB_FOLLOWUPS;
    }
  }
  if (!value || typeof value !== "object") return DEFAULT_HUB_FOLLOWUPS;
  const o = value as Record<string, unknown>;
  const max = Number(o["maxPerRun"]);
  return {
    enabled: o["enabled"] !== false,
    callSteps: steps(o["callSteps"], DEFAULT_HUB_FOLLOWUPS.callSteps),
    threadSteps: steps(o["threadSteps"], DEFAULT_HUB_FOLLOWUPS.threadSteps),
    quietStartHour: hour(o["quietStartHour"], DEFAULT_HUB_FOLLOWUPS.quietStartHour),
    quietEndHour: hour(o["quietEndHour"], DEFAULT_HUB_FOLLOWUPS.quietEndHour),
    includeVoicemail: o["includeVoicemail"] !== false,
    emailFallback: o["emailFallback"] !== false,
    maxPerRun: Number.isFinite(max) ? Math.min(Math.max(Math.floor(max), 1), 200) : DEFAULT_HUB_FOLLOWUPS.maxPerRun,
  };
}
