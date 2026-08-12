import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Meta calls this URL for Messenger events. GET = handshake, POST = messages. */
export const Route = createFileRoute("/api/public/hooks/facebook-messenger")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const verify = process.env["FACEBOOK_WEBHOOK_VERIFY_TOKEN"];
        if (
          url.searchParams.get("hub.mode") === "subscribe" &&
          verify &&
          url.searchParams.get("hub.verify_token") === verify
        ) {
          return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const appSecret = process.env["FACEBOOK_APP_SECRET"];
        if (!appSecret) return new Response("Not configured", { status: 500 });

        const raw = await request.text();
        const header = request.headers.get("x-hub-signature-256") ?? "";
        const expected = `sha256=${createHmac("sha256", appSecret).update(raw).digest("hex")}`;
        const a = Buffer.from(header);
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
        if (body?.object !== "page") return new Response("ignored", { status: 200 });

        const origin = new URL(request.url).origin;
        const { handleMessagingEvent } = await import("@/lib/messenger-agent.server");

        for (const entry of body.entry ?? []) {
          for (const event of entry.messaging ?? []) {
            try {
              await handleMessagingEvent(event, origin);
            } catch (e) {
              console.error("[messenger-hook] event failed", e);
            }
          }
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});