/**
 * Server-only helper: deliver a follow-up through the channel the person
 * asked for (email, text, or phone call), with graceful fallback to email.
 */
import { normalizeContactPref, type ContactPref } from "@/lib/contact-pref";

export type FollowupTarget = {
  name: string;
  email: string | null;
  phone: string | null;
  contactPref?: string | null;
  sourceTable?: string;
  sourceId?: string;
};

export type FollowupContent = {
  /** Email subject + html when the channel resolves to email. */
  subject: string;
  html: string;
  /** Short SMS body (<=320 chars) when the channel resolves to text. */
  smsBody: string;
  /** Why Maggie is calling, plus context, when the channel resolves to call. */
  callPurpose: string;
  callContext?: string;
  kind?: string;
  templateId?: string;
  relatedId?: string;
};

export type FollowupResult = {
  channel: ContactPref;
  sent: boolean;
  reason?: string;
};

export async function dispatchFollowup(
  target: FollowupTarget,
  content: FollowupContent,
): Promise<FollowupResult> {
  const pref = normalizeContactPref(target.contactPref);

  if (pref === "text" && target.phone) {
    const { sendSms } = await import("@/lib/sms.server");
    const res = await sendSms({
      to: target.phone,
      body: content.smsBody,
      kind: content.kind ?? "followup-sms",
      ...(content.relatedId ? { relatedId: content.relatedId } : {}),
    });
    if (res.sent) return { channel: "text", sent: true };
    // Consent or delivery problem — fall back to email so the lead isn't dropped.
    if (target.email) return { ...(await sendEmail(target, content)), reason: res.reason };
    return { channel: "text", sent: false, reason: res.reason };
  }

  if (pref === "call" && target.phone) {
    const queued = await queueCall(target, content);
    if (queued.sent) return queued;
    if (target.email) return { ...(await sendEmail(target, content)), reason: queued.reason };
    return queued;
  }

  if (target.email) return sendEmail(target, content);
  return { channel: pref, sent: false, reason: "no_reachable_channel" };
}

async function sendEmail(target: FollowupTarget, content: FollowupContent): Promise<FollowupResult> {
  const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
  const res = await sendResendEmail({
    to: target.email!,
    subject: content.subject,
    html: content.html,
    reply_to: NOTIFY_EMAIL,
    kind: content.kind ?? "followup-email",
    ...(content.templateId ? { templateId: content.templateId } : {}),
    ...(content.relatedId ? { relatedId: content.relatedId } : {}),
  });
  return { channel: "email", sent: res.sent, ...(res.sent ? {} : { reason: res.reason }) };
}

async function queueCall(target: FollowupTarget, content: FollowupContent): Promise<FollowupResult> {
  try {
    const { toE164, isOptedOut, recordCallEvent } = await import("@/lib/outbound-calls.server");
    const { AGENTS } = await import("@/lib/agents");
    const phoneE164 = toE164(target.phone);
    if (!phoneE164) return { channel: "call", sent: false, reason: "invalid_number" };
    if (await isOptedOut(phoneE164)) return { channel: "call", sent: false, reason: "opted_out" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("outbound_calls")
      .insert({
        contact_name: target.name,
        phone: target.phone ?? phoneE164,
        phone_e164: phoneE164,
        email: target.email,
        purpose: content.callPurpose,
        context_note: content.callContext ?? content.smsBody,
        agent_id: AGENTS[0].id,
        status: "queued",
        source_table: target.sourceTable ?? null,
        source_id: target.sourceId ?? null,
        created_by_label: "maggie-auto",
      })
      .select("id")
      .single();
    if (error) return { channel: "call", sent: false, reason: error.message };
    await recordCallEvent(data.id as string, "queued", "Queued from preferred contact method.", "system");
    return { channel: "call", sent: true };
  } catch (e) {
    return { channel: "call", sent: false, reason: e instanceof Error ? e.message : "queue_failed" };
  }
}
