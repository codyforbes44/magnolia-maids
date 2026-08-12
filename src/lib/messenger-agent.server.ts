/**
 * Maggie in the Facebook Messenger inbox. Server-only: builds her prompt from
 * the same knowledge base the website chat and phone agent use, runs the tool
 * loop against the existing public agent endpoints (so pricing, availability
 * and booking logic can never drift), and sends replies through the Graph API.
 */
import { streamText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildAgentKnowledge } from "@/agents/knowledge";
import { FACEBOOK_PAGE_ID } from "@/lib/facebook-config";

const GRAPH = "https://graph.facebook.com/v21.0";
const MODEL = "google/gemini-2.5-flash";

/** Facebook only allows a Page reply within 24 hours of the last user message. */
export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Maggie hands off after this many replies in a row without you stepping in. */
export const MAX_AI_STREAK = 12;

export type ThreadRow = {
  thread_id: string;
  page_id: string;
  person_id: string | null;
  person_name: string;
  auto_reply: boolean;
  needs_attention: boolean;
  handoff_reason: string | null;
  snippet: string | null;
  ai_reply_streak: number;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  last_ai_reply_at: string | null;
};

export type StoredMessage = {
  sender: "customer" | "page" | "maggie";
  body: string;
  created_at: string;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ------------------------------------------------------------------ */
/* Settings + storage                                                  */
/* ------------------------------------------------------------------ */

export async function messengerAutoReplyEnabled(): Promise<boolean> {
  const db = await admin();
  const { data } = await db.from("business_settings").select("value").eq("key", "messenger_auto_reply").maybeSingle();
  const value = (data?.value ?? {}) as { enabled?: boolean };
  return Boolean(value.enabled);
}

export async function setMessengerAutoReplyEnabled(enabled: boolean) {
  const db = await admin();
  const { error } = await db
    .from("business_settings")
    .upsert({ key: "messenger_auto_reply", value: { enabled }, is_public: false }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return { enabled };
}

export async function getThread(threadId: string): Promise<ThreadRow | null> {
  const db = await admin();
  const { data } = await db.from("messenger_threads").select("*").eq("thread_id", threadId).maybeSingle();
  return (data as ThreadRow | null) ?? null;
}

export async function upsertThread(row: Partial<ThreadRow> & { thread_id: string; page_id: string }) {
  const db = await admin();
  const { error } = await db.from("messenger_threads").upsert(row as never, { onConflict: "thread_id" });
  if (error) console.error("[messenger] thread upsert failed", error.message);
}

export async function patchThread(threadId: string, patch: Partial<ThreadRow>) {
  const db = await admin();
  const { error } = await db.from("messenger_threads").update(patch as never).eq("thread_id", threadId);
  if (error) console.error("[messenger] thread update failed", error.message);
}

/** Returns false when this message id was already stored (duplicate webhook). */
export async function recordMessage(row: {
  threadId: string;
  pageId: string;
  mid?: string | null;
  sender: StoredMessage["sender"];
  body: string;
  attachments?: string[];
  createdAt?: string;
}): Promise<boolean> {
  const db = await admin();
  const { error } = await db.from("messenger_messages").insert({
    thread_id: row.threadId,
    page_id: row.pageId,
    mid: row.mid ?? null,
    sender: row.sender,
    body: row.body,
    attachments: row.attachments ?? [],
    ...(row.createdAt ? { created_at: row.createdAt } : {}),
  } as never);
  if (error) {
    // 23505 = duplicate mid, which just means Meta retried the webhook.
    if (error.code === "23505") return false;
    console.error("[messenger] message insert failed", error.message);
  }
  return true;
}

export async function loadHistory(threadId: string, limit = 30): Promise<StoredMessage[]> {
  const db = await admin();
  const { data } = await db
    .from("messenger_messages")
    .select("sender, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as StoredMessage[]).reverse();
}

/* ------------------------------------------------------------------ */
/* Graph helpers                                                       */
/* ------------------------------------------------------------------ */

export async function pageToken(pageId: string): Promise<string> {
  const db = await admin();
  const { data } = await db
    .from("facebook_connections")
    .select("page_access_token")
    .eq("page_id", pageId)
    .maybeSingle();
  if (!data?.page_access_token) throw new Error("Page not connected");
  return data.page_access_token;
}

export async function sendPageMessage(pageId: string, recipientId: string, text: string) {
  const token = await pageToken(pageId);
  const body = new URLSearchParams({
    recipient: JSON.stringify({ id: recipientId }),
    message: JSON.stringify({ text }),
    messaging_type: "RESPONSE",
  });
  const res = await fetch(`${GRAPH}/${pageId}/messages?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    body,
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Facebook ${res.status}: ${raw.slice(0, 300)}`);
  return raw ? JSON.parse(raw) : {};
}

/** Facebook profile name for a Messenger sender, best effort. */
export async function lookupPersonName(pageId: string, personId: string): Promise<string | null> {
  try {
    const token = await pageToken(pageId);
    const res = await fetch(
      `${GRAPH}/${personId}?fields=name,first_name,last_name&access_token=${encodeURIComponent(token)}`,
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { name?: string; first_name?: string };
    return body.name ?? body.first_name ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* The agent                                                           */
/* ------------------------------------------------------------------ */

const SYSTEM_RULES = `You are Maggie replying inside the Magnolia Maids Facebook Messenger inbox.

Channel rules:
- Write like a text message: 1-3 short sentences, warm, no markdown, no bullet lists, no headings, at most one emoji.
- Never claim to be a human. If asked, say you're Maggie, the Magnolia Maids virtual assistant, and offer to bring in a teammate.
- Never invent a price. Call get_quote before stating any total, and repeat its total exactly.
- Ask for approximate square footage before quoting.
- Once you know their name plus a phone number or email, call capture_lead so the team has their details.
- Only call book_appointment after check_availability confirms the day and window and the person has agreed to it. Never claim an appointment is booked unless book_appointment returned success.
- Call handoff_to_human when they ask for a person, are upset, mention a complaint, refund, damage, injury, legal or press matter, or ask something you cannot answer from the business facts. After that tool, tell them a teammate will follow up and stop.
- Ask at most one question per message.`;

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

export type AgentRun = { reply: string | null; handoff: string | null; error: string | null };

export async function runMaggie(args: {
  origin: string;
  personName: string;
  history: StoredMessage[];
}): Promise<AgentRun> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { reply: null, handoff: null, error: "LOVABLE_API_KEY is not set" };

  let handoff: string | null = null;
  const gateway = createLovableAiGatewayProvider(key);

  const tools = {
    get_quote: tool({
      description: "Authoritative price for a cleaning. Always call before stating any total.",
      inputSchema: z.object({
        service: z.string().describe("Service name, e.g. Standard Clean, Bright Clean, Deep Clean, Airbnb Turnover"),
        bedrooms: z.number(),
        bathrooms: z.number().describe("Decimal allowed, e.g. 2.5"),
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
        date: z.string().nullable().describe("YYYY-MM-DD to check one day, or null for the next open days"),
      }),
      execute: async (input) =>
        postJson(args.origin, "/api/public/agent/availability", {
          ...(input.service ? { service: input.service } : {}),
          ...(input.date ? { date: input.date } : {}),
        }),
    }),
    book_appointment: tool({
      description: "Book the cleaning. Only after the person confirmed the date and window.",
      inputSchema: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string().nullable(),
        address: z.string(),
        service: z.string(),
        frequency: z.string().nullable(),
        bedrooms: z.number(),
        bathrooms: z.number(),
        square_feet: z.number().nullable(),
        date: z.string().describe("YYYY-MM-DD"),
        slot: z.string().describe("morning, midday, afternoon, sat-morning or sat-midday"),
        notes: z.string().nullable(),
      }),
      execute: async (input) =>
        postJson(args.origin, "/api/public/agent/book", {
          name: input.name,
          email: input.email,
          ...(input.phone ? { phone: input.phone } : {}),
          address: input.address,
          service: input.service,
          frequency: input.frequency ?? "One-time",
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          ...(input.square_feet ? { square_feet: input.square_feet } : {}),
          date: input.date,
          slot: input.slot,
          notes: [input.notes, "Booked by Maggie in Facebook Messenger."].filter(Boolean).join(" — "),
        }),
    }),
    capture_lead: tool({
      description: "Save this person as a lead so the team can follow up.",
      inputSchema: z.object({
        name: z.string(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        home_size: z.string().nullable(),
        contact_pref: z
          .enum(["email", "text", "call", "messenger"])
          .nullable()
          .describe("How they said they want to be contacted back"),
        message: z.string().nullable().describe("What they're asking for"),
      }),
      execute: async (input) => {
        if (!input.email && !input.phone) {
          return { ok: false, error: "Need an email or phone number before saving the lead." };
        }
        try {
          const { saveContactSubmission } = await import("@/lib/returning-contact.server");
          const saved = await saveContactSubmission({
            table: "campaign_leads",
            email: input.email ?? `messenger-${Date.now()}@no-email.magnoliamaids.pro`,
            phone: input.phone ?? null,
            appendColumn: "message",
            source: "facebook messenger",
            summary: input.message ?? "Facebook Messenger conversation with Maggie",
            values: {
              campaign: "facebook-messenger",
              source: "facebook-messenger",
              name: input.name || args.personName,
              email: input.email ?? `messenger-${Date.now()}@no-email.magnoliamaids.pro`,
              phone: input.phone ?? null,
              home_size: input.home_size ?? null,
              message: [input.message, `Facebook profile: ${args.personName}`].filter(Boolean).join(" — "),
              status: "new",
              sms_consent: false,
              contact_pref: input.contact_pref ?? "messenger",
            },
          });
          return { ok: true, id: saved.id, returning: saved.returning };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Could not save the lead." };
        }
      },
    }),
    handoff_to_human: tool({
      description: "Flag this conversation for the Magnolia Maids team and stop auto-replying.",
      inputSchema: z.object({ reason: z.string() }),
      execute: async (input) => {
        handoff = input.reason;
        return { ok: true };
      },
    }),
  };

  try {
    const result = streamText({
      model: gateway(MODEL),
      system: `${SYSTEM_RULES}\n\nThe person you're messaging is "${args.personName}".\n\n${buildAgentKnowledge()}`,
      messages: args.history.map((m) => ({
        role: m.sender === "customer" ? ("user" as const) : ("assistant" as const),
        content: m.body,
      })),
      tools,
      stopWhen: stepCountIs(50),
    });
    const text = (await result.text).trim();
    return { reply: text || null, handoff, error: null };
  } catch (e) {
    console.error("[messenger] agent run failed", e);
    return { reply: null, handoff, error: e instanceof Error ? e.message : "Agent failed" };
  }
}

/* ------------------------------------------------------------------ */
/* Inbound webhook handling                                            */
/* ------------------------------------------------------------------ */

type MessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{ type?: string; payload?: { url?: string } }>;
  };
};

/**
 * Handles one Messenger webhook event: stores it, then lets Maggie answer when
 * auto-reply is on, the thread isn't paused, and we're inside the 24h window.
 */
export async function handleMessagingEvent(event: MessagingEvent, origin: string) {
  const pageId = String(event.recipient?.id ?? FACEBOOK_PAGE_ID);
  const senderId = String(event.sender?.id ?? "");
  if (!event.message || !senderId) return;

  const echo = Boolean(event.message.is_echo) || senderId === pageId;
  const personId = echo ? String(event.recipient?.id ?? "") : senderId;
  if (!personId || personId === pageId) return;

  // Meta's conversation id is not on the message event; the person id is the
  // stable key for a 1:1 Page thread, so we use it as the thread id.
  const threadId = personId;
  const text = event.message.text?.trim() ?? "";
  const attachments = (event.message.attachments ?? [])
    .map((a) => a.payload?.url ?? a.type ?? "")
    .filter(Boolean) as string[];
  const at = new Date(event.timestamp ?? Date.now()).toISOString();

  const existing = await getThread(threadId);
  if (!existing) {
    const name = (await lookupPersonName(pageId, personId)) ?? "Facebook user";
    await upsertThread({ thread_id: threadId, page_id: pageId, person_id: personId, person_name: name });
  }

  const fresh = await recordMessage({
    threadId,
    pageId,
    mid: event.message.mid ?? null,
    sender: echo ? "page" : "customer",
    body: text || (attachments.length ? "[attachment]" : ""),
    attachments,
    createdAt: at,
  });
  if (!fresh) return; // duplicate webhook delivery

  if (echo) {
    // A reply we sent from the Page (admin or Maggie). Manual replies from the
    // Facebook inbox pause Maggie so a human stays in control of that thread.
    const wasMaggie =
      existing?.last_ai_reply_at && Date.now() - new Date(existing.last_ai_reply_at).getTime() < 60_000;
    await patchThread(threadId, {
      snippet: text.slice(0, 160),
      last_outbound_at: at,
      ...(wasMaggie ? {} : { auto_reply: false, handoff_reason: "You replied from Facebook", ai_reply_streak: 0 }),
    });
    return;
  }

  await patchThread(threadId, { snippet: text.slice(0, 160), last_inbound_at: at, needs_attention: false });

  const thread = (await getThread(threadId))!;
  if (!thread.auto_reply) return;
  if (!(await messengerAutoReplyEnabled())) return;
  if (thread.ai_reply_streak >= MAX_AI_STREAK) {
    await patchThread(threadId, {
      auto_reply: false,
      needs_attention: true,
      handoff_reason: "Maggie hit her reply limit on this thread",
    });
    return;
  }
  if (Date.now() - new Date(at).getTime() > MESSAGING_WINDOW_MS) {
    await patchThread(threadId, { needs_attention: true, handoff_reason: "Outside Facebook's 24-hour reply window" });
    return;
  }

  const history = await loadHistory(threadId);
  const run = await runMaggie({ origin, personName: thread.person_name, history });

  if (run.error) {
    await patchThread(threadId, { needs_attention: true, handoff_reason: `Maggie could not reply: ${run.error}` });
    return;
  }

  if (run.reply) {
    try {
      await sendPageMessage(pageId, personId, run.reply);
      await recordMessage({ threadId, pageId, sender: "maggie", body: run.reply });
      await patchThread(threadId, {
        snippet: run.reply.slice(0, 160),
        last_outbound_at: new Date().toISOString(),
        last_ai_reply_at: new Date().toISOString(),
        ai_reply_streak: thread.ai_reply_streak + 1,
      });
      await notifyOwner(thread.person_name, history, run.reply);
    } catch (e) {
      await patchThread(threadId, {
        needs_attention: true,
        handoff_reason: `Send failed: ${e instanceof Error ? e.message : "unknown error"}`,
      });
      return;
    }
  }

  if (run.handoff) {
    await patchThread(threadId, { auto_reply: false, needs_attention: true, handoff_reason: run.handoff });
  }
}

async function notifyOwner(personName: string, history: StoredMessage[], reply: string) {
  try {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
    const { interactionNoticeEmail } = await import("@/lib/email/interaction-notice");
    const notice = interactionNoticeEmail({
      title: "Facebook Messenger",
      subject: `Maggie replied to ${personName} on Messenger`,
      emoji: "💬",
      rows: [
        ["Channel", "Facebook Messenger"],
        ["Person", personName],
        ["Replied at", new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })],
      ],
      transcript: [
        ...history.map((m) => ({ role: m.sender === "customer" ? "visitor" : "maggie", text: m.body })),
        { role: "maggie", text: reply },
      ],
    });
    await sendResendEmail({
      to: NOTIFY_EMAIL,
      subject: notice.subject,
      html: notice.html,
      kind: "messenger-autoreply",
    });
  } catch (e) {
    console.error("[messenger] owner notice failed", e);
  }
}