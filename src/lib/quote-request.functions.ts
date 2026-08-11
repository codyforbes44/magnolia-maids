import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attributionSchema, attributionColumns } from "./attribution";

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
  smsConsent: z.boolean().default(false),
  attribution: attributionSchema.partial().optional(),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const submitQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => quoteRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { quoteRequestAdmin, quoteRequestCustomer } = await import("./email/quote-request");
    const { saveContactSubmission } = await import("./returning-contact.server");

    const payload = {
      ...data,
      phone: data.phone || null,
      address: data.address || null,
      preferredDate: data.preferredDate || null,
      preferredTime: data.preferredTime || null,
      notes: data.notes || null,
    };

    // Persist so the request shows up in Admin → Leads
    const detail = [
      `Service: ${data.service}`,
      `Frequency: ${data.frequency}`,
      data.addons ? `Add-ons: ${data.addons}` : null,
      data.pets ? "Pets in home" : null,
      `Estimate: ${data.estimate}`,
      data.address ? `Address: ${data.address}` : null,
      data.preferredTime ? `Preferred time: ${data.preferredTime}` : null,
      data.notes ? `Notes: ${data.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    let returning = false;
    try {
      const saved = await saveContactSubmission({
        table: "campaign_leads",
        email: data.email,
        phone: data.phone || null,
        appendColumn: "message",
        source: "instant quote form",
        summary: `${data.service} · ${data.bedrooms} bd / ${data.bathrooms} ba · ${data.estimate}`,
        values: {
          campaign: "instant-quote",
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          home_size: `${data.bedrooms} bd · ${data.bathrooms} ba`,
          preferred_date: /^\d{4}-\d{2}-\d{2}$/.test(data.preferredDate || "") ? data.preferredDate : null,
          message: detail,
          sms_consent: data.smsConsent,
          ...attributionColumns(data.attribution as any),
        },
      });
      returning = saved.returning;
    } catch (e) {
      console.error("[quote-request] lead save failed", e);
    }

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

    return { ok: true as const, returning, confirmationSent };
  });