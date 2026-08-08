import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attributionSchema, attributionColumns } from "./attribution";

const addressComponentsSchema = z
  .object({
    street: z.string().trim().max(200).nullable().default(null),
    unit: z.string().trim().max(60).nullable().default(null),
    city: z.string().trim().max(120).nullable().default(null),
    state: z.string().trim().max(60).nullable().default(null),
    postalCode: z.string().trim().max(20).nullable().default(null),
    country: z.string().trim().max(10).nullable().default(null),
    lat: z.number().min(-90).max(90).nullable().default(null),
    lng: z.number().min(-180).max(180).nullable().default(null),
    placeId: z.string().trim().max(300).nullable().default(null),
  })
  .optional();

const bookingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().min(4, "Address is required").max(300),
  addressComponents: addressComponentsSchema,
  bedrooms: z.string().min(1).max(20),
  bathrooms: z.string().min(1).max(20),
  service: z.string().min(1).max(80),
  frequency: z.string().min(1).max(40),
  preferredDay: z.string().max(20).optional().or(z.literal("")),
  preferredTime: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  attribution: attributionSchema.partial().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { bookingConfirmationCustomer, bookingNotificationAdmin, airbnbTurnoverConfirmation } = await import("./email/templates");
    const { sendSms } = await import("./sms.server");
    const { bookingConfirmationSms, bookingAlertSms } = await import("./sms/messages");
    const { SITE } = await import("./email/layout");

    const { data: row, error } = await supabaseAdmin
      .from("booking_requests")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        address: data.address,
        address_street: data.addressComponents?.street ?? null,
        address_unit: data.addressComponents?.unit ?? null,
        address_city: data.addressComponents?.city ?? null,
        address_state: data.addressComponents?.state ?? null,
        address_postal_code: data.addressComponents?.postalCode ?? null,
        address_country: data.addressComponents?.country ?? null,
        address_lat: data.addressComponents?.lat ?? null,
        address_lng: data.addressComponents?.lng ?? null,
        address_place_id: data.addressComponents?.placeId ?? null,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        service: data.service,
        frequency: data.frequency,
        preferred_day: data.preferredDay || null,
        preferred_time: data.preferredTime || null,
        notes: data.notes || null,
        ...attributionColumns(data.attribution as any),
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

    const smsDetails = {
      id: details.id,
      name: details.name,
      service: details.service,
      frequency: details.frequency,
      bedrooms: details.bedrooms,
      bathrooms: details.bathrooms,
      preferredDay: details.preferredDay,
      preferredTime: details.preferredTime,
    };

    // Everything fires immediately and in parallel — the visitor's recap never
    // waits on the internal alert, and no single failure blocks the others.
    const [confirmation, , customerText] = await Promise.all([
      // 1. Recap + next steps straight back to the visitor.
      sendResendEmail({
        to: data.email,
        subject: customer.subject,
        html: customer.html,
        reply_to: NOTIFY_EMAIL,
        kind: "booking-confirmation",
        relatedId: details.id,
      }).catch((e) => {
        console.error("[booking] confirmation email error", e);
        return { sent: false as const, reason: "exception" };
      }),
      // 2. Deliver the request to the Magnolia Maids inbox.
      sendResendEmail({
        to: NOTIFY_EMAIL,
        subject: admin.subject,
        html: admin.html,
        reply_to: data.email,
        kind: "booking-alert",
        relatedId: details.id,
      }).catch((e) => {
        console.error("[booking] admin email error", e);
        return { sent: false as const, reason: "exception" };
      }),
      // 3. Text the visitor the same recap (skipped when no phone was given).
      details.phone
        ? sendSms({
            to: details.phone,
            body: bookingConfirmationSms(smsDetails),
            kind: "sms-booking-confirmation",
            relatedId: details.id,
          })
        : Promise.resolve({ sent: false as const, reason: "no_phone" }),
      // 4. Heads-up text to the dispatch line (only when a distinct number is set —
      //    Twilio rejects a message whose To matches its From).
      (async () => {
        const { toE164 } = await import("./sms.server");
        const alertTo = toE164(process.env.ADMIN_SMS_NUMBER ?? SITE.phone);
        const from = toE164(process.env.TWILIO_FROM_NUMBER);
        if (!alertTo || alertTo === from) return { sent: false as const, reason: "same_number" };
        return sendSms({
          to: alertTo,
          body: bookingAlertSms({ ...smsDetails, phone: details.phone }),
          kind: "sms-booking-alert",
          relatedId: details.id,
        });
      })(),
    ]);

    if (!confirmation.sent) console.error("[booking] confirmation not delivered", confirmation.reason);
    if (!customerText.sent && details.phone) console.warn("[booking] confirmation text not sent", customerText.reason);

    return {
      ok: true as const,
      id: row.id,
      confirmationSent: confirmation.sent,
      textSent: customerText.sent,
    };
  });