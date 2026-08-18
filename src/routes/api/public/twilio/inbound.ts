import { createFileRoute } from "@tanstack/react-router";
import { verifyTwilioSignature } from "@/lib/reliability/twilio-signature.server";
import { claimWebhookEvent, finishWebhookEvent } from "@/lib/reliability/idempotency.server";
import { updateSmsConsent, sendSms, toE164, logInboundSms } from "@/lib/sms.server";
import { optOutConfirmationSms, optInWelcomeSms, helpSms, fallbackInboundSms } from "@/lib/sms/messages";


function twiml(message?: string) {
  const body = message ? `<Body>${escapeXml(message)}</Body>` : "";
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${body ? `<Message>${body}</Message>` : ""}</Response>`,
    {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    },
  );
}

function escapeXml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const Route = createFileRoute("/api/public/twilio/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const requestUrl = `${url.protocol}//${url.host}${url.pathname}`;
        const body = new URLSearchParams(await request.text());
        const signature = request.headers.get("X-Twilio-Signature");

        if (!verifyTwilioSignature(requestUrl, body, signature, "twilio/inbound")) {
          return new Response("Invalid signature", { status: 401 });
        }

        const from = body.get("From") || "";
        const to = body.get("To") || "";
        const rawBody = (body.get("Body") || "").trim().toUpperCase();
        const messageSid = body.get("MessageSid") || "unknown";

        // Twilio retries inbound webhooks; process each MessageSid once.
        const claim = await claimWebhookEvent({
          provider: "twilio",
          eventKey: `inbound:${messageSid}`,
          route: "/api/public/twilio/inbound",
          eventType: "inbound-sms",
          payload: Object.fromEntries(body.entries()),
        });
        if (!claim.fresh) return twiml();

        const normalizedFrom = toE164(from);
        console.log("[twilio/inbound]", { from: normalizedFrom, to, body: rawBody, messageSid });

        const keywordFor = (text: string) => {
          if (["STOP", "UNSUBSCRIBE", "CANCEL", "QUIT", "END"].includes(text)) return "stop";
          if (["START", "YES", "SUBSCRIBE"].includes(text)) return "start";
          if (["HELP", "INFO"].includes(text)) return "help";
          return "message";
        };
        await logInboundSms({
          from,
          body: body.get("Body") || "",
          keyword: keywordFor(rawBody),
          messageSid,
        });

        // Email every inbound text (contents included) to the owner inbox.
        try {
          const { interactionNoticeEmail } = await import("@/lib/email/interaction-notice");
          const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
          const notice = interactionNoticeEmail({
            title: "Inbound text message",
            emoji: "📲",
            subject: `[Inbound SMS] ${normalizedFrom || from}`,
            rows: [
              ["From", normalizedFrom || from],
              ["To", to],
              ["Keyword", keywordFor(rawBody)],
              ["Message SID", messageSid],
            ],
            body: body.get("Body") || "",
          });
          await sendResendEmail({
            to: NOTIFY_EMAIL,
            subject: notice.subject,
            html: notice.html,
            kind: "sms-inbound",
            relatedId: messageSid,
          });
        } catch (e) {
          console.error("[twilio/inbound] owner notification failed", e);
        }

        // Admin-editable auto-reply copy (falls back to the built-in wording).
        const { renderStoredSms } = await import("@/lib/sms/render.server");
        const { SITE } = await import("@/lib/email/layout");
        const autoReply = async (id: string, fallback: string) => {
          const tpl = await renderStoredSms(id, { sitePhone: SITE.phone });
          return tpl?.enabled === false ? fallback : (tpl?.body ?? fallback);
        };

        // STOP / UNSUBSCRIBE / CANCEL / QUIT / END
        const done = async () => finishWebhookEvent(claim.id, "processed");

        if (rawBody === "STOP" || rawBody === "UNSUBSCRIBE" || rawBody === "CANCEL" || rawBody === "QUIT" || rawBody === "END") {
          await updateSmsConsent(from, false, "inbound-stop");
          await done();
          return twiml(await autoReply("opt-out", optOutConfirmationSms()));
        }

        // START / YES / SUBSCRIBE
        if (rawBody === "START" || rawBody === "YES" || rawBody === "SUBSCRIBE") {
          await updateSmsConsent(from, true, "inbound-start");
          await done();
          return twiml(await autoReply("opt-in", optInWelcomeSms()));
        }

        // HELP / INFO
        if (rawBody === "HELP" || rawBody === "INFO") {
          await done();
          return twiml(await autoReply("help", helpSms()));
        }

        // Unknown keyword — record it, but don't auto-reply (or send a brief one).
        await updateSmsConsent(from, true, "inbound-keyword");
        await done();
        return twiml(await autoReply("inbound-fallback", fallbackInboundSms()));

      },
    },
  },
});
