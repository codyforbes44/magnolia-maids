import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import mark from "@/assets/magnolia-mark.webp";
import { SERVICE_RATES, serviceLabel, ADDONS, FREQUENCY_RATES } from "@/lib/pricing";

export const Route = createFileRoute("/new-client-form")({
  component: NewClientForm,
  head: () => ({
    meta: [
      { title: "Printable New Client Booking Form | Magnolia Maids" },
      {
        name: "description",
        content:
          "One-page printable intake form for collecting new Magnolia Maids client details, home info, entry access, and service preferences by hand.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Printable New Client Booking Form | Magnolia Maids" },
      {
        property: "og:description",
        content: "Print-and-fill intake sheet for new Magnolia Maids clients in Durant, OK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const PRINT_CSS = `
@page { size: letter portrait; margin: 0.4in; }
@media print {
  .no-print { display: none !important; }
  html, body { background: #fff !important; }
  .sheet { box-shadow: none !important; border: 0 !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
}
`;

/** Ruled write-in line. */
function Line({ label, className = "" }: { label: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className="mt-2 block h-[18px] border-b border-foreground/35" />
    </label>
  );
}

function Box({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className="inline-block h-[9px] w-[9px] shrink-0 border border-foreground/60" />
      <span className="text-[9px] leading-none">{label}</span>
    </span>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-2.5">
      <h2 className="mb-1.5 flex items-center gap-1.5 border-b border-foreground/25 pb-1 text-[9px] font-bold uppercase tracking-[0.16em]">
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function NewClientForm() {
  return (
    <main className="min-h-screen bg-muted/40 py-6 print:py-0">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print mx-auto mb-4 flex max-w-[8.5in] items-center justify-between gap-3 px-4">
        <p className="text-sm text-muted-foreground">
          Print this sheet to collect new client details by hand, then enter them in the admin dashboard.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Printer className="h-4 w-4" />
          Print form
        </button>
      </div>

      <div className="sheet mx-auto w-[8.5in] max-w-full border border-border bg-card px-[0.45in] py-[0.35in] text-foreground shadow-sm print:w-full">
        <header className="flex items-end justify-between gap-4 border-b-2 border-primary pb-2">
          <div className="flex items-center gap-2">
            <img src={mark} alt="Magnolia Maids" className="h-9 w-9 object-contain" />
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em]">Magnolia Maids</p>
              <p className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                New Client Booking Form · Durant, OK
              </p>
            </div>
          </div>
          <div className="text-right text-[8px] leading-snug text-muted-foreground">
            <p>(580) 745-0045 · hello@magnoliamaids.pro</p>
            <p>magnoliamaids.pro</p>
            <p className="mt-1">
              Date: <span className="inline-block w-20 border-b border-foreground/35" /> Taken by:{" "}
              <span className="inline-block w-16 border-b border-foreground/35" />
            </p>
          </div>
        </header>

        <Section n={1} title="Client contact">
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
            <Line label="Full name" />
            <Line label="Phone" />
            <Line label="Email" />
            <Line label="Service address" className="col-span-2" />
            <Line label="Apt / unit" />
            <Line label="City" />
            <Line label="State / ZIP" />
            <Line label="Best way to reach you (call / text / email)" />
          </div>
        </Section>

        <Section n={2} title="Home details">
          <div className="grid grid-cols-4 gap-x-4 gap-y-1.5">
            <Line label="Bedrooms" />
            <Line label="Bathrooms" />
            <Line label="Approx. sq ft" />
            <Line label="Stories / levels" />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Pets:</span>
            <Box label="None" />
            <Box label="Dog(s)" />
            <Box label="Cat(s)" />
            <Box label="Other" />
            <span className="text-[9px]">
              Names / where they stay: <span className="inline-block w-56 border-b border-foreground/35" />
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4">
            <Line label="Rooms to skip" />
            <Line label="Priority / focus areas" />
          </div>
        </Section>

        <Section n={3} title="Service requested">
          <div className="grid grid-cols-4 gap-x-3 gap-y-1.5">
            {SERVICE_RATES.map((s) => (
              <Box key={s.key} label={`${serviceLabel(s.key)} — from $${s.base}`} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Frequency:</span>
            {FREQUENCY_RATES.map((f) => (
              <Box
                key={f.key}
                label={f.discount ? `${f.key} (−${Math.round(f.discount * 100)}%)` : f.key}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Add-ons:</span>
            {ADDONS.map((a) => (
              <Box key={a.key} label={`${a.label} +$${a.price}`} />
            ))}
          </div>
        </Section>

        <Section n={4} title="Scheduling">
          <div className="grid grid-cols-4 gap-x-4 gap-y-1.5">
            <Line label="1st choice date" />
            <Line label="2nd choice date" />
            <Line label="Preferred time" />
            <Line label="Recurring day of week" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Arrival window:</span>
            <Box label="Morning (8–11am)" />
            <Box label="Midday (11am–2pm)" />
            <Box label="Afternoon (2–5pm)" />
            <Box label="No preference" />
          </div>
        </Section>

        <Section n={5} title="Entry & access">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Box label="Someone home" />
            <Box label="Lockbox" />
            <Box label="Keypad / smart lock" />
            <Box label="Key on file" />
            <Box label="Garage code" />
            <Box label="Other" />
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-x-4 gap-y-1.5">
            <Line label="Code / lockbox location" />
            <Line label="Alarm instructions" />
            <Line label="Parking notes" />
          </div>
        </Section>

        <Section n={6} title="Preferences & notes">
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
            <Line label="Product / scent preference" />
            <Line label="Allergies or sensitivities" />
            <Line label="How did you hear about us?" />
          </div>
          <div className="mt-1.5">
            <span className="block text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Notes
            </span>
            <span className="mt-2 block h-[18px] border-b border-foreground/35" />
            <span className="mt-3 block h-[18px] border-b border-foreground/35" />
          </div>
        </Section>

        <Section n={7} title="Quote & authorization">
          <div className="grid grid-cols-4 gap-x-4 gap-y-1.5">
            <Line label="Quoted total $" />
            <Line label="Deposit collected $" />
            <Line label="Payment method" />
            <Line label="Booking confirmed (Y/N)" />
          </div>
          <p className="mt-2 text-[7.5px] leading-snug text-muted-foreground">
            I authorize Magnolia Maids to enter the address above on scheduled dates and confirm the access details are
            accurate. Rescheduling or cancellation within 24 hours may incur a fee. Rates are estimates until the first
            walkthrough.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-x-6">
            <Line label="Client signature" />
            <Line label="Date" />
          </div>
        </Section>

        <footer className="mt-3 border-t border-foreground/20 pt-1.5 text-center text-[7.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Magnolia Maids · Durant, OK · Bryan County &amp; Lake Texoma · magnoliamaids.pro
        </footer>
      </div>
    </main>
  );
}