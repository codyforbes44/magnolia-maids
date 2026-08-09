import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AGENTS } from "@/lib/agents";

const API = "https://api.elevenlabs.io/v1";

export { AGENTS } from "@/lib/agents";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

async function elevenGet(path: string, params: Record<string, string> = {}) {
  const key = process.env["ELEVENLABS_API_KEY"];
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { "xi-api-key": key } });
  const body = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 400)}`);
  return body ? JSON.parse(body) : {};
}

export type ConversationSummary = {
  conversationId: string;
  agentId: string;
  agentName: string;
  startedAt: number | null;
  durationSecs: number | null;
  messageCount: number | null;
  status: string | null;
  callSuccessful: string | null;
};

export const listConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { agentId?: string; cursor?: string; pageSize?: number }) =>
    z
      .object({
        agentId: z.string().optional(),
        cursor: z.string().optional(),
        pageSize: z.number().min(1).max(100).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const res = await elevenGet("/convai/conversations", {
      ...(data.agentId ? { agent_id: data.agentId } : {}),
      ...(data.cursor ? { cursor: data.cursor } : {}),
      page_size: String(data.pageSize ?? 30),
    });
    const items: ConversationSummary[] = (res.conversations ?? []).map((c: any) => ({
      conversationId: c.conversation_id,
      agentId: c.agent_id ?? "",
      agentName:
        AGENTS.find((a) => a.id === c.agent_id)?.name ?? c.agent_name ?? "Unknown agent",
      startedAt: c.start_time_unix_secs ? c.start_time_unix_secs * 1000 : null,
      durationSecs: c.call_duration_secs ?? null,
      messageCount: c.message_count ?? null,
      status: c.status ?? null,
      callSuccessful: c.call_successful ?? null,
    }));
    return {
      items,
      nextCursor: (res.next_cursor as string | null) ?? null,
      hasMore: Boolean(res.has_more),
    };
  });

export type ConversationTurn = {
  role: string;
  message: string | null;
  timeInCallSecs: number | null;
};

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { conversationId: string }) =>
    z.object({ conversationId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const res = await elevenGet(`/convai/conversations/${data.conversationId}`);
    const meta = res.metadata ?? {};
    const analysis = res.analysis ?? {};
    return {
      conversationId: res.conversation_id ?? data.conversationId,
      agentId: res.agent_id ?? "",
      agentName: AGENTS.find((a) => a.id === res.agent_id)?.name ?? "Unknown agent",
      status: res.status ?? null,
      startedAt: meta.start_time_unix_secs ? meta.start_time_unix_secs * 1000 : null,
      durationSecs: meta.call_duration_secs ?? null,
      callSuccessful: analysis.call_successful ?? null,
      summary: analysis.transcript_summary ?? null,
      transcript: (res.transcript ?? []).map(
        (t: any): ConversationTurn => ({
          role: t.role ?? "agent",
          message: t.message ?? null,
          timeInCallSecs: t.time_in_call_secs ?? null,
        }),
      ),
    };
  });
/* ------------------------------------------------------------------ *
 * Agent management
 * ------------------------------------------------------------------ */

export const getAgentConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { agentId: string }) =>
    z.object({ agentId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { fetchAgent } = await import("@/lib/elevenlabs-admin.server");
    return fetchAgent(data.agentId);
  });

export const updateAgentConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        agentId: z.string().min(1),
        name: z.string().optional(),
        firstMessage: z.string().optional(),
        systemPrompt: z.string().optional(),
        llm: z.string().optional(),
        temperature: z.number().optional(),
        voiceId: z.string().optional(),
        stability: z.number().optional(),
        speed: z.number().optional(),
        similarityBoost: z.number().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { patchAgent } = await import("@/lib/elevenlabs-admin.server");
    const { agentId, ...patch } = data;
    return patchAgent(agentId, patch);
  });

export const listVoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { fetchVoices } = await import("@/lib/elevenlabs-admin.server");
    return fetchVoices();
  });

export const listKnowledgeDocs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { fetchKnowledgeBase } = await import("@/lib/elevenlabs-admin.server");
    return fetchKnowledgeBase();
  });

export const removeKnowledgeDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { deleteKnowledgeDoc } = await import("@/lib/elevenlabs-admin.server");
    await deleteKnowledgeDoc(data.id);
    return { ok: true };
  });

export const setAgentKnowledgeDocs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ agentId: z.string().min(1), docIds: z.array(z.string()) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { setAgentKnowledge } = await import("@/lib/elevenlabs-admin.server");
    return setAgentKnowledge(data.agentId, data.docIds);
  });

export const getVoiceUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { fetchUsage } = await import("@/lib/elevenlabs-admin.server");
    return fetchUsage();
  });
