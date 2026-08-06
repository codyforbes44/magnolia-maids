import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { EmptyState, SectionCard, inputClass } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({
    meta: [
      { title: "Admin — Content | Magnolia Maids" },
      { name: "description", content: "Edit page copy, FAQs, and campaign landing page content." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentPage,
});

type Block = { id: string; scope: string; key: string; value: unknown; updated_at: string };
type CampaignBlock = { campaign: string; value: unknown; active: boolean };

function ContentPage() {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignBlock[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    const [b, c] = await Promise.all([
      supabase.from("site_content").select("*").order("scope").order("key"),
      supabase.from("campaign_content").select("campaign, value, active").order("campaign"),
    ]);
    if (b.error || c.error) {
      setError(b.error?.message ?? c.error?.message ?? null);
      return;
    }
    setBlocks(b.data as Block[]);
    setCampaigns(c.data as CampaignBlock[]);
  }

  useEffect(() => {
    load();
  }, []);

  function flash(msg: string) {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2500);
  }

  function parse(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  async function saveBlock(id: string, raw: string) {
    const value = parse(raw);
    const { error } = await supabase.from("site_content").update({ value }).eq("id", id);
    if (error) return setError(error.message);
    setBlocks((prev) => prev?.map((b) => (b.id === id ? { ...b, value } : b)) ?? null);
    flash("Content saved.");
  }

  async function addBlock() {
    const scope = window.prompt("Page or section (e.g. home, services, faq)");
    if (!scope) return;
    const key = window.prompt("Block key (e.g. hero_headline)");
    if (!key) return;
    const { error } = await supabase.from("site_content").insert({ scope, key, value: "" });
    if (error) return setError(error.message);
    await load();
  }

  async function deleteBlock(id: string) {
    if (!window.confirm("Delete this content block?")) return;
    const { error } = await supabase.from("site_content").delete().eq("id", id);
    if (error) return setError(error.message);
    setBlocks((prev) => prev?.filter((b) => b.id !== id) ?? null);
  }

  async function toggleCampaign(campaign: string, active: boolean) {
    const { error } = await supabase.from("campaign_content").update({ active }).eq("campaign", campaign);
    if (error) return setError(error.message);
    setCampaigns((prev) => prev?.map((c) => (c.campaign === campaign ? { ...c, active } : c)) ?? null);
    flash("Campaign updated.");
  }

  async function saveCampaign(campaign: string, raw: string) {
    const value = parse(raw);
    const { error } = await supabase.from("campaign_content").update({ value }).eq("campaign", campaign);
    if (error) return setError(error.message);
    setCampaigns((prev) => prev?.map((c) => (c.campaign === campaign ? { ...c, value } : c)) ?? null);
    flash("Campaign content saved.");
  }

  const scopes = Array.from(new Set(blocks?.map((b) => b.scope) ?? []));

  return (
    <>
      <AdminPageHeader
        title="Content"
        description="Overrides for page copy, FAQs, and campaign landing pages. Plain text or JSON."
        actions={
          <button
            onClick={addBlock}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            New content block
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {status && (
        <div className="mb-4 rounded-xl border border-laurel/40 bg-laurel/5 p-3 text-sm text-laurel">
          {status}
        </div>
      )}

      <div className="space-y-6">
        {!blocks ? (
          <p className="text-sm text-muted-foreground">Loading content…</p>
        ) : !blocks.length ? (
          <EmptyState
            title="No content overrides yet"
            hint="Add a block to override copy without a code change."
          />
        ) : (
          scopes.map((scope) => (
            <SectionCard key={scope} title={scope} description="Blocks for this page or section.">
              <ul className="space-y-4">
                {blocks
                  .filter((b) => b.scope === scope)
                  .map((b) => (
                    <li key={b.id}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs font-semibold">{b.key}</span>
                        <button
                          onClick={() => deleteBlock(b.id)}
                          className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        defaultValue={
                          typeof b.value === "string" ? b.value : JSON.stringify(b.value, null, 2)
                        }
                        onBlur={(e) => saveBlock(b.id, e.target.value)}
                        className={`${inputClass} mt-1.5 font-mono text-xs`}
                      />
                    </li>
                  ))}
              </ul>
            </SectionCard>
          ))
        )}

        <SectionCard
          title="Campaign landing pages"
          description="Turn seasonal campaigns on or off and edit their offer copy."
        >
          {!campaigns ? (
            <p className="text-sm text-muted-foreground">Loading campaigns…</p>
          ) : !campaigns.length ? (
            <EmptyState
              title="No campaign overrides"
              hint="Summer on the Lake, Referral Week, and Holiday Ready currently use their built-in copy."
            />
          ) : (
            <ul className="space-y-4">
              {campaigns.map((c) => (
                <li key={c.campaign}>
                  <label className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{c.campaign}</span>
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={c.active}
                        onChange={(e) => toggleCampaign(c.campaign, e.target.checked)}
                        className="h-4 w-4"
                      />
                      Live
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={
                      typeof c.value === "string" ? c.value : JSON.stringify(c.value, null, 2)
                    }
                    onBlur={(e) => saveCampaign(c.campaign, e.target.value)}
                    className={`${inputClass} mt-1.5 font-mono text-xs`}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}