import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, inputClass } from "@/components/admin/ui";
import {
  DEFAULT_HUB_FOLLOWUPS,
  STEP_CHOICES,
  stepLabel,
  type HubFollowupConfig,
} from "@/lib/hub/auto-followups";
import {
  getHubFollowupSettings,
  saveHubFollowupSettings,
  runHubFollowupsNow,
} from "@/lib/hub/auto-followups.functions";

export const Route = createFileRoute("/_authenticated/admin/followups")({
  head: () => ({
    meta: [
      { title: "Admin — Auto follow-ups | Magnolia Maids" },
      {
        name: "description",
        content: "Timing for automatic reminders on unanswered calls and unread conversations.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FollowupsPage,
});

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const hourLabel = (h: number) => {
  const mer = h < 12 ? "AM" : "PM";
  const base = h % 12 === 0 ? 12 : h % 12;
  return `${base}:00 ${mer}`;
};

function StepPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number[];
  onChange: (next: number[]) => void;
}) {
  const toggle = (m: number) =>
    onChange(value.includes(m) ? value.filter((v) => v !== m) : [...value, m].sort((a, b) => a - b));
  return (
    <div>
      <div className="text-sm font-semibold">{label}</div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {STEP_CHOICES.map((m) => {
          const on = value.includes(m);
          return (
            <button
              key={m}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(m)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                on
                  ? "border-laurel bg-laurel text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:border-laurel/50"
              }`}
            >
              {stepLabel(m)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {value.length
          ? `Sends at ${value.map(stepLabel).join(", then ")} after the last activity.`
          : "No automatic follow-ups for this case."}
      </p>
    </div>
  );
}

function FollowupsPage() {
  const load = useServerFn(getHubFollowupSettings);
  const save = useServerFn(saveHubFollowupSettings);
  const runNow = useServerFn(runHubFollowupsNow);

  const [config, setConfig] = useState<HubFollowupConfig | null>(null);
  const [lastRun, setLastRun] = useState<{ at: string; sent: number; attempted: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load({ data: undefined as never })
      .then((res) => {
        setConfig(res.config);
        setLastRun(res.lastRun);
      })
      .catch((e: unknown) => setStatus(e instanceof Error ? e.message : "Could not load settings"));
  }, [load]);

  const patch = (next: Partial<HubFollowupConfig>) =>
    setConfig((c) => (c ? { ...c, ...next } : c));

  async function onSave() {
    if (!config) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await save({ data: { config } });
      setConfig(res.config);
      setStatus("Saved. The next sweep runs within 15 minutes.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRunNow() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await runNow({ data: undefined as never });
      setStatus(`Sweep finished — ${res.sent} follow-up(s) sent of ${res.attempted} due.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auto follow-ups"
        description="Chase unanswered calls and unread conversations automatically, on your schedule."
      />

      {status && (
        <div className="rounded-xl border border-laurel/40 bg-laurel/5 px-4 py-3 text-sm">{status}</div>
      )}

      {!config ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          Loading settings…
        </div>
      ) : (
        <>
          <SectionCard
            title="Automation"
            description="Maggie texts first when we have written SMS consent, and falls back to email."
          >
            <div className="space-y-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={config.enabled}
                  onChange={(e) => patch({ enabled: e.target.checked })}
                />
                <span>
                  <span className="font-semibold">Automatic follow-ups are on</span>
                  <span className="block text-xs text-muted-foreground">
                    A sweep runs every 15 minutes and only sends what is due.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={config.includeVoicemail}
                  onChange={(e) => patch({ includeVoicemail: e.target.checked })}
                />
                <span>
                  <span className="font-semibold">Include the voicemail transcription</span>
                  <span className="block text-xs text-muted-foreground">
                    Repeats what Maggie left on voicemail inside the reminder text.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={config.emailFallback}
                  onChange={(e) => patch({ emailFallback: e.target.checked })}
                />
                <span>
                  <span className="font-semibold">Fall back to email</span>
                  <span className="block text-xs text-muted-foreground">
                    Used when there is no phone number or no recorded SMS opt-in.
                  </span>
                </span>
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Intervals" description="Measured from the last activity on that call or thread.">
            <div className="space-y-6">
              <StepPicker
                label="Unanswered calls"
                hint="No answer, busy, failed, or straight to voicemail."
                value={config.callSteps}
                onChange={(callSteps) => patch({ callSteps })}
              />
              <StepPicker
                label="Unread threads"
                hint="Texts, emails, website chats, and Messenger notes still waiting on a reply."
                value={config.threadSteps}
                onChange={(threadSteps) => patch({ threadSteps })}
              />
            </div>
          </SectionCard>

          <SectionCard title="Sending window" description="Central time. Nothing sends outside these hours.">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm">
                <span className="font-semibold">Start</span>
                <select
                  className={inputClass}
                  value={config.quietStartHour}
                  onChange={(e) => patch({ quietStartHour: Number(e.target.value) })}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="font-semibold">End</span>
                <select
                  className={inputClass}
                  value={config.quietEndHour}
                  onChange={(e) => patch({ quietEndHour: Number(e.target.value) })}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="font-semibold">Max sends per sweep</span>
                <input
                  type="number"
                  min={1}
                  max={200}
                  className={inputClass}
                  value={config.maxPerRun}
                  onChange={(e) => patch({ maxPerRun: Number(e.target.value) })}
                />
              </label>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="rounded-full bg-laurel px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Save settings
            </button>
            <button
              type="button"
              onClick={onRunNow}
              disabled={busy}
              className="rounded-full border border-border/60 px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              Run a sweep now
            </button>
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_HUB_FOLLOWUPS)}
              className="text-sm font-semibold text-muted-foreground underline"
            >
              Reset to defaults
            </button>
            {lastRun && (
              <span className="text-xs text-muted-foreground">
                Last sweep {new Date(lastRun.at).toLocaleString()} · {lastRun.sent} sent
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
