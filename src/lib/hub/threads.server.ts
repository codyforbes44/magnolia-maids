/**
 * Unified conversation store for the communications hub. Every channel (text,
 * email, website chat, Messenger, Slack, calls) writes here so one person's
 * history reads as a single thread no matter how they reached us.
 */
export type HubChannel = "sms" | "email" | "chat" | "messenger" | "slack" | "call";

export type RecordMessageInput = {
  channel: HubChannel;
  direction: "in" | "out";
  /** Stable identity for the person on this channel (phone, email, thread id). */
  contactKey: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  externalId?: string | null;
  body: string;
  subject?: string | null;
  status?: string;
  providerId?: string | null;
  error?: string | null;
  author?: string | null;
  relatedId?: string | null;
  createdAt?: string;
};

/** Never throws — messaging must not fail because logging did. */
export async function recordMessage(input: RecordMessageInput) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const key = input.contactKey.trim();
    if (!key) return;
    const at = input.createdAt ?? new Date().toISOString();
    const snippet = (input.body || input.subject || "").slice(0, 200);

    const { data: existing } = await supabaseAdmin
      .from("message_threads")
      .select("id, unread, contact_name")
      .eq("channel", input.channel)
      .eq("contact_key", key)
      .maybeSingle();

    let threadId = existing?.id ?? null;

    if (threadId) {
      await supabaseAdmin
        .from("message_threads")
        .update({
          contact_name: input.contactName ?? existing?.contact_name ?? null,
          phone: input.phone ?? null,
          email: input.email ?? null,
          external_id: input.externalId ?? null,
          last_snippet: snippet,
          last_direction: input.direction,
          last_message_at: at,
          unread:
            input.direction === "in" ? (existing?.unread ?? 0) + 1 : (existing?.unread ?? 0),
        })
        .eq("id", threadId);
    } else {
      const { data: created } = await supabaseAdmin
        .from("message_threads")
        .insert({
          channel: input.channel,
          contact_key: key,
          contact_name: input.contactName ?? null,
          phone: input.phone ?? null,
          email: input.email ?? null,
          external_id: input.externalId ?? null,
          last_snippet: snippet,
          last_direction: input.direction,
          last_message_at: at,
          unread: input.direction === "in" ? 1 : 0,
        })
        .select("id")
        .maybeSingle();
      threadId = created?.id ?? null;
    }

    if (!threadId) return;

    await supabaseAdmin.from("messages").insert({
      thread_id: threadId,
      channel: input.channel,
      direction: input.direction,
      body: input.body ?? "",
      subject: input.subject ?? null,
      status: input.status ?? "sent",
      provider_id: input.providerId ?? null,
      error: input.error ?? null,
      author: input.author ?? null,
      related_id: input.relatedId ?? null,
      created_at: at,
    });
  } catch (e) {
    console.error("[hub] recordMessage failed", e);
  }
}
