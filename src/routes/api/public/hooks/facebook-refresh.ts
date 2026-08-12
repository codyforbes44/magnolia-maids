import { createFileRoute } from "@tanstack/react-router";

/**
 * Hourly pg_cron job: pulls fresh Facebook Lead Ads submissions and Messenger
 * activity so Maggie engages even when a webhook delivery is missed.
 */
export const Route = createFileRoute("/api/public/hooks/facebook-refresh")({
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

        // Overlap the window slightly so nothing slips between runs.
        const sinceMs = Date.now() - 75 * 60_000;
        const origin = new URL(request.url).origin;
        const { refreshLeadForms, refreshMessenger } = await import("@/lib/facebook-refresh.server");

        const leads = await refreshLeadForms(sinceMs).catch((e) => ({
          seen: 0,
          imported: 0,
          errors: [e instanceof Error ? e.message : "leads failed"],
        }));
        const messenger = await refreshMessenger(sinceMs, origin).catch((e) => ({
          replayed: 0,
          errors: [e instanceof Error ? e.message : "messenger failed"],
        }));

        if (leads.errors.length || messenger.errors.length) {
          console.error("[fb-refresh]", [...leads.errors, ...messenger.errors].join(" | "));
        }
        return Response.json({ ok: true, leads, messenger });
      },
    },
  },
});
