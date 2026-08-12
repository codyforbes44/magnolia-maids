import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import mascot96 from "@/assets/maggie-avatar-96.webp";
import mascot192 from "@/assets/maggie-avatar-192.webp";
import mascot384 from "@/assets/maggie-avatar-384.webp";
import portrait from "@/assets/maggie-portrait.jpg";

export const MAGGIE_BUCKET = "maggie-images";
export const MAGGIE_AVATAR_KEY = "maggie_avatar_url";
export const MAGGIE_PORTRAIT_KEY = "maggie_portrait_url";
/** ~10 years — regenerated whenever an admin saves a new image. */
export const MAGGIE_SIGNED_URL_TTL = 315_360_000;

export const DEFAULT_MAGGIE_IMAGES = {
  avatar: mascot96,
  avatarSrcSet: `${mascot96} 96w, ${mascot192} 192w, ${mascot384} 384w`,
  portrait,
};

export type MaggieImages = {
  avatar: string;
  avatarSrcSet: string | undefined;
  portrait: string;
};

function asUrl(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function fetchMaggieImageOverrides(): Promise<{
  avatar: string | null;
  portrait: string | null;
}> {
  const { data } = await supabase
    .from("business_settings")
    .select("key, value")
    .in("key", [MAGGIE_AVATAR_KEY, MAGGIE_PORTRAIT_KEY]);
  const rows = data ?? [];
  return {
    avatar: asUrl(rows.find((r) => r.key === MAGGIE_AVATAR_KEY)?.value),
    portrait: asUrl(rows.find((r) => r.key === MAGGIE_PORTRAIT_KEY)?.value),
  };
}

/** Admin-managed Maggie artwork with the bundled illustrations as fallback. */
export function useMaggieImages(): MaggieImages {
  const [images, setImages] = useState<MaggieImages>({
    avatar: DEFAULT_MAGGIE_IMAGES.avatar,
    avatarSrcSet: DEFAULT_MAGGIE_IMAGES.avatarSrcSet,
    portrait: DEFAULT_MAGGIE_IMAGES.portrait,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overrides = await fetchMaggieImageOverrides();
        if (cancelled) return;
        setImages({
          avatar: overrides.avatar ?? DEFAULT_MAGGIE_IMAGES.avatar,
          avatarSrcSet: overrides.avatar ? undefined : DEFAULT_MAGGIE_IMAGES.avatarSrcSet,
          portrait: overrides.portrait ?? DEFAULT_MAGGIE_IMAGES.portrait,
        });
      } catch {
        /* keep bundled defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return images;
}
