import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, AlertCircle, CheckCircle2, RotateCw } from "lucide-react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

type Suggestion = {
  placeId: string;
  primary: string;
  secondary: string;
};

/** Structured address pulled from Places — stored with the booking for routing/reporting. */
export type AddressComponents = {
  street: string | null;
  unit: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
};

export const EMPTY_ADDRESS_COMPONENTS: AddressComponents = {
  street: null,
  unit: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
  lat: null,
  lng: null,
  placeId: null,
};

function pickComponent(
  components: any[],
  type: string,
  short = false,
): string | null {
  const c = components.find((x) => (x.types ?? []).includes(type));
  if (!c) return null;
  return (short ? c.shortText ?? c.short_name : c.longText ?? c.long_name) ?? null;
}

/** Fetches the full component breakdown for a selected prediction. */
async function fetchPlaceComponents(placeId: string): Promise<AddressComponents | null> {
  const { Place } = (await window.google.maps.importLibrary("places")) as any;
  const place = new Place({ id: placeId });
  await place.fetchFields({ fields: ["addressComponents", "location", "formattedAddress"] });
  const comps: any[] = place.addressComponents ?? [];
  const number = pickComponent(comps, "street_number");
  const route = pickComponent(comps, "route");
  const loc = place.location;
  return {
    street: [number, route].filter(Boolean).join(" ") || null,
    unit: pickComponent(comps, "subpremise"),
    city:
      pickComponent(comps, "locality") ??
      pickComponent(comps, "sublocality") ??
      pickComponent(comps, "postal_town") ??
      pickComponent(comps, "administrative_area_level_3"),
    state: pickComponent(comps, "administrative_area_level_1", true),
    postalCode: pickComponent(comps, "postal_code"),
    country: pickComponent(comps, "country", true),
    lat: typeof loc?.lat === "function" ? loc.lat() : (loc?.lat ?? null),
    lng: typeof loc?.lng === "function" ? loc.lng() : (loc?.lng ?? null),
    placeId,
  };
}

/**
 * Light client-side sanity check so a typo'd address never reaches the crew.
 * Deliberately permissive — rural Bryan County routes are messy.
 */
export function validateAddress(value: string): string | null {
  const v = value.trim();
  if (!v) return "Please enter your home address.";
  if (v.length < 6) return "That address looks too short — add the street name.";
  if (v.length > 300) return "That address is too long.";
  if (!/\d/.test(v)) return "Include the house or building number.";
  if (!/[a-zA-Z]{2,}/.test(v)) return "Include the street name.";
  return null;
}

export function AddressAutocomplete({
  id,
  value,
  onChange,
  name = "address",
  required,
  placeholder = "Start typing your address…",
  error,
  onBlur,
  onComponentsChange,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  name?: string;
  required?: boolean;
  placeholder?: string;
  error?: string | null;
  onBlur?: () => void;
  onComponentsChange?: (c: AddressComponents) => void;
}) {
  const { status, retry } = useGoogleMaps();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const tokenRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = `${id ?? name}-suggestions`;
  const msgId = `${id ?? name}-message`;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function fetchSuggestions(input: string) {
    if (status !== "ready" || !input.trim() || !window.google?.maps) {
      setSuggestions([]);
      return;
    }
    try {
      setLoading(true);
      const { AutocompleteSuggestion, AutocompleteSessionToken } =
        (await window.google.maps.importLibrary("places")) as any;
      if (!tokenRef.current) tokenRef.current = new AutocompleteSessionToken();
      const { suggestions: raw } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: tokenRef.current,
          includedRegionCodes: ["us"],
          locationBias: {
            // Durant, OK — biases results to Bryan County / Lake Texoma.
            center: { lat: 33.9937, lng: -96.3711 },
            radius: 50000,
          },
        });
      const mapped: Suggestion[] = (raw ?? [])
        .map((s: any) => s.placePrediction)
        .filter(Boolean)
        .map((p: any) => ({
          placeId: p.placeId,
          primary: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
          secondary: p.structuredFormat?.secondaryText?.text ?? "",
        }));
      setSuggestions(mapped);
      setActive(0);
      setOpen(mapped.length > 0);
      setLookupFailed(false);
    } catch (err) {
      console.error("autocomplete error", err);
      setSuggestions([]);
      setOpen(false);
      setLookupFailed(true);
    } finally {
      setLoading(false);
    }
  }

  function handleInput(v: string) {
    onChange(v);
    setConfirmed(false);
    // Typing invalidates any previously resolved place.
    onComponentsChange?.(EMPTY_ADDRESS_COMPONENTS);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(v), 180);
  }

  function pick(s: Suggestion) {
    const full = s.secondary ? `${s.primary}, ${s.secondary}` : s.primary;
    onChange(full);
    setOpen(false);
    setSuggestions([]);
    setConfirmed(true);
    tokenRef.current = null; // end session after selection
    if (onComponentsChange) {
      fetchPlaceComponents(s.placeId)
        .then((c) => c && onComponentsChange(c))
        .catch((err) => {
          console.error("place details error", err);
          onComponentsChange({ ...EMPTY_ADDRESS_COMPONENTS, placeId: s.placeId });
        });
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const degraded = status === "error" || lookupFailed;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70 pointer-events-none" />
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={msgId}
          className={`w-full rounded-2xl border bg-background pl-11 pr-11 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring ${
            error ? "border-destructive" : "border-input"
          }`}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!loading && confirmed && !error && (
          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"
        >
          {suggestions.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b last:border-b-0 border-border/60 transition ${
                  i === active ? "bg-secondary" : "hover:bg-secondary/60"
                }`}
              >
                <MapPin className="h-4 w-4 mt-1 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{s.primary}</div>
                  {s.secondary && (
                    <div className="text-xs text-muted-foreground truncate">
                      {s.secondary}
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div id={msgId} className="mt-1 space-y-1">
        {error && (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
        {degraded && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>
              Address suggestions are unavailable right now — just type your full
              address (street, city, state, ZIP) and we'll confirm it with you.
            </span>
            <button
              type="button"
              onClick={() => {
                setLookupFailed(false);
                retry();
              }}
              className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
            >
              <RotateCw className="h-3 w-3" /> Retry
            </button>
          </p>
        )}
      </div>
    </div>
  );
}