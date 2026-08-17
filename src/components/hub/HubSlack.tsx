import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSlackLog, getSlackStatus } from "@/lib/slack.functions";

export function HubSlack() {
  const statusFn = useServerFn(getSlackStatus);
  const logFn = useServerFn(getSlackLog);
  const status = useQuery({ queryKey: ["hub", "slack", "status"], queryFn: () => statusFn({}) });
  const log = useQuery({ queryKey: ["hub", "slack", "log"], queryFn: () => logFn({}) });

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-sm font-semibold">
          {status.data?.configured ? (status.data.team ?? "Slack workspace") : "Slack not connected"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {status.data?.settings?.channelName
            ? `#${status.data.settings.channelName} · Maggie ${
                status.data.settings.answerInChannel ? "answers here" : "is quiet here"
              }`
            : "Pick a channel in Admin → Slack"}
        </p>
      </div>

      <h3 className="px-1 font-display text-base font-semibold">Recent Slack activity</h3>
      <ul className="space-y-2">
        {(log.data?.messages ?? []).map((m: any) => (
          <li key={m.id} className="rounded-2xl border border-border bg-background p-3">
            <p className="text-sm">{m.text || m.kind}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {m.kind} · {m.status} · {new Date(m.created_at).toLocaleString()}
            </p>
          </li>
        ))}
        {log.data && log.data.messages.length === 0 && (
          <li className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
            No Slack messages yet.
          </li>
        )}
      </ul>
    </div>
  );
}
