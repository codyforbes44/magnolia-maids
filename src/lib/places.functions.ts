import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const sessionToken = z.string().uuid();
async function placesRequest(path: string, mask: string, body?: object) {
  const apiKey = process.env["GOOGLE_MAPS_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey || !lovableKey) throw new Error("Address lookup is not configured. You can enter your full address manually.");
  const response = await fetch(`https://connector-gateway.lovable.dev/google_maps/places/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": apiKey, "Content-Type": "application/json", "X-Goog-FieldMask": mask },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`Places request failed [${response.status}]: ${text}`);
    if (response.status === 403) {
      if (text.includes("API_KEY_HTTP_REFERRER_BLOCKED")) throw new Error("Google Maps server key is referrer-restricted. Set the server key's application restrictions to None or IP addresses in Google Cloud Console.");
      if (text.includes("API_KEY_SERVICE_BLOCKED")) throw new Error("Enable Places API (New) and add it to the server key's allowed APIs in Google Cloud Console.");
    }
    throw new Error(`Address lookup failed [${response.status}]: ${text}`);
  }
  return response.json();
}

export const suggestAddresses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ input: z.string().trim().min(3).max(200), sessionToken }).parse(data))
  .handler(async ({ data }): Promise<Array<{ placeId: string; primary: string; secondary: string }>> => {
    const result = await placesRequest("places:autocomplete", "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text", {
      ...data, includedRegionCodes: ["us"], locationBias: { circle: { center: { latitude: 32.92, longitude: -96.80 }, radius: 50000 } },
    });
    return (result.suggestions ?? []).slice(0, 5).flatMap((item: { placePrediction?: { placeId?: string; text?: { text?: string } } }) => {
      const p = item.placePrediction;
      return p?.placeId && p.text?.text ? [{ placeId: p.placeId, primary: p.text.text, secondary: "" }] : [];
    });
  });

export const resolveAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ placeId: z.string().regex(/^[A-Za-z0-9_-]{1,250}$/), sessionToken }).parse(data))
  .handler(async ({ data }) => {
    const place = await placesRequest(`places/${data.placeId}?sessionToken=${encodeURIComponent(data.sessionToken)}`, "addressComponents,location,formattedAddress");
    const component = (type: string, short = false): string | null => {
      const c = (place.addressComponents ?? []).find((c: { types?: string[] }) => c.types?.includes(type));
      return (short ? c?.shortText : c?.longText) ?? null;
    };
    return { street: [component("street_number"), component("route")].filter(Boolean).join(" ") || null, unit: component("subpremise"), city: component("locality") ?? component("sublocality"), state: component("administrative_area_level_1", true), postalCode: component("postal_code"), country: component("country", true), lat: place.location?.latitude ?? null, lng: place.location?.longitude ?? null, placeId: data.placeId };
  });