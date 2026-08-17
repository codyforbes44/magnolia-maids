import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const planitCodeRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  name: z.string().trim().max(120).optional().or(z.literal("")),
});

export type PlanitCodeRequestInput = z.infer<typeof planitCodeRequestSchema>;

/** Emails the plan.It Family redemption code + redemption steps to a visitor. */
export const requestPlanitCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => planitCodeRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { planitCodeCustomer, planitCodeAdmin } = await import("./email/planit-code");
    const { loadPlanitCode } = await import("./partners.server");
    const { saveContactSubmission } = await import("./returning-contact.server");

    const code = await loadPlanitCode();
    const req = { email: data.email, name: data.name || null };

    const customer = planitCodeCustomer(req, code);
    const sent = await sendResendEmail({
      to: data.email,
      subject: customer.subject,
      html: customer.html,
      reply_to: NOTIFY_EMAIL,
      kind: "planit-code",
    });
    if (!sent.sent) {
      console.error("[planit-code] send failed", sent.reason);
      throw new Error("We couldn't send that email. Please call (580) 745-0045.");
    }

    try {
      await saveContactSubmission({
        table: "campaign_leads",
        email: data.email,
        phone: null,
        appendColumn: "message",
        source: "plan.It Family perk page",
        summary: `Requested plan.It ${code} code`,
        values: {
          campaign: "planit-family",
          name: data.name || null,
          email: data.email,
          message: `Requested the plan.It Family redemption code (${code}) from /planit-family.`,
          contact_pref: "email",
        },
      });
    } catch (e) {
      console.error("[planit-code] lead save failed", e);
    }

    try {
      const admin = planitCodeAdmin(req, code);
      await sendResendEmail({
        to: NOTIFY_EMAIL,
        subject: admin.subject,
        html: admin.html,
        reply_to: data.email,
        kind: "planit-code",
      });
    } catch (e) {
      console.error("[planit-code] admin notice failed", e);
    }

    return { ok: true as const };
  });
