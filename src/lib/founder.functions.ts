import { createServerFn } from "@tanstack/react-start";
import { FOUNDER_LIMIT, founderSpotsLeft } from "./pricing";

/** Public: returns only how many founder spots remain — never any client data. */
export const getFounderSpots = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("booking_requests")
      .select("email,status")
      .in("status", ["pending", "confirmed"])
      .limit(5000);
    const claimed = new Set((data ?? []).map((r) => (r.email ?? "").trim().toLowerCase()).filter(Boolean)).size;
    return { limit: FOUNDER_LIMIT, left: founderSpotsLeft(claimed) };
  } catch {
    return { limit: FOUNDER_LIMIT, left: null as number | null };
  }
});
