import { createFileRoute } from "@tanstack/react-router";

/**
 * TwiML endpoint for the admin browser dialer. Twilio hits this when the
 * hub places a call; we bridge it to the dialed number from the Magnolia
 * Maids business line.
 */
function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const Route = createFileRoute("/api/public/twilio/voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const to = String(form.get("To") ?? "").trim();
        const from = process.env["TWILIO_FROM_NUMBER"] ?? "";

        // Inbound call to the business number → ring the browser dialer.
        if (!to || to.startsWith("client:") === false && !/^\+?[0-9]{8,15}$/.test(to)) {
          return xml(
            `<Say voice="Polly.Joanna">Thanks for calling Magnolia Maids. Please hold while we connect you.</Say>`,
          );
        }

        if (to.startsWith("client:")) {
          return xml(
            `<Dial answerOnBridge="true"><Client>${esc(to.replace("client:", ""))}</Client></Dial>`,
          );
        }

        const dialFrom = from ? ` callerId="${esc(from)}"` : "";
        return xml(
          `<Dial answerOnBridge="true"${dialFrom} timeout="30"><Number>${esc(to)}</Number></Dial>`,
        );
      },
    },
  },
});
