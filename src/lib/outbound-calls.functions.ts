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

export const listOutboundCalls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: string } | undefined) =>
    z.object({ status: z.string().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    let query = context.supabase
      .from("outbound_calls")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CreateInput = z.object({
  contactName: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  email: z.string().email().optional().or(z.literal("")),
  purpose: z.string().min(2).max(60),
  contextNote: z.string().max(2000).optional().or(z.literal("")),
  agentId: z.string().min(4),
  scheduledAt: z.string().optional().or(z.literal("")),
  sourceTable: z.string().max(60).optional().or(z.literal("")),
  sourceId: z.string().uuid().optional().or(z.literal("")),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
});

export const queueOutboundCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { toE164 } = await import("@/lib/outbound-calls.server");
    const phone = toE164(data.phone);
    if (!phone) throw new Error("That phone number isn't a valid US number.");

    const { isOptedOut } = await import("@/lib/outbound-calls.server");
    if (await isOptedOut(phone)) throw new Error("That number is on the do-not-call list.");

    const { data: row, error } = await context.supabase
      .from("outbound_calls")
      .insert({
        contact_name: data.contactName,
        phone: data.phone,
        phone_e164: phone,
        email: data.email || null,
        purpose: data.purpose,
        context_note: data.contextNote || null,
        agent_id: data.agentId,
        scheduled_at: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
        status: data.scheduledAt ? "scheduled" : "queued",
        source_table: data.sourceTable || null,
        source_id: data.sourceId || null,
        assigned_to: data.assignedTo || null,
        created_by: context.userId,
        created_by_label: "admin",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateOutboundCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.string().optional(),
        outcome: z.string().max(60).optional(),
        outcomeNotes: z.string().max(4000).optional(),
        contextNote: z.string().max(2000).optional(),
        scheduledAt: z.string().optional().or(z.literal("")),
        assignedTo: z.string().uuid().optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, unknown> = {};
    if (data.status) patch["status"] = data.status;
    if (data.outcome !== undefined) patch["outcome"] = data.outcome;
    if (data.outcomeNotes !== undefined) patch["outcome_notes"] = data.outcomeNotes;
    if (data.contextNote !== undefined) patch["context_note"] = data.contextNote;
    if (data.scheduledAt !== undefined)
      patch["scheduled_at"] = data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null;
    if (data.assignedTo !== undefined) patch["assigned_to"] = data.assignedTo || null;

    const { data: row, error } = await context.supabase
      .from("outbound_calls")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const dialOutboundCallNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("outbound_calls")
      .select("id, contact_name, phone_e164, email, purpose, context_note, agent_id, attempts, source_table, source_id")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error(error?.message ?? "Call not found");
    const { dialCall, withinCallWindow } = await import("@/lib/outbound-calls.server");
    const outsideWindow = !withinCallWindow();
    const result = await dialCall(row as any);
    return { ...result, outsideWindow };
  });

export const listCallOptOuts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("call_opt_outs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addCallOptOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ phone: z.string().min(7), reason: z.string().max(300).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { toE164 } = await import("@/lib/outbound-calls.server");
    const phone = toE164(data.phone);
    if (!phone) throw new Error("Invalid phone number.");
    const { error } = await context.supabase
      .from("call_opt_outs")
      .upsert({ phone_e164: phone, reason: data.reason ?? null, source: "admin" });
    if (error) throw new Error(error.message);
    await context.supabase
      .from("outbound_calls")
      .update({ status: "cancelled", outcome: "opted_out" })
      .eq("phone_e164", phone)
      .in("status", ["queued", "scheduled"]);
    return { ok: true, phone };
  });

export const removeCallOptOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ phone: z.string().min(7) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("call_opt_outs").delete().eq("phone_e164", data.phone);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
