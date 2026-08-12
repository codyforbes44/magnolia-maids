import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SectionCard } from "@/components/admin/ui";
import { getMaggieEngagement, setMaggieEngagement } from "@/lib/maggie-engage.functions";

const SOURCE_LABELS: Record<string, string> = {
  campaign_leads: "Leads",
  booking_requests: "Booking requests",
  job_applications: "Job applicants",
  property_inquiries: "Property managers",
  franchise_inquiries: "Franchise inquiries",
};

type Settings = { enabled: boolean; sources: Record<string, boolean> };

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 py-2 ${disabled ? "opacity-50" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

/** Master + per-audience switches for Maggie's automatic outreach. */
export function MaggieEngagementPanel() {
  const load = useServerFn(getMaggieEngagement);
  const save = useServerFn(setMaggieEngagement);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [messenger, setMessenger] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load({ data: undefined })
      .then((res) => {
        setSettings(res.settings as Settings);
        setMessenger(res.messenger);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load Maggie's settings."));
  }, [load]);

  async function push(patch: {
    enabled?: boolean;
    sources?: Record<string, boolean>;
    messenger?: boolean;
  }) {
    setStatus("Saving…");
    setError(null);
    try {
      const res = await save({ data: patch });
      setSettings(res.settings as Settings);
      if (typeof res.messenger === "boolean") setMessenger(res.messenger);
      setStatus("Saved.");
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : "Couldn't save.");
    }
  }

  return (
    <SectionCard
      title="Maggie engagement"
      description="Turn Maggie's automatic follow-ups on for everyone, or pick which audiences she works."
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!settings ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="divide-y divide-border">
          <Toggle
            label="Let Maggie engage automatically"
            hint="Master switch. Off means no automatic emails, texts, or calls from Maggie — you can still engage her on an individual contact."
            checked={settings.enabled}
            onChange={(enabled) => push({ enabled })}
          />
          {Object.keys(SOURCE_LABELS).map((key) => (
            <Toggle
              key={key}
              label={SOURCE_LABELS[key]}
              checked={settings.sources[key] ?? false}
              disabled={!settings.enabled}
              onChange={(v) => push({ sources: { [key]: v } })}
            />
          ))}
          <Toggle
            label="Facebook Messenger auto-reply"
            hint="Maggie answers new Messenger messages within seconds."
            checked={messenger}
            onChange={(v) => push({ messenger: v })}
          />
        </div>
      )}
      {status && <p className="mt-2 text-xs text-muted-foreground">{status}</p>}
    </SectionCard>
  );
}
