import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { HubPerson, HubPersonDetail, HubPersonKind } from "./hub-types";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

const TABLE_BY_KIND = {
  lead: "campaign_leads",
  booking: "booking_requests",
  applicant: "job_applications",
  client: "customer_profiles",
} as const;

/** Every person the business is talking to — leads, bookings, applicants, clients. */
export const listHubPeople = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["all", "lead", "booking", "applicant", "client"]).default("all"),
        search: z.string().trim().max(120).optional(),
        limit: z.number().int().min(1).max(100).default(40),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ people: HubPerson[] }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = (data.search ?? "").replace(/[%,()]/g, " ").trim();
    const like = `%${s}%`;
    const want = (k: HubPersonKind) => data.kind === "all" || data.kind === k;

    const [leads, bookings, applicants, clients] = await Promise.all([
      want("lead")
        ? supabaseAdmin
            .from("campaign_leads")
            .select(
              "id, name, email, phone, campaign, source, status, message, home_size, preferred_date, contact_pref, created_at",
            )
            .order("created_at", { ascending: false })
            .limit(data.limit)
        : { data: [] },
      want("booking")
        ? supabaseAdmin
            .from("booking_requests")
            .select(
              "id, name, email, phone, service, frequency, address, preferred_day, preferred_time, status, notes, contact_pref, created_at",
            )
            .order("created_at", { ascending: false })
            .limit(data.limit)
        : { data: [] },
      want("applicant")
        ? supabaseAdmin
            .from("job_applications")
            .select(
              "id, name, email, phone, role, area, availability, status, notes, contact_pref, created_at",
            )
            .order("created_at", { ascending: false })
            .limit(data.limit)
        : { data: [] },
      want("client")
        ? supabaseAdmin
            .from("customer_profiles")
            .select("id, full_name, phone, contact_pref, created_at")
            .order("created_at", { ascending: false })
            .limit(data.limit)
        : { data: [] },
    ]);

    const people: HubPerson[] = [];

    for (const r of (leads.data ?? []) as any[]) {
      people.push({
        id: r.id,
        kind: "lead",
        name: r.name,
        email: r.email ?? null,
        phone: r.phone ?? null,
        status: r.status ?? null,
        contactPref: r.contact_pref ?? null,
        summary: [r.campaign || r.source, r.home_size].filter(Boolean).join(" · ") || null,
        at: r.created_at,
      });
    }
    for (const r of (bookings.data ?? []) as any[]) {
      people.push({
        id: r.id,
        kind: "booking",
        name: r.name,
        email: r.email ?? null,
        phone: r.phone ?? null,
        status: r.status ?? null,
        contactPref: r.contact_pref ?? null,
        summary:
          [r.service, r.frequency, r.preferred_day].filter(Boolean).join(" · ") || null,
        at: r.created_at,
      });
    }
    for (const r of (applicants.data ?? []) as any[]) {
      people.push({
        id: r.id,
        kind: "applicant",
        name: r.name,
        email: r.email ?? null,
        phone: r.phone ?? null,
        status: r.status ?? null,
        contactPref: r.contact_pref ?? null,
        summary: [r.role, r.area].filter(Boolean).join(" · ") || null,
        at: r.created_at,
      });
    }
    if ((clients.data ?? []).length) {
      // customer_profiles has no email column — pull the latest booking email per client.
      const ids = (clients.data as any[]).map((c) => c.id);
      const { data: bookingEmails } = await supabaseAdmin
        .from("booking_requests")
        .select("customer_id, email, created_at")
        .in("customer_id", ids)
        .order("created_at", { ascending: false });
      const emailByCustomer = new Map<string, string>();
      for (const b of (bookingEmails ?? []) as any[]) {
        if (b.customer_id && !emailByCustomer.has(b.customer_id)) {
          emailByCustomer.set(b.customer_id, b.email);
        }
      }
      for (const r of clients.data as any[]) {
        people.push({
          id: r.id,
          kind: "client",
          name: r.full_name || "Client",
          email: emailByCustomer.get(r.id) ?? null,
          phone: r.phone ?? null,
          status: "client",
          contactPref: r.contact_pref ?? null,
          summary: "Account holder",
          at: r.created_at,
        });
      }
    }

    const filtered = s
      ? people.filter((p) =>
          [p.name, p.email, p.phone, p.summary, p.status]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(s.toLowerCase())),
        )
      : people;

    filtered.sort((a, b) => (a.at < b.at ? 1 : -1));
    void like;
    return { people: filtered.slice(0, 80) };
  });

/** One person: their record fields, recent conversations, and outreach history. */
export const getHubPerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["lead", "booking", "applicant", "client"]),
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<HubPersonDetail> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = TABLE_BY_KIND[data.kind];
    const { data: row, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That record no longer exists.");

    const r = row as any;
    const name = r.name ?? r.full_name ?? "Contact";
    let email: string | null = r.email ?? null;
    const phone: string | null = r.phone ?? null;

    if (data.kind === "client" && !email) {
      const { data: b } = await supabaseAdmin
        .from("booking_requests")
        .select("email")
        .eq("customer_id", data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      email = (b as any)?.email ?? null;
    }

    const digits = (phone ?? "").replace(/\D/g, "").slice(-10);
    const keys = [email?.toLowerCase(), digits ? `+1${digits}` : null].filter(Boolean) as string[];

    const [threadsRes, callsRes, activityRes] = await Promise.all([
      keys.length
        ? supabaseAdmin
            .from("message_threads")
            .select("id, channel, contact_key, last_snippet, last_message_at, unread")
            .in("contact_key", keys)
            .order("last_message_at", { ascending: false })
            .limit(10)
        : { data: [] },
      digits
        ? supabaseAdmin
            .from("outbound_calls")
            .select("id, purpose, status, outcome, duration_secs, created_at")
            .ilike("phone_e164", `%${digits}`)
            .order("created_at", { ascending: false })
            .limit(10)
        : { data: [] },
      supabaseAdmin
        .from("contact_activity")
        .select("id, event, summary, source, created_at")
        .eq("record_table", table)
        .eq("record_id", data.id)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    // Only present fields worth reading on a small screen.
    const skip = new Set([
      "id",
      "name",
      "full_name",
      "email",
      "phone",
      "phone_digits",
      "created_at",
      "updated_at",
      "customer_id",
    ]);
    const fields = Object.entries(r)
      .filter(([k, v]) => !skip.has(k) && v !== null && v !== "" && typeof v !== "object")
      .map(([k, v]) => ({ label: k.replace(/_/g, " "), value: String(v) }))
      .slice(0, 18);

    return {
      id: data.id,
      kind: data.kind,
      name,
      email,
      phone,
      status: r.status ?? (data.kind === "client" ? "client" : null),
      contactPref: r.contact_pref ?? null,
      createdAt: r.created_at ?? null,
      fields,
      threads: ((threadsRes.data ?? []) as any[]).map((t) => ({
        id: t.id,
        channel: t.channel,
        contactKey: t.contact_key,
        snippet: t.last_snippet,
        at: t.last_message_at,
        unread: t.unread ?? 0,
      })),
      calls: ((callsRes.data ?? []) as any[]).map((c) => ({
        id: c.id,
        purpose: c.purpose,
        status: c.status,
        outcome: c.outcome,
        durationSecs: c.duration_secs,
        at: c.created_at,
      })),
      activity: ((activityRes.data ?? []) as any[]).map((a) => ({
        id: a.id,
        event: a.event,
        summary: a.summary,
        source: a.source,
        at: a.created_at,
      })),
    };
  });

/** Move a record through its pipeline straight from the hub. */
export const setHubPersonStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["lead", "booking", "applicant"]),
        id: z.string().uuid(),
        status: z.string().trim().min(2).max(40),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = TABLE_BY_KIND[data.kind];
    const { error } = await supabaseAdmin
      .from(table)
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("contact_activity").insert({
      record_table: table,
      record_id: data.id,
      event: "status_changed",
      source: "hub",
      summary: `Status set to ${data.status}`,
      payload: { status: data.status },
    });
    return { ok: true };
  });

/** Free-text note pinned to the person's activity trail. */
export const addHubPersonNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["lead", "booking", "applicant", "client"]),
        id: z.string().uuid(),
        note: z.string().trim().min(1).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_activity").insert({
      record_table: TABLE_BY_KIND[data.kind],
      record_id: data.id,
      event: "note",
      source: "hub",
      summary: data.note,
      payload: { by: context.userId },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Personal email to one contact, sent through the branded Magnolia layout. */
export const sendHubEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        to: z.string().trim().email(),
        subject: z.string().trim().min(2).max(150),
        body: z.string().trim().min(1).max(5000),
        name: z.string().trim().max(120).default(""),
        recordTable: z.string().trim().max(60).default(""),
        recordId: z.string().uuid().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { renderLayout, esc, firstName } = await import("@/lib/email/layout");
    const { sendResendEmail } = await import("@/lib/resend.server");
    const paragraphs = data.body
      .split(/\n{2,}/)
      .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${esc(p).replace(/\n/g, "<br/>")}</p>`)
      .join("");
    const html = renderLayout(
      `<p style="margin:0 0 14px">Hi ${esc(firstName(data.name))},</p>${paragraphs}`,
      { title: data.subject, preheader: data.body.slice(0, 120) },
    );
    const res = await sendResendEmail({
      to: data.to,
      subject: data.subject,
      html,
      kind: "hub-direct",
    });
    if (data.recordTable && data.recordId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("contact_activity").insert({
        record_table: data.recordTable,
        record_id: data.recordId,
        event: "email_sent",
        source: "hub",
        summary: data.subject,
        payload: { to: data.to },
      });
    }
    return res;
  });
