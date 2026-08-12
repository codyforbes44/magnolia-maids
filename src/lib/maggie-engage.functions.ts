import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Read the Maggie engagement switches (master + per source) plus Messenger. */
export const getMaggieEngagement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { loadEngagement } = await import("@/lib/maggie-engage.server");
    const { messengerAutoReplyEnabled } = await import("@/lib/messenger-agent.server");
    const [settings, messenger] = await Promise.all([loadEngagement(), messengerAutoReplyEnabled()]);
    return { settings, messenger };
  });

export const setMaggieEngagement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        enabled: z.boolean().optional(),
        sources: z.record(z.string(), z.boolean()).optional(),
        messenger: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { loadEngagement, saveEngagement } = await import("@/lib/maggie-engage.server");
    const current = await loadEngagement();
    const settings = await saveEngagement({
      enabled: data.enabled ?? current.enabled,
      sources: { ...current.sources, ...(data.sources ?? {}) } as typeof current.sources,
    });

    let messenger: boolean | undefined;
    if (typeof data.messenger === "boolean") {
      const { setMessengerAutoReplyEnabled } = await import("@/lib/messenger-agent.server");
      messenger = (await setMessengerAutoReplyEnabled(data.messenger)).enabled;
    }
    return { settings, ...(messenger === undefined ? {} : { messenger }) };
  });

/** Maggie drafts and sends a personal follow-up to one contact, right now. */
export const engageWithMaggie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        source: z.enum([
          "campaign_leads",
          "booking_requests",
          "job_applications",
          "property_inquiries",
          "franchise_inquiries",
        ]),
        id: z.string().uuid(),
        channel: z.enum(["auto", "email", "text", "call"]).default("auto"),
        instruction: z.string().max(600).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { engageRecord } = await import("@/lib/maggie-engage.server");
    return engageRecord({
      source: data.source,
      id: data.id,
      channel: data.channel,
      ...(data.instruction ? { instruction: data.instruction } : {}),
      by: (context.claims as { email?: string } | undefined)?.email ?? "admin",
    });
  });
