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
  sqft: z.string().trim().max(40).optional().or(z.literal("")),
  service: z.string().min(1).max(80),
  frequency: z.string().min(1).max(40),
  preferredDay: z.string().max(20).optional().or(z.literal("")),
  preferredTime: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  smsConsent: z.boolean().default(false),
  contactPref: z.enum(["email", "text", "call"]).default("email"),
  attribution: attributionSchema.partial().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { saveContactSubmission } = await import("./returning-contact.server");
    const { bookingConfirmationCustomer, bookingNotificationAdmin, airbnbTurnoverConfirmation } = await import("./email/templates");
    const { sendSms, recordSmsOptIn } = await import("./sms.server");
    const { bookingConfirmationSms, bookingAlertSms } = await import("./sms/messages");
    const { renderStoredSms } = await import("./sms/render.server");
    const { SITE } = await import("./email/layout");

    const saved = await saveContactSubmission({
      table: "booking_requests",
      email: data.email,
      phone: data.phone || null,
      appendColumn: "notes",
      source: "booking wizard",
      summary: `${data.service} · ${data.frequency} · ${data.bedrooms} bd / ${data.bathrooms} ba${
        data.sqft ? ` · ${data.sqft}` : ""
      }`,
      values: {
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
        notes: [data.sqft ? `Home size: ${data.sqft}` : null, data.notes || null]
          .filter(Boolean)
          .join(" — ") || null,
        sms_consent: data.smsConsent,
        contact_pref: data.contactPref,
        ...attributionColumns(data.attribution as any),
      },
    });

    const details = {
      id: saved.id,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      address: data.address,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqft: data.sqft || null,
      service: data.service,
      frequency: data.frequency,
      preferredDay: data.preferredDay || null,
      preferredTime: data.preferredTime || null,
      notes: data.notes || null,
    };
    const isTurnover = /airbnb|turnover/i.test(data.service);
    // Persist the checkbox opt-in centrally so every later channel honors it.
    if (data.smsConsent && details.phone) await recordSmsOptIn(details.phone, "booking-form");
    const customer = isTurnover
      ? airbnbTurnoverConfirmation(details, data.preferredTime || undefined)
      : bookingConfirmationCustomer(details);
    const admin = bookingNotificationAdmin(details);

    const { notifySlackSafe } = await import("./slack.server");
    notifySlackSafe("bookings", {
      emoji: "🗓️",
      title: "New booking request",
      headline: `${details.name} — ${details.service} (${details.frequency})`,
      rows: [
        ["Email", details.email],
        ["Phone", details.phone],
        ["Home", `${details.bedrooms} bd / ${details.bathrooms} ba`],
        ["Address", details.address],
        ["Preferred", [details.preferredDay, details.preferredTime].filter(Boolean).join(" ") || null],
        ["Notes", details.notes],
      ],
      adminPath: "/admin/bookings",
    });

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

    // Admin-editable wording (falls back to the built-in copy when no override).
    const smsVars = {
      name: details.name,
      firstName: details.name.trim().split(" ")[0] || "there",
      phone: details.phone,
      service: details.service,
      frequency: details.frequency,
      bedrooms: details.bedrooms,
      bathrooms: details.bathrooms,
      preferredDay: details.preferredDay,
      preferredTime: details.preferredTime,
      address: details.address,
      estimate: null,
      sitePhone: SITE.phone,
      ref: details.id.slice(0, 8).toUpperCase(),
    };
    const [confirmTpl, alertTpl] = await Promise.all([
      renderStoredSms("booking-confirmation", smsVars),
      renderStoredSms("booking-alert", smsVars),
    ]);
    const confirmBody =
      confirmTpl?.enabled === false ? null : (confirmTpl?.body ?? bookingConfirmationSms(smsDetails));
    const alertBody =
      alertTpl?.enabled === false
        ? null
        : (alertTpl?.body ?? bookingAlertSms({ ...smsDetails, phone: details.phone }));

    // Only text the visitor if they opted in.
    const customerText = details.phone && confirmBody
      ? data.smsConsent
        ? sendSms({
            to: details.phone,
            body: confirmBody,
            kind: "sms-booking-confirmation",
            relatedId: details.id,
          })
        : Promise.resolve({ sent: false as const, reason: "no_consent" })
      : Promise.resolve({ sent: false as const, reason: "no_phone" });

    // Everything fires immediately and in parallel — the visitor's recap never
    // waits on the internal alert, and no single failure blocks the others.
    const [confirmation, , customerTextResult] = await Promise.all([
      // 1. Recap + next steps straight back to the visitor.
      sendResendEmail({
        to: data.email,
        subject: customer.subject,
        html: customer.html,
        reply_to: NOTIFY_EMAIL,
        kind: "booking-confirmation",
        templateId: "booking-confirmation-customer",
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
        templateId: "booking-notification-admin",
        relatedId: details.id,
      }).catch((e) => {
        console.error("[booking] admin email error", e);
        return { sent: false as const, reason: "exception" };
      }),
      // 3. Text the visitor the same recap (skipped when no phone or no consent).
      customerText,
      // 4. Heads-up text to the dispatch line (only when a distinct number is set —
      //    Twilio rejects a message whose To matches its From).
      (async () => {
        const { toE164 } = await import("./sms.server");
        if (!alertBody) return { sent: false as const, reason: "template_disabled" };
        const alertTo = toE164(process.env.ADMIN_SMS_NUMBER ?? SITE.phone);
        const from = toE164(process.env.TWILIO_FROM_NUMBER);
        if (!alertTo || alertTo === from) return { sent: false as const, reason: "same_number" };
        return sendSms({
          to: alertTo,
          body: alertBody,
          kind: "sms-booking-alert",
          relatedId: details.id,
          checkConsent: false,
        });
      })(),
    ]);

    if (!confirmation.sent) console.error("[booking] confirmation not delivered", confirmation.reason);
    if (!customerTextResult.sent && details.phone && data.smsConsent) console.warn("[booking] confirmation text not sent", customerTextResult.reason);

    return {
      ok: true as const,
      id: saved.id,
      returning: saved.returning,
      submissions: saved.submissions,
      confirmationSent: confirmation.sent,
      textSent: customerTextResult.sent,
    };
  });