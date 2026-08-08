import { applyOverride, type EmailOverride, type Rendered } from "./overrides.server";

export const CUSTOM_PREFIX = "custom:";

export type CustomTemplateRow = {
  id: string;
  base_template_id: string;
  name: string;
  category: string;
  audience: string;
  description: string;
  subject: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  cta_label: string | null;
  intro_html: string | null;
  footer_note: string | null;
  updated_at?: string;
};

export function isCustomId(id: string) {
  return id.startsWith(CUSTOM_PREFIX);
}

export function customUuid(id: string) {
  return id.slice(CUSTOM_PREFIX.length);
}

export async function listCustomTemplates(): Promise<CustomTemplateRow[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("custom_email_templates")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[custom-templates] list failed", error.message);
    return [];
  }
  return (data ?? []) as unknown as CustomTemplateRow[];
}

export async function loadCustomTemplate(id: string): Promise<CustomTemplateRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("custom_email_templates")
    .select("*")
    .eq("id", customUuid(id))
    .maybeSingle();
  return (data as unknown as CustomTemplateRow | null) ?? null;
}

function asOverride(row: CustomTemplateRow): EmailOverride {
  return {
    template_id: row.id,
    subject: row.subject,
    hero_title: row.hero_title,
    hero_subtitle: row.hero_subtitle,
    cta_label: row.cta_label,
    intro_html: row.intro_html,
    footer_note: row.footer_note,
    enabled: true,
  };
}

/** Renders a saved copy by rendering its source template and applying the copy's wording. */
export async function renderCustomTemplate(row: CustomTemplateRow): Promise<Rendered> {
  const { getEmailTemplate } = await import("./catalog.server");
  const base = getEmailTemplate(row.base_template_id);
  if (!base) throw new Error("The template this copy was based on no longer exists");
  return applyOverride(base.render(), asOverride(row));
}
