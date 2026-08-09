import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { listChangeRequests, resolveChangeRequest } from "@/lib/admin/change-requests.functions";
import { StatusPill, fmtDate } from "@/components/account/AccountShell";

export const Route = createFileRoute("/_authenticated/admin/change-requests")({
  head: () => ({ meta: [{ title: "Change requests — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ChangeRequests,
});

const inputCls = "mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm";

function ChangeRequests() {
  const listFn = useServerFn(listChangeRequests);
  const resolveFn = useServerFn(resolveChangeRequest);
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ adminResponse: "", newDay: "", newTime: "", notifyCustomer: true });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "change-requests"], queryFn: () => listFn({}) });

  const resolve = useMutation({
    mutationFn: (input: { id: string; decision: "approved" | "declined" }) =>
      resolveFn({ data: { ...input, ...form } } as never),
    onSuccess: () => {
      setOpenId(null);
      setForm({ adminResponse: "", newDay: "", newTime: "", notifyCustomer: true });
      queryClient.invalidateQueries({ queryKey: ["admin", "change-requests"] });
    },
  });

  const rows = data ?? [];
  const pending = rows.filter((r) => r.status === "pending");

  return (
    <AdminShell
      title="Change requests"
      description="Reschedule and cancellation requests from customer dashboards."
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {isLoading ? "Loading…" : `${pending.length} waiting on you · ${rows.length} total`}
      </p>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold">
                  {r.booking?.name ?? "Customer"} · {r.kind === "cancel" ? "Cancellation" : "Reschedule"}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {r.booking?.service} · currently {fmtDate(r.booking?.preferred_day)}
                  {r.booking?.preferred_time ? ` · ${r.booking.preferred_time}` : ""}
                </p>
                {r.kind === "reschedule" && (
                  <p className="mt-1 text-sm">
                    Asked for <strong>{fmtDate(r.preferred_day)}</strong>
                    {r.alternate_day ? ` (backup ${fmtDate(r.alternate_day)})` : ""}
                    {r.preferred_time ? ` · ${r.preferred_time}` : ""}
                  </p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {[r.reason, r.note].filter(Boolean).join(" · ") || "No notes"}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {r.booking?.email} {r.booking?.phone ? `· ${r.booking.phone}` : ""}
                </p>
              </div>
              <StatusPill status={r.status} />
            </div>

            {r.status === "pending" &&
              (openId === r.id ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-secondary/40 p-4">
                  {r.kind === "reschedule" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-semibold">
                        Confirmed date
                        <input
                          type="date"
                          value={form.newDay || r.preferred_day || ""}
                          onChange={(e) => setForm({ ...form, newDay: e.target.value })}
                          className={inputCls}
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Confirmed window
                        <input
                          value={form.newTime || r.preferred_time || ""}
                          onChange={(e) => setForm({ ...form, newTime: e.target.value })}
                          className={inputCls}
                        />
                      </label>
                    </div>
                  )}
                  <label className="block text-sm font-semibold">
                    Message to the customer
                    <textarea
                      rows={3}
                      value={form.adminResponse}
                      onChange={(e) => setForm({ ...form, adminResponse: e.target.value })}
                      className={inputCls}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.notifyCustomer}
                      onChange={(e) => setForm({ ...form, notifyCustomer: e.target.checked })}
                      className="h-5 w-5 rounded border-border"
                    />
                    Email the customer
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ id: r.id, decision: "approved" })}
                      className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom disabled:opacity-60"
                    >
                      {r.kind === "cancel" ? "Approve cancellation" : "Confirm new time"}
                    </button>
                    <button
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ id: r.id, decision: "declined" })}
                      className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold disabled:opacity-60"
                    >
                      Decline & suggest
                    </button>
                    <button onClick={() => setOpenId(null)} className="min-h-11 px-4 text-sm text-muted-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setOpenId(r.id)}
                  className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom"
                >
                  Respond
                </button>
              ))}

            {r.admin_response && r.status !== "pending" && (
              <p className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-sm">{r.admin_response}</p>
            )}
          </div>
        ))}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No change requests yet.</p>
        )}
      </div>
    </AdminShell>
  );
}