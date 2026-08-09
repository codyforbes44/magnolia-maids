import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin/roles";

/** Admin-triggered run of the daily knowledge base + content sync. */
export const runContentSyncNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { runContentSync } = await import("@/lib/content-sync.server");
    return runContentSync(getRequestUrl().origin, "manual");
  });
