import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NextdoorStatus = {
  adsToken: boolean;
  advertiserId: boolean;
  capiToken: boolean;
  publishingClient: boolean;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

/**
 * Reports which Nextdoor credentials are present. Never returns the values —
 * only whether each one is configured, so the admin can see what's unlocked.
 */
export const getNextdoorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NextdoorStatus> => {
    await assertAdmin(context.supabase, context.userId);
    return {
      adsToken: Boolean(process.env["NEXTDOOR_ADS_TOKEN"]),
      advertiserId: Boolean(process.env["NEXTDOOR_ADVERTISER_ID"]),
      capiToken: Boolean(process.env["NEXTDOOR_CAPI_TOKEN"]),
      publishingClient: Boolean(process.env["NEXTDOOR_CLIENT_ID"] && process.env["NEXTDOOR_CLIENT_SECRET"]),
    };
  });
