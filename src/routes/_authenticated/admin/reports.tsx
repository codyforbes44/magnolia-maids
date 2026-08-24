import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Printer, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { StatCard, downloadCSV } from "@/components/admin/ui";
import { buildItemizedReport, type ItemizedReport } from "@/lib/admin/reports.functions";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [
      { title: "Admin — Itemized Report | Magnolia Maids" },
      {
        name: "description",
        content: "Download an itemized report of Magnolia Maids leads, bookings, and applicants.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

const PRINT_CSS = `
@page { size: letter landscape; margin: 0.4in; }
@media print {
  .no-print { display: none !important; }
  html, body { background: #fff !important; }
  .report-sheet { border: 0 !important; }
  table { font-size: 8px !important; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
}
`;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function countBy<T extends { status: string }>(rows: T[]) {
  const out = new Map<string, number>();
  for (const r of rows) out.set(r.status, (out.get(r.status) ?? 0) + 1);
  return [...out.entries()].sort((a, b) => b[1] - a[1]);
}

function Table({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">
        {caption} <span className="text-muted-foreground">({rows.length})</span>
      </h2>
      <div className="mt-2 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead className="bg-secondary/60">
            <tr>
              <th className="px-2 py-2 font-bold uppercase tracking-wide">#</th>
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-2 font-bold uppercase tracking-wide">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-2 py-3 text-muted-foreground" colSpan={columns.length + 1}>
                  Nothing in this date range.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={String(r.id)} className="border-t border-border/50 align-top">
                <td className="px-2 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-2 py-2">
                    {c.key === "created_at"
                      ? fmtDate(String(r.created_at))
                      : ((r[c.key] as string) ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const LEAD_COLS = [
  { key: "created_at", label: "Received" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "campaign", label: "Campaign" },
  { key: "source", label: "Source" },
  { key: "home_size", label: "Home size" },
  { key: "preferred_date", label: "Preferred date" },
  { key: "contact_pref", label: "Contact pref" },
  { key: "status", label: "Status" },
];

const BOOKING_COLS = [
  { key: "created_at", label: "Requested" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "service", label: "Service" },
  { key: "frequency", label: "Frequency" },
  { key: "bedrooms", label: "Bd" },
  { key: "bathrooms", label: "Ba" },
  { key: "preferred_day", label: "Day" },
  { key: "preferred_time", label: "Time" },
  { key: "address", label: "Address" },
  { key: "status", label: "Status" },
];

const APPLICANT_COLS = [
  { key: "created_at", label: "Applied" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "role", label: "Role" },
  { key: "employment_type", label: "Type" },
  { key: "area", label: "Area" },
  { key: "availability", label: "Availability" },
  { key: "contact_pref", label: "Contact pref" },
  { key: "status", label: "Status" },
];

function ReportsPage() {
  const run = useServerFn(buildItemizedReport);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<ItemizedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (range: { from: string; to: string }) => {
      setLoading(true);
      setError(null);
      try {
        setReport(await run({ data: range }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't build the report.");
      } finally {
        setLoading(false);
      }
    },
    [run],
  );

  useEffect(() => {
    void load({ from: "", to: "" });
  }, [load]);

  function exportSection(name: string, cols: { key: string; label: string }[], rows: any[]) {
    downloadCSV(
      `magnolia-maids-${name}`,
      cols.map((c) => c.label),
      rows.map((r) => Object.fromEntries(cols.map((c) => [c.label, r[c.key] ?? ""]))),
    );
  }

  function exportCombined() {
    if (!report) return;
    const headers = ["Record type", "Date", "Name", "Email", "Phone", "Details", "Status"];
    const rows = [
      ...report.leads.map((l) => ({
        "Record type": "Lead",
        Date: l.created_at,
        Name: l.name,
        Email: l.email,
        Phone: l.phone ?? "",
        Details: [l.campaign, l.source, l.home_size].filter(Boolean).join(" · "),
        Status: l.status,
      })),
      ...report.bookings.map((b) => ({
        "Record type": "Booking",
        Date: b.created_at,
        Name: b.name,
        Email: b.email,
        Phone: b.phone ?? "",
        Details: [b.service, b.frequency, b.address].filter(Boolean).join(" · "),
        Status: b.status,
      })),
      ...report.applicants.map((a) => ({
        "Record type": "Applicant",
        Date: a.created_at,
        Name: a.name,
        Email: a.email,
        Phone: a.phone ?? "",
        Details: [a.role, a.employment_type, a.area].filter(Boolean).join(" · "),
        Status: a.status,
      })),
    ].sort((x, y) => (x.Date < y.Date ? 1 : -1));
    downloadCSV("magnolia-maids-itemized-report", headers, rows);
  }

  const btn =
    "tap-target inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition";

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <AdminPageHeader
        title="Itemized report"
        description="Every lead, booking, and applicant on record — filter by date, download as CSV, or print to PDF."
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => void load({ from, to })}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button type="button" className={btn} onClick={exportCombined} disabled={!report}>
              <Download className="h-4 w-4" /> Combined CSV
            </button>
            <button
              type="button"
              className="tap-target inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Print / save PDF
            </button>
          </div>
        }
      />

      <div className="no-print mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
          />
        </label>
        <button type="button" className={btn} onClick={() => void load({ from, to })}>
          Apply range
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setFrom("");
            setTo("");
            void load({ from: "", to: "" });
          }}
        >
          Clear
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-muted-foreground">Building report…</p>}

      {report && !loading && (
        <div className="report-sheet">
          <p className="mb-4 text-xs text-muted-foreground">
            Magnolia Maids · Durant, OK · Generated {fmtDate(report.generatedAt)}
            {report.from || report.to
              ? ` · Range ${report.from ?? "start"} → ${report.to ?? "today"}`
              : " · All records"}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Leads"
              value={report.leads.length}
              hint={countBy(report.leads)
                .map(([s, n]) => `${n} ${s}`)
                .join(" · ")}
            />
            <StatCard
              label="Bookings"
              value={report.bookings.length}
              tone="accent"
              hint={countBy(report.bookings)
                .map(([s, n]) => `${n} ${s}`)
                .join(" · ")}
            />
            <StatCard
              label="Applicants"
              value={report.applicants.length}
              hint={countBy(report.applicants)
                .map(([s, n]) => `${n} ${s}`)
                .join(" · ")}
            />
          </div>

          <div className="no-print mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={btn}
              onClick={() => exportSection("leads", LEAD_COLS, report.leads)}
            >
              <Download className="h-4 w-4" /> Leads CSV
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => exportSection("bookings", BOOKING_COLS, report.bookings)}
            >
              <Download className="h-4 w-4" /> Bookings CSV
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => exportSection("applicants", APPLICANT_COLS, report.applicants)}
            >
              <Download className="h-4 w-4" /> Applicants CSV
            </button>
          </div>

          <Table caption="Leads" columns={LEAD_COLS} rows={report.leads as any} />
          <Table caption="Bookings" columns={BOOKING_COLS} rows={report.bookings as any} />
          <Table caption="Applicants" columns={APPLICANT_COLS} rows={report.applicants as any} />

          <p className="mt-8 border-t border-border/60 pt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Magnolia Maids · Confidential · magnoliamaids.pro · (580) 745-0045
          </p>
        </div>
      )}
    </div>
  );
}
