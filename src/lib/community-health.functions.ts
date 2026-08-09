import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-triggered run of the daily /community verification. */
export const runCommunityHealthNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !data) throw new Error("Forbidden");

    const { runCommunityHealthCheck } = await import("@/lib/community-health.server");
    return runCommunityHealthCheck(getRequestUrl().origin, "manual");
  });
