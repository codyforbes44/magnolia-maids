/**
 * Automated follow-ups for the communications hub.
 *
 * Two situations get chased automatically at admin-configurable intervals:
 *  1. Unanswered outbound calls (no answer / busy / failed / voicemail) — the
 *     person gets a personalised text that repeats what the voicemail said.
 *  2. Unread inbound threads (text, email, web chat, Messenger) — the person
 *     gets a short "we're still here" nudge so nobody is left hanging.
 *
 * Every send is de-duplicated in `reminder_dispatches`, so a missed cron run
 * never double-texts and a caught-up run never skips a step.
 */
import {
  DEFAULT_HUB_FOLLOWUPS,
  parseHubFollowups,
  type HubFollowupConfig,
} from "./auto-followups";

const SETTINGS_KEY = "hub_followups";
const BUSINESS_PHONE = "(580) 745-0045";
const TZ = "America/Chicago";

export async function loadHubFollowupConfig(): Promise<HubFollowupConfig> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("business_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (data?.value == null) return DEFAULT_HUB_FOLLOWUPS;
    return parseHubFollowups(data.value);
  } catch {
    return DEFAULT_HUB_FOLLOWUPS;
  }
}

export async function saveHubFollowupConfig(config: HubFollowupConfig) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("business_settings")
    .upsert(
      { key: SETTINGS_KEY, value: config as unknown as never, is_public: false },
      { onConflict: "key" },
    );
  if (error) throw new Error(error.message);
}

/** Current hour on the Chicago wall clock. */
function localHour(at = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour12: false, hour: "2-digit" }).format(at),
  ) % 24;
}

function withinSendingHours(cfg: HubFollowupConfig, at = new Date()): boolean {
  const h = localHour(at);
  if (cfg.quietStartHour === cfg.quietEndHour) return true;
  if (cfg.quietStartHour < cfg.quietEndHour) return h >= cfg.quietStartHour && h < cfg.quietEndHour;
  return h >= cfg.quietStartHour || h < cfg.quietEndHour;
}

/** Highest configured step whose delay has elapsed, or null when none has. */
function dueStep(steps: number[], elapsedMinutes: number): number | null {
  let due: number | null = null;
  for (const s of steps) if (elapsedMinutes >= s) due = s;
  return due;
}

function firstName(name: string | null | undefined): string {
  const n = (name ?? "").trim().split(/\s+/)[0];
  return n && n.length > 1 ? n : "there";
}

function clean(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

type Sent = {
  kind: "call" | "thread";
  id: string;
  step: number;
  channel: string;
  ok: boolean;
  reason?: string;
};

async function alreadySent(recordTable: string, ids: string[]) {
  if (!ids.length) return new Set<string>();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("reminder_dispatches")
    .select("record_id, offset_key")
    .eq("record_table", recordTable)
    .in("record_id", ids);
  return new Set((data ?? []).map((r) => `${r.record_id}:${r.offset_key}`));
}

async function markSent(recordTable: string, recordId: string, offsetKey: string, channel: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("reminder_dispatches").insert({
    record_table: recordTable,
    record_id: recordId,
    offset_key: offsetKey,
    channel,
  });
}

/** Text first (with recorded consent), email as the configured fallback. */
async function deliver(opts: {
  name: string | null;
  phone: string | null;
  email: string | null;
  smsBody: string;
  subject: string;
  html: string;
  kind: string;
  relatedId?: string;
  emailFallback: boolean;
}): Promise<{ channel: string; ok: boolean; reason?: string }> {
  if (opts.phone) {
    const { sendSms, hasSmsOptIn } = await import("@/lib/sms.server");
    if (await hasSmsOptIn(opts.phone)) {
      const res = await sendSms({
        to: opts.phone,
        body: opts.smsBody,
        kind: opts.kind,
        ...(opts.relatedId ? { relatedId: opts.relatedId } : {}),
      });
      if (res.sent) return { channel: "sms", ok: true };
      if (!opts.emailFallback || !opts.email) return { channel: "sms", ok: false, reason: res.reason };
    }
  }
  if (opts.emailFallback && opts.email) {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
    const res = await sendResendEmail({
      to: opts.email,
      subject: opts.subject,
      html: opts.html,
      reply_to: NOTIFY_EMAIL,
      kind: opts.kind,
      ...(opts.relatedId ? { relatedId: opts.relatedId } : {}),
    });
    return { channel: "email", ok: res.sent, ...(res.sent ? {} : { reason: res.reason }) };
  }
  return { channel: "none", ok: false, reason: "no_reachable_channel" };
}

function emailShell(greeting: string, lines: string[]) {
  return `<div style="font-family:Georgia,serif;color:#2f3b30;line-height:1.6">
  <p>${greeting}</p>
  ${lines.map((l) => `<p>${l}</p>`).join("")}
  <p>— Maggie · Magnolia Maids · ${BUSINESS_PHONE}</p>
</div>`;
}

/** Chases outbound calls that never connected. */
async function runCallFollowups(cfg: HubFollowupConfig, budget: number): Promise<Sent[]> {
  if (!cfg.callSteps.length || budget <= 0) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const oldest = new Date(Date.now() - 14 * 86400000).toISOString();

  const { data: rows, error } = await supabaseAdmin
    .from("outbound_calls")
    .select(
      "id, contact_name, phone, phone_e164, email, purpose, status, outcome, transcript_summary, created_at, last_attempt_at, ended_at, failed_at",
    )
    .gte("created_at", oldest)
    .in("status", ["failed", "no-answer", "no_answer", "busy", "completed"])
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[hub-followups] call query failed", error.message);
    return [];
  }

  const unanswered = (rows ?? []).filter((r) => {
    const status = String(r.status);
    const outcome = String(r.outcome ?? "").toLowerCase();
    if (status === "completed") return outcome.includes("voicemail") || outcome.includes("no_answer");
    return true;
  });

  const seen = await alreadySent("outbound_calls", unanswered.map((r) => r.id as string));
  const out: Sent[] = [];

  for (const row of unanswered) {
    if (out.length >= budget) break;
    const at = row.ended_at ?? row.failed_at ?? row.last_attempt_at ?? row.created_at;
    const elapsed = (Date.now() - new Date(at as string).getTime()) / 60000;
    const step = dueStep(cfg.callSteps, elapsed);
    if (step == null) continue;
    const key = `call-fu-${step}`;
    if (seen.has(`${row.id}:${key}`)) continue;
    if (!row.phone_e164 && !row.email) continue;

    const name = firstName(row.contact_name as string);
    const voicemail = cfg.includeVoicemail ? clean(row.transcript_summary as string, 220) : null;
    const why = clean(row.purpose as string, 90) ?? "your cleaning";

    const smsBody = [
      `Hi ${name}, it's Maggie with Magnolia Maids. We tried calling about ${why} and couldn't reach you.`,
      voicemail ? `Voicemail recap: "${voicemail}"` : null,
      `Reply here or call ${BUSINESS_PHONE} and we'll pick right back up. Reply STOP to opt out.`,
    ]
      .filter(Boolean)
      .join(" ");

    const html = emailShell(`Hi ${name},`, [
      `We tried reaching you by phone about ${why} and couldn't connect.`,
      voicemail ? `Here's what we left on your voicemail: <em>“${voicemail}”</em>` : "",
      `Just reply to this email or call <strong>${BUSINESS_PHONE}</strong> and we'll take it from there.`,
    ].filter(Boolean));

    const res = await deliver({
      name: row.contact_name as string,
      phone: (row.phone_e164 ?? row.phone) as string | null,
      email: row.email as string | null,
      smsBody: smsBody.slice(0, 480),
      subject: "We tried to reach you — Magnolia Maids",
      html,
      kind: "hub-followup-call",
      relatedId: row.id as string,
      emailFallback: cfg.emailFallback,
    });

    if (res.ok) {
      await markSent("outbound_calls", row.id as string, key, res.channel);
      try {
        const { recordCallEvent } = await import("@/lib/outbound-calls.server");
        await recordCallEvent(
          row.id as string,
          String(row.status),
          `Automated follow-up sent by ${res.channel} after ${step} min.`,
          "system",
        );
      } catch {
        /* timeline logging is best-effort */
      }
    }
    out.push({ kind: "call", id: row.id as string, step, channel: res.channel, ok: res.ok, ...(res.reason ? { reason: res.reason } : {}) });
  }
  return out;
}

/** Nudges people whose inbound message is still sitting unread. */
async function runThreadFollowups(cfg: HubFollowupConfig, budget: number): Promise<Sent[]> {
  if (!cfg.threadSteps.length || budget <= 0) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const oldest = new Date(Date.now() - 14 * 86400000).toISOString();

  const { data: rows, error } = await supabaseAdmin
    .from("message_threads")
    .select("id, channel, contact_key, contact_name, phone, email, last_snippet, last_direction, last_message_at, unread")
    .gt("unread", 0)
    .eq("last_direction", "in")
    .in("channel", ["sms", "email", "chat", "messenger"])
    .gte("last_message_at", oldest)
    .order("last_message_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[hub-followups] thread query failed", error.message);
    return [];
  }

  const seen = await alreadySent("message_threads", (rows ?? []).map((r) => r.id as string));
  const out: Sent[] = [];

  for (const row of rows ?? []) {
    if (out.length >= budget) break;
    const elapsed = (Date.now() - new Date(row.last_message_at as string).getTime()) / 60000;
    const step = dueStep(cfg.threadSteps, elapsed);
    if (step == null) continue;
    const key = `thread-fu-${step}`;
    if (seen.has(`${row.id}:${key}`)) continue;

    const contactKey = String(row.contact_key ?? "");
    const phone = (row.phone as string | null) ?? (contactKey.startsWith("+") ? contactKey : null);
    const email = (row.email as string | null) ?? (contactKey.includes("@") ? contactKey : null);
    if (!phone && !email) continue;

    const name = firstName(row.contact_name as string);
    const snippet = clean(row.last_snippet as string, 120);

    const smsBody = [
      `Hi ${name}, Maggie with Magnolia Maids here — circling back on your message${snippet ? ` about "${snippet}"` : ""}.`,
      `Still happy to help: reply here or call ${BUSINESS_PHONE}. Reply STOP to opt out.`,
    ].join(" ");

    const html = emailShell(`Hi ${name},`, [
      `I didn't want your note to slip through the magnolia leaves${snippet ? `: <em>“${snippet}”</em>` : "."}`,
      `Reply to this email or call <strong>${BUSINESS_PHONE}</strong> and we'll get you scheduled.`,
    ]);

    const res = await deliver({
      name: row.contact_name as string,
      phone,
      email,
      smsBody: smsBody.slice(0, 480),
      subject: "Following up on your message — Magnolia Maids",
      html,
      kind: "hub-followup-thread",
      relatedId: row.id as string,
      emailFallback: cfg.emailFallback,
    });

    if (res.ok) await markSent("message_threads", row.id as string, key, res.channel);
    out.push({ kind: "thread", id: row.id as string, step, channel: res.channel, ok: res.ok, ...(res.reason ? { reason: res.reason } : {}) });
  }
  return out;
}

export async function runHubFollowups(force = false) {
  const cfg = await loadHubFollowupConfig();
  if (!cfg.enabled && !force) return { ok: true, skipped: "disabled" as const, sent: 0, results: [] as Sent[] };
  if (!withinSendingHours(cfg) && !force) {
    return { ok: true, skipped: "quiet_hours" as const, sent: 0, results: [] as Sent[] };
  }

  const calls = await runCallFollowups(cfg, cfg.maxPerRun);
  const threads = await runThreadFollowups(cfg, cfg.maxPerRun - calls.length);
  const results = [...calls, ...threads];
  const sent = results.filter((r) => r.ok).length;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("business_settings").upsert(
      {
        key: "hub_followups_last_run",
        value: { at: new Date().toISOString(), sent, attempted: results.length } as unknown as never,
        is_public: false,
      },
      { onConflict: "key" },
    );
  } catch {
    /* run bookkeeping is best-effort */
  }

  return { ok: true, sent, attempted: results.length, results };
}
