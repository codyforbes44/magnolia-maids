import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Keep slow work alive past the response when the runtime supports it. */
async function background(work: () => Promise<unknown>) {
  const p = work().catch((e) => console.error("[slack-hook] background failed", e));
  try {
    const specifier = "cloudflare:workers";
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      waitUntil?: (p: Promise<unknown>) => void;
    };
    if (typeof mod.waitUntil === "function") mod.waitUntil(p);
  } catch {
    /* not on Workers — the promise still runs */
  }
  return p;
}

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

        const origin = new URL(request.url).origin;
        const contentType = request.headers.get("content-type") ?? "";

        // Slash commands arrive as form data, not JSON.
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const form = new URLSearchParams(raw);
          const channelId = form.get("channel_id");
          const userId = form.get("user_id");
          if (!channelId || !userId) return new Response("ok", { status: 200 });
          const { handleSlackSlashCommand } = await import("@/lib/slack-agent.server");
          void background(() =>
            handleSlackSlashCommand({
              eventId: `slash-${form.get("trigger_id") ?? `${channelId}-${Date.now()}`}`,
              ...(form.get("team_id") ? { teamId: form.get("team_id") as string } : {}),
              channelId,
              userId,
              text: form.get("text") ?? "",
              origin,
              responseUrl: form.get("response_url"),
            }),
          );
          return Response.json({
            response_type: "ephemeral",
            text: "On it — Maggie is looking that up…",
          });
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

        if (body?.type === "event_callback" && body?.event) {
          const { handleSlackEvent } = await import("@/lib/slack-agent.server");
          // Ack inside Slack's 3-second window; answer in the background.
          // Retries are harmless: handleSlackEvent dedupes on event_id.
          void background(() =>
            handleSlackEvent({
              eventId: String(body.event_id ?? `${body.event.channel}-${body.event.ts}`),
              ...(body.team_id ? { teamId: String(body.team_id) } : {}),
              event: body.event,
              origin,
              selfUserId: body.authorizations?.[0]?.user_id ?? null,
            }),
          );
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
