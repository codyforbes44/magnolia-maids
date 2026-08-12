import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OutreachChannel = "email" | "text" | "call" | "system";

export type OutreachItem = {
  id: string;
  at: string;
  channel: OutreachChannel;
  title: string;
  detail: string | null;
  status: string;
  ok: boolean;
};

const input = z.object({
  table: z.enum([
    "campaign_leads",
    "booking_requests",
    "job_applications",
    "property_inquiries",
    "franchise_inquiries",
  ]),
  id: z.string().uuid(),
});

/**
 * Every Maggie touch on one record — emails, texts, and outbound calls —
 * merged into a single time-ordered outreach timeline for the admin drawer.
 */
export const getOutreachTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }): Promise<{ items: OutreachItem[] }> => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const items: OutreachItem[] = [];

    const [messages, calls, activity] = await Promise.all([
      supabaseAdmin
        .from("email_log")
        .select("id, created_at, recipient, subject, kind, status, error")
        .eq("related_id", data.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("outbound_calls")
        .select(
          "id, created_at, contact_name, phone_e164, purpose, status, outcome, outcome_notes, error, duration_secs, last_attempt_at, ended_at",
        )
        .eq("source_table", data.table)
        .eq("source_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("contact_activity")
        .select("id, created_at, event, source, summary")
        .eq("record_table", data.table)
        .eq("record_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    for (const m of messages.data ?? []) {
      const isSms = String(m.kind ?? "").toLowerCase().includes("sms");
      items.push({
        id: `msg-${m.id}`,
        at: m.created_at,
        channel: isSms ? "text" : "email",
        title: m.subject || (isSms ? "Text message" : "Email"),
        detail: [m.recipient, m.kind, m.error].filter(Boolean).join(" · "),
        status: m.status === "sent" ? "Delivered to provider" : (m.status ?? "unknown"),
        ok: m.status === "sent",
      });
    }

    for (const c of calls.data ?? []) {
      const done = ["completed"].includes(c.status);
      items.push({
        id: `call-${c.id}`,
        at: c.last_attempt_at ?? c.created_at,
        channel: "call",
        title: `Maggie call — ${c.purpose}`,
        detail: [
          c.phone_e164,
          c.outcome ? `outcome: ${c.outcome}` : null,
          c.duration_secs ? `${c.duration_secs}s` : null,
          c.outcome_notes,
          c.error,
        ]
          .filter(Boolean)
          .join(" · "),
        status: c.status,
        ok: done || ["queued", "scheduled", "calling"].includes(c.status),
      });
    }

    for (const a of activity.data ?? []) {
      items.push({
        id: `act-${a.id}`,
        at: a.created_at,
        channel: "system",
        title: a.summary,
        detail: a.source ? `via ${a.source}` : null,
        status: a.event,
        ok: !String(a.event).includes("fail"),
      });
    }

    items.sort((x, y) => (x.at < y.at ? 1 : -1));
    return { items: items.slice(0, 120) };
  });
