import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { downloadCSV } from "@/components/admin/ui";
import { sourceLabel } from "@/lib/attribution";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  head: () => ({
    meta: [
      { title: "Admin — Booking Requests | Magnolia Maids" },
      { name: "description", content: "View, filter, and export Magnolia Maids booking requests." },
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
  utm_source: string | null;
  utm_campaign: string | null;
};

const STATUSES = ["new", "contacted", "scheduled", "completed", "cancelled"] as const;

function AdminPage() {
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

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
      "utm_source","utm_campaign",
    ];
    downloadCSV("bookings", headers, filtered as unknown as Record<string, unknown>[]);
  }

  return (
    <>
      <AdminPageHeader
        title="Booking requests"
        description="Every request from the site, the voice concierge, and the booking wizard."
        actions={
          <>
            <div className="inline-flex rounded-full border border-border p-1 text-xs font-semibold">
              <button
                onClick={() => setView("list")}
                className={`rounded-full px-3 py-1.5 transition ${
                  view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`rounded-full px-3 py-1.5 transition ${
                  view === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                }`}
              >
                Calendar
              </button>
            </div>
            <button
              onClick={exportCSV}
              disabled={!filtered.length}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              Export CSV ({filtered.length})
            </button>
          </>
        }
      />

      {(
          <>
            {view === "list" && (
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
            )}

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            {view === "list" ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary/60 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Address</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Preferred</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows === null && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
                  )}
                  {rows && filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No bookings match your filters.</td></tr>
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
                        <span className="inline-flex rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-xs font-semibold">
                          {sourceLabel(r.utm_source)}
                        </span>
                        {r.utm_campaign && (
                          <div className="mt-1 text-xs text-muted-foreground">{r.utm_campaign}</div>
                        )}
                      </td>
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
            ) : (
              <CalendarView
                bookings={filtered}
                month={calendarMonth}
                onPrevMonth={() =>
                  setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                }
                onNextMonth={() =>
                  setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                }
                onToday={() => {
                  const d = new Date();
                  setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                }}
                onSelect={(id) => setSelectedId(id)}
              />
            )}
          </>
        )}

      {selected && (
        <BookingDetailPanel
          booking={selected}
          onClose={() => setSelectedId(null)}
          onStatusChange={(status) => updateStatus(selected.id, status)}
        />
      )}
    </>
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
            <h2 className="font-display text-2xl font-semibold">{booking.name}</h2>
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
                <a href={`mailto:${booking.email}`} className="text-laurel hover:underline">
                  {booking.email}
                </a>
              </DetailRow>
              <DetailRow label="Phone">
                {booking.phone ? (
                  <a href={`tel:${booking.phone}`} className="text-laurel hover:underline">
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
                  className="text-laurel hover:underline"
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
                "Your Magnolia Maids booking request",
              )}`}
              className="rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-bold shadow-bloom hover:brightness-105"
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function parseTimeToMinutes(t: string | null): number {
  if (!t) return 24 * 60 + 1;
  const s = t.trim().toLowerCase();
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!m) return 24 * 60;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + min;
}

function CalendarView({
  bookings,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelect,
}: {
  bookings: Booking[];
  month: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelect: (id: string) => void;
}) {
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDay = new Date(year, monthIdx, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const byDay = new Map<string, Booking[]>();
  for (const b of bookings) {
    if (!b.preferred_day) continue;
    const list = byDay.get(b.preferred_day) ?? [];
    list.push(b);
    byDay.set(b.preferred_day, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => parseTimeToMinutes(a.preferred_time) - parseTimeToMinutes(b.preferred_time));
  }

  const unscheduled = bookings.filter((b) => !b.preferred_day).length;
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells: { date: Date; key: string; inMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(year, monthIdx, i - startOffset + 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({ date: d, key, inMonth: d.getMonth() === monthIdx });
  }

  return (
    <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-4">
        <h2 className="font-display text-2xl font-bold">
          {MONTH_NAMES[monthIdx]} {year}
        </h2>
        <div className="flex items-center gap-2">
          {unscheduled > 0 && (
            <span className="text-xs text-muted-foreground">
              {unscheduled} without preferred day
            </span>
          )}
          <button
            onClick={onPrevMonth}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
          >
            ‹ Prev
          </button>
          <button
            onClick={onToday}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
          >
            Today
          </button>
          <button
            onClick={onNextMonth}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
          >
            Next ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-border/60 text-sm">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-secondary/60 px-2 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((c) => {
          const items = byDay.get(c.key) ?? [];
          const isToday = c.key === todayStr;
          return (
            <div
              key={c.key}
              className={`min-h-[110px] bg-card p-2 flex flex-col gap-1 ${
                c.inMonth ? "" : "opacity-45"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? "rounded-full bg-primary text-primary-foreground px-2 py-0.5"
                      : "text-muted-foreground"
                  }`}
                >
                  {c.date.getDate()}
                </span>
                {items.length > 0 && (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {items.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelect(b.id)}
                    className="text-left rounded-md bg-secondary/70 hover:bg-secondary px-2 py-1 text-[11px] leading-tight"
                    title={`${b.name} · ${b.service}`}
                  >
                    <div className="font-semibold truncate">
                      {b.preferred_time ?? "—"}
                    </div>
                    <div className="truncate text-muted-foreground">{b.name}</div>
                  </button>
                ))}
                {items.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">
                    +{items.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}