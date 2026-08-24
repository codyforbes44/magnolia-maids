import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReportLead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  campaign: string;
  source: string | null;
  home_size: string | null;
  preferred_date: string | null;
  contact_pref: string | null;
  status: string;
  message: string | null;
};

export type ReportBooking = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  frequency: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  preferred_day: string | null;
  preferred_time: string | null;
  address: string | null;
  contact_pref: string | null;
  status: string;
  notes: string | null;
};

export type ReportApplicant = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  employment_type: string | null;
  area: string | null;
  availability: string | null;
  experience: string | null;
  contact_pref: string | null;
  status: string;
};

export type ItemizedReport = {
  generatedAt: string;
  from: string | null;
  to: string | null;
  leads: ReportLead[];
  bookings: ReportBooking[];
  applicants: ReportApplicant[];
};

const rangeSchema = z.object({
  from: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  to: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

export const buildItemizedReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => rangeSchema.parse(data ?? {}))
  .handler(async ({ context, data }): Promise<ItemizedReport> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const from = data.from ? `${data.from}T00:00:00.000Z` : null;
    const to = data.to ? `${data.to}T23:59:59.999Z` : null;

    const scope = (q: any) => {
      let out = q.order("created_at", { ascending: false }).limit(5000);
      if (from) out = out.gte("created_at", from);
      if (to) out = out.lte("created_at", to);
      return out;
    };

    const [leads, bookings, applicants] = await Promise.all([
      scope(
        supabaseAdmin
          .from("campaign_leads")
          .select(
            "id, created_at, name, email, phone, campaign, source, home_size, preferred_date, contact_pref, status, message",
          ),
      ),
      scope(
        supabaseAdmin
          .from("booking_requests")
          .select(
            "id, created_at, name, email, phone, service, frequency, bedrooms, bathrooms, preferred_day, preferred_time, address, contact_pref, status, notes",
          ),
      ),
      scope(
        supabaseAdmin
          .from("job_applications")
          .select(
            "id, created_at, name, email, phone, role, employment_type, area, availability, experience, contact_pref, status",
          ),
      ),
    ]);

    for (const res of [leads, bookings, applicants]) {
      if (res.error) throw new Error(res.error.message);
    }

    return {
      generatedAt: new Date().toISOString(),
      from: data.from || null,
      to: data.to || null,
      leads: (leads.data ?? []) as ReportLead[],
      bookings: (bookings.data ?? []) as ReportBooking[],
      applicants: (applicants.data ?? []) as ReportApplicant[],
    };
  });
