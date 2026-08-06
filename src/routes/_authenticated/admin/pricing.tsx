import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { EmptyState, SectionCard, inputClass } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  head: () => ({
    meta: [
      { title: "Admin — Pricing | Magnolia Maids" },
      { name: "description", content: "Edit Durant service rates, add-ons, and discounts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PricingPage,
});

type Rate = {
  id: string;
  key: string;
  label: string;
  base: number;
  per_bed: number;
  per_bath: number;
  recurring: boolean;
  active: boolean;
  sort_order: number;
};

type Addon = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  price: number;
  active: boolean;
  sort_order: number;
};

type Setting = { key: string; value: unknown };

const SETTING_LABELS: Record<string, string> = {
  included_bedrooms: "Bedrooms included in base price",
  included_bathrooms: "Bathrooms included in base price",
  host_weekend_discount: "Host Weekend bundle discount (0.10 = 10%)",
  referral_credit: "Referral credit ($)",
};

function PricingPage() {
  const [rates, setRates] = useState<Rate[] | null>(null);
  const [addons, setAddons] = useState<Addon[] | null>(null);
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [r, a, s] = await Promise.all([
      supabase.from("service_rates").select("*").order("sort_order"),
      supabase.from("service_addons").select("*").order("sort_order"),
      supabase.from("pricing_settings").select("key, value"),
    ]);
    if (r.error || a.error || s.error) {
      setError(r.error?.message ?? a.error?.message ?? s.error?.message ?? null);
      return;
    }
    setRates(r.data as Rate[]);
    setAddons(a.data as Addon[]);
    setSettings(s.data as Setting[]);
  }

  useEffect(() => {
    load();
  }, []);

  function flash(msg: string) {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2500);
  }

  async function saveRate(id: string, patch: Partial<Rate>) {
    const { error } = await supabase.from("service_rates").update(patch).eq("id", id);
    if (error) return setError(error.message);
    setRates((prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? null);
    flash("Rate saved.");
  }

  async function saveAddon(id: string, patch: Partial<Addon>) {
    const { error } = await supabase.from("service_addons").update(patch).eq("id", id);
    if (error) return setError(error.message);
    setAddons((prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? null);
    flash("Add-on saved.");
  }

  async function addAddon() {
    const label = window.prompt("Add-on name (e.g. Inside fridge)");
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("service_addons").insert({
      key,
      label,
      price: 0,
      sort_order: (addons?.length ?? 0) + 1,
    });
    if (error) return setError(error.message);
    await load();
  }

  async function deleteAddon(id: string) {
    if (!window.confirm("Remove this add-on?")) return;
    const { error } = await supabase.from("service_addons").delete().eq("id", id);
    if (error) return setError(error.message);
    setAddons((prev) => prev?.filter((a) => a.id !== id) ?? null);
  }

  async function saveSetting(key: string, raw: string) {
    const num = Number(raw);
    const value = Number.isFinite(num) && raw.trim() !== "" ? num : raw;
    const { error } = await supabase.from("pricing_settings").update({ value }).eq("key", key);
    if (error) return setError(error.message);
    setSettings((prev) => prev?.map((s) => (s.key === key ? { ...s, value } : s)) ?? null);
    flash("Setting saved.");
  }

  return (
    <>
      <AdminPageHeader
        title="Pricing"
        description="Service rates, add-ons, and discount rules used across the site and the voice concierge."
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
        <SectionCard
          title="Service rates"
          description="Base price plus per-extra-bedroom and per-extra-bathroom pricing. Changes save when you leave a field."
        >
          {!rates ? (
            <p className="text-sm text-muted-foreground">Loading rates…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Service</th>
                    <th className="py-2">Base</th>
                    <th className="py-2">Per bed</th>
                    <th className="py-2">Per bath</th>
                    <th className="py-2">Recurring</th>
                    <th className="py-2">Live</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="py-2 pr-3">
                        <input
                          defaultValue={r.label}
                          onBlur={(e) =>
                            e.target.value !== r.label && saveRate(r.id, { label: e.target.value })
                          }
                          className={inputClass}
                        />
                      </td>
                      {(["base", "per_bed", "per_bath"] as const).map((field) => (
                        <td key={field} className="py-2 pr-3">
                          <input
                            type="number"
                            step="1"
                            defaultValue={Number(r[field])}
                            onBlur={(e) =>
                              Number(e.target.value) !== Number(r[field]) &&
                              saveRate(r.id, { [field]: Number(e.target.value) } as Partial<Rate>)
                            }
                            className={`${inputClass} w-24`}
                          />
                        </td>
                      ))}
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={r.recurring}
                          onChange={(e) => saveRate(r.id, { recurring: e.target.checked })}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={r.active}
                          onChange={(e) => saveRate(r.id, { active: e.target.checked })}
                          className="h-4 w-4"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Add-ons"
          description="Optional extras offered in the booking wizard."
          action={
            <button
              onClick={addAddon}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              Add add-on
            </button>
          }
        >
          {!addons ? (
            <p className="text-sm text-muted-foreground">Loading add-ons…</p>
          ) : !addons.length ? (
            <EmptyState title="No add-ons yet" hint="Add extras like inside fridge, oven, or laundry." />
          ) : (
            <ul className="space-y-3">
              {addons.map((a) => (
                <li key={a.id} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto_auto] sm:items-center">
                  <input
                    defaultValue={a.label}
                    onBlur={(e) =>
                      e.target.value !== a.label && saveAddon(a.id, { label: e.target.value })
                    }
                    className={inputClass}
                  />
                  <input
                    type="number"
                    step="1"
                    defaultValue={Number(a.price)}
                    onBlur={(e) =>
                      Number(e.target.value) !== Number(a.price) &&
                      saveAddon(a.id, { price: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={a.active}
                      onChange={(e) => saveAddon(a.id, { active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Live
                  </label>
                  <button
                    onClick={() => deleteAddon(a.id)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Rules & discounts">
          {!settings ? (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {settings.map((s) => (
                <label key={s.key} className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {SETTING_LABELS[s.key] ?? s.key}
                  </span>
                  <input
                    defaultValue={String(s.value)}
                    onBlur={(e) =>
                      e.target.value !== String(s.value) && saveSetting(s.key, e.target.value)
                    }
                    className={`${inputClass} mt-1.5`}
                  />
                </label>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}