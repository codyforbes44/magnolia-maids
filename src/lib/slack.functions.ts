import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: role } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Forbidden");
}

export type SlackStatus = {
  configured: boolean;
  team: string | null;
  botName: string | null;
  error: string | null;
  settings: {
    channelId: string | null;
    channelName: string | null;
    answerInChannel: boolean;
    channelMode: "all" | "mention";
    events: Record<string, boolean>;
  };
  channels: Array<{ id: string; name: string; is_member: boolean }>;
};

export const getSlackStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SlackStatus> => {
    await assertAdmin(context as never);
    const { loadSlackSettings, slackConfigured, slackIdentity, listSlackChannels } = await import(
      "@/lib/slack.server"
    );
    const settings = await loadSlackSettings();
    if (!slackConfigured()) {
      return { configured: false, team: null, botName: null, error: null, settings, channels: [] };
    }
    try {
      const [identity, channels] = await Promise.all([slackIdentity(), listSlackChannels()]);
      return {
        configured: true,
        team: (identity.team as string) ?? null,
        botName: (identity.user as string) ?? null,
        error: null,
        settings,
        channels,
      };
    } catch (e) {
      return {
        configured: true,
        team: null,
        botName: null,
        error: e instanceof Error ? e.message : "Slack check failed",
        settings,
        channels: [],
      };
    }
  });

export const saveSlackSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        channelId: z.string().nullable().optional(),
        channelName: z.string().nullable().optional(),
        answerInChannel: z.boolean().optional(),
        channelMode: z.enum(["all", "mention"]).optional(),
        events: z.record(z.string(), z.boolean()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { saveSlackSettings } = await import("@/lib/slack.server");
    return saveSlackSettings(data as never);
  });

export const sendSlackTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ text: z.string().max(500).optional() }).parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { postToSlack } = await import("@/lib/slack.server");
    return postToSlack({
      text: data.text?.trim() || "👋 Maggie here — Slack is wired up to Magnolia Maids.",
      kind: "test",
    });
  });

export const getSlackLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { recentSlackMessages, recentSlackEvents } = await import("@/lib/slack.server");
    const [messages, events] = await Promise.all([recentSlackMessages(60), recentSlackEvents(60)]);
    return { messages, events };
  });
