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
  /** True for admin-created copies of a built-in template. */
  custom: boolean;
  baseTemplateId?: string;
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
    const builtIn: EmailTemplateSummary[] = EMAIL_TEMPLATES.map((t) => {
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
      custom: false,
      };
    });

    const { listCustomTemplates, CUSTOM_PREFIX, renderCustomTemplate } = await import(
      "@/lib/email/custom.server"
    );
    const customs = await listCustomTemplates();
    for (const row of customs) {
      let subject = row.subject ?? "";
      if (!subject) {
        try {
          subject = (await renderCustomTemplate(row)).subject;
        } catch {
          subject = "(source template missing)";
        }
      }
      const base = EMAIL_TEMPLATES.find((t) => t.id === row.base_template_id);
      builtIn.push({
        id: `${CUSTOM_PREFIX}${row.id}`,
        name: row.name,
        category: row.category || "Custom",
        audience: row.audience || "Customer",
        description: row.description || `Copy of ${base?.name ?? row.base_template_id}.`,
        trigger: "Sent manually from this page.",
        file: base?.file ?? "—",
        subject,
        edited: true,
        custom: true,
        baseTemplateId: row.base_template_id,
      });
    }

    return builtIn;
  });

export const previewEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }): Promise<{ subject: string; html: string }> => {
    await assertAdmin(context.supabase, context.userId);
    const { isCustomId, loadCustomTemplate, renderCustomTemplate } = await import(
      "@/lib/email/custom.server"
    );
    if (isCustomId(data.id)) {
      const row = await loadCustomTemplate(data.id);
      if (!row) throw new Error("Template not found");
      return renderCustomTemplate(row);
    }
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
  bodyHtml: string;
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
  bodyHtml: z.string().max(20000).default(""),
  footerNote: z.string().max(1000).default(""),
  enabled: z.boolean().default(true),
});

/** Returns the saved edits for a template (empty strings when untouched). */
export const getEmailTemplateOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }): Promise<EmailOverrideDraft & { edited: boolean }> => {
    await assertAdmin(context.supabase, context.userId);
    const { isCustomId, loadCustomTemplate } = await import("@/lib/email/custom.server");
    const { loadOverride } = await import("@/lib/email/overrides.server");
    const o = isCustomId(data.id)
      ? await (async () => {
          const row = await loadCustomTemplate(data.id);
          if (!row) throw new Error("Template not found");
          return {
            template_id: row.id,
            subject: row.subject,
            hero_title: row.hero_title,
            hero_subtitle: row.hero_subtitle,
            cta_label: row.cta_label,
            intro_html: row.intro_html,
            body_html: row.body_html,
            footer_note: row.footer_note,
            enabled: true,
          };
        })()
      : await loadOverride(data.id);
    return {
      subject: o?.subject ?? "",
      heroTitle: o?.hero_title ?? "",
      heroSubtitle: o?.hero_subtitle ?? "",
      ctaLabel: o?.cta_label ?? "",
      introHtml: o?.intro_html ?? "",
      bodyHtml: o?.body_html ?? "",
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
    const { isCustomId, customUuid } = await import("@/lib/email/custom.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const blankValue = (v: string) => (v.trim() ? v.trim() : null);

    if (isCustomId(data.id)) {
      const { error: customError } = await supabaseAdmin
        .from("custom_email_templates")
        .update({
          subject: blankValue(data.subject),
          hero_title: blankValue(data.heroTitle),
          hero_subtitle: blankValue(data.heroSubtitle),
          cta_label: blankValue(data.ctaLabel),
          intro_html: blankValue(data.introHtml),
          body_html: blankValue(data.bodyHtml),
          footer_note: blankValue(data.footerNote),
        })
        .eq("id", customUuid(data.id));
      if (customError) throw new Error(customError.message);
      return { ok: true as const };
    }

    if (!getEmailTemplate(data.id)) throw new Error("Template not found");

    const blank = (v: string) => (v.trim() ? v.trim() : null);
    const { error } = await supabaseAdmin.from("email_template_overrides").upsert(
      {
        template_id: data.id,
        subject: blank(data.subject),
        hero_title: blank(data.heroTitle),
        hero_subtitle: blank(data.heroSubtitle),
        cta_label: blank(data.ctaLabel),
        intro_html: blank(data.introHtml),
        body_html: blank(data.bodyHtml),
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
    const { isCustomId } = await import("@/lib/email/custom.server");
    if (isCustomId(data.id)) throw new Error("Saved copies can't be reverted — delete the copy instead.");
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

    const { isCustomId, loadCustomTemplate, renderCustomTemplate } = await import(
      "@/lib/email/custom.server"
    );
    const { withOverride } = await import("@/lib/email/overrides.server");

    let rendered;
    if (isCustomId(data.id)) {
      const row = await loadCustomTemplate(data.id);
      if (!row) throw new Error("Template not found");
      rendered = await renderCustomTemplate(row);
    } else {
      const entry = getEmailTemplate(data.id);
      if (!entry) throw new Error("Template not found");
      rendered = await withOverride(data.id, entry.render());
    }

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

/** Copies an existing template (built-in or custom) into a new, separately editable one. */
export const duplicateEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().min(1),
        name: z.string().trim().min(2).max(120),
        category: z.string().trim().max(60).default("Custom"),
        audience: z.enum(["Customer", "Admin", "Applicant"]).default("Customer"),
        description: z.string().trim().max(400).default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertAdmin(context.supabase, context.userId);
    const { getEmailTemplate } = await import("@/lib/email/catalog.server");
    const { isCustomId, loadCustomTemplate, CUSTOM_PREFIX } = await import(
      "@/lib/email/custom.server"
    );
    const { loadOverride } = await import("@/lib/email/overrides.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let baseTemplateId: string;
    let copy: Record<string, string | null>;

    if (isCustomId(data.id)) {
      const row = await loadCustomTemplate(data.id);
      if (!row) throw new Error("Template not found");
      baseTemplateId = row.base_template_id;
      copy = {
        subject: row.subject,
        hero_title: row.hero_title,
        hero_subtitle: row.hero_subtitle,
        cta_label: row.cta_label,
        intro_html: row.intro_html,
        body_html: row.body_html,
        footer_note: row.footer_note,
      };
    } else {
      const entry = getEmailTemplate(data.id);
      if (!entry) throw new Error("Template not found");
      baseTemplateId = entry.id;
      const o = await loadOverride(entry.id);
      copy = {
        subject: o?.enabled ? o.subject : null,
        hero_title: o?.enabled ? o.hero_title : null,
        hero_subtitle: o?.enabled ? o.hero_subtitle : null,
        cta_label: o?.enabled ? o.cta_label : null,
        intro_html: o?.enabled ? o.intro_html : null,
        body_html: o?.enabled ? o.body_html : null,
        footer_note: o?.enabled ? o.footer_note : null,
      };
    }

    const source = getEmailTemplate(baseTemplateId);
    const { data: inserted, error } = await supabaseAdmin
      .from("custom_email_templates")
      .insert({
        base_template_id: baseTemplateId,
        name: data.name,
        category: data.category || "Custom",
        audience: data.audience,
        description: data.description || `Copy of ${source?.name ?? baseTemplateId}.`,
        created_by: context.userId,
        ...copy,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: `${CUSTOM_PREFIX}${(inserted as { id: string }).id}` };
  });

/** Permanently deletes an admin-created template copy. */
export const deleteCustomEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { isCustomId, customUuid } = await import("@/lib/email/custom.server");
    if (!isCustomId(data.id)) throw new Error("Only saved copies can be deleted");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("custom_email_templates")
      .delete()
      .eq("id", customUuid(data.id));
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
