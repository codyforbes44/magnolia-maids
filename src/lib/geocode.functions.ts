import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({ address: z.string().trim().min(6).max(300) });

const coordsInput = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type GeocodeResult = {
  lat: number;
  lng: number;
  formatted: string;
} | null;

/**
 * Server-side geocoding through the Maps connector gateway.
 * Used as a fallback when a visitor types an address instead of picking a
 * suggestion, so the map preview still lands on the right block.
 */
export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<GeocodeResult> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) return null;

    const url =
      "https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json" +
      `?address=${encodeURIComponent(data.address)}&region=us&components=country:US`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
      },
    });

    if (res.status === 403) {
      const details: Array<{ reason?: string }> =
        ((await res.json().catch(() => null)) as any)?.error?.details ?? [];
      const reason = details.find((d) => d.reason)?.reason;
      console.error(`[geocode] permission denied${reason ? `: ${reason}` : ""}`);
      return null;
    }
    if (!res.ok) {
      console.error(`[geocode] failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
      return null;
    }

    const body = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat: number; lng: number } };
      }>;
    };
    const hit = body.results?.[0];
    const loc = hit?.geometry?.location;
    if (body.status !== "OK" || !loc) return null;
    return { lat: loc.lat, lng: loc.lng, formatted: hit?.formatted_address ?? data.address };
  });

/**
 * Reverse geocoding for the "Use my current location" button on the quote form.
 * Turns the browser's GPS fix into a street address the crew can route to.
 */
export const reverseGeocode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => coordsInput.parse(data))
  .handler(async ({ data }): Promise<GeocodeResult> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) return null;

    const url =
      "https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json" +
      `?latlng=${data.lat},${data.lng}&result_type=street_address|premise|subpremise`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
      },
    });

    if (!res.ok) {
      console.error(
        `[reverse-geocode] failed [${res.status}]: ${(await res.text()).slice(0, 300)}`,
      );
      return null;
    }

    const body = (await res.json()) as {
      status?: string;
      results?: Array<{ formatted_address?: string }>;
    };
    const formatted = body.results?.[0]?.formatted_address;
    if (body.status !== "OK" || !formatted) return null;
    return { lat: data.lat, lng: data.lng, formatted };
  });
