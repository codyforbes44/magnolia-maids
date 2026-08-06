import { Bath, Check, DoorOpen, Leaf, Minus, PawPrint, Plus, Refrigerator, WashingMachine, Wind } from "lucide-react";
import {
  ADDONS,
  BATH_MAX,
  BATH_MIN,
  BED_MAX,
  BED_MIN,
  countLabel,
  type AddonKey,
} from "@/lib/pricing";

const ICONS = { Leaf, Refrigerator, Wind, WashingMachine, DoorOpen, Bath } as const;

/** +/- stepper. Bathrooms move in half steps so half baths are honest. */
export function CountStepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      <div className="flex items-center gap-2 rounded-2xl bg-secondary/40 border border-border p-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, Math.round((value - step) * 2) / 2))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="h-11 w-11 shrink-0 rounded-xl bg-card border border-border hover:border-primary/40 flex items-center justify-center transition disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center">
          <div className="font-display text-2xl font-semibold leading-none tabular-nums">{countLabel(value)}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{hint ?? label}</div>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, Math.round((value + step) * 2) / 2))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="h-11 w-11 shrink-0 rounded-xl bg-card border border-border hover:border-primary/40 flex items-center justify-center transition disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AddonPicker({
  selected,
  onToggle,
  columns = "sm:grid-cols-2 md:grid-cols-3",
}: {
  selected: readonly AddonKey[];
  onToggle: (key: AddonKey) => void;
  columns?: string;
}) {
  return (
    <div className={`grid gap-3 ${columns}`}>
      {ADDONS.map((a) => {
        const Icon = ICONS[a.icon];
        const on = selected.includes(a.key);
        return (
          <button
            key={a.key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(a.key)}
            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
              on ? "border-primary bg-secondary shadow-bloom" : "border-border bg-card hover:border-primary/60"
            }`}
          >
            <span className={`grid place-items-center h-10 w-10 shrink-0 rounded-xl transition ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold leading-tight">{a.label}</span>
              <span className="text-xs text-muted-foreground">+${a.price}</span>
            </span>
            <span className={`grid place-items-center h-6 w-6 shrink-0 rounded-full border transition ${on ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"}`}>
              <Check className="h-3.5 w-3.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Everything about the home, in one block: bedrooms, bathrooms (half steps),
 * pets, and add-ons. Shared by the booking wizard, services builder and
 * pricing page so a visitor never re-answers the same question.
 */
export function HomeDetailsPicker({
  bedrooms,
  bathrooms,
  addons,
  pets,
  onChange,
  addonColumns,
}: {
  bedrooms: number;
  bathrooms: number;
  addons: readonly AddonKey[];
  pets: boolean;
  onChange: (patch: { bedrooms?: number; bathrooms?: number; addons?: AddonKey[]; pets?: boolean }) => void;
  addonColumns?: string;
}) {
  const toggle = (key: AddonKey) =>
    onChange({ addons: addons.includes(key) ? addons.filter((a) => a !== key) : [...addons, key] });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 min-[420px]:grid-cols-2">
        <CountStepper label="Bedrooms" value={bedrooms} onChange={(n) => onChange({ bedrooms: n })} min={BED_MIN} max={BED_MAX} hint={bedrooms === 0 ? "Studio" : "Bedrooms"} />
        <CountStepper label="Bathrooms" value={bathrooms} onChange={(n) => onChange({ bathrooms: n })} min={BATH_MIN} max={BATH_MAX} step={0.5} hint="Half baths count as 0.5" />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add-ons</div>
          <span className="text-xs text-muted-foreground">Tap to add · price updates live</span>
        </div>
        <AddonPicker selected={addons} onToggle={toggle} columns={addonColumns} />
      </div>

      <button
        type="button"
        aria-pressed={pets}
        onClick={() => onChange({ pets: !pets })}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
          pets ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/60"
        }`}
      >
        <span className={`grid place-items-center h-10 w-10 shrink-0 rounded-xl ${pets ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
          <PawPrint className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold leading-tight">Pets at home</span>
          <span className="text-xs text-muted-foreground">No extra charge — we bring pet-safe products and plan for hair.</span>
        </span>
        <span className={`grid place-items-center h-6 w-6 shrink-0 rounded-full border ${pets ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"}`}>
          <Check className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}
