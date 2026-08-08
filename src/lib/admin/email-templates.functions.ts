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
    return EMAIL_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      audience: t.audience,
      description: t.description,
      trigger: t.trigger,
      file: t.file,
      subject: t.render().subject,
    }));
  });

export const previewEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }): Promise<{ subject: string; html: string }> => {
    await assertAdmin(context.supabase, context.userId);
    const { getEmailTemplate } = await import("@/lib/email/catalog.server");
    const entry = getEmailTemplate(data.id);
    if (!entry) throw new Error("Template not found");
    return entry.render();
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
    const rendered = entry.render();

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