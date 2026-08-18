import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import {
  applyDeliveryReceipt,
  claimWebhookEvent,
  finishWebhookEvent,
  stableKey,
} from "@/lib/reliability/idempotency.server";

/**
 * Resend delivery webhook (Svix signed). Records delivered / bounced /
 * complained / opened outcomes against the email log and hub messages.
 * Set RESEND_WEBHOOK_SECRET (the whsec_… value) to enforce verification.
 */
function verifySvix(secret: string, headers: Headers, raw: string) {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatureHeader = headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${raw}`).digest("base64");
  return signatureHeader
    .split(" ")
    .map((p) => p.split(",")[1] ?? "")
    .some((sig) => {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    });
}

export const Route = createFileRoute("/api/public/hooks/resend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const secret = process.env["RESEND_WEBHOOK_SECRET"];
        if (secret) {
          if (!verifySvix(secret, request.headers, raw)) {
            return new Response("Invalid signature", { status: 401 });
          }
        } else {
          console.warn("[hooks/resend] RESEND_WEBHOOK_SECRET not set; skipping verification");
        }

        let payload: { type?: string; created_at?: string; data?: Record<string, unknown> } = {};
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const emailId = String(payload.data?.["email_id"] ?? payload.data?.["id"] ?? "");
        const type = payload.type ?? "unknown";
        const eventKey =
          request.headers.get("svix-id") ?? stableKey(emailId, type, payload.created_at ?? raw);

        const claim = await claimWebhookEvent({
          provider: "resend",
          eventKey,
          route: "/api/public/hooks/resend",
          eventType: type,
          payload,
        });
        if (!claim.fresh) return new Response("duplicate");

        try {
          if (emailId) {
            const status = type.replace(/^email\./, "");
            const detail =
              (payload.data?.["bounce"] as { message?: string } | undefined)?.message ?? null;
            await applyDeliveryReceipt({ providerId: emailId, status, detail });

            // Hard bounces and complaints stop future marketing sends.
            if (status === "bounced" || status === "complained") {
              const to = payload.data?.["to"];
              const address = Array.isArray(to) ? String(to[0]) : to ? String(to) : null;
              if (address) console.warn(`[hooks/resend] ${status} for ${address}`);
            }
          }
          await finishWebhookEvent(claim.id, "processed");
        } catch (e) {
          console.error("[hooks/resend] processing failed", e);
          await finishWebhookEvent(claim.id, "failed", String(e));
          return new Response("error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
