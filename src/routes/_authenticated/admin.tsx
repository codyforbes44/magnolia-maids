import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Booking Requests | Maid 4 Miami" },
      { name: "description", content: "View, filter, and export Maid 4 Miami booking requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string;
  bedrooms: string;
  bathrooms: string;
  service: string;
  frequency: string;
  preferred_day: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "contacted", "scheduled", "completed", "cancelled"] as const;

function AdminPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const selected = useMemo(
    () => rows?.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setUserEmail(userData.user.email ?? "");
      const { data: roles, error: roleErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      if (roleErr) {
        setError(roleErr.message);
        setIsAdmin(false);
        return;
      }
      const admin = (roles ?? []).some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (!admin) return;

      const { data, error } = await supabase
        .from("booking_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      setRows(data as Booking[]);
    })();
  }, []);

  const services = useMemo(() => {
    const s = new Set<string>();
    rows?.forEach((r) => s.add(r.service));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (serviceFilter !== "all" && r.service !== serviceFilter) return false;
      if (fromDate && r.created_at < fromDate) return false;
      if (toDate && r.created_at > toDate + "T23:59:59") return false;
      if (q) {
        const hay = `${r.name} ${r.email} ${r.phone ?? ""} ${r.address} ${r.notes ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, serviceFilter, fromDate, toDate]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("booking_requests").update({ status }).eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
  }

  function exportCSV() {
    const headers = [
      "created_at","name","email","phone","address","bedrooms","bathrooms",
      "service","frequency","preferred_day","preferred_time","status","notes",
    ];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...filtered.map((r) =>
        headers.map((h) => escape((r as unknown as Record<string, unknown>)[h])).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="flex-1 mx-auto w-full max-w-7xl px-5 md:px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold">Booking Requests</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{userEmail}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              disabled={!filtered.length}
              className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              Export CSV ({filtered.length})
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              Sign out
            </button>
          </div>
        </div>

        {isAdmin === false && (
          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-xl font-bold">Access pending</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account isn't an admin yet. Ask the site owner to grant your account the
              <span className="mx-1 rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">admin</span>
              role, then refresh this page.
            </p>
          </div>
        )}

        {isAdmin && (
          <>
            <div className="mt-6 grid gap-3 md:grid-cols-5">
              <input
                placeholder="Search name, email, address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:col-span-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
              >
                <option value="all">All services</option>
                {services.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary/60 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Address</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Preferred</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows === null && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
                  )}
                  {rows && filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No bookings match your filters.</td></tr>
                  )}
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`border-t border-border/60 align-top cursor-pointer transition hover:bg-secondary/40 ${
                        selectedId === r.id ? "bg-secondary/60" : ""
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-muted-foreground">{r.email}</div>
                        {r.phone && <div className="text-muted-foreground">{r.phone}</div>}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">{r.address}</td>
                      <td className="px-4 py-3">
                        <div>{r.service}</div>
                        <div className="text-xs text-muted-foreground">{r.frequency}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.bedrooms} bd / {r.bathrooms} ba</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.preferred_day ?? "—"}
                        {r.preferred_time ? ` · ${r.preferred_time}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={r.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateStatus(r.id, e.target.value)}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {r.notes && (
                          <div className="mt-1 text-xs text-muted-foreground">Has notes</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      <SiteFooter />

      {selected && (
        <BookingDetailPanel
          booking={selected}
          onClose={() => setSelectedId(null)}
          onStatusChange={(status) => updateStatus(selected.id, status)}
        />
      )}
    </div>
  );
}

function BookingDetailPanel({
  booking,
  onClose,
  onStatusChange,
}: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border/60 bg-card/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Booking request
            </div>
            <h2 className="font-display text-2xl font-extrabold">{booking.name}</h2>
            <div className="mt-1 text-xs text-muted-foreground">
              Received {new Date(booking.created_at).toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Status
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    booking.status === s
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contact
            </h3>
            <dl className="mt-2 space-y-1 text-sm">
              <DetailRow label="Email">
                <a href={`mailto:${booking.email}`} className="text-ocean hover:underline">
                  {booking.email}
                </a>
              </DetailRow>
              <DetailRow label="Phone">
                {booking.phone ? (
                  <a href={`tel:${booking.phone}`} className="text-ocean hover:underline">
                    {booking.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </DetailRow>
              <DetailRow label="Address">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(booking.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ocean hover:underline"
                >
                  {booking.address}
                </a>
              </DetailRow>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Service
            </h3>
            <dl className="mt-2 space-y-1 text-sm">
              <DetailRow label="Type">{booking.service}</DetailRow>
              <DetailRow label="Frequency">{booking.frequency}</DetailRow>
              <DetailRow label="Home size">
                {booking.bedrooms} bd · {booking.bathrooms} ba
              </DetailRow>
              <DetailRow label="Preferred day">
                {booking.preferred_day ?? "—"}
              </DetailRow>
              <DetailRow label="Preferred time">
                {booking.preferred_time ?? "—"}
              </DetailRow>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Notes
            </h3>
            <div className="mt-2 rounded-xl border border-border/60 bg-background p-4 text-sm whitespace-pre-wrap">
              {booking.notes?.trim() ? booking.notes : (
                <span className="text-muted-foreground">No notes provided.</span>
              )}
            </div>
          </section>

          <section className="flex flex-wrap gap-2 pt-2">
            <a
              href={`mailto:${booking.email}?subject=${encodeURIComponent(
                "Your Maid 4 Miami booking request",
              )}`}
              className="rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-bold shadow-splash hover:brightness-105"
            >
              Email customer
            </a>
            {booking.phone && (
              <a
                href={`tel:${booking.phone}`}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                Call
              </a>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <dt className="text-xs font-semibold text-muted-foreground pt-0.5">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}