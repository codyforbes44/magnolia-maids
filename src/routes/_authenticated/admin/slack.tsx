import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, EmptyState } from "@/components/admin/ui";
import { getSlackStatus, saveSlackSettingsFn, sendSlackTest, getSlackLog, type SlackStatus } from "@/lib/slack.functions";
import { Send, Slash } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/slack")({
  head: () => ({
    meta: [
      { title: "Admin — Slack | Magnolia Maids" },
      { name: "description", content: "Slack notifications and Maggie's answers in the Magnolia Maids workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SlackAdminPage,
});

const EVENT_LABELS: Record<string, string> = {
  leads: "New leads",
  bookings: "Booking requests",
  applications: "Job applicants",
  properties: "Property manager inquiries",
  franchise: "Franchise inquiries",
  calls: "Finished Maggie calls",
  messenger: "Messenger threads that need you",
};

type LogRow = {
  id: string;
  channel_id: string;
  kind: string;
  text: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  event_type: string | null;
  channel_id: string | null;
  user_id: string | null;
  text: string | null;
  handled: boolean;
  error: string | null;
  created_at: string;
};

function SlackAdminPage() {
  const loadStatus = useServerFn(getSlackStatus);
  const saveSettings = useServerFn(saveSlackSettingsFn);
  const sendTest = useServerFn(sendSlackTest);
  const loadLog = useServerFn(getSlackLog);

  const [status, setStatus] = useState<SlackStatus | null>(null);
  const [log, setLog] = useState<LogRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    loadStatus({ data: undefined } as never)
      .then(setStatus)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load Slack status."));
    loadLog({ data: undefined } as never)
      .then((r) => {
        setLog(r.messages as LogRow[]);
        setEvents((r.events ?? []) as EventRow[]);
      })
      .catch(() => setLog([]));
  }, [loadStatus, loadLog]);

  useEffect(refresh, [refresh]);

  async function patch(next: Record<string, unknown>) {
    setBusy(true);
    setNote(null);
    setError(null);
    try {
      const settings = await saveSettings({ data: next });
      setStatus((s) => (s ? { ...s, settings: settings as SlackStatus["settings"] } : s));
      setNote("Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setNote(null);
    setError(null);
    try {
      const res = await sendTest({ data: {} });
      setNote(res.sent ? "Test message posted to Slack." : `Not sent — ${res.reason ?? "unknown reason"}.`);
      loadLog({ data: undefined } as never)
        .then((r) => {
          setLog(r.messages as LogRow[]);
          setEvents((r.events ?? []) as EventRow[]);
        })
        .catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  }

  const settings = status?.settings;

  return (
    <>
      <AdminPageHeader
        title="Slack"
        description="Maggie posts what's happening into your team channel and answers questions there."
        actions={
          <button
            type="button"
            onClick={test}
            disabled={busy || !status?.configured}
            className="tap-target inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden />
            Send test message
          </button>
        }
      />

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {note && <p className="mb-4 text-sm text-muted-foreground">{note}</p>}

      <div className="grid gap-6">
        <SectionCard title="Connection" description="The Magnolia Maids Slack app in your workspace.">
          {!status ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !status.configured ? (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
              <Slash className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
              <div>
                <p className="font-semibold">Slack isn't connected yet.</p>
                <p className="text-muted-foreground">
                  Create the Slack app from the manifest, install it to the workspace, then add the bot token and
                  signing secret.
                </p>
              </div>
            </div>
          ) : status.error ? (
            <p className="text-sm text-destructive">Slack said: {status.error}</p>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace</dt>
                <dd className="text-sm font-semibold">{status.team ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bot</dt>
                <dd className="text-sm font-semibold">{status.botName ?? "—"}</dd>
              </div>
            </dl>
          )}
        </SectionCard>

        {settings && (
          <>
            <SectionCard title="Channel" description="Where notifications land and where Maggie listens.">
              <label htmlFor="slack-channel" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Team channel
              </label>
              <select
                id="slack-channel"
                name="slack-channel"
                value={settings.channelId ?? ""}
                disabled={busy || !status?.configured}
                onChange={(e) => {
                  const channel = status?.channels.find((c) => c.id === e.target.value);
                  void patch({ channelId: e.target.value || null, channelName: channel?.name ?? null });
                }}
                className="mt-1 w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose a channel…</option>
                {status?.channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                    {c.is_member ? "" : " (invite Maggie first)"}
                  </option>
                ))}
              </select>
              {settings.channelId && !status?.channels.find((c) => c.id === settings.channelId)?.is_member && (
                <p className="mt-2 text-xs text-destructive">
                  Maggie isn't in this channel yet — run /invite @Maggie there.
                </p>
              )}
            </SectionCard>

            <SectionCard title="Maggie in Slack" description="Mention her in the channel or send her a DM.">
              <label className="flex items-start gap-3 py-2">
                <input
                  type="checkbox"
                  id="slack-answer"
                  name="slack-answer"
                  checked={settings.answerInChannel}
                  disabled={busy}
                  onChange={(e) => void patch({ answerInChannel: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
                />
                <span>
                  <span className="block text-sm font-semibold">Let Maggie answer in Slack</span>
                  <span className="block text-xs text-muted-foreground">
                    She quotes from live pricing, looks up leads and bookings, and can send a follow-up after you
                    confirm.
                  </span>
                </span>
              </label>

              <div className="mt-4">
                <label
                  htmlFor="slack-channel-mode"
                  className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  In the team channel
                </label>
                <select
                  id="slack-channel-mode"
                  name="slack-channel-mode"
                  value={settings.channelMode}
                  disabled={busy}
                  onChange={(e) => void patch({ channelMode: e.target.value })}
                  className="mt-1 w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Answer every message</option>
                  <option value="mention">Only when someone @mentions her</option>
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  Direct messages are always answered.
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Notifications" description="Pick what gets posted to the channel.">
              <div className="divide-y divide-border">
                {Object.keys(EVENT_LABELS).map((key) => (
                  <label key={key} className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id={`slack-event-${key}`}
                      name={`slack-event-${key}`}
                      checked={settings.events[key] ?? false}
                      disabled={busy}
                      onChange={(e) => void patch({ events: { [key]: e.target.checked } })}
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    <span className="text-sm font-semibold">{EVENT_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        <SectionCard
          title="Received from Slack"
          description="Everything Slack delivered, and whether Maggie answered it."
        >
          {events.length === 0 ? (
            <EmptyState
              title="Nothing received yet"
              hint="If your messages aren't listed, Slack isn't delivering events — check Event Subscriptions and reinstall the app."
            />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {events.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider">{e.event_type ?? "event"}</span>
                    <span>{new Date(e.created_at).toLocaleString("en-US", { timeZone: "America/Chicago" })}</span>
                    <span className={e.handled ? "text-laurel" : "text-destructive"}>
                      {e.handled ? "answered" : "no reply"}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words">{e.text}</p>
                  {e.error && <p className="mt-1 text-xs text-muted-foreground">Reason: {e.error}</p>}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Slack log" description="Every message the app sent to Slack.">
          {log.length === 0 ? (
            <EmptyState title="Nothing sent yet" hint="Send a test message to check the wiring." />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {log.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider">{m.kind}</span>
                    <span>{new Date(m.created_at).toLocaleString("en-US", { timeZone: "America/Chicago" })}</span>
                    <span className={m.status === "sent" ? "text-laurel" : "text-destructive"}>{m.status}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words">{m.text}</p>
                  {m.error && <p className="mt-1 text-xs text-destructive">{m.error}</p>}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
