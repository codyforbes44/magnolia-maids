import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

export const listChangeRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("service_change_requests")
      .select(
        "id,booking_id,customer_id,kind,status,preferred_day,alternate_day,preferred_time,reason,note,admin_response,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((data ?? []).map((r) => r.booking_id)));
    const bookings = ids.length
      ? (
          await supabaseAdmin
            .from("booking_requests")
            .select("id,name,email,phone,service,frequency,preferred_day,preferred_time,address,status")
            .in("id", ids)
        ).data ?? []
      : [];
    const byId = new Map(bookings.map((b) => [b.id, b]));
    return (data ?? []).map((r) => ({ ...r, booking: byId.get(r.booking_id) ?? null }));
  });

export const resolveChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "declined"]),
        adminResponse: z.string().trim().max(1000).optional().default(""),
        newDay: z.string().trim().max(20).optional().default(""),
        newTime: z.string().trim().max(60).optional().default(""),
        notifyCustomer: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error } = await supabaseAdmin
      .from("service_change_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !req) throw new Error("Request not found");

    const { data: booking } = await supabaseAdmin
      .from("booking_requests")
      .select("id,name,email,service,preferred_day,preferred_time,address")
      .eq("id", req.booking_id)
      .maybeSingle();

    // Apply the change to the booking itself when the office approves it.
    if (data.decision === "approved" && booking) {
      if (req.kind === "cancel") {
        await supabaseAdmin.from("booking_requests").update({ status: "cancelled" }).eq("id", booking.id);
      } else {
        const day = data.newDay || req.preferred_day;
        const time = data.newTime || req.preferred_time;
        await supabaseAdmin
          .from("booking_requests")
          .update({
            preferred_day: day ?? booking.preferred_day,
            preferred_time: time ?? booking.preferred_time,
            status: "confirmed",
          })
          .eq("id", booking.id);
      }
    }

    await supabaseAdmin
      .from("service_change_requests")
      .update({
        status: data.decision,
        admin_response: data.adminResponse || null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (data.notifyCustomer && booking?.email) {
      const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
      const { changeRequestResolved } = await import("@/lib/email/account");
      const rendered = changeRequestResolved({
        name: booking.name,
        kind: req.kind as "reschedule" | "cancel",
        service: booking.service,
        currentDay: booking.preferred_day,
        currentTime: booking.preferred_time,
        preferredDay: data.newDay || req.preferred_day,
        preferredTime: data.newTime || req.preferred_time,
        address: booking.address,
        bookingId: booking.id,
        approved: data.decision === "approved",
        adminResponse: data.adminResponse || null,
      });
      await sendResendEmail({
        to: booking.email,
        subject: rendered.subject,
        html: rendered.html,
        reply_to: NOTIFY_EMAIL,
        kind: "change-request",
        templateId: "change-request-resolved",
        relatedId: booking.id,
      });
    }

    return { ok: true };
  });