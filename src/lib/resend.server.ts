const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

/** Verified sending domain in Resend. */
export const FROM_ADDRESS = "Magnolia Maids <bookings@bookme.bet>";
/** Where every visitor interaction is delivered. */
export const NOTIFY_EMAIL = "hello@magnoliamaids.pro";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
  /** Categorises the send in the admin email log (e.g. "booking", "careers"). */
  kind?: string;
  /** Optional row this email relates to, for admin cross-referencing. */
  relatedId?: string;
  /** Catalog template id — applies any admin edits saved for that template. */
  templateId?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function logEmail(entry: {
  recipient: string;
  subject: string;
  kind: string;
  status: "sent" | "failed";
  provider_id?: string | null;
  error?: string | null;
  related_id?: string | null;
  body_html?: string | null;
  reply_to?: string | null;
  from_address?: string | null;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // related_id is a uuid column — external ids (conversation/message SIDs) go in the error/reference text instead.
    const relatedId = entry.related_id && UUID_RE.test(entry.related_id) ? entry.related_id : null;
    const { error } = await supabaseAdmin
      .from("email_log")
      .insert({ ...entry, related_id: relatedId });
    if (error) console.error("[resend] email_log insert rejected", error.message);
  } catch (e) {
    console.error("[resend] email_log insert failed", e);
  }
  // Mirror into the communications hub so email reads as a thread per person.
  const { recordMessage } = await import("@/lib/hub/threads.server");
  await recordMessage({
    channel: "email",
    direction: "out",
    contactKey: entry.recipient.split(",")[0]!.trim().toLowerCase(),
    email: entry.recipient,
    subject: entry.subject,
    body: entry.subject,
    status: entry.status,
    providerId: entry.provider_id ?? null,
    error: entry.error ?? null,
  });
}

export async function sendResendEmail(input: SendEmailInput) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const kind = input.kind ?? "general";
  const recipient = Array.isArray(input.to) ? input.to.join(", ") : input.to;

  // Admin-edited copy (subject, headline, intro, CTA, footer) wins over code defaults.
  let subject = input.subject;
  let html = input.html;
  if (input.templateId) {
    try {
      const { withOverride } = await import("./email/overrides.server");
      const merged = await withOverride(input.templateId, { subject, html });
      subject = merged.subject;
      html = merged.html;
    } catch (e) {
      console.error("[resend] override apply failed", e);
    }
  }

  if (!lovableKey || !resendKey) {
    console.error("[resend] missing LOVABLE_API_KEY or RESEND_API_KEY");
    await logEmail({
      recipient,
      subject,
      kind,
      status: "failed",
      error: "not_configured",
      related_id: input.relatedId ?? null,
      body_html: html,
      reply_to: input.reply_to ?? null,
      from_address: input.from ?? FROM_ADDRESS,
    });
    return { sent: false as const, reason: "not_configured" };
  }

  const from = input.from ?? FROM_ADDRESS;
  const to = Array.isArray(input.to) ? input.to : [input.to];

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      reply_to: input.reply_to,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[resend] send failed [${res.status}]: ${body}`);
    await logEmail({
      recipient,
      subject,
      kind,
      status: "failed",
      error: `http_${res.status}: ${body.slice(0, 400)}`,
      related_id: input.relatedId ?? null,
      body_html: html,
      reply_to: input.reply_to ?? null,
      from_address: from,
    });
    return { sent: false as const, reason: `http_${res.status}`, body };
  }

  let providerId: string | null = null;
  try {
    const payload = (await res.clone().json()) as { id?: string };
    providerId = payload.id ?? null;
  } catch {
    providerId = null;
  }

  await logEmail({
    recipient,
    subject,
    kind,
    status: "sent",
    provider_id: providerId,
    related_id: input.relatedId ?? null,
    body_html: html,
    reply_to: input.reply_to ?? null,
    from_address: from,
  });

  return { sent: true as const };
}