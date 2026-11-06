import { getRequestHeader } from "@tanstack/react-start/server";

/** Daily address-lookup allowance for visitors who are not signed in. */
export const GUEST_MAPS_DAILY_LIMIT = 40;

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Allows billable Maps lookups for signed-in users without limit and for guests
 * up to a per-visitor daily cap (keyed by a hash of the caller's IP address).
 * Returns false when the guest has used up today's allowance.
 */
export async function allowMapsLookup(): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const auth = getRequestHeader("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) {
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data.user) return true;
  }
  const ip =
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const key = await sha256(`maps:${ip}`);
  const { data, error } = await supabaseAdmin.rpc("bump_maps_lookup", {
    _key: key,
    _limit: GUEST_MAPS_DAILY_LIMIT,
  });
  if (error) {
    console.error("[maps-guard] usage check failed", error.message);
    return false;
  }
  return data === true;
}
