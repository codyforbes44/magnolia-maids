import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/** Meta calls this URL. GET = subscription handshake, POST = lead notifications. */
export const Route = createFileRoute("/api/public/hooks/facebook-leadgen")({
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
        const raw = await request.text();
        const header = request.headers.get("x-hub-signature-256") ?? "";

        if (!appSecret) return new Response("Not configured", { status: 500 });
        const expected = `sha256=${createHmac("sha256", appSecret).update(raw).digest("hex")}`;
        const a = Buffer.from(header);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const { ingestLeadgen } = await import("@/lib/facebook.server");
        const results: unknown[] = [];
        for (const entry of payload.entry ?? []) {
          for (const change of entry.changes ?? []) {
            if (change.field !== "leadgen") continue;
            const v = change.value ?? {};
            if (!v.leadgen_id) continue;
            try {
              results.push(
                await ingestLeadgen({
                  leadgenId: String(v.leadgen_id),
                  pageId: v.page_id ? String(v.page_id) : undefined,
                  formName: v.form_name ?? null,
                }),
              );
            } catch (e) {
              console.error("[fb-leadgen] ingest failed", e);
            }
          }
        }
        // Always 200 so Meta doesn't disable the subscription.
        return Response.json({ ok: true, processed: results.length });
      },
    },
  },
});