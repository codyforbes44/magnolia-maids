import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const quoteRequestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  preferredDate: z.string().trim().max(60).optional().or(z.literal("")),
  preferredTime: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  service: z.string().trim().max(80),
  frequency: z.string().trim().max(60),
  bedrooms: z.string().trim().max(20),
  bathrooms: z.string().trim().max(20),
  addons: z.string().trim().max(400),
  pets: z.boolean(),
  estimate: z.string().trim().max(40),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const submitQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => quoteRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { quoteRequestAdmin, quoteRequestCustomer } = await import("./email/quote-request");

    const payload = {
      ...data,
      phone: data.phone || null,
      address: data.address || null,
      preferredDate: data.preferredDate || null,
      preferredTime: data.preferredTime || null,
      notes: data.notes || null,
    };

    const admin = quoteRequestAdmin(payload);
    const notified = await sendResendEmail({
      to: NOTIFY_EMAIL,
      subject: admin.subject,
      html: admin.html,
      reply_to: data.email,
      kind: "quote-request",
    });

    if (!notified.sent) {
      console.error("[quote-request] admin notification failed", notified.reason);
      throw new Error("We couldn't send your request. Please call (580) 745-0045.");
    }

    let confirmationSent = false;
    try {
      const customer = quoteRequestCustomer(payload);
      const confirmation = await sendResendEmail({
        to: data.email,
        subject: customer.subject,
        html: customer.html,
        reply_to: NOTIFY_EMAIL,
        kind: "quote-request",
      });
      confirmationSent = confirmation.sent;
      if (!confirmation.sent) console.error("[quote-request] confirmation failed", confirmation.reason);
    } catch (e) {
      console.error("[quote-request] confirmation error", e);
    }

    return { ok: true as const, confirmationSent };
  });