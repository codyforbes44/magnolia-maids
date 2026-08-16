import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Slack Events API endpoint: URL verification plus message/mention events. */
export const Route = createFileRoute("/api/public/hooks/slack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signingSecret = process.env["SLACK_SIGNING_SECRET"];
        if (!signingSecret) return new Response("Not configured", { status: 500 });

        const raw = await request.text();
        const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";
        const signature = request.headers.get("x-slack-signature") ?? "";

        // Reject replays older than five minutes.
        const age = Math.abs(Date.now() / 1000 - Number(timestamp));
        if (!timestamp || Number.isNaN(age) || age > 300) {
          return new Response("Stale request", { status: 401 });
        }

        const expected = `v0=${createHmac("sha256", signingSecret).update(`v0:${timestamp}:${raw}`).digest("hex")}`;
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let body: any = null;
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        if (body?.type === "url_verification") {
          return new Response(String(body.challenge ?? ""), {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }

        // Slack retries when we're slow; the first delivery is already working.
        if (request.headers.get("x-slack-retry-num")) return new Response("ok", { status: 200 });

        if (body?.type === "event_callback" && body?.event) {
          const origin = new URL(request.url).origin;
          const { handleSlackEvent } = await import("@/lib/slack-agent.server");
          try {
            await handleSlackEvent({
              eventId: String(body.event_id ?? `${body.event.channel}-${body.event.ts}`),
              teamId: body.team_id ? String(body.team_id) : undefined,
              event: body.event,
              origin,
              selfUserId: body.authorizations?.[0]?.user_id ?? null,
            });
          } catch (e) {
            console.error("[slack-hook] event failed", e);
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
