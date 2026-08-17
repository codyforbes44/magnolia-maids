import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlarmClock,
  CalendarDays,
  Check,
  Clock3,
  Plus,
  Trash2,
} from "lucide-react";
import { createHubReminder, updateHubReminder } from "@/lib/hub/hub.functions";
import type { HubOverview } from "@/lib/hub/hub-types";
import { inputClass } from "@/components/admin/ui";

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function HubHome({ overview }: { overview: HubOverview }) {
  const qc = useQueryClient();
  const create = useServerFn(createHubReminder);
  const update = useServerFn(updateHubReminder);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const addMut = useMutation({
    mutationFn: (t: string) => create({ data: { title: t } }),
    onSuccess: () => {
      setTitle("");
      setAdding(false);
      qc.invalidateQueries({ queryKey: ["hub"] });
    },
  });
  const actMut = useMutation({
    mutationFn: (v: { id: string; action: "done" | "snooze" | "delete" }) =>
      update({ data: { id: v.id, action: v.action, snoozeMinutes: 120 } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hub"] }),
  });

  const first = overview.name?.split(" ")[0];

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
        <p className="text-sm opacity-90">Good day{first ? `, ${first}` : ""}</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          {overview.totalUnread
            ? `${overview.totalUnread} message${overview.totalUnread === 1 ? "" : "s"} waiting`
            : "You're all caught up"}
        </p>
        <p className="mt-1 text-xs opacity-90">
          {overview.bookings.length} upcoming job{overview.bookings.length === 1 ? "" : "s"} ·{" "}
          {overview.missedCalls} call{overview.missedCalls === 1 ? "" : "s"} to return
        </p>
      </div>

      <section className="rounded-3xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <AlarmClock className="h-4 w-4 text-primary" /> Today
          </h2>
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>

        {adding && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim()) addMut.mutate(title.trim());
            }}
          >
            <input
              className={inputClass}
              placeholder="Remind me to…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Reminder"
            />
            <button className="rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground">
              Save
            </button>
          </form>
        )}

        <ul className="mt-3 space-y-2">
          {overview.reminders.length === 0 && (
            <li className="rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">
              Nothing needs you right now.
            </li>
          )}
          {overview.reminders.slice(0, 12).map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-2 rounded-2xl border border-border bg-secondary/40 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{r.title}</p>
                {r.note && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.note}</p>
                )}
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {r.auto ? "auto" : "personal"}
                  {r.channel ? ` · ${r.channel}` : ""}
                  {r.dueAt ? ` · ${timeAgo(r.dueAt)}` : ""}
                </p>
              </div>
              {!r.auto && (
                <div className="flex shrink-0 gap-1">
                  <button
                    aria-label="Snooze"
                    onClick={() => actMut.mutate({ id: r.id, action: "snooze" })}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                  >
                    <Clock3 className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Mark done"
                    onClick={() => actMut.mutate({ id: r.id, action: "done" })}
                    className="rounded-full p-1.5 text-primary hover:bg-secondary"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete"
                    onClick={() => actMut.mutate({ id: r.id, action: "delete" })}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-border bg-background p-4">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <CalendarDays className="h-4 w-4 text-primary" /> Upcoming bookings
        </h2>
        <ul className="mt-3 space-y-2">
          {overview.bookings.length === 0 && (
            <li className="rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">
              No jobs scheduled in the next seven days.
            </li>
          )}
          {overview.bookings.map((b) => (
            <li key={b.id} className="rounded-2xl border border-border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold">{b.name}</p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {b.day} {b.time ?? ""}
                </p>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {b.service} · {b.frequency} · {b.address}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
