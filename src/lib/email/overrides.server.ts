import { esc, paragraph } from "./layout";

export type EmailOverride = {
  template_id: string;
  subject: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  cta_label: string | null;
  intro_html: string | null;
  body_html: string | null;
  footer_note: string | null;
  enabled: boolean;
  updated_at?: string;
};

export type Rendered = { subject: string; html: string };

function replaceSlot(html: string, slot: string, value: string) {
  const re = new RegExp(`<!--et:${slot}-->[\\s\\S]*?<!--/et:${slot}-->`);
  return html.replace(re, `<!--et:${slot}-->${value}<!--/et:${slot}-->`);
}

/** Applies an admin-edited override on top of a rendered template. */
export function applyOverride(rendered: Rendered, o: EmailOverride | null): Rendered {
  if (!o || o.enabled === false) return rendered;
  let html = rendered.html;
  const subject = o.subject?.trim() ? o.subject.trim() : rendered.subject;

  if (o.hero_title?.trim()) html = replaceSlot(html, "heroTitle", esc(o.hero_title.trim()));
  if (typeof o.hero_subtitle === "string")
    html = replaceSlot(html, "heroSubtitle", esc(o.hero_subtitle.trim()));
  if (o.cta_label?.trim()) html = replaceSlot(html, "ctaLabel", esc(o.cta_label.trim()));
  if (o.body_html?.trim()) html = replaceSlot(html, "body", richText(o.body_html.trim()));
  if (typeof o.footer_note === "string")
    html = replaceSlot(html, "footerNote", esc(o.footer_note.trim()));
  if (o.intro_html?.trim())
    html = replaceSlot(
      html,
      "intro",
      o.intro_html
        .trim()
        .split(/\n{2,}/)
        .map((p) => paragraph(esc(p.trim()).replace(/\n/g, "<br />")))
        .join(""),
    );

  return { subject, html };
}

/** Reads one saved override (admin client — server only). */
export async function loadOverride(templateId: string): Promise<EmailOverride | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("email_template_overrides")
      .select("*")
      .eq("template_id", templateId)
      .maybeSingle();
    return (data as EmailOverride | null) ?? null;
  } catch (e) {
    console.error("[email-overrides] load failed", e);
    return null;
  }
}

/** Renders with any admin edits applied. */
export async function withOverride(templateId: string, rendered: Rendered): Promise<Rendered> {
  return applyOverride(rendered, await loadOverride(templateId));
}
