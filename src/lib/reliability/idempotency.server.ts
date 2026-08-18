import { createHash } from "crypto";

/**
 * Webhook + outbound-send idempotency. Providers retry aggressively, so every
 * inbound webhook is claimed by a unique key before it is processed, and every
 * outbound text/email can carry a key so a retried action never double-sends.
 */

export type WebhookClaim = {
  /** False when this exact event was already handled. */
  fresh: boolean;
  id: string | null;
  attempts: number;
};

export function stableKey(...parts: (string | null | undefined)[]) {
  const joined = parts.filter(Boolean).join("|");
  return createHash("sha256").update(joined).digest("hex").slice(0, 48);
}

/**
 * Claims a webhook delivery. Returns fresh:false when the provider is
 * re-delivering something already processed.
 */
export async function claimWebhookEvent(input: {
  provider: string;
  eventKey: string;
  route: string;
  eventType?: string | null;
  payload?: unknown;
}): Promise<WebhookClaim> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("webhook_events")
      .select("id, status, attempts")
      .eq("provider", input.provider)
      .eq("event_key", input.eventKey)
      .maybeSingle();

    if (existing) {
      const attempts = (existing.attempts ?? 1) + 1;
      await supabaseAdmin
        .from("webhook_events")
        .update({ attempts })
        .eq("id", existing.id);
      // Already handled (or handled and failed permanently) → skip reprocessing.
      if (existing.status === "processed") {
        return { fresh: false, id: existing.id, attempts };
      }
      return { fresh: true, id: existing.id, attempts };
    }

    const { data: created } = await supabaseAdmin
      .from("webhook_events")
      .insert({
        provider: input.provider,
        event_key: input.eventKey,
        route: input.route,
        event_type: input.eventType ?? null,
        payload: (input.payload ?? null) as never,
        status: "received",
      })
      .select("id")
      .maybeSingle();
    return { fresh: true, id: created?.id ?? null, attempts: 1 };
  } catch (e) {
    console.error("[idempotency] claim failed", e);
    // Never block a webhook because bookkeeping failed.
    return { fresh: true, id: null, attempts: 1 };
  }
}

export async function finishWebhookEvent(
  id: string | null,
  status: "processed" | "failed",
  error?: string | null,
) {
  if (!id) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("webhook_events")
      .update({
        status,
        error: error ? String(error).slice(0, 600) : null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id);
  } catch (e) {
    console.error("[idempotency] finish failed", e);
  }
}

/**
 * Reserves an outbound send. Returns duplicate:true when this key already sent,
 * so callers can short-circuit instead of texting/emailing twice.
 */
export async function reserveOutbound(input: {
  key: string;
  channel: "sms" | "email";
  recipient?: string | null;
}): Promise<{ duplicate: boolean; providerId: string | null }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, data } = await supabaseAdmin
      .from("outbound_idempotency")
      .insert({
        idempotency_key: input.key,
        channel: input.channel,
        recipient: input.recipient ?? null,
        status: "pending",
      })
      .select("id")
      .maybeSingle();
    if (!error && data) return { duplicate: false, providerId: null };

    const { data: existing } = await supabaseAdmin
      .from("outbound_idempotency")
      .select("provider_id, status")
      .eq("idempotency_key", input.key)
      .maybeSingle();
    if (existing) return { duplicate: true, providerId: existing.provider_id ?? null };
    return { duplicate: false, providerId: null };
  } catch (e) {
    console.error("[idempotency] reserve failed", e);
    return { duplicate: false, providerId: null };
  }
}

export async function settleOutbound(
  key: string,
  status: "sent" | "failed",
  providerId?: string | null,
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("outbound_idempotency")
      .update({ status, provider_id: providerId ?? null })
      .eq("idempotency_key", key);
  } catch (e) {
    console.error("[idempotency] settle failed", e);
  }
}

/** Records a provider delivery receipt against the email/SMS log + hub message. */
export async function applyDeliveryReceipt(input: {
  providerId: string;
  status: string;
  detail?: string | null;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("email_log")
      .update({
        delivery_status: input.status,
        delivery_detail: input.detail ? String(input.detail).slice(0, 400) : null,
        delivery_updated_at: now,
      })
      .eq("provider_id", input.providerId);
    await supabaseAdmin
      .from("messages")
      .update({ status: input.status, error: input.detail ?? null })
      .eq("provider_id", input.providerId);
  } catch (e) {
    console.error("[delivery] receipt failed", e);
  }
}
