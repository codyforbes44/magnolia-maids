import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatPhone, type ContactForm } from "./quote-schema";

const field =
  "mt-1 w-full rounded-xl border border-border bg-card px-3 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</span>;
}

export function QuoteContactForm({
  form,
  errors,
  onChange,
  onBlurField,
}: {
  form: ContactForm;
  errors: Record<string, string>;
  onChange: (patch: Partial<ContactForm>) => void;
  onBlurField: (key: keyof ContactForm) => void;
}) {
  const [showOptional, setShowOptional] = useState(Boolean(form.address || form.notes));

  const err = (key: string) =>
    errors[key] ? (
      <span id={`${key}-error`} role="alert" className="mt-1 block text-xs text-destructive">
        {errors[key]}
      </span>
    ) : null;

  const a11y = (key: string) => ({
    "aria-invalid": errors[key] ? (true as const) : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block" data-field="name">
        <Label>Name</Label>
        <input
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onBlur={() => onBlurField("name")}
          className={field}
          autoComplete="name"
          required
          {...a11y("name")}
        />
        {err("name")}
      </label>

      <label className="block" data-field="email">
        <Label>Email</Label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange({ email: e.target.value })}
          onBlur={() => onBlurField("email")}
          className={field}
          autoComplete="email"
          inputMode="email"
          required
          {...a11y("email")}
        />
        {err("email")}
      </label>

      <label className="block" data-field="phone">
        <Label>Phone (so we can text your slot)</Label>
        <input
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => onChange({ phone: formatPhone(e.target.value) })}
          onBlur={() => onBlurField("phone")}
          className={field}
          autoComplete="tel"
          inputMode="tel"
          placeholder="(580) 745-0045"
          {...a11y("phone")}
        />
        {err("phone")}
      </label>

      <label className="block">
        <Label>Preferred day</Label>
        <input
          type="date"
          value={form.preferredDate ?? ""}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange({ preferredDate: e.target.value })}
          className={field}
        />
      </label>

      <label className="block sm:col-span-2">
        <Label>Preferred time</Label>
        <select
          value={form.preferredTime ?? ""}
          onChange={(e) => onChange({ preferredTime: e.target.value })}
          className={field}
        >
          <option value="">No preference</option>
          <option>Morning (8–11am)</option>
          <option>Midday (11am–2pm)</option>
          <option>Afternoon (2–5pm)</option>
        </select>
      </label>

      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          aria-expanded={showOptional}
          className="tap-target inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showOptional ? "rotate-180" : ""}`} />
          Add address or notes (optional)
        </button>

        {showOptional && (
          <div className="mt-3 grid gap-4">
            <label className="block">
              <Label>Address</Label>
              <input
                value={form.address ?? ""}
                onChange={(e) => onChange({ address: e.target.value })}
                className={field}
                autoComplete="street-address"
              />
            </label>
            <label className="block">
              <Label>Anything we should know?</Label>
              <textarea
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) => onChange({ notes: e.target.value })}
                className={field}
                placeholder="Gate codes, pets, parking, priorities…"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
