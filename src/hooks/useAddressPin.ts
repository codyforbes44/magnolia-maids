import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { geocodeAddress } from "@/lib/geocode.functions";
import type { AddressComponents } from "@/components/AddressAutocomplete";

export type Pin = { lat: number; lng: number } | null;

/**
 * Resolves a map pin for the address the visitor is entering.
 * A picked Places suggestion already carries coordinates; typed addresses are
 * geocoded server-side (debounced) so the preview still lands on the block.
 */
export function useAddressPin(address: string, place: AddressComponents): Pin {
  const [pin, setPin] = useState<Pin>(null);
  const lookup = useServerFn(geocodeAddress);
  const lastLookup = useRef<string>("");

  useEffect(() => {
    if (place.lat != null && place.lng != null) {
      setPin({ lat: place.lat, lng: place.lng });
      return;
    }
    const value = (address ?? "").trim();
    if (value.length < 8) {
      setPin(null);
      return;
    }
    if (lastLookup.current === value) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      lastLookup.current = value;
      lookup({ data: { address: value } })
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
  }, [address, place.lat, place.lng, lookup]);

  return pin;
}
