import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("job_applications")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        area: data.area,
        role: data.role,
        availability: data.availability,
        experience: data.experience || null,
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[careers] insert failed", error.message);
      throw new Error("We couldn't save your application. Please call (580) 745-0045.");
    }

    const application = {
      id: row.id as string,
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