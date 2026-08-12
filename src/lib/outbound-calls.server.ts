/** Server-only helpers for Maggie's outbound follow-up calls. */

const API = "https://api.elevenlabs.io/v1";

/** ElevenLabs phone number registered for Magnolia Maids: (580) 745-0045. */
export const MAGNOLIA_PHONE_NUMBER_ID = "phnum_5201kzabeyq6esmtbjj8tqm5pmyc";

export const CALL_PURPOSES = [
  { value: "lead_followup", label: "New lead follow-up" },
  { value: "quote_followup", label: "Quote follow-up" },
  { value: "booking_confirm", label: "Confirm a booking" },
  { value: "reschedule", label: "Reschedule / change request" },
  { value: "applicant_screen", label: "Applicant screening" },
  { value: "property_followup", label: "Property / turnover follow-up" },
  { value: "win_back", label: "Win-back / check-in" },
  { value: "general_followup", label: "General follow-up" },
] as const;

export const CALL_STATUSES = [
  "queued",
  "scheduled",
  "calling",
  "completed",
  "no_answer",
  "failed",
  "cancelled",
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

/** Calling window in America/Chicago — never dial outside 8am–8pm local. */
export const CALL_WINDOW = { startHour: 8, endHour: 20 };
export const MAX_ATTEMPTS = 3;

export function centralHour(at: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    hour12: false,
  }).formatToParts(at);
  return Number(parts.find((p) => p.type === "hour")?.value ?? "0");
}

export function withinCallWindow(at: Date = new Date()) {
  const h = centralHour(at);
  return h >= CALL_WINDOW.startHour && h < CALL_WINDOW.endHour;
}

export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (raw.trim().startsWith("+") && digits.length >= 8) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function isOptedOut(phoneE164: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("call_opt_outs")
    .select("phone_e164")
    .eq("phone_e164", phoneE164)
    .maybeSingle();
  return Boolean(data);
}

function key() {
  const k = process.env["ELEVENLABS_API_KEY"];
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set");
  return k;
}

/** Places the call through ElevenLabs' Twilio outbound endpoint. */
export async function placeOutboundCall(input: {
  agentId: string;
  toNumber: string;
  variables: Record<string, string>;
}) {
  const res = await fetch(`${API}/convai/twilio/outbound-call`, {
    method: "POST",
    headers: { "xi-api-key": key(), "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: input.agentId,
      agent_phone_number_id: MAGNOLIA_PHONE_NUMBER_ID,
      to_number: input.toNumber,
      conversation_initiation_client_data: {
        dynamic_variables: input.variables,
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${text.slice(0, 400)}`);
  const body = text ? JSON.parse(text) : {};
  // ElevenLabs answers 200 even when Twilio refuses the dial — surface that as a failure.
  if (body.success === false) {
    throw new Error(String(body.message ?? "The phone provider rejected the call."));
  }
  return {
    conversationId: (body.conversation_id ?? null) as string | null,
    callSid: (body.callSid ?? body.call_sid ?? null) as string | null,
  };
}

export type CallRow = {
  id: string;
  contact_name: string;
  phone_e164: string;
  email: string | null;
  purpose: string;
  context_note: string | null;
  agent_id: string;
  attempts: number;
  source_table: string | null;
  source_id: string | null;
};

/** Dials one queued row and records the result. Never throws. */
export async function dialCall(row: CallRow) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (await isOptedOut(row.phone_e164)) {
    await supabaseAdmin
      .from("outbound_calls")
      .update({ status: "cancelled", outcome: "opted_out", error: "Number is on the do-not-call list." })
      .eq("id", row.id);
    return { ok: false as const, reason: "opted_out" };
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    await supabaseAdmin
      .from("outbound_calls")
      .update({ status: "failed", error: `Max attempts (${MAX_ATTEMPTS}) reached.` })
      .eq("id", row.id);
    return { ok: false as const, reason: "max_attempts" };
  }

  await supabaseAdmin
    .from("outbound_calls")
    .update({ status: "calling", attempts: row.attempts + 1, last_attempt_at: new Date().toISOString(), error: null })
    .eq("id", row.id);

  const purposeLabel =
    CALL_PURPOSES.find((p) => p.value === row.purpose)?.label ?? "Follow-up";

  try {
    const result = await placeOutboundCall({
      agentId: row.agent_id,
      toNumber: row.phone_e164,
      variables: {
        contact_name: row.contact_name,
        call_purpose: purposeLabel,
        call_context: row.context_note ?? "",
        contact_email: row.email ?? "",
        call_direction: "outbound",
      },
    });
    await supabaseAdmin
      .from("outbound_calls")
      .update({
        conversation_id: result.conversationId,
        call_sid: result.callSid,
      })
      .eq("id", row.id);
    return { ok: true as const, conversationId: result.conversationId };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await supabaseAdmin
      .from("outbound_calls")
      .update({ status: "failed", error: message })
      .eq("id", row.id);
    return { ok: false as const, reason: "error", error: message };
  }
}

/** Dials everything that is due right now. Used by the scheduler route. */
export async function dispatchDueCalls(limit = 5) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!withinCallWindow()) return { dispatched: 0, skipped: "outside_call_window" as const };

  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("outbound_calls")
    .select("id, contact_name, phone_e164, email, purpose, context_note, agent_id, attempts, source_table, source_id")
    .in("status", ["queued", "scheduled"])
    .or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) return { dispatched: 0, error: error.message };

  let dispatched = 0;
  for (const row of data ?? []) {
    const res = await dialCall(row as CallRow);
    if (res.ok) dispatched += 1;
  }
  return { dispatched, considered: (data ?? []).length };
}
