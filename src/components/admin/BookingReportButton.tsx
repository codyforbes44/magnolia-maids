import { Printer } from "lucide-react";

type BookingLike = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string;
  bedrooms: string | number;
  bathrooms: string | number;
  service: string;
  frequency: string;
  preferred_day: string | null;
  preferred_time: string | null;
  notes: string | null;
  admin_notes?: string | null;
  status: string;
  created_at: string;
  contact_pref?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
};

function esc(v: unknown) {
  const s = v == null || v === "" ? "—" : String(v);
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

function row(label: string, value: unknown) {
  return `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`;
}

function reportHTML(b: BookingLike) {
  const received = new Date(b.created_at).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const generated = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const ref = b.id.slice(0, 8).toUpperCase();

  return `<!doctype html><html><head><meta charset="utf-8" />
<title>Magnolia Maids — Booking ${ref}</title>
<style>
  @page { size: letter portrait; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #22281f; margin: 0; }
  .head { display: flex; justify-content: space-between; align-items: flex-end;
          border-bottom: 3px solid #3f5b3a; padding-bottom: 12px; }
  .brand { font-size: 24px; font-weight: 700; letter-spacing: .02em; color: #3f5b3a; }
  .sub { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #7a7f74; margin-top: 4px; }
  .ref { text-align: right; font-size: 11px; color: #7a7f74; line-height: 1.6; }
  h1 { font-size: 19px; margin: 22px 0 2px; }
  .status { display: inline-block; margin-top: 6px; border: 1px solid #b08d4f; color: #8a6b2f;
            border-radius: 999px; padding: 3px 12px; font-size: 10px; letter-spacing: .14em;
            text-transform: uppercase; font-family: Helvetica, Arial, sans-serif; }
  h2 { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #7a7f74;
       margin: 24px 0 6px; border-bottom: 1px solid #e2e0d6; padding-bottom: 4px;
       font-family: Helvetica, Arial, sans-serif; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { text-align: left; width: 34%; font-weight: 600; color: #5c6355; padding: 5px 8px 5px 0;
       vertical-align: top; }
  td { padding: 5px 0; vertical-align: top; }
  tr + tr th, tr + tr td { border-top: 1px solid #f0efe7; }
  .box { border: 1px solid #e2e0d6; border-radius: 8px; padding: 10px 12px; font-size: 12.5px;
         white-space: pre-wrap; min-height: 46px; }
  .lines div { border-bottom: 1px solid #d8d6cb; height: 26px; }
  .sign { display: flex; gap: 28px; margin-top: 28px; }
  .sign div { flex: 1; border-top: 1px solid #22281f; padding-top: 5px; font-size: 10px;
              letter-spacing: .12em; text-transform: uppercase; color: #7a7f74;
              font-family: Helvetica, Arial, sans-serif; }
  footer { margin-top: 30px; border-top: 1px solid #e2e0d6; padding-top: 8px; font-size: 9px;
           letter-spacing: .16em; text-transform: uppercase; color: #9a9b91;
           font-family: Helvetica, Arial, sans-serif; text-align: center; }
</style></head><body>
  <div class="head">
    <div>
      <div class="brand">Magnolia Maids</div>
      <div class="sub">Durant, Oklahoma</div>
    </div>
    <div class="ref">
      Booking #${esc(ref)}<br />Generated ${esc(generated)}
    </div>
  </div>

  <h1>Booking request report</h1>
  <div class="status">${esc(b.status)}</div>

  <h2>Customer</h2>
  <table>
    ${row("Name", b.name)}
    ${row("Email", b.email)}
    ${row("Phone", b.phone)}
    ${row("Preferred contact", b.contact_pref)}
    ${row("Service address", b.address)}
  </table>

  <h2>Service details</h2>
  <table>
    ${row("Service", b.service)}
    ${row("Frequency", b.frequency)}
    ${row("Home size", `${b.bedrooms} bd · ${b.bathrooms} ba`)}
    ${row("Preferred day", b.preferred_day)}
    ${row("Preferred time", b.preferred_time)}
  </table>

  <h2>Record</h2>
  <table>
    ${row("Received", received)}
    ${row("Status", b.status)}
    ${row("Source", b.utm_source)}
    ${row("Campaign", b.utm_campaign)}
    ${row("Reference", b.id)}
  </table>

  <h2>Customer notes</h2>
  <div class="box">${esc(b.notes)}</div>

  <h2>Internal notes</h2>
  <div class="box">${esc(b.admin_notes)}</div>

  <h2>Visit log</h2>
  <div class="box lines"><div></div><div></div><div></div><div></div></div>

  <div class="sign">
    <div>Team member</div>
    <div>Date completed</div>
    <div>Customer initials</div>
  </div>

  <footer>Magnolia Maids · Confidential · magnoliamaids.pro · (580) 745-0045</footer>
</body></html>`;
}

export function BookingReportButton({
  booking,
  className,
}: {
  booking: BookingLike;
  className?: string;
}) {
  function print() {
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) {
      alert("Please allow pop-ups to print this report.");
      return;
    }
    w.document.open();
    w.document.write(reportHTML(booking));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  }

  return (
    <button
      type="button"
      onClick={print}
      className={
        className ??
        "tap-target inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary transition"
      }
    >
      <Printer className="h-4 w-4" /> Print booking report
    </button>
  );
}
