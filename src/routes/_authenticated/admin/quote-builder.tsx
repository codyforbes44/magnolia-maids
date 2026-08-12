import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Printer, RotateCcw, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, FieldGroup, inputClass } from "@/components/admin/ui";
import markUrl from "@/assets/magnolia-mark.webp";
import {
  ADDONS,
  BATH_MAX,
  BATH_MIN,
  BED_MAX,
  BED_MIN,
  FREQUENCY_RATES,
  SERVICE_RATES,
  addonsTotal,
  clampBaths,
  clampBeds,
  countLabel,
  getAddon,
  getServiceRate,
  priceHome,
  serviceLabel,
  SQFT_BANDS,
  getSqftBand,
  INCLUDED_BEDROOMS,
  INCLUDED_BATHROOMS,
  type AddonKey,
  type FrequencyKey,
  type ServiceKey,
  type SqftBandKey,
} from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin/quote-builder")({
  head: () => ({
    meta: [
      { title: "Admin — Quote Builder | Magnolia Maids" },
      {
        name: "description",
        content:
          "Capture client details over the phone, watch the price update live, and print a formal quote.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuoteBuilderPage,
});

const BUSINESS = {
  name: "Magnolia Maids",
  tagline: "Premium residential cleaning — Durant, Oklahoma",
  phone: "(580) 745-0045",
  email: "hello@magnoliamaids.pro",
  site: "magnoliamaids.pro",
  address: "Serving Durant, Bryan County & Lake Texoma",
};

type LineItem = { id: string; label: string; amount: number };

type Client = {
  name: string;
  phone: string;
  email: string;
  address: string;
  preferredDate: string;
  notes: string;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function newQuoteNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MM-${stamp}-${rand}`;
}

function QuoteBuilderPage() {
  const [client, setClient] = useState<Client>({
    name: "",
    phone: "",
    email: "",
    address: "",
    preferredDate: "",
    notes: "",
  });
  const [service, setService] = useState<ServiceKey>("Standard Clean");
  const [frequency, setFrequency] = useState<FrequencyKey>("Biweekly");
  const [bedrooms, setBedrooms] = useState(INCLUDED_BEDROOMS);
  const [bathrooms, setBathrooms] = useState(INCLUDED_BATHROOMS);
  const [sqft, setSqft] = useState<SqftBandKey>("s");
  const [addons, setAddons] = useState<AddonKey[]>([]);
  const [conditionPct, setConditionPct] = useState(0);
  const [travelFee, setTravelFee] = useState(0);
  const [courtesy, setCourtesy] = useState(0);
  const [custom, setCustom] = useState<LineItem[]>([]);
  const [quoteNumber, setQuoteNumber] = useState(newQuoteNumber);

  const recurring = getServiceRate(service).recurring;
  const effectiveFrequency: FrequencyKey = recurring ? frequency : "One-time";

  const q = useMemo(() => {
    const base = priceHome({
      service,
      frequency: effectiveFrequency,
      bedrooms,
      bathrooms,
      sqft,
    });
    const extras = addonsTotal(addons);
    const condition = Math.round((base.total + extras) * (conditionPct / 100));
    const customTotal = custom.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);
    const subtotal = base.total + extras + condition + travelFee + customTotal;
    const total = Math.max(0, subtotal - courtesy);
    return { base, extras, condition, customTotal, subtotal, total };
  }, [
    service,
    effectiveFrequency,
    bedrooms,
    bathrooms,
    sqft,
    addons,
    conditionPct,
    travelFee,
    courtesy,
    custom,
  ]);

  const today = new Date();
  const validUntil = new Date(today.getTime() + 14 * 86400000);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  function toggleAddon(key: AddonKey) {
    setAddons((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function resetAll() {
    setClient({ name: "", phone: "", email: "", address: "", preferredDate: "", notes: "" });
    setService("Standard Clean");
    setFrequency("Biweekly");
    setBedrooms(INCLUDED_BEDROOMS);
    setBathrooms(INCLUDED_BATHROOMS);
    setSqft("s");
    setAddons([]);
    setConditionPct(0);
    setTravelFee(0);
    setCourtesy(0);
    setCustom([]);
    setQuoteNumber(newQuoteNumber());
  }

  const extraBeds = Math.max(0, bedrooms - INCLUDED_BEDROOMS);
  const extraBaths = Math.max(0, bathrooms - INCLUDED_BATHROOMS);
  const rate = getServiceRate(service);

  /** Line rows shared by the on-screen summary and the printed quote. */
  const rows: { label: string; detail?: string; amount: number }[] = [
    {
      label: serviceLabel(service),
      detail: `Includes ${INCLUDED_BEDROOMS} bedrooms / ${INCLUDED_BATHROOMS} bathrooms`,
      amount: rate.base,
    },
    ...(extraBeds > 0
      ? [{ label: `Additional bedrooms (${extraBeds})`, amount: extraBeds * rate.perBed }]
      : []),
    ...(extraBaths > 0
      ? [
          {
            label: `Additional bathrooms (${countLabel(extraBaths)})`,
            amount: Math.round(extraBaths * rate.perBath),
          },
        ]
      : []),
    ...(q.base.sizeUpcharge > 0
      ? [
          {
            label: "Home size adjustment",
            detail: `${getSqftBand(sqft)?.short} · x${q.base.sizeMultiplier}`,
            amount: q.base.sizeUpcharge,
          },
        ]
      : []),
    ...(q.base.discount > 0
      ? [
          {
            label: `${effectiveFrequency} plan discount`,
            detail: `${Math.round(q.base.discount * 100)}% off recurring visits`,
            amount: -q.base.savings,
          },
        ]
      : []),
    ...addons.map((k) => ({
      label: getAddon(k)?.label ?? k,
      amount: getAddon(k)?.price ?? 0,
    })),
    ...(q.condition !== 0
      ? [
          {
            label: conditionPct > 0 ? "Condition & pet adjustment" : "Condition adjustment",
            detail: `${conditionPct > 0 ? "+" : ""}${conditionPct}%`,
            amount: q.condition,
          },
        ]
      : []),
    ...(travelFee !== 0 ? [{ label: "Travel outside Durant", amount: travelFee }] : []),
    ...custom
      .filter((l) => l.label.trim() || l.amount)
      .map((l) => ({ label: l.label.trim() || "Custom item", amount: l.amount || 0 })),
    ...(courtesy !== 0
      ? [{ label: "Courtesy discount", amount: -Math.abs(courtesy) }]
      : []),
  ];

  return (
    <>
      <div className="no-print">
        <AdminPageHeader
          title="Verbal quote builder"
          description="Take the details as the client talks. The price updates live, then print a formal quote."
          actions={
            <>
              <button
                type="button"
                onClick={resetAll}
                className="tap-target inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                <RotateCcw className="h-4 w-4" /> New quote
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="tap-target inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Printer className="h-4 w-4" /> Print / Save as PDF
              </button>
            </>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="grid gap-6">
            <SectionCard title="Client" description="Captured while you're on the call.">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Name">
                  <input
                    className={inputClass}
                    value={client.name}
                    maxLength={100}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    placeholder="Isabela Rivera"
                  />
                </FieldGroup>
                <FieldGroup label="Phone">
                  <input
                    className={inputClass}
                    value={client.phone}
                    maxLength={20}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    placeholder="(580) 555-0134"
                  />
                </FieldGroup>
                <FieldGroup label="Email">
                  <input
                    className={inputClass}
                    value={client.email}
                    maxLength={255}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    placeholder="client@example.com"
                  />
                </FieldGroup>
                <FieldGroup label="Requested date">
                  <input
                    type="date"
                    className={inputClass}
                    value={client.preferredDate}
                    onChange={(e) => setClient({ ...client, preferredDate: e.target.value })}
                  />
                </FieldGroup>
                <div className="sm:col-span-2">
                  <FieldGroup label="Service address">
                    <input
                      className={inputClass}
                      value={client.address}
                      maxLength={200}
                      onChange={(e) => setClient({ ...client, address: e.target.value })}
                      placeholder="123 W Main St, Durant, OK 74701"
                    />
                  </FieldGroup>
                </div>
                <div className="sm:col-span-2">
                  <FieldGroup label="Notes for the quote">
                    <textarea
                      rows={3}
                      maxLength={1000}
                      className={inputClass}
                      value={client.notes}
                      onChange={(e) => setClient({ ...client, notes: e.target.value })}
                      placeholder="Two dogs, hardwood throughout, gate code 1420…"
                    />
                  </FieldGroup>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Scope" description="Every change re-prices instantly.">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Service">
                  <select
                    className={inputClass}
                    value={service}
                    onChange={(e) => setService(e.target.value as ServiceKey)}
                  >
                    {SERVICE_RATES.map((r) => (
                      <option key={r.key} value={r.key}>
                        {serviceLabel(r.key)} — {money(r.base)} base
                      </option>
                    ))}
                  </select>
                </FieldGroup>
                <FieldGroup label="Frequency">
                  <select
                    className={inputClass}
                    value={effectiveFrequency}
                    disabled={!recurring}
                    onChange={(e) => setFrequency(e.target.value as FrequencyKey)}
                  >
                    {FREQUENCY_RATES.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.key}
                        {f.discount ? ` — ${Math.round(f.discount * 100)}% off` : ""}
                      </option>
                    ))}
                  </select>
                  {!recurring && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {serviceLabel(service)} is a one-time service.
                    </p>
                  )}
                </FieldGroup>
                <FieldGroup label={`Bedrooms (${bedrooms})`}>
                  <input
                    type="range"
                    min={BED_MIN}
                    max={BED_MAX}
                    step={1}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(clampBeds(Number(e.target.value)))}
                    className="w-full accent-[var(--primary)]"
                  />
                </FieldGroup>
                <FieldGroup label={`Bathrooms (${countLabel(bathrooms)})`}>
                  <input
                    type="range"
                    min={BATH_MIN}
                    max={BATH_MAX}
                    step={0.5}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(clampBaths(Number(e.target.value)))}
                    className="w-full accent-[var(--primary)]"
                  />
                </FieldGroup>
                <FieldGroup label="Home size (sq ft)">
                  <select
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value as SqftBandKey)}
                    className={inputClass}
                  >
                    {SQFT_BANDS.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.label}
                        {b.multiplier > 1 ? ` — x${b.multiplier}` : ""}
                      </option>
                    ))}
                  </select>
                </FieldGroup>
              </div>

              <div className="mt-5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Add-ons
                </span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ADDONS.map((a) => {
                    const on = addons.includes(a.key);
                    return (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => toggleAddon(a.key)}
                        aria-pressed={on}
                        className={`tap-target flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                          on ? "border-primary bg-primary/5 font-semibold" : "border-border"
                        }`}
                      >
                        <span>{a.label}</span>
                        <span className="tabular-nums text-muted-foreground">
                          +{money(a.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Adjustments"
              description="Condition, travel, courtesy discounts, and anything custom."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup label={`Condition / pets (${conditionPct > 0 ? "+" : ""}${conditionPct}%)`}>
                  <input
                    type="range"
                    min={-10}
                    max={40}
                    step={5}
                    value={conditionPct}
                    onChange={(e) => setConditionPct(Number(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                </FieldGroup>
                <FieldGroup label="Travel fee ($)">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    className={inputClass}
                    value={travelFee || ""}
                    onChange={(e) => setTravelFee(Math.max(0, Number(e.target.value) || 0))}
                  />
                </FieldGroup>
                <FieldGroup label="Courtesy discount ($)">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    className={inputClass}
                    value={courtesy || ""}
                    onChange={(e) => setCourtesy(Math.max(0, Number(e.target.value) || 0))}
                  />
                </FieldGroup>
              </div>

              <div className="mt-5 grid gap-2">
                {custom.map((l, i) => (
                  <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_120px_auto] gap-2">
                    <input
                      className={inputClass}
                      placeholder="Custom line item"
                      maxLength={80}
                      value={l.label}
                      onChange={(e) =>
                        setCustom(custom.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))
                      }
                    />
                    <input
                      type="number"
                      className={inputClass}
                      value={l.amount || ""}
                      onChange={(e) =>
                        setCustom(
                          custom.map((x, xi) =>
                            xi === i ? { ...x, amount: Number(e.target.value) || 0 } : x,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove line item"
                      onClick={() => setCustom(custom.filter((_, xi) => xi !== i))}
                      className="tap-target rounded-xl border border-border px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setCustom([
                      ...custom,
                      { id: `${Date.now()}-${custom.length}`, label: "", amount: 0 },
                    ])
                  }
                  className="tap-target inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  <Plus className="h-4 w-4" /> Add custom line
                </button>
              </div>
            </SectionCard>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Live quote</h2>
              <dl className="mt-4 grid gap-2 text-sm">
                {rows.map((r, i) => (
                  <div key={`${r.label}-${i}`} className="flex items-baseline justify-between gap-3">
                    <dt className="min-w-0">
                      <span className="block truncate">{r.label}</span>
                      {r.detail && (
                        <span className="block text-xs text-muted-foreground">{r.detail}</span>
                      )}
                    </dt>
                    <dd className="shrink-0 tabular-nums">{money(r.amount)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {money(q.total)}
                </span>
              </div>
              {recurring && q.base.discount > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Per visit on the {effectiveFrequency.toLowerCase()} plan.
                </p>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="tap-target mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                <Printer className="h-4 w-4" /> Print formal quote (PDF)
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Quote {quoteNumber} · valid through {fmtDate(validUntil)}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ---------- Printed document ---------- */}
      <div className="print-sheet hidden">
        <header className="flex items-start justify-between gap-6 border-b-2 border-black/80 pb-4">
          <div className="flex items-center gap-3">
            <img src={markUrl} alt="" className="h-14 w-14 object-contain" />
            <div>
              <div className="font-display text-2xl font-semibold">{BUSINESS.name}</div>
              <div className="text-xs">{BUSINESS.tagline}</div>
            </div>
          </div>
          <div className="text-right text-xs leading-5">
            <div className="text-sm font-semibold uppercase tracking-widest">Service Quote</div>
            <div>{quoteNumber}</div>
            <div>{fmtDate(today)}</div>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-6 text-xs leading-5">
          <div>
            <div className="mb-1 font-semibold uppercase tracking-widest">Prepared for</div>
            <div className="text-sm font-semibold">{client.name || "—"}</div>
            {client.address && <div>{client.address}</div>}
            {client.phone && <div>{client.phone}</div>}
            {client.email && <div>{client.email}</div>}
            {client.preferredDate && <div>Requested date: {client.preferredDate}</div>}
          </div>
          <div className="text-right">
            <div className="mb-1 font-semibold uppercase tracking-widest">Prepared by</div>
            <div className="text-sm font-semibold">{BUSINESS.name}</div>
            <div>{BUSINESS.address}</div>
            <div>{BUSINESS.phone}</div>
            <div>{BUSINESS.email}</div>
            <div>{BUSINESS.site}</div>
          </div>
        </section>

        <section className="mt-6">
          <div className="text-xs">
            <span className="font-semibold uppercase tracking-widest">Scope: </span>
            {serviceLabel(service)} · {countLabel(bedrooms)} bd / {countLabel(bathrooms)} ba ·{" "}
            {effectiveFrequency}
          </div>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-black/40 text-left text-xs uppercase tracking-widest">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`p-${r.label}-${i}`} className="border-b border-black/10">
                  <td className="py-2 pr-4">
                    {r.label}
                    {r.detail && <div className="text-xs opacity-70">{r.detail}</div>}
                  </td>
                  <td className="py-2 text-right tabular-nums">{money(r.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black/80">
                <td className="py-3 text-right pr-4 font-semibold uppercase tracking-widest text-xs">
                  Total{recurring && q.base.discount > 0 ? " per visit" : ""}
                </td>
                <td className="py-3 text-right font-display text-2xl font-semibold tabular-nums">
                  {money(q.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {client.notes && (
          <section className="mt-5 text-xs leading-5">
            <div className="font-semibold uppercase tracking-widest">Notes</div>
            <p className="mt-1 whitespace-pre-wrap">{client.notes}</p>
          </section>
        )}

        <section className="mt-6 border-t border-black/30 pt-4 text-[11px] leading-5">
          <div className="font-semibold uppercase tracking-widest">Terms</div>
          <ul className="mt-1 list-disc pl-4">
            <li>This quote is valid through {fmtDate(validUntil)}.</li>
            <li>
              Pricing assumes the home condition described at the time of the quote. Significant
              differences on arrival are discussed with you before any change.
            </li>
            <li>
              Recurring plan pricing requires the visit interval quoted above; discounts end if the
              plan is discontinued.
            </li>
            <li>Bonded and insured. Cancellations inside 24 hours may incur a trip fee.</li>
            <li>Payment is due on completion of the visit unless otherwise arranged.</li>
          </ul>
          <p className="mt-4">
            Thank you for considering {BUSINESS.name} — questions? Call {BUSINESS.phone}.
          </p>
        </section>
      </div>
    </>
  );
}
