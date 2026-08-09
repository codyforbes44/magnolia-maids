import { createFileRoute } from "@tanstack/react-router";
import { runContentSync } from "@/lib/content-sync.server";

/**
 * Daily cron entry point: refreshes Maggie's knowledge base from live app data
 * and verifies every public page still renders its content.
 */
export const Route = createFileRoute("/api/public/hooks/content-sync")({
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

        const row = await runContentSync(new URL(request.url).origin, "cron");
        return Response.json({ success: true, ...row });
      },
    },
  },
});
