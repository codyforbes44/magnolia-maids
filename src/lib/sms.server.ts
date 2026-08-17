const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

/**
 * The only phone number Magnolia Maids is authorized to text from
 * (the A2P-approved Durant number). Every outbound send is pinned to it,
 * even when a Messaging Service is configured, so a shared Twilio account
 * can never rotate our texts onto another number.
 */
export const AUTHORIZED_SMS_FROM = "+15807450045";

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
  // Mirror into the communications hub so the text reads as a real thread.
  const { recordMessage } = await import("@/lib/hub/threads.server");
  await recordMessage({
    channel: "sms",
    direction: "out",
    contactKey: entry.recipient,
    phone: entry.recipient,
    body: entry.subject,
    status: entry.status,
    providerId: entry.provider_id ?? null,
    error: entry.error ?? null,
    relatedId: entry.related_id ?? null,
  });
}

export type SendSmsInput = {
  to: string;
  body: string;
  /** Categorises the send in the admin log (e.g. "sms-booking"). */
  kind?: string;
  relatedId?: string;
  /** When true (default), the central consent table is checked first. */
  checkConsent?: boolean;
  /**
   * When true, a number with no recorded consent row is allowed through
   * (used for internal/dispatch numbers, admin test sends, and texts a caller
   * verbally asked for while on the phone). Numbers that texted STOP are
   * always blocked.
   */
  allowUnknown?: boolean;
};

/**
 * Sends an SMS through the Twilio connector gateway.
 * Never throws — a missing connection simply reports { sent:false }.
 */
export async function sendSms(input: SendSmsInput) {
  const kind = input.kind ?? "sms";
  const to = toE164(input.to);
  const subject = input.body.slice(0, 120);
  const checkConsent = input.checkConsent ?? true;
  if (!to) {
    return { sent: false as const, reason: "invalid_number" };
  }

  if (checkConsent) {
    const status = await getSmsConsentStatus(to);
    if (status === "opted_out") {
      console.log("[sms] consent opt-out for", to);
      return { sent: false as const, reason: "opted_out" };
    }
    if (status === "unknown" && !input.allowUnknown) {
      console.log("[sms] no recorded opt-in for", to);
      return { sent: false as const, reason: "no_consent" };
    }
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

/**
 * Records or updates a phone number's SMS consent status. All incoming STOP,
 * START, HELP replies should be normalised and funnelled here so the app can
 * honor opt-outs across every lead table.
 */
// (see logInboundSms below for the inbound activity trail)
export async function updateSmsConsent(
  phone: string,
  consent: boolean,
  source?: string,
) {
  const normalized = toE164(phone);
  if (!normalized) {
    console.warn("[sms] cannot update consent for invalid phone", phone);
    return { ok: false as const, reason: "invalid_number" };
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sms_consents").upsert(
      { phone: normalized, consent, source: source ?? "inbound", updated_at: new Date().toISOString() },
      { onConflict: "phone" },
    );
    if (error) {
      console.error("[sms] consent upsert failed", error.message);
      return { ok: false as const, reason: "db_error" };
    }
    return { ok: true as const, phone: normalized };
  } catch (e) {
    console.error("[sms] consent update error", e);
    return { ok: false as const, reason: "exception" };
  }
}

export type SmsConsentStatus = "opted_in" | "opted_out" | "unknown";

/**
 * Tri-state consent lookup. A missing row is `unknown` — never an implicit
 * opt-in — so A2P outreach only goes to numbers that checked a consent box or
 * texted START.
 */
export async function getSmsConsentStatus(phone: string): Promise<SmsConsentStatus> {
  const normalized = toE164(phone);
  if (!normalized) return "opted_out";

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("sms_consents")
      .select("consent")
      .eq("phone", normalized)
      .maybeSingle();
    if (!data) return "unknown";
    return data.consent ? "opted_in" : "opted_out";
  } catch (e) {
    console.error("[sms] consent lookup error", e);
    return "unknown";
  }
}

/** True only when the number has an explicit, still-active opt-in on file. */
export async function hasSmsOptIn(phone: string): Promise<boolean> {
  return (await getSmsConsentStatus(phone)) === "opted_in";
}

/**
 * Records a form/verbal opt-in. Never overrides a previous STOP — once someone
 * opts out, only an inbound START can re-enable texting.
 */
export async function recordSmsOptIn(phone: string, source: string) {
  const normalized = toE164(phone);
  if (!normalized) return { ok: false as const, reason: "invalid_number" };
  const status = await getSmsConsentStatus(normalized);
  if (status === "opted_out") return { ok: false as const, reason: "previously_opted_out" };
  if (status === "opted_in") return { ok: true as const, phone: normalized };
  return updateSmsConsent(normalized, true, source);
}

/**
 * Records an inbound text (STOP / START / HELP / other) in the shared activity
 * log so the admin SMS log can show both directions of the conversation.
 * Never throws.
 */
export async function logInboundSms(input: {
  from: string;
  body: string;
  keyword: string;
  messageSid?: string | null;
}) {
  const to = toE164(input.from) ?? input.from;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("email_log").insert({
      recipient: to,
      subject: (input.body || "(empty)").slice(0, 200),
      kind: `sms-inbound:${input.keyword}`,
      status: "sent",
      provider_id: input.messageSid ?? null,
    });
  } catch (e) {
    console.error("[sms] inbound log failed", e);
  }
  const { recordMessage } = await import("@/lib/hub/threads.server");
  await recordMessage({
    channel: "sms",
    direction: "in",
    contactKey: to,
    phone: to,
    body: input.body || "",
    status: "received",
    providerId: input.messageSid ?? null,
  });
}
