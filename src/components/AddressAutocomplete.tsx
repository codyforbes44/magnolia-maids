import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

type Suggestion = {
  placeId: string;
  primary: string;
  secondary: string;
};

export function AddressAutocomplete({
  value,
  onChange,
  name = "address",
  required,
  placeholder = "Start typing your address…",
}: {
  value: string;
  onChange: (v: string) => void;
  name?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const status = useGoogleMaps();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const tokenRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

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
            // Durant-ish bias
            center: { lat: 25.7617, lng: -80.1918 },
            radius: 60000,
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
    } catch (err) {
      console.error("autocomplete error", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInput(v: string) {
    onChange(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(v), 180);
  }

  function pick(s: Suggestion) {
    const full = s.secondary ? `${s.primary}, ${s.secondary}` : s.primary;
    onChange(full);
    setOpen(false);
    setSuggestions([]);
    tokenRef.current = null; // end session after selection
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

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70 pointer-events-none" />
        <input
          name={name}
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={onKeyDown}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-2xl border border-input bg-background pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
          {suggestions.map((s, i) => (
            <li key={s.placeId}>
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
      {status === "error" && (
        <p className="mt-1 text-xs text-muted-foreground">
          Address suggestions unavailable — type your address manually.
        </p>
      )}
    </div>
  );
}