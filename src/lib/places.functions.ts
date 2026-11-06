import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const sessionToken = z.string().uuid();

export const suggestAddresses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ input: z.string().trim().min(3).max(200), sessionToken }).parse(data),
  )
  .handler(
    async ({ data }): Promise<Array<{ placeId: string; primary: string; secondary: string }>> => {
      const { placesRequest } = await import("@/lib/places.server");
      const result = await placesRequest(
        "places:autocomplete",
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
        {
          ...data,
          includedRegionCodes: ["us"],
          locationBias: {
            circle: { center: { latitude: 32.92, longitude: -96.8 }, radius: 50000 },
          },
        },
      );
      return (result.suggestions ?? [])
        .slice(0, 5)
        .flatMap((item: { placePrediction?: { placeId?: string; text?: { text?: string } } }) => {
          const p = item.placePrediction;
          return p?.placeId && p.text?.text
            ? [{ placeId: p.placeId, primary: p.text.text, secondary: "" }]
            : [];
        });
    },
  );

export const resolveAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ placeId: z.string().regex(/^[A-Za-z0-9_-]{1,250}$/), sessionToken }).parse(data),
  )
  .handler(async ({ data }) => {
    const { placesRequest } = await import("@/lib/places.server");
    const place = await placesRequest(
      `places/${data.placeId}?sessionToken=${encodeURIComponent(data.sessionToken)}`,
      "addressComponents,location,formattedAddress",
    );
    const component = (type: string, short = false): string | null => {
      const c = (place.addressComponents ?? []).find((c: { types?: string[] }) =>
        c.types?.includes(type),
      );
      return (short ? c?.shortText : c?.longText) ?? null;
    };
    return {
      street: [component("street_number"), component("route")].filter(Boolean).join(" ") || null,
      unit: component("subpremise"),
      city: component("locality") ?? component("sublocality"),
      state: component("administrative_area_level_1", true),
      postalCode: component("postal_code"),
      country: component("country", true),
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null,
      placeId: data.placeId,
    };
  });
