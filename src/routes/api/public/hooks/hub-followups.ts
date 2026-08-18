import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron endpoint: chases unanswered calls and unread threads with a
 * personalised text (or email fallback) at the admin-configured intervals.
 * Runs every 15 minutes; all timing lives in Settings → Auto follow-ups.
 */
export const Route = createFileRoute("/api/public/hooks/hub-followups")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const anonKey =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
        const provided =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!anonKey || !provided || provided !== anonKey) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { runHubFollowups } = await import("@/lib/hub/auto-followups.server");
        try {
          const result = await runHubFollowups();
          return Response.json(result);
        } catch (e) {
          console.error("[hub-followups] run failed", e);
          return Response.json({ error: "Run failed" }, { status: 500 });
        }
      },
    },
  },
});
