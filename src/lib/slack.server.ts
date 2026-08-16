/**
 * Slack for Magnolia Maids. Server-only.
 *
 * One custom Slack app installed in the workspace: the bot posts business
 * notifications into the chosen channel and answers questions there. Every
 * outbound message is logged so the admin panel can show what went out.
 */
const SLACK_API = "https://slack.com/api";
const SETTINGS_KEY = "slack";

export const SLACK_EVENTS = [
  "leads",
  "bookings",
  "applications",
  "properties",
  "franchise",
  "calls",
  "messenger",
] as const;
export type SlackEventKind = (typeof SLACK_EVENTS)[number];

export const SLACK_EVENT_LABELS: Record<SlackEventKind, string> = {
  leads: "New leads",
  bookings: "Booking requests",
  applications: "Job applicants",
  properties: "Property manager inquiries",
  franchise: "Franchise inquiries",
  calls: "Finished Maggie calls",
  messenger: "Messenger threads that need you",
};

export type SlackSettings = {
  channelId: string | null;
  channelName: string | null;
  answerInChannel: boolean;
  /** "all" = answer every message in the channel, "mention" = only @Maggie. */
  channelMode: "all" | "mention";
  events: Record<SlackEventKind, boolean>;
};

export const DEFAULT_SLACK_SETTINGS: SlackSettings = {
  channelId: null,
  channelName: null,
  answerInChannel: true,
  channelMode: "all",
  events: {
    leads: true,
    bookings: true,
    applications: true,
    properties: true,
    franchise: true,
    calls: true,
    messenger: true,
  },
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function parseSlackSettings(raw: unknown): SlackSettings {
  const value = (raw ?? {}) as Partial<SlackSettings>;
  const events = { ...DEFAULT_SLACK_SETTINGS.events };
  for (const key of SLACK_EVENTS) {
    const v = (value.events ?? {})[key];
    if (typeof v === "boolean") events[key] = v;
  }
  return {
    channelId: typeof value.channelId === "string" && value.channelId ? value.channelId : null,
    channelName: typeof value.channelName === "string" && value.channelName ? value.channelName : null,
    answerInChannel: typeof value.answerInChannel === "boolean" ? value.answerInChannel : true,
    channelMode: value.channelMode === "mention" ? "mention" : "all",
    events,
  };
}

export async function loadSlackSettings(): Promise<SlackSettings> {
  try {
    const db = await admin();
    const { data } = await db.from("business_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
    return parseSlackSettings(data?.value);
  } catch {
    return DEFAULT_SLACK_SETTINGS;
  }
}

export async function saveSlackSettings(patch: Partial<SlackSettings>): Promise<SlackSettings> {
  const current = await loadSlackSettings();
  const next = parseSlackSettings({
    ...current,
    ...patch,
    events: { ...current.events, ...(patch.events ?? {}) },
  });
  const db = await admin();
  const { error } = await db
    .from("business_settings")
    .upsert({ key: SETTINGS_KEY, value: next, is_public: false }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return next;
}

/* ------------------------------------------------------------------ */
/* Web API                                                             */
/* ------------------------------------------------------------------ */

export function slackConfigured(): boolean {
  return Boolean(process.env["SLACK_BOT_TOKEN"] && process.env["SLACK_SIGNING_SECRET"]);
}

type SlackResponse = Record<string, unknown> & { ok?: boolean; error?: string };

export async function slackApi(method: string, body?: Record<string, unknown>): Promise<SlackResponse> {
  const token = process.env["SLACK_BOT_TOKEN"];
  if (!token) throw new Error("SLACK_BOT_TOKEN is not configured");

  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body ?? {}),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Slack ${method} failed [${res.status}]: ${raw.slice(0, 300)}`);
  let parsed: SlackResponse;
  try {
    parsed = JSON.parse(raw) as SlackResponse;
  } catch {
    throw new Error(`Slack ${method} returned non-JSON: ${raw.slice(0, 200)}`);
  }
  if (!parsed.ok) throw new Error(`Slack ${method} error: ${parsed.error ?? "unknown"}`);
  return parsed;
}

export type SlackChannel = { id: string; name: string; is_member: boolean };

export async function listSlackChannels(): Promise<SlackChannel[]> {
  const out: SlackChannel[] = [];
  let cursor = "";
  do {
    const page = await slackApi("conversations.list", {
      limit: 200,
      exclude_archived: true,
      types: "public_channel,private_channel",
      ...(cursor ? { cursor } : {}),
    });
    for (const c of (page.channels ?? []) as Array<Record<string, unknown>>) {
      out.push({ id: String(c.id), name: String(c.name), is_member: Boolean(c.is_member) });
    }
    cursor = String(
      ((page.response_metadata ?? {}) as Record<string, unknown>)["next_cursor"] ?? "",
    );
  } while (cursor);
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function slackIdentity() {
  return slackApi("auth.test");
}

/* ------------------------------------------------------------------ */
/* Sending + logging                                                   */
/* ------------------------------------------------------------------ */

async function logSlackMessage(row: {
  channelId: string;
  threadTs?: string | null;
  ts?: string | null;
  kind: string;
  text: string;
  status: "sent" | "failed" | "skipped";
  error?: string | null;
  payload?: unknown;
}) {
  try {
    const db = await admin();
    await db.from("slack_messages").insert({
      channel_id: row.channelId,
      thread_ts: row.threadTs ?? null,
      ts: row.ts ?? null,
      kind: row.kind,
      text: row.text,
      status: row.status,
      error: row.error ?? null,
      payload: (row.payload ?? null) as never,
    } as never);
  } catch (e) {
    console.error("[slack] message log failed", e);
  }
}

export type SlackSendResult = { sent: boolean; ts?: string; reason?: string };

export async function postToSlack(args: {
  text: string;
  blocks?: unknown[];
  channelId?: string | null;
  threadTs?: string | null;
  kind?: string;
}): Promise<SlackSendResult> {
  const settings = await loadSlackSettings();
  const channelId = args.channelId ?? settings.channelId;
  const kind = args.kind ?? "notification";

  if (!slackConfigured()) return { sent: false, reason: "Slack is not connected" };
  if (!channelId) return { sent: false, reason: "No Slack channel selected" };

  try {
    const res = await slackApi("chat.postMessage", {
      channel: channelId,
      text: args.text,
      ...(args.blocks ? { blocks: args.blocks } : {}),
      ...(args.threadTs ? { thread_ts: args.threadTs } : {}),
      unfurl_links: false,
    });
    const ts = typeof res.ts === "string" ? res.ts : undefined;
    await logSlackMessage({
      channelId,
      threadTs: args.threadTs ?? null,
      ts: ts ?? null,
      kind,
      text: args.text,
      status: "sent",
      payload: args.blocks ?? null,
    });
    return { sent: true, ...(ts ? { ts } : {}) };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "Slack send failed";
    console.error("[slack] send failed", reason);
    await logSlackMessage({
      channelId,
      threadTs: args.threadTs ?? null,
      kind,
      text: args.text,
      status: "failed",
      error: reason,
    });
    return { sent: false, reason };
  }
}

/* ------------------------------------------------------------------ */
/* Notification cards                                                  */
/* ------------------------------------------------------------------ */

const SITE_URL = "https://magnoliamaids.pro";

export type NotifyCard = {
  emoji: string;
  title: string;
  headline: string;
  rows: Array<[string, string | null | undefined]>;
  adminPath?: string;
};

function buildBlocks(card: NotifyCard) {
  const fields = card.rows
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .slice(0, 10)
    .map(([label, value]) => ({
      type: "mrkdwn",
      text: `*${label}*\n${String(value).slice(0, 400)}`,
    }));

  const blocks: unknown[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `${card.emoji} *${card.title}*\n${card.headline}` },
    },
  ];
  if (fields.length) blocks.push({ type: "section", fields });
  if (card.adminPath) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `<${SITE_URL}${card.adminPath}|Open in the dashboard>` }],
    });
  }
  return blocks;
}

/**
 * Fire-and-forget notification into the team channel. Never throws — a Slack
 * problem must not break the form submission that triggered it.
 */
export async function notifySlack(kind: SlackEventKind, card: NotifyCard): Promise<SlackSendResult> {
  try {
    const settings = await loadSlackSettings();
    if (!settings.events[kind]) return { sent: false, reason: "event disabled" };
    return await postToSlack({
      text: `${card.emoji} ${card.title}: ${card.headline}`,
      blocks: buildBlocks(card),
      kind,
    });
  } catch (e) {
    console.error("[slack] notify failed", e);
    return { sent: false, reason: e instanceof Error ? e.message : "notify failed" };
  }
}

/** Safe to call from any request path: swallows everything. */
export function notifySlackSafe(kind: SlackEventKind, card: NotifyCard) {
  void notifySlack(kind, card).catch((e) => console.error("[slack] notify error", e));
}

export async function recentSlackMessages(limit = 50) {
  const db = await admin();
  const { data } = await db
    .from("slack_messages")
    .select("id, channel_id, thread_ts, kind, text, status, error, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Array<{
    id: string;
    channel_id: string;
    thread_ts: string | null;
    kind: string;
    text: string | null;
    status: string;
    error: string | null;
    created_at: string;
  }>;
}

export async function recentSlackEvents(limit = 50) {
  const db = await admin();
  const { data } = await db
    .from("slack_events")
    .select("id, event_id, event_type, channel_id, user_id, text, handled, error, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Array<{
    id: string;
    event_id: string;
    event_type: string | null;
    channel_id: string | null;
    user_id: string | null;
    text: string | null;
    handled: boolean;
    error: string | null;
    created_at: string;
  }>;
}
