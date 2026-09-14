import { PLANIT_CODE_SETTING, PLANIT_DEFAULT_CODE } from "./partners";

/**
 * Current plan.It redemption code. Admin can override it in business settings;
 * otherwise the shared client code is used.
 */
export async function loadPlanitCode(): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("business_settings")
      .select("value")
      .eq("key", PLANIT_CODE_SETTING)
      .maybeSingle();
    const raw = data?.value as unknown;
    const code = typeof raw === "string" ? raw : (raw as { code?: string } | null)?.code;
    return code && code.trim() ? code.trim() : PLANIT_DEFAULT_CODE;
  } catch {
    return PLANIT_DEFAULT_CODE;
  }
}
