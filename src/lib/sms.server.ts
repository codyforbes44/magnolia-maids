const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

/** Digits-only E.164 normaliser for US numbers typed as (580) 745-0045. */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (raw.trim().startsWith("+") && digits.length >= 8) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

async function logSms(entry: {
  recipient: string;
  subject: string;
  kind: string;
  status: "sent" | "failed";
  provider_id?: string | null;
  error?: string | null;
  related_id?: string | null;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("email_log").insert(entry);
  } catch (e) {
    console.error("[sms] log insert failed", e);
  }
}

export type SendSmsInput = {
  to: string;
  body: string;
  /** Categorises the send in the admin log (e.g. "sms-booking"). */
  kind?: string;
  relatedId?: string;
};

/**
 * Sends an SMS through the Twilio connector gateway.
 * Never throws — a missing connection simply reports { sent:false }.
 */
export async function sendSms(input: SendSmsInput) {
  const kind = input.kind ?? "sms";
  const to = toE164(input.to);
  const subject = input.body.slice(0, 120);
  if (!to) {
    return { sent: false as const, reason: "invalid_number" };
  }

  const lovableKey = process.env.LOVABLE_API_KEY;
  const twilioKey = process.env.TWILIO_API_KEY;
  const from = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!lovableKey || !twilioKey || (!from && !messagingServiceSid)) {
    console.warn("[sms] not configured — skipping send to", to);
    return { sent: false as const, reason: "not_configured" };
  }

  const params = new URLSearchParams({ To: to, Body: input.body });
  if (messagingServiceSid) params.set("MessagingServiceSid", messagingServiceSid);
  else params.set("From", from!);

  try {
    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[sms] send failed [${res.status}]: ${body}`);
      await logSms({
        recipient: to,
        subject,
        kind,
        status: "failed",
        error: `http_${res.status}: ${body.slice(0, 400)}`,
        related_id: input.relatedId ?? null,
      });
      return { sent: false as const, reason: `http_${res.status}` };
    }

    let providerId: string | null = null;
    try {
      const payload = (await res.json()) as { sid?: string };
      providerId = payload.sid ?? null;
    } catch {
      providerId = null;
    }

    await logSms({
      recipient: to,
      subject,
      kind,
      status: "sent",
      provider_id: providerId,
      related_id: input.relatedId ?? null,
    });
    return { sent: true as const };
  } catch (e) {
    console.error("[sms] send error", e);
    await logSms({
      recipient: to,
      subject,
      kind,
      status: "failed",
      error: String(e).slice(0, 400),
      related_id: input.relatedId ?? null,
    });
    return { sent: false as const, reason: "exception" };
  }
}
