import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SmsTemplateRecord = {
  templateId: string;
  body: string;
  enabled: boolean;
  customized: boolean;
  updatedAt: string | null;
};

export type SmsTemplateVersion = {
  id: string;
  templateId: string;
  body: string;
  note: string | null;
  createdAt: string;
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

/** Stored overrides + saved default variables. */
export const loadSmsTemplateState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ overrides: SmsTemplateRecord[]; variables: Record<string, string> }> => {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const [ov, vars] = await Promise.all([
        supabaseAdmin
          .from("sms_template_overrides")
          .select("template_id,body,enabled,updated_at"),
        supabaseAdmin.from("sms_template_variables").select("key,value"),
      ]);
      if (ov.error) throw new Error(ov.error.message);
      if (vars.error) throw new Error(vars.error.message);

      return {
        overrides: (ov.data ?? []).map((r) => ({
          templateId: r.template_id,
          body: r.body,
          enabled: r.enabled,
          customized: true,
          updatedAt: r.updated_at,
        })),
        variables: Object.fromEntries((vars.data ?? []).map((r) => [r.key, r.value])),
      };
    },
  );

const saveInput = z.object({
  templateId: z.string().trim().min(1).max(64),
  body: z.string().trim().min(1).max(1600),
  enabled: z.boolean().default(true),
  note: z.string().trim().max(200).optional(),
});

/** Saves new wording and snapshots the previous version into history. */
export const saveSmsTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: current } = await supabaseAdmin
      .from("sms_template_overrides")
      .select("body")
      .eq("template_id", data.templateId)
      .maybeSingle();

    if (current?.body && current.body !== data.body) {
      await supabaseAdmin.from("sms_template_versions").insert({
        template_id: data.templateId,
        body: current.body,
        note: "Replaced by a newer save",
        created_by: context.userId,
      });
    }

    const { error } = await supabaseAdmin.from("sms_template_overrides").upsert(
      {
        template_id: data.templateId,
        body: data.body,
        enabled: data.enabled,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      },
      { onConflict: "template_id" },
    );
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("sms_template_versions").insert({
      template_id: data.templateId,
      body: data.body,
      note: data.note ?? "Saved",
      created_by: context.userId,
    });

    return { ok: true };
  });

const idInput = z.object({ templateId: z.string().trim().min(1).max(64) });

/** Removes the override so the built-in wording applies again. */
export const resetSmsTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: current } = await supabaseAdmin
      .from("sms_template_overrides")
      .select("body")
      .eq("template_id", data.templateId)
      .maybeSingle();
    if (current?.body) {
      await supabaseAdmin.from("sms_template_versions").insert({
        template_id: data.templateId,
        body: current.body,
        note: "Reset to built-in wording",
        created_by: context.userId,
      });
    }

    const { error } = await supabaseAdmin
      .from("sms_template_overrides")
      .delete()
      .eq("template_id", data.templateId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSmsTemplateVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }): Promise<SmsTemplateVersion[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("sms_template_versions")
      .select("id,template_id,body,note,created_at")
      .eq("template_id", data.templateId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);

    return (rows ?? []).map((r) => ({
      id: r.id,
      templateId: r.template_id,
      body: r.body,
      note: r.note,
      createdAt: r.created_at,
    }));
  });

const rollbackInput = z.object({ versionId: z.string().uuid() });

/** Restores a saved version as the live wording (snapshotting the current one). */
export const rollbackSmsTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => rollbackInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: version, error: verErr } = await supabaseAdmin
      .from("sms_template_versions")
      .select("template_id,body")
      .eq("id", data.versionId)
      .maybeSingle();
    if (verErr) throw new Error(verErr.message);
    if (!version) throw new Error("Version not found");

    const { data: current } = await supabaseAdmin
      .from("sms_template_overrides")
      .select("body")
      .eq("template_id", version.template_id)
      .maybeSingle();
    if (current?.body && current.body !== version.body) {
      await supabaseAdmin.from("sms_template_versions").insert({
        template_id: version.template_id,
        body: current.body,
        note: "Replaced by a rollback",
        created_by: context.userId,
      });
    }

    const { error } = await supabaseAdmin.from("sms_template_overrides").upsert(
      {
        template_id: version.template_id,
        body: version.body,
        enabled: true,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      },
      { onConflict: "template_id" },
    );
    if (error) throw new Error(error.message);

    return { ok: true, body: version.body };
  });

const varsInput = z.object({
  variables: z.record(z.string().max(64), z.string().max(300)),
});

const testSendInput = z.object({
  templateId: z.string().trim().min(1).max(64),
  body: z.string().trim().min(1).max(1600),
  to: z.string().trim().min(7).max(24),
  variables: z.record(z.string().max(64), z.string().max(300)).default({}),
});

/** Sends a one-off test text of the current draft to an admin's own phone. */
export const sendSmsTemplateTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => testSendInput.parse(data))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ sent: boolean; to: string; body: string; reason?: string }> => {
      await assertAdmin(context.supabase, context.userId);
      const { sendSms, toE164 } = await import("@/lib/sms.server");
      const { renderSmsBody } = await import("@/lib/sms/catalog");

      const to = toE164(data.to);
      if (!to) throw new Error("That doesn't look like a valid US mobile number.");

      const body = renderSmsBody(data.body, data.variables);
      if (!body.trim()) throw new Error("The rendered message is empty.");

      const result = await sendSms({
        to,
        body,
        kind: `sms-test:${data.templateId}`,
        // Admin-initiated test to their own device — not marketing traffic.
        checkConsent: false,
      });

      return { sent: result.sent, to, body, reason: "reason" in result ? result.reason : undefined };
    },
  );

/** Saves the default sample variables used for previews. */
export const saveSmsVariables = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => varsInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const rows = Object.entries(data.variables).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }));
    if (rows.length === 0) return { ok: true };

    const { error } = await supabaseAdmin
      .from("sms_template_variables")
      .upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });