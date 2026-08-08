import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  changeRequestSchema,
  homeProfileSchema,
  petSchema,
  profileSchema,
} from "./account-schemas";
import { z } from "zod";

const BOOKING_COLUMNS =
  "id,name,email,phone,address,bedrooms,bathrooms,service,frequency,preferred_day,preferred_time,notes,status,created_at";

/**
 * Links every booking/lead that matches the signed-in user's verified email
 * (or their saved phone) to their account, then returns the profile.
 */
export const getAccountProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const email = (context.claims as { email?: string } | null)?.email ?? null;

    let { data: profile } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      const { data: created } = await supabase
        .from("customer_profiles")
        .insert({ id: userId, full_name: "" })
        .select("*")
        .single();
      profile = created ?? null;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const digits = (profile?.phone ?? "").replace(/\D/g, "");

    if (email) {
      await supabaseAdmin
        .from("booking_requests")
        .update({ customer_id: userId })
        .is("customer_id", null)
        .ilike("email", email);
      await supabaseAdmin
        .from("campaign_leads")
        .update({ customer_id: userId })
        .is("customer_id", null)
        .ilike("email", email);
    }
    if (digits.length >= 10) {
      await supabaseAdmin
        .from("booking_requests")
        .update({ customer_id: userId })
        .is("customer_id", null)
        .eq("phone_digits", digits);
    }
    if (profile && !profile.claimed_at) {
      await supabase
        .from("customer_profiles")
        .update({ claimed_at: new Date().toISOString() })
        .eq("id", userId);
    }

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);

    return {
      profile: profile
        ? {
            fullName: profile.full_name ?? "",
            phone: profile.phone,
            contactPref: profile.contact_pref ?? "email",
            marketingOptIn: profile.marketing_opt_in ?? false,
          }
        : null,
      email,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  });

export const saveAccountProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("customer_profiles")
      .upsert({
        id: context.userId,
        full_name: data.fullName,
        phone: data.phone,
        contact_pref: data.contactPref,
        marketing_opt_in: data.marketingOptIn,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("booking_requests")
      .select(BOOKING_COLUMNS)
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const { data: requests } = await context.supabase
      .from("service_change_requests")
      .select("id,booking_id,kind,status,preferred_day,alternate_day,preferred_time,reason,note,admin_response,created_at")
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });

    return { bookings: data ?? [], changeRequests: requests ?? [] };
  });

export const getMyBooking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: booking, error } = await context.supabase
      .from("booking_requests")
      .select(BOOKING_COLUMNS)
      .eq("id", data.id)
      .eq("customer_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!booking) return { booking: null, changeRequests: [] };

    const { data: requests } = await context.supabase
      .from("service_change_requests")
      .select("id,booking_id,kind,status,preferred_day,alternate_day,preferred_time,reason,note,admin_response,created_at")
      .eq("booking_id", data.id)
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });

    return { booking, changeRequests: requests ?? [] };
  });

export const getHomeProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: home } = await context.supabase
      .from("customer_homes")
      .select("*")
      .eq("customer_id", context.userId)
      .maybeSingle();
    const { data: pets } = await context.supabase
      .from("customer_pets")
      .select("*")
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: true });
    return { home: home ?? null, pets: pets ?? [] };
  });

export const saveHomeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => homeProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("customer_homes").upsert({
      customer_id: context.userId,
      entry_method: data.entryMethod,
      entry_code: data.entryCode,
      lockbox_location: data.lockboxLocation,
      alarm_instructions: data.alarmInstructions,
      parking_notes: data.parkingNotes,
      address: data.address,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      square_feet: data.squareFeet,
      skip_rooms: data.skipRooms,
      focus_rooms: data.focusRooms,
      product_preferences: data.productPreferences,
      scent_preference: data.scentPreference,
      supplies_notes: data.suppliesNotes,
      preferred_frequency: data.preferredFrequency,
      preferred_day: data.preferredDay,
      preferred_window: data.preferredWindow,
      standing_addons: data.standingAddons,
      billing_email: data.billingEmail,
      billing_phone: data.billingPhone,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const savePet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => petSchema.parse(data))
  .handler(async ({ data, context }) => {
    const row = {
      customer_id: context.userId,
      name: data.name,
      kind: data.kind,
      temperament: data.temperament,
      location_during_clean: data.locationDuringClean,
      notes: data.notes,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("customer_pets")
        .update(row)
        .eq("id", data.id)
        .eq("customer_id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("customer_pets")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

export const deletePet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("customer_pets")
      .delete()
      .eq("id", data.id)
      .eq("customer_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => changeRequestSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: booking, error: bookingError } = await context.supabase
      .from("booking_requests")
      .select("id,name,email,service,frequency,preferred_day,preferred_time,address")
      .eq("id", data.bookingId)
      .eq("customer_id", context.userId)
      .maybeSingle();
    if (bookingError) throw new Error(bookingError.message);
    if (!booking) throw new Error("We couldn't find that visit on your account.");

    const { data: inserted, error } = await context.supabase
      .from("service_change_requests")
      .insert({
        booking_id: data.bookingId,
        customer_id: context.userId,
        kind: data.kind,
        preferred_day: data.preferredDay,
        alternate_day: data.alternateDay,
        preferred_time: data.preferredTime,
        reason: data.reason,
        note: data.note,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { changeRequestReceived, changeRequestAdmin } = await import("./email/account");

    const payload = {
      name: booking.name,
      kind: data.kind,
      service: booking.service,
      currentDay: booking.preferred_day,
      currentTime: booking.preferred_time,
      preferredDay: data.preferredDay,
      alternateDay: data.alternateDay,
      preferredTime: data.preferredTime,
      reason: data.reason,
      note: data.note,
      address: booking.address,
      email: booking.email,
      bookingId: booking.id,
    };

    const customer = changeRequestReceived(payload);
    await sendResendEmail({
      to: booking.email,
      subject: customer.subject,
      html: customer.html,
      reply_to: NOTIFY_EMAIL,
      kind: "change-request",
      templateId: "change-request-received",
      relatedId: booking.id,
    });
    const admin = changeRequestAdmin(payload);
    await sendResendEmail({
      to: NOTIFY_EMAIL,
      subject: admin.subject,
      html: admin.html,
      reply_to: booking.email,
      kind: "change-request",
      templateId: "change-request-admin",
      relatedId: booking.id,
    });

    return { ok: true, id: inserted.id };
  });