import { useEffect, useRef } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

/**
 * Small map with a pin on the visitor's service address.
 * Falls back to a plain "open in Google Maps" card whenever the Maps script
 * is unavailable, so the quote flow never depends on it.
 */
export function AddressMapPreview({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  const { status } = useGoogleMaps();
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  useEffect(() => {
    if (status !== "ready" || !boxRef.current || !window.google?.maps) return;
    const center = { lat, lng };
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(boxRef.current, {
        center,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "cooperative",
        clickableIcons: false,
      });
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapRef.current,
        title: label,
      });
    } else {
      mapRef.current.setCenter(center);
      markerRef.current?.setPosition(center);
      markerRef.current?.setTitle(label);
    }
  }, [status, lat, lng, label]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-secondary/40">
      {status === "ready" ? (
        <div
          ref={boxRef}
          role="img"
          aria-label={`Map showing ${label}`}
          className="h-44 w-full sm:h-52"
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center px-4 text-center sm:h-52">
          <p className="text-xs text-muted-foreground">
            {status === "error"
              ? "Map preview unavailable right now — your address is still saved."
              : "Loading map…"}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-3 py-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{label}</span>
        </span>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
