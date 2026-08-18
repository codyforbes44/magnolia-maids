/**
 * Shared (client-safe) helpers for reading Twilio message delivery states.
 * Twilio moves a text through queued → sending → sent → delivered, or lands on
 * failed / undelivered with a numeric error code.
 */
export type DeliveryTone = "pending" | "sent" | "delivered" | "failed";

const PENDING = new Set(["queued", "accepted", "scheduled", "sending"]);
const DELIVERED = new Set(["delivered", "read", "received", "opened"]);
const FAILED = new Set(["failed", "undelivered", "bounced", "complained", "canceled"]);

export function deliveryTone(status: string | null | undefined): DeliveryTone {
  const s = (status ?? "").toLowerCase();
  if (FAILED.has(s)) return "failed";
  if (DELIVERED.has(s)) return "delivered";
  if (PENDING.has(s)) return "pending";
  return "sent";
}

export function deliveryLabel(status: string | null | undefined): string {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    queued: "Queued",
    accepted: "Queued",
    scheduled: "Scheduled",
    sending: "Sending",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    received: "Received",
    undelivered: "Not delivered",
    failed: "Failed",
    canceled: "Canceled",
    logged: "Logged",
  };
  return map[s] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown");
}

/** Plain-English carrier reasons for the Twilio error codes we actually see. */
const TWILIO_ERRORS: Record<string, { message: string; retryable: boolean }> = {
  "30001": { message: "Carrier queue was full — worth trying again.", retryable: true },
  "30002": { message: "Twilio account suspended.", retryable: false },
  "30003": { message: "Phone is off or unreachable.", retryable: true },
  "30004": { message: "This number has blocked messages from us.", retryable: false },
  "30005": { message: "Number doesn't exist or is no longer in service.", retryable: false },
  "30006": { message: "Landline or carrier that can't receive texts.", retryable: false },
  "30007": { message: "Carrier flagged the message as spam.", retryable: false },
  "30008": { message: "Carrier didn't say why — try resending.", retryable: true },
  "30010": { message: "Message price exceeded the max price.", retryable: false },
  "30034": { message: "Number isn't registered for A2P 10DLC.", retryable: false },
  "21610": { message: "This person replied STOP — they must text START first.", retryable: false },
  "21614": { message: "Not a valid mobile number.", retryable: false },
};

export function parseDeliveryError(detail: string | null | undefined): {
  code: string | null;
  message: string | null;
  retryable: boolean;
} {
  if (!detail) return { code: null, message: null, retryable: false };
  const match = /(?:twilio_error_|error\s*)(\d{4,5})/i.exec(detail);
  const code = match?.[1] ?? null;
  if (code && TWILIO_ERRORS[code]) {
    return { code, message: TWILIO_ERRORS[code].message, retryable: TWILIO_ERRORS[code].retryable };
  }
  // Network / HTTP failures on our side are always safe to retry.
  const transient = /network|http_5\d\d|http_429|timeout/i.test(detail);
  return { code, message: detail.slice(0, 160), retryable: transient };
}

/** True when an admin should be offered a one-tap resend. */
export function canRetryMessage(input: {
  direction: string;
  channel: string;
  status: string;
  error: string | null;
}) {
  if (input.direction !== "out") return false;
  if (input.channel !== "sms") return false;
  if (deliveryTone(input.status) !== "failed") return false;
  const parsed = parseDeliveryError(input.error);
  // No code at all → unknown failure, allow the human to decide.
  return parsed.retryable || !parsed.code;
}
