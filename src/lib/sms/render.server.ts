import { getSmsTemplate, renderSmsBody } from "./catalog";

/**
 * Renders a template using the admin override when one is stored and enabled,
 * otherwise the code default. Never throws — falls back to the default body.
 */
export async function renderStoredSms(
  templateId: string,
  vars: Record<string, string | null | undefined>,
): Promise<{ body: string; enabled: boolean; source: "override" | "default" } | null> {
  const def = getSmsTemplate(templateId);
  if (!def) return null;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("sms_template_overrides")
      .select("body,enabled")
      .eq("template_id", templateId)
      .maybeSingle();
    if (data?.body) {
      return {
        body: renderSmsBody(data.body, vars),
        enabled: data.enabled,
        source: "override",
      };
    }
  } catch (e) {
    console.error("[sms] override lookup failed", templateId, e);
  }

  return { body: renderSmsBody(def.defaultBody, vars), enabled: true, source: "default" };
}