/** Server-only helpers for the ElevenLabs admin console.
 *  Kept out of *.functions.ts so the server-fn splitter can't strip them. */

const API = "https://api.elevenlabs.io/v1";

function key() {
  const k = process.env["ELEVENLABS_API_KEY"];
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set");
  return k;
}

export async function eleven(
  path: string,
  init: { method?: string; body?: unknown; params?: Record<string, string> } = {},
) {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(init.params ?? {})) if (v) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    method: init.method ?? "GET",
    headers: {
      "xi-api-key": key(),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

export type AgentConfig = {
  agentId: string;
  name: string;
  language: string | null;
  firstMessage: string;
  systemPrompt: string;
  llm: string | null;
  temperature: number | null;
  maxDurationSecs: number | null;
  voiceId: string | null;
  ttsModelId: string | null;
  stability: number | null;
  speed: number | null;
  similarityBoost: number | null;
  knowledgeBase: { id: string; name: string; type: string | null }[];
  tools: string[];
};

export async function fetchAgent(agentId: string): Promise<AgentConfig> {
  const res = await eleven(`/convai/agents/${agentId}`);
  const conv = res.conversation_config ?? {};
  const agent = conv.agent ?? {};
  const prompt = agent.prompt ?? {};
  const tts = conv.tts ?? {};
  return {
    agentId: res.agent_id ?? agentId,
    name: res.name ?? "",
    language: agent.language ?? null,
    firstMessage: agent.first_message ?? "",
    systemPrompt: prompt.prompt ?? "",
    llm: prompt.llm ?? null,
    temperature: typeof prompt.temperature === "number" ? prompt.temperature : null,
    maxDurationSecs: conv.conversation?.max_duration_seconds ?? null,
    voiceId: tts.voice_id ?? null,
    ttsModelId: tts.model_id ?? null,
    stability: typeof tts.stability === "number" ? tts.stability : null,
    speed: typeof tts.speed === "number" ? tts.speed : null,
    similarityBoost: typeof tts.similarity_boost === "number" ? tts.similarity_boost : null,
    knowledgeBase: (Array.isArray(prompt.knowledge_base) ? prompt.knowledge_base : []).map(
      (d: any) => ({ id: d.id, name: d.name ?? d.id, type: d.type ?? null }),
    ),
    tools: (Array.isArray(prompt.tool_ids) ? prompt.tool_ids : []).map(String),
  };
}

export type AgentPatch = {
  name?: string;
  firstMessage?: string;
  systemPrompt?: string;
  llm?: string;
  temperature?: number;
  voiceId?: string;
  stability?: number;
  speed?: number;
  similarityBoost?: number;
};

export async function patchAgent(agentId: string, patch: AgentPatch) {
  const current = await fetchAgent(agentId);
  const promptPatch: Record<string, unknown> = {};
  if (patch.systemPrompt !== undefined) promptPatch["prompt"] = patch.systemPrompt;
  if (patch.llm !== undefined) promptPatch["llm"] = patch.llm;
  if (patch.temperature !== undefined) promptPatch["temperature"] = patch.temperature;

  const agentPatch: Record<string, unknown> = {};
  if (patch.firstMessage !== undefined) agentPatch["first_message"] = patch.firstMessage;
  if (Object.keys(promptPatch).length) agentPatch["prompt"] = promptPatch;

  const ttsPatch: Record<string, unknown> = {};
  if (patch.voiceId !== undefined) ttsPatch["voice_id"] = patch.voiceId;
  if (patch.stability !== undefined) ttsPatch["stability"] = patch.stability;
  if (patch.speed !== undefined) ttsPatch["speed"] = patch.speed;
  if (patch.similarityBoost !== undefined) ttsPatch["similarity_boost"] = patch.similarityBoost;

  const conversation_config: Record<string, unknown> = {};
  if (Object.keys(agentPatch).length) conversation_config["agent"] = agentPatch;
  if (Object.keys(ttsPatch).length) conversation_config["tts"] = ttsPatch;

  const body: Record<string, unknown> = {};
  if (patch.name !== undefined && patch.name !== current.name) body["name"] = patch.name;
  if (Object.keys(conversation_config).length) body["conversation_config"] = conversation_config;
  if (!Object.keys(body).length) return current;

  await eleven(`/convai/agents/${agentId}`, { method: "PATCH", body });
  return fetchAgent(agentId);
}

export async function fetchVoices() {
  const res = await eleven("/voices");
  return (res.voices ?? []).map((v: any) => ({
    voiceId: v.voice_id as string,
    name: (v.name ?? v.voice_id) as string,
    category: (v.category ?? null) as string | null,
    previewUrl: (v.preview_url ?? null) as string | null,
  }));
}

export async function fetchKnowledgeBase() {
  const res = await eleven("/convai/knowledge-base", { params: { page_size: "100" } });
  return (res.documents ?? []).map((d: any) => ({
    id: d.id as string,
    name: (d.name ?? d.id) as string,
    type: (d.type ?? null) as string | null,
    createdAt: d.metadata?.created_at_unix_secs
      ? d.metadata.created_at_unix_secs * 1000
      : null,
    sizeBytes: (d.metadata?.size_bytes ?? null) as number | null,
    dependentAgents: Array.isArray(d.dependent_agents) ? d.dependent_agents.length : 0,
  }));
}

export async function deleteKnowledgeDoc(id: string) {
  await eleven(`/convai/knowledge-base/${id}`, { method: "DELETE" });
}

export async function fetchUsage() {
  const sub = await eleven("/user/subscription");
  return {
    tier: (sub.tier ?? null) as string | null,
    characterCount: (sub.character_count ?? null) as number | null,
    characterLimit: (sub.character_limit ?? null) as number | null,
    resetsAt: sub.next_character_count_reset_unix
      ? sub.next_character_count_reset_unix * 1000
      : null,
  };
}
