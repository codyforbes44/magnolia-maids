import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { campaignLeadSchema } from "./campaign-lead-schema";
import { attributionColumns } from "./attribution";

export const submitCampaignLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => campaignLeadSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { campaignLeadAdmin, campaignLeadCustomer } = await import("./email/campaign");
    const { CAMPAIGNS } = await import("./campaigns");
    const { saveContactSubmission } = await import("./returning-contact.server");

    const meta = CAMPAIGNS[data.campaign];

    const saved = await saveContactSubmission({
      table: "campaign_leads",
      email: data.email,
      phone: data.phone || null,
      appendColumn: "message",
      source: `${meta.label} landing page`,
      summary: `${meta.label}${data.homeSize ? ` · ${data.homeSize}` : ""}`,
      values: {
        campaign: data.campaign,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        home_size: data.homeSize || null,
        preferred_date: data.preferredDate || null,
        referral_name: data.referralName || null,
        message: data.message || null,
        contact_pref: data.contactPref,
        ...attributionColumns(data.attribution as any),
      },
    });

    const lead = {
      id: saved.id,
      campaign: data.campaign,
      campaignLabel: meta.label,
      offer: meta.offer,
      path: meta.path,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      homeSize: data.homeSize || null,
      preferredDate: data.preferredDate || null,
      referralName: data.referralName || null,
      message: data.message || null,
    };

    const admin = campaignLeadAdmin(lead);
    const customer = campaignLeadCustomer(lead);

    let confirmationSent = false;
    try {
      const notified = await sendResendEmail({
        to: NOTIFY_EMAIL,
        subject: admin.subject,
        html: admin.html,
        reply_to: data.email,
        templateId: "campaign-lead-admin",
      });
      if (!notified.sent) {
        console.error("[campaign-lead] notification not delivered", notified.reason);
      } else {
        const confirmation = await sendResendEmail({
          to: data.email,
          subject: customer.subject,
          html: customer.html,
          reply_to: NOTIFY_EMAIL,
          templateId: "campaign-lead-customer",
        });
        confirmationSent = confirmation.sent;
        if (!confirmation.sent) console.error("[campaign-lead] confirmation not delivered", confirmation.reason);
      }
    } catch (e) {
      console.error("[campaign-lead] email send error", e);
    }

    return {
      ok: true as const,
      id: lead.id,
      returning: saved.returning,
      submissions: saved.submissions,
      confirmationSent,
    };
  });

export const resendCampaignThankYou = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { campaignLeadCustomer } = await import("./email/campaign");
    const { CAMPAIGNS } = await import("./campaigns");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("campaign_leads")
      .select("id,campaign,name,email,phone,home_size,preferred_date,referral_name,message")
      .eq("id", data.id)
      .maybeSingle();

    if (error || !row) throw new Error("Lead not found");

    const meta = (CAMPAIGNS as Record<string, (typeof CAMPAIGNS)[keyof typeof CAMPAIGNS]>)[row.campaign];
    if (!meta) throw new Error(`Unknown campaign: ${row.campaign}`);

    const customer = campaignLeadCustomer({
      id: row.id,
      campaign: row.campaign,
      campaignLabel: meta.label,
      offer: meta.offer,
      path: meta.path,
      name: row.name,
      email: row.email,
      phone: row.phone,
      homeSize: row.home_size,
      preferredDate: row.preferred_date,
      referralName: row.referral_name,
      message: row.message,
    });

    const sent = await sendResendEmail({
      to: row.email,
      subject: customer.subject,
      html: customer.html,
      reply_to: NOTIFY_EMAIL,
      templateId: "campaign-lead-customer",
    });

    if (!sent.sent) {
      console.error("[campaign-lead] resend thank-you failed", sent.reason);
      throw new Error(sent.reason || "Email could not be delivered");
    }

    return { ok: true as const, email: row.email };
  });

async function assertLeadAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

async function loadLead(id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row, error } = await supabaseAdmin
    .from("campaign_leads")
    .select("id,campaign,name,email,phone,home_size,preferred_date,referral_name,message")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) throw new Error("Lead not found");
  return row as any;
}

export type LeadEmailOption = {
  id: string;
  name: string;
  description: string;
  custom: boolean;
};

/** Admin-only: templates that can be personalised and sent to a lead. */
export const listLeadEmailOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeadEmailOption[]> => {
    await assertLeadAdmin(context.supabase, context.userId);
    const { EMAIL_TEMPLATES } = await import("./email/catalog.server");
    const { LEAD_EMAIL_TEMPLATE_IDS } = await import("./email/lead-emails.server");
    const { listCustomTemplates, CUSTOM_PREFIX } = await import("./email/custom.server");

    const allowed = new Set<string>(LEAD_EMAIL_TEMPLATE_IDS);
    const options: LeadEmailOption[] = EMAIL_TEMPLATES.filter((t) => allowed.has(t.id)).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      custom: false,
    }));

    for (const row of await listCustomTemplates()) {
      if (!allowed.has(row.base_template_id)) continue;
      options.push({
        id: `${CUSTOM_PREFIX}${row.id}`,
        name: row.name,
        description: row.description || "Saved copy",
        custom: true,
      });
    }
    return options;
  });

const leadEmailDraftSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().min(1),
  subject: z.string().max(300).default(""),
  heroTitle: z.string().max(300).default(""),
  heroSubtitle: z.string().max(300).default(""),
  ctaLabel: z.string().max(120).default(""),
  introHtml: z.string().max(4000).default(""),
  bodyHtml: z.string().max(20000).default(""),
  footerNote: z.string().max(1000).default(""),
});

/** Admin-only: renders the chosen template with this lead's details and the admin's tweaks. */
export const previewLeadEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => leadEmailDraftSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ subject: string; html: string }> => {
    await assertLeadAdmin(context.supabase, context.userId);
    const { renderLeadEmail } = await import("./email/lead-emails.server");
    return renderLeadEmail(data.templateId, await loadLead(data.id), data);
  });

/** Admin-only: sends the customised template to the lead. */
export const sendLeadEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => leadEmailDraftSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertLeadAdmin(context.supabase, context.userId);
    const { renderLeadEmail } = await import("./email/lead-emails.server");
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");

    const lead = await loadLead(data.id);
    const mail = await renderLeadEmail(data.templateId, lead, data);

    const sent = await sendResendEmail({
      to: lead.email,
      subject: mail.subject,
      html: mail.html,
      reply_to: NOTIFY_EMAIL,
      kind: "lead-followup",
      relatedId: lead.id,
    });
    if (!sent.sent) {
      console.error("[campaign-lead] follow-up send failed", sent.reason);
      throw new Error(sent.reason || "Email could not be delivered");
    }
    return { ok: true as const, email: lead.email as string };
  });
