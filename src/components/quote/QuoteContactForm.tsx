import { useEffect, useRef, useState } from "react";
import { ChevronDown, Crosshair, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  AddressAutocomplete,
  EMPTY_ADDRESS_COMPONENTS,
  type AddressComponents,
} from "@/components/AddressAutocomplete";
import { AddressMapPreview } from "@/components/AddressMapPreview";
import { geocodeAddress, reverseGeocode } from "@/lib/geocode.functions";
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
  const [showOptional, setShowOptional] = useState(Boolean(form.notes));
  const [place, setPlace] = useState<AddressComponents>(EMPTY_ADDRESS_COMPONENTS);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const lookup = useServerFn(geocodeAddress);
  const reverse = useServerFn(reverseGeocode);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const lastLookup = useRef<string>("");

  // A picked suggestion already carries coordinates. When someone types the
  // address by hand we geocode it server-side so the pin still shows.
  useEffect(() => {
    if (place.lat != null && place.lng != null) {
      setPin({ lat: place.lat, lng: place.lng });
      return;
    }
    const address = (form.address ?? "").trim();
    if (address.length < 8) {
      setPin(null);
      return;
    }
    if (lastLookup.current === address) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      lastLookup.current = address;
      lookup({ data: { address } })
        .then((r) => {
          if (!cancelled) setPin(r ? { lat: r.lat, lng: r.lng } : null);
        })
        .catch(() => {
          if (!cancelled) setPin(null);
        });
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [form.address, place.lat, place.lng, lookup]);

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

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocateError("Your browser doesn't support location sharing.");
      return;
    }
    setLocateError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const r = await reverse({ data: { lat, lng } });
          if (r) {
            onChange({ address: r.formatted });
            lastLookup.current = r.formatted;
            setPlace({ ...EMPTY_ADDRESS_COMPONENTS, lat: r.lat, lng: r.lng });
          } else {
            setPin({ lat, lng });
            setLocateError("We pinned your location but couldn't read the street address — please type it in.");
          }
        } catch {
          setLocateError("Couldn't look up that location. Please type your address.");
        } finally {
          setLocating(false);
        }
      },
      (e) => {
        setLocating(false);
        setLocateError(
          e.code === e.PERMISSION_DENIED
            ? "Location access was blocked — enable it in your browser or type your address."
            : "Couldn't get your location. Please type your address.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

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

      <div className="sm:col-span-2" data-field="address">
        <Label>Service address</Label>
        <div className="mt-1">
          <AddressAutocomplete
            id="quote-address"
            value={form.address ?? ""}
            onChange={(v) => onChange({ address: v })}
            onComponentsChange={setPlace}
            placeholder="Start typing your Durant-area address…"
            error={errors["address"] || null}
          />
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="tap-target mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
          {locating ? "Finding you…" : "Use my current location"}
        </button>
        {locateError && (
          <p role="alert" className="mt-1 text-xs text-muted-foreground">
            {locateError}
          </p>
        )}
        {pin && (
          <div className="mt-3">
            <AddressMapPreview lat={pin.lat} lng={pin.lng} label={form.address ?? "Your home"} />
          </div>
        )}
      </div>

      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          aria-expanded={showOptional}
          className="tap-target inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showOptional ? "rotate-180" : ""}`} />
          Add notes (optional)
        </button>

        {showOptional && (
          <div className="mt-3 grid gap-4">
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

      <label className="flex items-start gap-3 sm:col-span-2">
        <input
          type="checkbox"
          checked={form.smsConsent}
          onChange={(e) => onChange({ smsConsent: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring"
          aria-describedby="sms-consent-desc"
        />
        <span id="sms-consent-desc" className="text-xs text-muted-foreground">
          I agree to receive text messages from Magnolia Maids about my appointment and reminders. Msg & data rates may apply. Reply STOP to opt out.
        </span>
      </label>
    </div>
  );
}
