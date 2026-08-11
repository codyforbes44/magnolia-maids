import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "crypto";
import { updateSmsConsent, sendSms, toE164 } from "@/lib/sms.server";
import { optOutConfirmationSms, optInWelcomeSms, helpSms, fallbackInboundSms } from "@/lib/sms/messages";


const SITE = {
  phone: "(580) 745-0045",
};

/**
 * Verifies a Twilio inbound request using the Account Auth Token.
 * The connector gateway key is separate from the auth token, so we look for an
 * optional TWILIO_AUTH_TOKEN env var. If it is not set we still process the
 * message (useful for local development) but log a warning.
 */
function isValidTwilioSignature(requestUrl: string, body: URLSearchParams, signature: string | null): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.warn("[twilio/inbound] TWILIO_AUTH_TOKEN not set; skipping signature verification");
    return true;
  }
  if (!signature) return false;

  const values: string[] = [];
  body.sort();
  for (const [key, value] of body.entries()) {
    values.push(`${key}${value}`);
  }
  const expected = createHmac("sha1", authToken)
    .update(`${requestUrl}${values.join("")}`)
    .digest("base64");
  return signature === expected;
}

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

        if (!isValidTwilioSignature(requestUrl, body, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const from = body.get("From") || "";
        const to = body.get("To") || "";
        const rawBody = (body.get("Body") || "").trim().toUpperCase();
        const messageSid = body.get("MessageSid") || "unknown";

        const normalizedFrom = toE164(from);
        console.log("[twilio/inbound]", { from: normalizedFrom, to, body: rawBody, messageSid });

        // STOP / UNSUBSCRIBE / CANCEL / QUIT / END
        if (rawBody === "STOP" || rawBody === "UNSUBSCRIBE" || rawBody === "CANCEL" || rawBody === "QUIT" || rawBody === "END") {
          await updateSmsConsent(from, false, "inbound-stop");
          return twiml(optOutConfirmationSms());
        }

        // START / YES / SUBSCRIBE
        if (rawBody === "START" || rawBody === "YES" || rawBody === "SUBSCRIBE") {
          await updateSmsConsent(from, true, "inbound-start");
          return twiml(optInWelcomeSms());
        }

        // HELP / INFO
        if (rawBody === "HELP" || rawBody === "INFO") {
          return twiml(helpSms());
        }

        // Unknown keyword — record it, but don't auto-reply (or send a brief one).
        await updateSmsConsent(from, true, "inbound-keyword");
        return twiml(fallbackInboundSms());

      },
    },
  },
});
