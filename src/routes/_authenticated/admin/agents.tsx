import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw, Save, Trash2, Bot, Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, StatCard, FieldGroup, inputClass, EmptyState } from "@/components/admin/ui";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  AGENTS,
  getAgentConfig,
  updateAgentConfig,
  listVoices,
  listKnowledgeDocs,
  removeKnowledgeDoc,
  setAgentKnowledgeDocs,
  getVoiceUsage,
} from "@/lib/elevenlabs.functions";
import { runContentSyncNow } from "@/lib/content-sync.functions";

export const Route = createFileRoute("/_authenticated/admin/agents")({
  head: () => ({
    meta: [
      { title: "Admin — Voice agents | Magnolia Maids" },
      {
        name: "description",
        content: "Manage Maggie's voice agents, prompts, voices, and knowledge base.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgentsPage,
});

type Config = Awaited<ReturnType<typeof getAgentConfig>>;
type Voice = Awaited<ReturnType<typeof listVoices>>[number];
type Doc = Awaited<ReturnType<typeof listKnowledgeDocs>>[number];

const LLMS = ["gemini-2.0-flash", "gemini-2.5-flash", "gpt-4o-mini", "gpt-4o", "claude-3-5-sonnet"];

function fmtBytes(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function btn(kind: "solid" | "ghost" = "ghost") {
  return kind === "solid"
    ? "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
    : "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold transition hover:bg-secondary disabled:opacity-40";
}

function AgentsPage() {
  const fetchConfig = useServerFn(getAgentConfig);
  const saveConfig = useServerFn(updateAgentConfig);
  const fetchVoices = useServerFn(listVoices);
  const fetchDocs = useServerFn(listKnowledgeDocs);
  const deleteDoc = useServerFn(removeKnowledgeDoc);
  const attachDocs = useServerFn(setAgentKnowledgeDocs);
  const fetchUsage = useServerFn(getVoiceUsage);
  const syncNow = useServerFn(runContentSyncNow);
  const { isAdmin } = useIsAdmin();
  const canEdit = isAdmin === true;

  const [agentId, setAgentId] = useState<string>(AGENTS[0].id);
  const [config, setConfig] = useState<Config | null>(null);
  const [draft, setDraft] = useState<Partial<Config>>({});
  const [voices, setVoices] = useState<Voice[]>([]);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [usage, setUsage] = useState<Awaited<ReturnType<typeof getVoiceUsage>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgent = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const cfg = await fetchConfig({ data: { agentId: id } });
        setConfig(cfg);
        setDraft(cfg);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load agent");
        setConfig(null);
      } finally {
        setLoading(false);
      }
    },
    [fetchConfig],
  );

  useEffect(() => {
    void loadAgent(agentId);
  }, [agentId, loadAgent]);

  const loadSide = useCallback(async () => {
    try {
      const [v, d, u] = await Promise.all([fetchVoices(), fetchDocs(), fetchUsage()]);
      setVoices(v);
      setDocs(d);
      setUsage(u);
    } catch {
      setDocs([]);
    }
  }, [fetchVoices, fetchDocs, fetchUsage]);

  useEffect(() => {
    void loadSide();
  }, [loadSide]);

  const set = <K extends keyof Config>(k: K, v: Config[K]) =>
    setDraft((prev) => ({ ...prev, [k]: v }));

  const dirty =
    !!config &&
    (["name", "firstMessage", "systemPrompt", "llm", "temperature", "voiceId", "stability", "speed", "similarityBoost"] as const).some(
      (k) => draft[k] !== config[k],
    );

  async function handleSave() {
    if (!config || !canEdit) return;
    setSaving(true);
    try {
      const next = await saveConfig({
        data: {
          agentId: config.agentId,
          ...(draft.name !== config.name ? { name: draft.name ?? "" } : {}),
          ...(draft.firstMessage !== config.firstMessage
            ? { firstMessage: draft.firstMessage ?? "" }
            : {}),
          ...(draft.systemPrompt !== config.systemPrompt
            ? { systemPrompt: draft.systemPrompt ?? "" }
            : {}),
          ...(draft.llm && draft.llm !== config.llm ? { llm: draft.llm } : {}),
          ...(typeof draft.temperature === "number" && draft.temperature !== config.temperature
            ? { temperature: draft.temperature }
            : {}),
          ...(draft.voiceId && draft.voiceId !== config.voiceId ? { voiceId: draft.voiceId } : {}),
          ...(typeof draft.stability === "number" && draft.stability !== config.stability
            ? { stability: draft.stability }
            : {}),
          ...(typeof draft.speed === "number" && draft.speed !== config.speed
            ? { speed: draft.speed }
            : {}),
          ...(typeof draft.similarityBoost === "number" &&
          draft.similarityBoost !== config.similarityBoost
            ? { similarityBoost: draft.similarityBoost }
            : {}),
        },
      });
      setConfig(next);
      setDraft(next);
      toast.success("Agent updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDoc(id: string, on: boolean) {
    if (!config || !canEdit) return;
    const current = config.knowledgeBase.map((d) => d.id);
    const nextIds = on ? [...new Set([...current, id])] : current.filter((x) => x !== id);
    try {
      const next = await attachDocs({ data: { agentId: config.agentId, docIds: nextIds } });
      setConfig(next);
      setDraft((p) => ({ ...p, knowledgeBase: next.knowledgeBase }));
      toast.success(on ? "Document attached" : "Document detached");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update knowledge base");
    }
  }

  async function handleDeleteDoc(id: string, name: string) {
    if (!canEdit) return;
    if (!window.confirm(`Delete "${name}" from the knowledge base?`)) return;
    try {
      await deleteDoc({ data: { id } });
      setDocs((prev) => (prev ?? []).filter((d) => d.id !== id));
      toast.success("Document deleted");
      void loadAgent(agentId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleSync() {
    if (!canEdit) return;
    setSyncing(true);
    const id = toast.loading("Rebuilding knowledge base from live site…");
    try {
      const res = await syncNow();
      toast.success(
        `Sync ${res.status} — ${res.agents_updated}/${res.agents_total} agents refreshed`,
        { id },
      );
      await Promise.all([loadSide(), loadAgent(agentId)]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed", { id });
    } finally {
      setSyncing(false);
    }
  }

  const attached = new Set((config?.knowledgeBase ?? []).map((d) => d.id));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Voice agents"
        description="Maggie's ElevenLabs agents — prompts, voices, knowledge base, and usage."
        actions={
          <>
            <button className={btn()} onClick={() => void loadAgent(agentId)} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              className={btn("solid")}
              onClick={() => void handleSync()}
              disabled={syncing || !canEdit}
              title={canEdit ? undefined : "Admin role required"}
            >
              <Sparkles className="h-3.5 w-3.5" /> Sync knowledge base
            </button>
          </>
        }
      />

      {isAdmin === false && (
        <p className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Read-only view.</span> Editing agents,
          syncing the knowledge base, and deleting documents require an admin role. Ask an existing
          admin to grant access from the Team page.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Agents" value={AGENTS.length} hint="Connected assistants" />
        <StatCard
          label="Knowledge docs"
          value={docs === null ? "…" : docs.length}
          hint="Shared across agents"
        />
        <StatCard
          label="Characters used"
          value={
            usage?.characterCount != null
              ? `${usage.characterCount.toLocaleString()}${usage.characterLimit ? ` / ${usage.characterLimit.toLocaleString()}` : ""}`
              : "—"
          }
          hint={usage?.tier ? `Plan: ${usage.tier}` : undefined}
          tone="accent"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {AGENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAgentId(a.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              agentId === a.id
                ? "border-laurel bg-laurel/10 text-laurel"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Bot className="h-3.5 w-3.5" /> {a.name}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && !config ? (
        <p className="text-sm text-muted-foreground">Loading agent configuration…</p>
      ) : !config ? (
        <EmptyState title="Agent unavailable" hint="Check the ElevenLabs API key and agent id." />
      ) : (
        <fieldset
          disabled={!canEdit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] disabled:opacity-90"
        >
          <div className="space-y-6">
            <SectionCard title="Conversation" description="How this agent greets and behaves.">
              <div className="space-y-4">
                <FieldGroup label="Display name">
                  <input
                    className={inputClass}
                    value={draft.name ?? ""}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="First message">
                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    value={draft.firstMessage ?? ""}
                    onChange={(e) => set("firstMessage", e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="System prompt">
                  <textarea
                    className={`${inputClass} min-h-[280px] font-mono text-xs`}
                    value={draft.systemPrompt ?? ""}
                    onChange={(e) => set("systemPrompt", e.target.value)}
                  />
                </FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label="Model">
                    <select
                      className={inputClass}
                      value={draft.llm ?? ""}
                      onChange={(e) => set("llm", e.target.value)}
                    >
                      {[...new Set([draft.llm ?? "", ...LLMS])]
                        .filter(Boolean)
                        .map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                    </select>
                  </FieldGroup>
                  <FieldGroup label={`Temperature — ${(draft.temperature ?? 0).toFixed(2)}`}>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={draft.temperature ?? 0}
                      onChange={(e) => set("temperature", Number(e.target.value))}
                      className="w-full accent-[hsl(var(--laurel,140_20%_35%))]"
                    />
                  </FieldGroup>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Voice" description="Delivery settings for spoken replies.">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Voice">
                  <select
                    className={inputClass}
                    value={draft.voiceId ?? ""}
                    onChange={(e) => set("voiceId", e.target.value)}
                  >
                    {draft.voiceId && !voices.some((v) => v.voiceId === draft.voiceId) && (
                      <option value={draft.voiceId}>{draft.voiceId} (current)</option>
                    )}
                    {voices.map((v) => (
                      <option key={v.voiceId} value={v.voiceId}>
                        {v.name}
                        {v.category ? ` · ${v.category}` : ""}
                      </option>
                    ))}
                  </select>
                </FieldGroup>
                <FieldGroup label={`Stability — ${(draft.stability ?? 0).toFixed(2)}`}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={draft.stability ?? 0}
                    onChange={(e) => set("stability", Number(e.target.value))}
                    className="w-full"
                  />
                </FieldGroup>
                <FieldGroup label={`Similarity — ${(draft.similarityBoost ?? 0).toFixed(2)}`}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={draft.similarityBoost ?? 0}
                    onChange={(e) => set("similarityBoost", Number(e.target.value))}
                    className="w-full"
                  />
                </FieldGroup>
                <FieldGroup label={`Speed — ${(draft.speed ?? 1).toFixed(2)}x`}>
                  <input
                    type="range"
                    min={0.7}
                    max={1.2}
                    step={0.05}
                    value={draft.speed ?? 1}
                    onChange={(e) => set("speed", Number(e.target.value))}
                    className="w-full"
                  />
                </FieldGroup>
              </div>
              {(() => {
                const preview = voices.find((v) => v.voiceId === draft.voiceId)?.previewUrl;
                return preview ? (
                  <audio controls src={preview} className="mt-4 w-full" preload="none" />
                ) : null;
              })()}
            </SectionCard>

            <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/95 p-4 backdrop-blur">
              <button
                className={btn("solid")}
                onClick={() => void handleSave()}
                disabled={!dirty || saving}
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                className={btn()}
                onClick={() => config && setDraft(config)}
                disabled={!dirty || saving}
              >
                Discard
              </button>
              <span className="text-xs text-muted-foreground">
                {dirty ? "Unsaved changes" : "Everything is in sync with ElevenLabs"}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <SectionCard
              title="Knowledge base"
              description="Attach the documents this agent can quote from."
            >
              {docs === null ? (
                <p className="text-sm text-muted-foreground">Loading documents…</p>
              ) : docs.length === 0 ? (
                <EmptyState
                  title="No documents"
                  hint="Run a knowledge base sync to publish the live site content."
                />
              ) : (
                <ul className="space-y-2">
                  {docs.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-start gap-3 rounded-xl border border-border/60 p-3"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={attached.has(d.id)}
                        onChange={(e) => void toggleDoc(d.id, e.target.checked)}
                        aria-label={`Attach ${d.name}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.type ?? "text"} · {fmtBytes(d.sizeBytes)}
                          {d.createdAt ? ` · ${new Date(d.createdAt).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Delete ${d.name}`}
                        onClick={() => void handleDeleteDoc(d.id, d.name)}
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Agent details">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Agent ID</dt>
                  <dd className="truncate font-mono text-xs">{config.agentId}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Language</dt>
                  <dd>{config.language ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Docs attached</dt>
                  <dd>{config.knowledgeBase.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Tools</dt>
                  <dd>{config.tools.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Max call length</dt>
                  <dd>
                    {config.maxDurationSecs
                      ? `${Math.round(config.maxDurationSecs / 60)} min`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </SectionCard>
          </div>
        </fieldset>
      )}
    </div>
  );
}
