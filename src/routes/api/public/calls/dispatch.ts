import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduler entry point for queued outbound calls.
 * Called by pg_cron with the project anon key in the `apikey` header.
 */
export const Route = createFileRoute("/api/public/calls/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? "";
        const allowed = [
          process.env["SUPABASE_ANON_KEY"],
          process.env["SUPABASE_PUBLISHABLE_KEY"],
          process.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
        ].filter((v): v is string => Boolean(v));
        if (!apikey || !allowed.includes(apikey)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { dispatchDueCalls } = await import("@/lib/outbound-calls.server");
        const result = await dispatchDueCalls(5);
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
