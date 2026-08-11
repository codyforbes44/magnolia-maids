import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { EmptyState, SectionCard, StatusPill, inputClass } from "@/components/admin/ui";
import {
  DAY_CHOICES,
  DEFAULT_REMINDER_TIMING,
  HOUR_CHOICES,
  REMINDER_SERVICE_KEYS,
  describeWindow,
  parseReminderTiming,
  type ReminderTiming,
  type ReminderWindow,
} from "@/lib/reminder-timing";
import { serviceLabel } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Admin — Settings | Magnolia Maids" },
      { name: "description", content: "Business details, email delivery log, and integrations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

type Setting = { key: string; value: unknown; is_public: boolean };
type EmailRow = {
  id: string;
  recipient: string;
  subject: string;
  kind: string;
  status: string;
  error: string | null;
  created_at: string;
};

const LABELS: Record<string, string> = {
  phone: "Phone number",
  email: "Public email",
  city: "Service city",
  facebook: "Facebook page URL",
  x: "X profile URL",
  notify_email: "Internal notification inbox",
};

const EMAIL_STYLES: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  failed: "bg-destructive/10 text-destructive border border-destructive/30",
};

function SettingsPage() {
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const [emails, setEmails] = useState<EmailRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [timing, setTiming] = useState<ReminderTiming | null>(null);
  const [savingTiming, setSavingTiming] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, e] = await Promise.all([
        supabase.from("business_settings").select("key, value, is_public").order("key"),
        supabase
          .from("email_log")
          .select("id, recipient, subject, kind, status, error, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (s.error || e.error) {
        setError(s.error?.message ?? e.error?.message ?? null);
        return;
      }
      setSettings(s.data as Setting[]);
      setTiming(
        parseReminderTiming(
          (s.data as Setting[]).find((r) => r.key === "reminder_timing")?.value ??
            DEFAULT_REMINDER_TIMING,
        ),
      );
      setEmails(e.data as EmailRow[]);
    })();
  }, []);

  async function saveSetting(key: string, raw: string) {
    const { error } = await supabase.from("business_settings").update({ value: raw }).eq("key", key);
    if (error) return setError(error.message);
    setSettings((prev) => prev?.map((s) => (s.key === key ? { ...s, value: raw } : s)) ?? null);
    setStatus("Saved.");
    window.setTimeout(() => setStatus(null), 2000);
  }

  async function saveTiming(next: ReminderTiming) {
    setTiming(next);
    setSavingTiming(true);
    const { error } = await supabase
      .from("business_settings")
      .upsert({ key: "reminder_timing", value: next as unknown as never, is_public: false });
    setSavingTiming(false);
    if (error) return setError(error.message);
    setStatus("Reminder timing saved.");
    window.setTimeout(() => setStatus(null), 2000);
  }

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Business details used across the site, plus email delivery and integration status."
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
        <SectionCard title="Business details" description="Phone, email, city, and social profiles.">
          {!settings ? (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {settings
                .filter((s) => s.key !== "reminder_timing")
                .map((s) => (
                <label key={s.key} className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {LABELS[s.key] ?? s.key}
                  </span>
                  <input
                    defaultValue={typeof s.value === "string" ? s.value : String(s.value ?? "")}
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

        <SectionCard
          title="Reminder timing"
          description="Choose how far ahead reminder emails and texts go out — set a default and override it per service type."
        >
          {!timing ? (
            <p className="text-sm text-muted-foreground">Loading reminder timing…</p>
          ) : (
            <div className="space-y-6">
              <label className="block max-w-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Daily send time (Central)
                </span>
                <select
                  value={timing.sendHour}
                  onChange={(e) => saveTiming({ ...timing, sendHour: Number(e.target.value) })}
                  className={`${inputClass} mt-1.5`}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {((h + 11) % 12) + 1}:00 {h < 12 ? "AM" : "PM"}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Day-based reminders send at this hour. Hour-based reminders are timed off the
                  arrival window.
                </span>
              </label>

              <WindowEditor
                title="Default (all services & campaign leads)"
                value={timing.default}
                disabled={savingTiming}
                onChange={(w) => saveTiming({ ...timing, default: w })}
              />

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Per service type
                </p>
                {REMINDER_SERVICE_KEYS.map((key) => {
                  const override = timing.services[key];
                  return (
                    <div key={key} className="rounded-xl border border-border/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{serviceLabel(key)}</p>
                          <p className="text-xs text-muted-foreground">
                            {override
                              ? describeWindow(override)
                              : `Using default — ${describeWindow(timing.default)}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={savingTiming}
                          onClick={() => {
                            const services = { ...timing.services };
                            if (override) delete services[key];
                            else services[key] = { ...timing.default };
                            saveTiming({ ...timing, services });
                          }}
                          className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary"
                        >
                          {override ? "Use default" : "Customize"}
                        </button>
                      </div>
                      {override && (
                        <div className="mt-4">
                          <WindowEditor
                            value={override}
                            disabled={savingTiming}
                            onChange={(w) =>
                              saveTiming({
                                ...timing,
                                services: { ...timing.services, [key]: w },
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Email delivery" description="Last 50 transactional emails sent from the site.">
          {!emails ? (
            <p className="text-sm text-muted-foreground">Loading email log…</p>
          ) : !emails.length ? (
            <EmptyState
              title="No emails logged yet"
              hint="Booking, career, and campaign emails will appear here once sent."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Sent</th>
                    <th className="py-2">To</th>
                    <th className="py-2">Subject</th>
                    <th className="py-2">Kind</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((e) => (
                    <tr key={e.id} className="border-t border-border/60">
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="py-2">{e.recipient}</td>
                      <td className="py-2">{e.subject}</td>
                      <td className="py-2 text-xs">{e.kind}</td>
                      <td className="py-2">
                        <StatusPill status={e.status} styles={EMAIL_STYLES} />
                        {e.error && (
                          <div className="mt-1 text-xs text-destructive">{e.error}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Integrations" description="Where the connected services are managed.">
          <ul className="space-y-3 text-sm">
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
              <span>
                <span className="font-semibold">Facebook &amp; Lead Ads</span>
                <span className="block text-xs text-muted-foreground">
                  Page publishing, insights, ads, and lead capture.
                </span>
              </span>
              <a href="/admin/facebook" className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary">
                Open Marketing
              </a>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
              <span>
                <span className="font-semibold">Resend email</span>
                <span className="block text-xs text-muted-foreground">
                  Booking, careers, campaign, and reminder emails.
                </span>
              </span>
              <span className="text-xs text-muted-foreground">Configured</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
              <span>
                <span className="font-semibold">Voice concierge</span>
                <span className="block text-xs text-muted-foreground">
                  ElevenLabs agents with the live pricing knowledge base.
                </span>
              </span>
              <span className="text-xs text-muted-foreground">Configured</span>
            </li>
          </ul>
        </SectionCard>
      </div>
    </>
  );
}