import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { campaignLeadSchema } from "./campaign-lead-schema";

export const submitCampaignLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => campaignLeadSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { campaignLeadAdmin, campaignLeadCustomer } = await import("./email/campaign");
    const { CAMPAIGNS } = await import("./campaigns");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const meta = CAMPAIGNS[data.campaign];

    const { data: row, error } = await supabaseAdmin
      .from("campaign_leads")
      .insert({
        campaign: data.campaign,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        home_size: data.homeSize || null,
        preferred_date: data.preferredDate || null,
        referral_name: data.referralName || null,
        message: data.message || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[campaign-lead] insert failed", error.message);
      throw new Error("We couldn't save your request. Please call (580) 745-0045.");
    }

    const lead = {
      id: row.id as string,
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
      });
      if (!notified.sent) {
        console.error("[campaign-lead] notification not delivered", notified.reason);
      } else {
        const confirmation = await sendResendEmail({
          to: data.email,
          subject: customer.subject,
          html: customer.html,
          reply_to: NOTIFY_EMAIL,
        });
        confirmationSent = confirmation.sent;
        if (!confirmation.sent) console.error("[campaign-lead] confirmation not delivered", confirmation.reason);
      }
    } catch (e) {
      console.error("[campaign-lead] email send error", e);
    }

    return { ok: true as const, id: lead.id, confirmationSent };
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

    const meta = CAMPAIGNS[row.campaign];
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
    });

    if (!sent.sent) {
      console.error("[campaign-lead] resend thank-you failed", sent.reason);
      throw new Error(sent.reason || "Email could not be delivered");
    }

    return { ok: true as const, email: row.email };
  });
