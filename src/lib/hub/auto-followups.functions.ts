import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseHubFollowups, type HubFollowupConfig } from "./auto-followups";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export type HubFollowupState = {
  config: HubFollowupConfig;
  lastRun: { at: string; sent: number; attempted: number } | null;
};

export const getHubFollowupSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HubFollowupState> => {
    await assertAdmin(context as never);
    const { loadHubFollowupConfig } = await import("./auto-followups.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [config, last] = await Promise.all([
      loadHubFollowupConfig(),
      supabaseAdmin
        .from("business_settings")
        .select("value")
        .eq("key", "hub_followups_last_run")
        .maybeSingle(),
    ]);
    const raw = last.data?.value as { at?: string; sent?: number; attempted?: number } | null;
    return {
      config,
      lastRun: raw?.at ? { at: raw.at, sent: raw.sent ?? 0, attempted: raw.attempted ?? 0 } : null,
    };
  });

export const saveHubFollowupSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { config: unknown }) => input)
  .handler(async ({ data, context }): Promise<HubFollowupState> => {
    await assertAdmin(context as never);
    const config = parseHubFollowups(data.config);
    const { saveHubFollowupConfig } = await import("./auto-followups.server");
    await saveHubFollowupConfig(config);
    return { config, lastRun: null };
  });

/** Runs the sweep immediately, ignoring the enabled flag and quiet hours. */
export const runHubFollowupsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { runHubFollowups } = await import("./auto-followups.server");
    const res = await runHubFollowups(true);
    return { sent: res.sent ?? 0, attempted: res.attempted ?? 0 };
  });
