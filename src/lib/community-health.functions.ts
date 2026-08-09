import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin/roles";

/** Admin-triggered run of the daily /community verification. */
export const runCommunityHealthNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { runCommunityHealthCheck } = await import("@/lib/community-health.server");
    return runCommunityHealthCheck(getRequestUrl().origin, "manual");
  });
