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
        const expected =
          process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { dispatchDueCalls } = await import("@/lib/outbound-calls.server");
        const result = await dispatchDueCalls(5);
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
