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
    const { sendResendEmail } = await import("./resend.server");
    const { careersApplicationAdmin, careersApplicationCandidate } = await import("./email/templates");

    const application = {
      id: crypto.randomUUID(),
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

    try {
      await Promise.all([
        sendResendEmail({ to: "codyforbes@gmail.com", subject: admin.subject, html: admin.html, reply_to: data.email }),
        sendResendEmail({ to: data.email, subject: candidate.subject, html: candidate.html, reply_to: "hello@bookme.bet" }),
      ]);
    } catch (e) {
      console.error("[careers] email send error", e);
    }

    return { ok: true as const };
  });