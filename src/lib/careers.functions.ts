import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const careersSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(4).max(40),
  area: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(80),
  availability: z.string().trim().min(1).max(200),
  experience: z.string().max(2000).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type CareersInput = z.infer<typeof careersSchema>;

export const submitCareersApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => careersSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { careersApplicationAdmin, careersApplicationCandidate } = await import("./email/templates");
    const { saveContactSubmission } = await import("./returning-contact.server");

    const saved = await saveContactSubmission({
      table: "job_applications",
      email: data.email,
      phone: data.phone,
      appendColumn: "notes",
      source: "careers application",
      summary: `${data.role} · ${data.area}`,
      values: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        area: data.area,
        role: data.role,
        availability: data.availability,
        experience: data.experience || null,
        notes: data.notes || null,
      },
    });

    const application = {
      id: saved.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      area: data.area,
      role: data.role,
      availability: data.availability,
      experience: data.experience || null,
      notes: data.notes || null,
    };

    const candidate = careersApplicationCandidate(application);
    const admin = careersApplicationAdmin(application);

    let confirmationSent = false;
    try {
      // 1. Deliver the application to the Magnolia Maids inbox.
      const notified = await sendResendEmail({
        to: NOTIFY_EMAIL,
        subject: admin.subject,
        html: admin.html,
        reply_to: data.email,
        kind: "careers-admin",
        templateId: "careers-admin",
        relatedId: application.id,
      });

      if (!notified.sent) {
        console.error("[careers] notification not delivered", notified.reason);
      } else {
        // 2. Only after a successful delivery, confirm back to the applicant
        //    with their submitted details and the expected next steps.
        const confirmation = await sendResendEmail({
          to: data.email,
          subject: candidate.subject,
          html: candidate.html,
          reply_to: NOTIFY_EMAIL,
          kind: "careers-confirmation",
          templateId: "careers-candidate",
          relatedId: application.id,
        });
        confirmationSent = confirmation.sent;
        if (!confirmation.sent) {
          console.error("[careers] confirmation not delivered", confirmation.reason);
        }
      }
    } catch (e) {
      console.error("[careers] email send error", e);
    }

    return { ok: true as const, id: application.id, confirmationSent };
  });

/**
 * Admin-only: sends the Facebook hiring follow-up (or the standard "application
 * received" copy) to an applicant, with any admin edits from Admin → Emails applied.
 */
export const sendApplicantFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        templateId: z.enum(["facebook-hiring-followup", "careers-candidate"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { applyOverride, loadOverride } = await import("./email/overrides.server");

    const { data: row, error } = await supabaseAdmin
      .from("job_applications")
      .select("id,name,email,phone,area,role,availability,experience,notes")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("Application not found");

    let mail;
    if (data.templateId === "facebook-hiring-followup") {
      const { facebookHiringFollowup } = await import("./email/facebook-hiring-followup");
      mail = facebookHiringFollowup({
        name: row.name,
        role: row.role,
        area: row.area,
        availability: row.availability,
      });
    } else {
      const { careersApplicationCandidate } = await import("./email/templates");
      mail = careersApplicationCandidate({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        area: row.area,
        role: row.role,
        availability: row.availability,
        experience: row.experience,
        notes: row.notes,
      });
    }

    mail = applyOverride(mail, await loadOverride(data.templateId));

    const sent = await sendResendEmail({
      to: row.email,
      subject: mail.subject,
      html: mail.html,
      reply_to: NOTIFY_EMAIL,
      kind: "careers-followup",
      templateId: data.templateId,
      relatedId: row.id,
    });
    if (!sent.sent) {
      console.error("[careers] follow-up send failed", sent.reason);
      throw new Error(sent.reason || "Email could not be delivered");
    }

    // Stamp the record so the scheduled Facebook follow-up job skips it.
    if (data.templateId === "facebook-hiring-followup") {
      const { error: markError } = await supabaseAdmin
        .from("job_applications")
        .update({ followup_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      if (markError) console.error("[careers] follow-up stamp failed", markError.message);
    }

    return { ok: true as const, email: row.email as string };
  });