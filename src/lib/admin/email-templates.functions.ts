import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmailTemplateSummary = {
  id: string;
  name: string;
  category: string;
  audience: string;
  description: string;
  trigger: string;
  file: string;
  subject: string;
  edited: boolean;
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

export const listEmailTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailTemplateSummary[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { EMAIL_TEMPLATES } = await import("@/lib/email/catalog.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("email_template_overrides")
      .select("template_id,subject,enabled");
    const edits = new Map((rows ?? []).map((r: any) => [r.template_id, r]));
    return EMAIL_TEMPLATES.map((t) => {
      const o = edits.get(t.id);
      return {
      id: t.id,
      name: t.name,
      category: t.category,
      audience: t.audience,
      description: t.description,
      trigger: t.trigger,
      file: t.file,
      subject: o?.enabled && o?.subject ? o.subject : t.render().subject,
      edited: Boolean(o),
      };
    });
  });

export const previewEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }): Promise<{ subject: string; html: string }> => {
    await assertAdmin(context.supabase, context.userId);
    const { getEmailTemplate } = await import("@/lib/email/catalog.server");
    const { withOverride } = await import("@/lib/email/overrides.server");
    const entry = getEmailTemplate(data.id);
    if (!entry) throw new Error("Template not found");
    return withOverride(data.id, entry.render());
  });

export type EmailOverrideDraft = {
  subject: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  introHtml: string;
  footerNote: string;
  enabled: boolean;
};

const draftSchema = z.object({
  id: z.string().min(1),
  subject: z.string().max(300).default(""),
  heroTitle: z.string().max(300).default(""),
  heroSubtitle: z.string().max(300).default(""),
  ctaLabel: z.string().max(120).default(""),
  introHtml: z.string().max(4000).default(""),
  footerNote: z.string().max(1000).default(""),
  enabled: z.boolean().default(true),
});

/** Returns the saved edits for a template (empty strings when untouched). */
export const getEmailTemplateOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }): Promise<EmailOverrideDraft & { edited: boolean }> => {
    await assertAdmin(context.supabase, context.userId);
    const { loadOverride } = await import("@/lib/email/overrides.server");
    const o = await loadOverride(data.id);
    return {
      subject: o?.subject ?? "",
      heroTitle: o?.hero_title ?? "",
      heroSubtitle: o?.hero_subtitle ?? "",
      ctaLabel: o?.cta_label ?? "",
      introHtml: o?.intro_html ?? "",
      footerNote: o?.footer_note ?? "",
      enabled: o?.enabled ?? true,
      edited: Boolean(o),
    };
  });

/** Saves admin edits for a template. Blank fields fall back to the coded copy. */
export const saveEmailTemplateOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => draftSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { getEmailTemplate } = await import("@/lib/email/catalog.server");
    if (!getEmailTemplate(data.id)) throw new Error("Template not found");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const blank = (v: string) => (v.trim() ? v.trim() : null);
    const { error } = await supabaseAdmin.from("email_template_overrides").upsert(
      {
        template_id: data.id,
        subject: blank(data.subject),
        hero_title: blank(data.heroTitle),
        hero_subtitle: blank(data.heroSubtitle),
        cta_label: blank(data.ctaLabel),
        intro_html: blank(data.introHtml),
        footer_note: blank(data.footerNote),
        enabled: data.enabled,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      },
      { onConflict: "template_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Removes all edits so the template renders exactly as coded. */
export const resetEmailTemplateOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("email_template_overrides")
      .delete()
      .eq("template_id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const sendEmailTemplateTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().min(1), to: z.string().trim().email().max(255) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { getEmailTemplate } = await import("@/lib/email/catalog.server");
    const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");

    const entry = getEmailTemplate(data.id);
    if (!entry) throw new Error("Template not found");
    const { withOverride } = await import("@/lib/email/overrides.server");
    const rendered = await withOverride(data.id, entry.render());

    const sent = await sendResendEmail({
      to: data.to,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
      reply_to: NOTIFY_EMAIL,
      kind: "template-test",
    });
    if (!sent.sent) throw new Error(sent.reason || "Email could not be delivered");
    return { ok: true as const, to: data.to };
  });