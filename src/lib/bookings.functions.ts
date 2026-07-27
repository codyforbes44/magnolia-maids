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
    const { sendResendEmail } = await import("./resend.server");

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

    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const rows: [string, string][] = [
      ["Name", data.name],
      ["Email", data.email],
      ["Phone", data.phone || "—"],
      ["Address", data.address],
      ["Bedrooms", data.bedrooms],
      ["Bathrooms", data.bathrooms],
      ["Service", data.service],
      ["Frequency", data.frequency],
      ["Preferred day", data.preferredDay || "—"],
      ["Preferred time", data.preferredTime || "—"],
      ["Notes", data.notes || "—"],
    ];
    const tableRows = rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px;color:#64748b;font-weight:600;">${esc(k)}</td><td style="padding:6px 12px;color:#0f172a;">${esc(v)}</td></tr>`,
      )
      .join("");

    const adminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;">
        <h2 style="color:#0ea5e9;margin:0 0 8px;">🐬 New Splash booking request</h2>
        <p style="color:#334155;margin:0 0 16px;">A new quote came in from ${esc(data.name)}.</p>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;">${tableRows}</table>
        <p style="color:#64748b;font-size:12px;margin-top:16px;">Booking ID: ${row.id}</p>
      </div>`;

    const customerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;">
        <h2 style="color:#0ea5e9;margin:0 0 8px;">Thanks, ${esc(data.name)}! 🐬</h2>
        <p style="color:#334155;">We received your Splash cleaning request and will confirm your visit within one business hour.</p>
        <h3 style="color:#0f172a;margin-top:20px;">Your request</h3>
        <table style="width:100%;border-collapse:collapse;background:#f0f9ff;border-radius:12px;overflow:hidden;">${tableRows}</table>
        <p style="color:#334155;margin-top:20px;">Reply to this email if anything changes — we're here to help.</p>
        <p style="color:#64748b;font-size:12px;">— The Splash team · Miami, FL</p>
      </div>`;

    try {
      await Promise.all([
        sendResendEmail({
          to: "codyforbes@gmail.com",
          subject: `New booking · ${data.name} · ${data.service}`,
          html: adminHtml,
          reply_to: data.email,
        }),
        sendResendEmail({
          to: data.email,
          subject: "We got your Splash cleaning request 🐬",
          html: customerHtml,
          reply_to: "codyforbes@gmail.com",
        }),
      ]);
    } catch (e) {
      console.error("[booking] email send error", e);
    }

    return { ok: true as const, id: row.id };
  });