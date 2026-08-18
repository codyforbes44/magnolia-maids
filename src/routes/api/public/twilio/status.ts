import { createFileRoute } from "@tanstack/react-router";
import { verifyTwilioSignature } from "@/lib/reliability/twilio-signature.server";
import {
  applyDeliveryReceipt,
  claimWebhookEvent,
  finishWebhookEvent,
} from "@/lib/reliability/idempotency.server";

/**
 * Twilio status callback for both SMS delivery receipts and voice call
 * progress. Every delivery is de-duplicated by SID + status, so Twilio's
 * retries never double-write history.
 */
export const Route = createFileRoute("/api/public/twilio/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const requestUrl = `${url.protocol}//${url.host}${url.pathname}`;
        const body = new URLSearchParams(await request.text());
        const signature = request.headers.get("X-Twilio-Signature");
        if (!verifyTwilioSignature(requestUrl, body, signature, "twilio/status")) {
          return new Response("Invalid signature", { status: 401 });
        }

        const messageSid = body.get("MessageSid") || body.get("SmsSid");
        const callSid = body.get("CallSid");
        const status =
          body.get("MessageStatus") || body.get("SmsStatus") || body.get("CallStatus") || "unknown";
        const errorCode = body.get("ErrorCode");
        const sid = messageSid || callSid;
        if (!sid) return new Response("ok");

        const claim = await claimWebhookEvent({
          provider: "twilio",
          eventKey: `${sid}:${status}`,
          route: "/api/public/twilio/status",
          eventType: messageSid ? "message-status" : "call-status",
          payload: Object.fromEntries(body.entries()),
        });
        if (!claim.fresh) return new Response("duplicate");

        try {
          if (messageSid) {
            await applyDeliveryReceipt({
              providerId: messageSid,
              status,
              detail: errorCode ? `twilio_error_${errorCode}` : null,
            });
          } else if (callSid) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: call } = await supabaseAdmin
              .from("outbound_calls")
              .select("id")
              .eq("call_sid", callSid)
              .maybeSingle();
            if (call) {
              const { recordCallEvent } = await import("@/lib/outbound-calls.server");
              await recordCallEvent(call.id, status, errorCode ? `error ${errorCode}` : null, "twilio");
            }
          }
          await finishWebhookEvent(claim.id, "processed");
        } catch (e) {
          console.error("[twilio/status] processing failed", e);
          await finishWebhookEvent(claim.id, "failed", String(e));
          return new Response("error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
