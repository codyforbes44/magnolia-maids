/**
 * Maggie inside Slack. Server-only.
 *
 * Same brain as the website chat, the phone agent and the Messenger inbox:
 * the knowledge base plus the live pricing/availability/booking endpoints, so
 * numbers can never drift. Slack-specific extras let the team look records up
 * and put Maggie on a follow-up without leaving the channel.
 */
import { streamText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildAgentKnowledge } from "@/agents/knowledge";
import { slackApi, postToSlack, loadSlackSettings } from "@/lib/slack.server";

const MODEL = "google/gemini-2.5-flash";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const SYSTEM_RULES = `You are Maggie, the Magnolia Maids assistant, talking with the Magnolia Maids team inside their private Slack channel.

Channel rules:
- You are talking to coworkers, not customers. Be direct and useful, short paragraphs, light Slack markdown (*bold*, bullet lines) and at most one emoji.
- Never invent a price. Call get_quote before stating any total and repeat its numbers exactly.
- Use lookup_record when someone asks about a specific person, lead, applicant, or booking.
- Use list_schedule for "what's on today/this week".
- engage_contact actually sends a real message to a real customer. Only call it with confirmed=true after the teammate has clearly approved sending in this conversation. If they have not, call it with confirmed=false first and repeat back exactly who you would contact and on what channel.
- If you don't know something, say so plainly instead of guessing.
- Keep replies under about 120 words unless asked for detail.`;

async function postJson(origin: string, path: string, payload: unknown) {
  const res = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { ok: false, error: text.slice(0, 300) };
  }
}

const LOOKUP_TABLES = {
  lead: { table: "campaign_leads", select: "id,name,email,phone,contact_pref,campaign,home_size,message,status,created_at", nameCol: "name" },
  booking: { table: "booking_requests", select: "id,name,email,phone,contact_pref,service,frequency,bedrooms,bathrooms,address,preferred_day,preferred_time,status,created_at", nameCol: "name" },
  applicant: { table: "job_applications", select: "id,name,email,phone,contact_pref,role,area,availability,status,created_at", nameCol: "name" },
  property: { table: "property_inquiries", select: "id,contact_name,email,phone,contact_pref,property_name,total_units,turns_per_month,status,created_at", nameCol: "contact_name" },
  franchise: { table: "franchise_inquiries", select: "id,name,email,phone,contact_pref,target_city,target_state,timeline,status,created_at", nameCol: "name" },
} as const;

export type SlackAgentRun = { reply: string | null; error: string | null };

export async function runMaggieInSlack(args: {
  origin: string;
  history: Array<{ role: "user" | "assistant"; text: string; who?: string }>;
}): Promise<SlackAgentRun> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { reply: null, error: "LOVABLE_API_KEY is not set" };

  const gateway = createLovableAiGatewayProvider(key);

  const tools = {
    get_quote: tool({
      description: "Authoritative price for a cleaning. Always call before stating any total.",
      inputSchema: z.object({
        service: z.string().describe("Standard Clean, Bright Clean, Deep Clean, Airbnb Turnover, Move-Out"),
        bedrooms: z.number(),
        bathrooms: z.number(),
        square_feet: z.number().nullable(),
        frequency: z.string().nullable().describe("One-time, Monthly, Biweekly, or Weekly"),
      }),
      execute: async (input) => {
        const params = new URLSearchParams({
          service: input.service,
          bedrooms: String(input.bedrooms),
          bathrooms: String(input.bathrooms),
        });
        if (input.square_feet) params.set("square_feet", String(input.square_feet));
        if (input.frequency) params.set("frequency", input.frequency);
        const res = await fetch(`${args.origin}/api/public/quote?${params}`);
        const text = await res.text();
        try {
          return text ? JSON.parse(text) : { ok: false };
        } catch {
          return { ok: false, error: "Quote service unavailable." };
        }
      },
    }),

    check_availability: tool({
      description: "Open cleaning days and time windows.",
      inputSchema: z.object({
        service: z.string().nullable(),
        date: z.string().nullable().describe("YYYY-MM-DD for one day, or null for the next open days"),
      }),
      execute: async (input) =>
        postJson(args.origin, "/api/public/agent/availability", {
          ...(input.service ? { service: input.service } : {}),
          ...(input.date ? { date: input.date } : {}),
        }),
    }),

    lookup_record: tool({
      description: "Find a lead, booking, applicant, property or franchise record by name, phone or email.",
      inputSchema: z.object({
        kind: z.enum(["lead", "booking", "applicant", "property", "franchise"]),
        query: z.string().describe("Name, phone number, or email to search for"),
      }),
      execute: async (input) => {
        try {
          const db = await admin();
          const cfg = LOOKUP_TABLES[input.kind];
          const q = input.query.trim();
          const like = `%${q}%`;
          const { data, error } = await db
            .from(cfg.table)
            .select(cfg.select)
            .or(`${cfg.nameCol}.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
            .order("created_at", { ascending: false })
            .limit(5);
          if (error) return { ok: false, error: error.message };
          return { ok: true, count: (data ?? []).length, records: data ?? [] };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Lookup failed" };
        }
      },
    }),

    list_schedule: tool({
      description: "Upcoming booking requests, soonest first.",
      inputSchema: z.object({ days: z.number().nullable().describe("How many days ahead, default 7") }),
      execute: async (input) => {
        try {
          const db = await admin();
          const { data, error } = await db
            .from("booking_requests")
            .select("id,name,service,preferred_day,preferred_time,address,status")
            .order("preferred_day", { ascending: true })
            .limit(input.days && input.days > 7 ? 40 : 20);
          if (error) return { ok: false, error: error.message };
          return { ok: true, bookings: data ?? [] };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Schedule lookup failed" };
        }
      },
    }),

    engage_contact: tool({
      description:
        "Have Maggie draft and SEND a real follow-up to a contact on their preferred channel. Requires explicit approval from the teammate first.",
      inputSchema: z.object({
        source: z.enum([
          "campaign_leads",
          "booking_requests",
          "job_applications",
          "property_inquiries",
          "franchise_inquiries",
        ]),
        id: z.string().describe("The record id from lookup_record"),
        channel: z.enum(["auto", "email", "text", "call"]),
        instruction: z.string().nullable().describe("What the message should say"),
        confirmed: z.boolean().describe("True only when the teammate explicitly approved sending"),
      }),
      execute: async (input) => {
        if (!input.confirmed) {
          return { ok: false, needs_confirmation: true, note: "Ask the teammate to confirm before sending." };
        }
        try {
          const { engageRecord } = await import("@/lib/maggie-engage.server");
          const res = await engageRecord({
            source: input.source,
            id: input.id,
            channel: input.channel,
            ...(input.instruction ? { instruction: input.instruction } : {}),
            by: "Slack",
          });
          return { ok: res.sent, channel: res.channel, reason: res.reason ?? null };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Could not reach out." };
        }
      },
    }),
  };

  try {
    const result = streamText({
      model: gateway(MODEL),
      system: `${SYSTEM_RULES}\n\nToday is ${new Date().toLocaleDateString("en-US", { timeZone: "America/Chicago", dateStyle: "full" })}.\n\n${buildAgentKnowledge()}`,
      messages: args.history.map((m) => ({
        role: m.role,
        content: m.who && m.role === "user" ? `${m.who}: ${m.text}` : m.text,
      })),
      tools,
      stopWhen: stepCountIs(50),
    });
    const text = (await result.text).trim();
    return { reply: text || null, error: null };
  } catch (e) {
    console.error("[slack-agent] run failed", e);
    return { reply: null, error: e instanceof Error ? e.message : "Agent failed" };
  }
}

/* ------------------------------------------------------------------ */
/* Event handling                                                      */
/* ------------------------------------------------------------------ */

type SlackEvent = {
  type?: string;
  subtype?: string;
  channel?: string;
  channel_type?: string;
  user?: string;
  bot_id?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
};

/** Records the event id; returns false when we've already seen it. */
export async function claimSlackEvent(row: {
  eventId: string;
  teamId?: string;
  event: SlackEvent;
}): Promise<boolean> {
  try {
    const db = await admin();
    const { error } = await db.from("slack_events").insert({
      event_id: row.eventId,
      team_id: row.teamId ?? null,
      channel_id: row.event.channel ?? null,
      user_id: row.event.user ?? null,
      event_type: row.event.type ?? null,
      thread_ts: row.event.thread_ts ?? null,
      ts: row.event.ts ?? null,
      text: row.event.text ?? null,
    } as never);
    if (error) {
      if (error.code === "23505") return false; // Slack retried
      console.error("[slack] event insert failed", error.message);
    }
    return true;
  } catch (e) {
    console.error("[slack] event claim failed", e);
    return true;
  }
}

async function markEvent(eventId: string, patch: { handled?: boolean; error?: string | null }) {
  try {
    const db = await admin();
    await db.from("slack_events").update(patch as never).eq("event_id", eventId);
  } catch {
    /* logging only */
  }
}

function stripMention(text: string) {
  return text.replace(/<@[A-Z0-9]+>/g, "").trim();
}

async function threadHistory(channel: string, threadTs: string, selfId: string | null) {
  try {
    const res = await slackApi("conversations.replies", { channel, ts: threadTs, limit: 30 });
    const messages = (res.messages ?? []) as Array<Record<string, unknown>>;
    return messages
      .map((m) => {
        const text = stripMention(String(m.text ?? ""));
        if (!text) return null;
        const isSelf = Boolean(m.bot_id) || (selfId && m.user === selfId);
        return { role: isSelf ? ("assistant" as const) : ("user" as const), text };
      })
      .filter(Boolean) as Array<{ role: "user" | "assistant"; text: string }>;
  } catch {
    return [];
  }
}

/**
 * Handles one Slack Events API callback: answers in a thread when the message
 * is a mention in the configured channel, or any DM to the bot.
 */
export async function handleSlackEvent(args: {
  eventId: string;
  teamId?: string;
  event: SlackEvent;
  origin: string;
  selfUserId?: string | null;
}) {
  const { event, eventId } = args;
  if (event.bot_id || event.subtype === "bot_message" || !event.user) return;
  if (event.type !== "app_mention" && event.type !== "message") return;

  const text = stripMention(event.text ?? "");
  if (!text) return;

  const settings = await loadSlackSettings();
  const isDm = event.channel_type === "im";
  const isMention = event.type === "app_mention";
  if (!isDm && !isMention) return;
  if (!isDm && settings.channelId && event.channel !== settings.channelId) return;
  if (!settings.answerInChannel) return;

  const fresh = await claimSlackEvent({ eventId, ...(args.teamId ? { teamId: args.teamId } : {}), event });
  if (!fresh) return;

  const threadTs = event.thread_ts ?? event.ts ?? null;
  const history = threadTs
    ? await threadHistory(event.channel!, threadTs, args.selfUserId ?? null)
    : [];
  if (!history.length) history.push({ role: "user", text });

  const run = await runMaggieInSlack({ origin: args.origin, history });

  if (run.error || !run.reply) {
    await postToSlack({
      text: `I couldn't answer that one${run.error ? `: ${run.error}` : "."}`,
      channelId: event.channel ?? null,
      threadTs,
      kind: "reply-error",
    });
    await markEvent(eventId, { handled: false, error: run.error ?? "no reply" });
    return;
  }

  await postToSlack({
    text: run.reply,
    channelId: event.channel ?? null,
    threadTs,
    kind: "reply",
  });
  await markEvent(eventId, { handled: true, error: null });
}
