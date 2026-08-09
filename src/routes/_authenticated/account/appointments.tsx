import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getMyBookings, submitChangeRequest } from "@/lib/account.functions";
import { Card, StatusPill, fmtDate } from "@/components/account/AccountShell";
import { CalendarDays, MapPin, Repeat2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/appointments")({
  head: () => ({
    meta: [
      { title: "My appointments — Magnolia Maids" },
      { name: "description", content: "View, reschedule, or add entry and pet details to your upcoming Magnolia Maids cleaning appointments." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Appointments,
});

const today = () => new Date().toISOString().slice(0, 10);
const TIME_WINDOWS = ["Morning (8–11am)", "Midday (11am–2pm)", "Afternoon (2–5pm)", "Flexible"];

function Appointments() {
  const bookingsFn = useServerFn(getMyBookings);
  const submitFn = useServerFn(submitChangeRequest);
  const queryClient = useQueryClient();
  const [active, setActive] = useState<{ id: string; kind: "reschedule" | "cancel" } | null>(null);
  const [form, setForm] = useState({ preferredDay: "", alternateDay: "", preferredTime: "", reason: "", note: "" });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["account", "bookings"], queryFn: () => bookingsFn({}) });
  const rows = data?.bookings ?? [];
  const requests = data?.changeRequests ?? [];
  const upcoming = rows
    .filter((b) => b.status !== "cancelled" && (b.preferred_day ?? "") >= today())
    .sort((a, b) => (a.preferred_day ?? "").localeCompare(b.preferred_day ?? ""));

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof submitFn>[0]) => submitFn(input),
    onSuccess: () => {
      setDone(
        active?.kind === "cancel"
          ? "Cancellation requested. We'll confirm by email — nothing is cancelled until we do."
          : "Reschedule requested. We'll email you the confirmed time shortly.",
      );
      setActive(null);
      setForm({ preferredDay: "", alternateDay: "", preferredTime: "", reason: "", note: "" });
      queryClient.invalidateQueries({ queryKey: ["account", "bookings"] });
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong"),
  });

  function open(id: string, kind: "reschedule" | "cancel") {
    setError(null);
    setDone(null);
    setActive({ id, kind });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    setError(null);
    if (active.kind === "reschedule" && !form.preferredDay) {
      setError("Pick the date you'd prefer.");
      return;
    }
    mutation.mutate({ data: { bookingId: active.id, kind: active.kind, ...form } } as never);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Appointments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Request a new time or cancel a visit. Our Durant office confirms every change by email.
        </p>
      </div>

      {done && <p className="rounded-2xl bg-laurel/10 px-4 py-3 text-sm font-semibold text-laurel">{done}</p>}

      {isLoading ? (
        <Card>
          <p className="text-sm text-muted-foreground">Loading your visits…</p>
        </Card>
      ) : upcoming.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">No upcoming visits.</p>
          <Link
            to="/booking"
            className="mt-3 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom"
          >
            Book a cleaning
          </Link>
        </Card>
      ) : (
        upcoming.map((b) => {
          const pending = requests.find((r) => r.booking_id === b.id && r.status === "pending");
          return (
            <Card key={b.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">{b.service}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    {fmtDate(b.preferred_day)}
                    {b.preferred_time ? ` · ${b.preferred_time}` : ""}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{b.address}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Repeat2 className="h-4 w-4 shrink-0" />
                    {b.frequency} · {b.bedrooms} bed · {b.bathrooms} bath
                  </p>
                  {b.notes && <p className="mt-2 rounded-2xl bg-secondary px-4 py-2 text-sm">{b.notes}</p>}
                </div>
                <StatusPill status={b.status} />
              </div>

              {pending ? (
                <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm">
                  {pending.kind === "cancel" ? "Cancellation" : "Reschedule"} requested — waiting on our office.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => open(b.id, "reschedule")}
                    className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom"
                  >
                    Request new time
                  </button>
                  <button
                    onClick={() => open(b.id, "cancel")}
                    className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold"
                  >
                    Request cancellation
                  </button>
                </div>
              )}

              {active?.id === b.id && (
                <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-secondary/40 p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <h3 className="truncate font-display text-base font-semibold">
                      {active.kind === "cancel" ? "Request a cancellation" : "Request a new time"}
                    </h3>
                    <button type="button" aria-label="Close" onClick={() => setActive(null)} className="rounded-full p-2 hover:bg-secondary">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {active.kind === "reschedule" && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-semibold">
                          Preferred date
                          <input
                            type="date"
                            min={today()}
                            value={form.preferredDay}
                            onChange={(e) => setForm({ ...form, preferredDay: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                          />
                        </label>
                        <label className="text-sm font-semibold">
                          Backup date (optional)
                          <input
                            type="date"
                            min={today()}
                            value={form.alternateDay}
                            onChange={(e) => setForm({ ...form, alternateDay: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                          />
                        </label>
                      </div>
                      <label className="block text-sm font-semibold">
                        Preferred window
                        <select
                          value={form.preferredTime}
                          onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                        >
                          <option value="">No preference</option>
                          {TIME_WINDOWS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}

                  <label className="block text-sm font-semibold">
                    Reason (optional)
                    <input
                      value={form.reason}
                      maxLength={120}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                      placeholder={active.kind === "cancel" ? "Travel, guests, plans changed…" : "Schedule conflict…"}
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Anything else we should know?
                    <textarea
                      rows={3}
                      maxLength={800}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                    />
                  </label>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom disabled:opacity-60 sm:w-auto"
                  >
                    {mutation.isPending ? "Sending…" : "Send request"}
                  </button>
                </form>
              )}
            </Card>
          );
        })
      )}

      {requests.length > 0 && (
        <Card title="Change request history">
          <ul className="divide-y divide-border/60">
            {requests.map((r) => (
              <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold capitalize">{r.kind}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {r.preferred_day ? fmtDate(r.preferred_day) : new Date(r.created_at).toLocaleDateString()}
                    {r.admin_response ? ` · ${r.admin_response}` : ""}
                  </p>
                </div>
                <StatusPill status={r.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}