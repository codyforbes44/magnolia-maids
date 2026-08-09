import { createFileRoute } from "@tanstack/react-router";
import { runCommunityHealthCheck } from "@/lib/community-health.server";

/**
 * Daily cron entry point for the /community verification. The check itself
 * lives in community-health.server so the manual admin action runs the same
 * code path.
 */
export const Route = createFileRoute("/api/public/hooks/community-health")({
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

        const row = await runCommunityHealthCheck(new URL(request.url).origin, "cron");
        return Response.json({ success: true, ...row });
      },
    },
  },
});
