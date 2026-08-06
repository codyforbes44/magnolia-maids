import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const bookingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().min(4, "Address is required").max(300),
  bedrooms: z.string().min(1).max(20),
  bathrooms: z.string().min(1).max(20),
  service: z.string().min(1).max(80),
  frequency: z.string().min(1).max(40),
  preferredDay: z.string().max(20).optional().or(z.literal("")),
  preferredTime: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { bookingConfirmationCustomer, bookingNotificationAdmin, airbnbTurnoverConfirmation } = await import("./email/templates");

    const { data: row, error } = await supabaseAdmin
      .from("booking_requests")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        address: data.address,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        service: data.service,
        frequency: data.frequency,
        preferred_day: data.preferredDay || null,
        preferred_time: data.preferredTime || null,
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[booking] insert failed", error);
      throw new Error("Could not save your request. Please try again.");
    }

    const details = {
      id: row.id as string,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      address: data.address,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      service: data.service,
      frequency: data.frequency,
      preferredDay: data.preferredDay || null,
      preferredTime: data.preferredTime || null,
      notes: data.notes || null,
    };
    const isTurnover = /airbnb|turnover/i.test(data.service);
    const customer = isTurnover
      ? airbnbTurnoverConfirmation(details, data.preferredTime || undefined)
      : bookingConfirmationCustomer(details);
    const admin = bookingNotificationAdmin(details);

    try {
      await Promise.all([
        sendResendEmail({ to: NOTIFY_EMAIL, subject: admin.subject, html: admin.html, reply_to: data.email }),
        sendResendEmail({ to: data.email, subject: customer.subject, html: customer.html, reply_to: NOTIFY_EMAIL }),
      ]);
    } catch (e) {
      console.error("[booking] email send error", e);
    }

    return { ok: true as const, id: row.id };
  });