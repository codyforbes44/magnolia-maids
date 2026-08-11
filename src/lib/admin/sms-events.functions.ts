import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Booking lifecycle texts an admin can fire from the bookings drawer. */
export const BOOKING_SMS_EVENTS = [
  { id: "booking-confirmation", label: "Booking confirmed", needsEta: false },
  { id: "appointment-reminder", label: "Appointment reminder", needsEta: false },
  { id: "crew-eta", label: "On the way (ETA)", needsEta: true },
  { id: "crew-arrived", label: "Crew arrived", needsEta: false },
  { id: "completion", label: "Clean complete", needsEta: false },
] as const;

export type BookingSmsEventId = (typeof BOOKING_SMS_EVENTS)[number]["id"];

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

const eventInput = z.object({
  bookingId: z.string().uuid(),
  event: z.enum([
    "booking-confirmation",
    "appointment-reminder",
    "crew-eta",
    "crew-arrived",
    "completion",
  ]),
  eta: z.string().trim().max(80).optional(),
  reviewUrl: z.string().trim().max(300).optional(),
});

/** Sends a booking lifecycle text to the customer using the stored template. */
export const sendBookingEventSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => eventInput.parse(data))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ sent: boolean; to?: string; body?: string; reason?: string }> => {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { sendSms, toE164 } = await import("@/lib/sms.server");
      const { renderStoredSms } = await import("@/lib/sms/render.server");
      const { SITE } = await import("@/lib/email/layout");

      const { data: b, error } = await supabaseAdmin
        .from("booking_requests")
        .select(
          "id,name,phone,address,service,frequency,bedrooms,bathrooms,preferred_day,preferred_time,sms_consent",
        )
        .eq("id", data.bookingId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!b) throw new Error("Booking not found");

      const to = toE164(b.phone ?? "");
      if (!to) return { sent: false, reason: "no_phone" };
      if (!b.sms_consent) return { sent: false, reason: "no_consent" };

      const tpl = await renderStoredSms(data.event, {
        name: b.name,
        firstName: b.name.trim().split(" ")[0] || "there",
        phone: b.phone,
        service: b.service,
        frequency: b.frequency,
        bedrooms: b.bedrooms,
        bathrooms: b.bathrooms,
        preferredDay: b.preferred_day,
        preferredTime: b.preferred_time,
        timeWindow: b.preferred_time,
        address: b.address,
        eta: data.eta ?? "shortly",
        reviewUrl: data.reviewUrl ?? `${SITE.url}/#reviews`,
        sitePhone: SITE.phone,
        ref: b.id.slice(0, 8).toUpperCase(),
      });
      if (!tpl) throw new Error("Unknown template");
      if (tpl.enabled === false) return { sent: false, reason: "template_paused" };

      const result = await sendSms({
        to,
        body: tpl.body,
        kind: `sms-${data.event}`,
        relatedId: b.id,
      });

      return {
        sent: result.sent,
        to,
        body: tpl.body,
        reason: "reason" in result ? result.reason : undefined,
      };
    },
  );

export type SmsActivityRow = {
  id: string;
  recipient: string;
  subject: string;
  kind: string;
  status: string;
  providerId: string | null;
  error: string | null;
  relatedId: string | null;
  createdAt: string;
  direction: "inbound" | "outbound";
};

const listInput = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["all", "sent", "failed"]).default("all"),
  direction: z.enum(["all", "inbound", "outbound"]).default("all"),
  kind: z.string().trim().max(80).optional(),
  limit: z.number().int().min(1).max(500).default(200),
});

/** Reads the SMS half of the shared activity log for the admin SMS log page. */
export const listSmsActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ rows: SmsActivityRow[]; kinds: string[] }> => {
      await assertAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      let query = supabaseAdmin
        .from("email_log")
        .select("id,recipient,subject,kind,status,provider_id,error,related_id,created_at")
        .like("kind", "sms%")
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (data.status !== "all") query = query.eq("status", data.status);
      if (data.kind) query = query.eq("kind", data.kind);
      if (data.direction === "inbound") query = query.like("kind", "sms-inbound%");
      if (data.search) {
        const q = `%${data.search}%`;
        query = query.or(
          `recipient.ilike.${q},subject.ilike.${q},error.ilike.${q},provider_id.ilike.${q}`,
        );
      }

      const { data: rows, error } = await query;
      if (error) throw new Error(error.message);

      const mapped: SmsActivityRow[] = (rows ?? []).map((r) => ({
        id: r.id,
        recipient: r.recipient,
        subject: r.subject,
        kind: r.kind,
        status: r.status,
        providerId: r.provider_id,
        error: r.error,
        relatedId: r.related_id,
        createdAt: r.created_at,
        direction: r.kind.startsWith("sms-inbound") ? "inbound" : "outbound",
      }));

      const filtered =
        data.direction === "outbound"
          ? mapped.filter((r) => r.direction === "outbound")
          : mapped;

      // Distinct kinds for the filter dropdown (from the loaded window).
      const kinds = Array.from(new Set(mapped.map((r) => r.kind))).sort();
      return { rows: filtered, kinds };
    },
  );
