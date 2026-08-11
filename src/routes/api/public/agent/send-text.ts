import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { sendSms, toE164 } from "@/lib/sms.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const KIND = "sms-agent";
/** Max agent-initiated texts to one number per rolling hour. */
const HOURLY_LIMIT = 3;

const Input = z.object({
  to: z.string().min(7),
  message: z.string().min(4).max(320),
  /** Optional link appended to the message (booking or instant quote). */
  link: z.enum(["quote", "booking", "none"]).optional(),
});

const LINKS = {
  quote: "https://magnoliamaids.pro/quote",
  booking: "https://magnoliamaids.pro/booking",
} as const;

async function overLimit(phone: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("email_log")
      .select("id", { count: "exact", head: true })
      .eq("recipient", phone)
      .eq("kind", KIND)
      .gte("created_at", since);
    return (count ?? 0) >= HOURLY_LIMIT;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/agent/send-text")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        let payload: unknown = null;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400, headers: CORS });
        }

        const parsed = Input.safeParse(payload);
        if (!parsed.success) {
          return Response.json(
            {
              ok: false,
              error:
                "Provide the caller's mobile number in `to` and the text in `message` (max 320 characters). Optional `link`: quote, booking, or none.",
            },
            { status: 400, headers: CORS },
          );
        }

        const to = toE164(parsed.data.to);
        if (!to) {
          return Response.json(
            { ok: false, error: "That phone number doesn't look like a valid US mobile number. Ask the caller to repeat it." },
            { status: 400, headers: CORS },
          );
        }

        if (await overLimit(to)) {
          return Response.json(
            { ok: false, error: `Already texted ${to} ${HOURLY_LIMIT} times in the past hour. Tell the caller the earlier text is on its way.` },
            { status: 429, headers: CORS },
          );
        }

        const link = parsed.data.link && parsed.data.link !== "none" ? LINKS[parsed.data.link] : null;
        const body = [
          `Magnolia Maids: ${parsed.data.message.trim()}`,
          link,
          "Reply STOP to opt out.",
        ]
          .filter(Boolean)
          .join(" ");

        const result = await sendSms({ to, body, kind: KIND });

        if (!result.sent) {
          const reason =
            result.reason === "opted_out"
              ? "That number opted out of texts. Offer to email instead."
              : "Texting is temporarily unavailable. Offer to email the details instead.";
          return Response.json({ ok: false, error: reason, reason: result.reason }, { status: 200, headers: CORS });
        }

        return Response.json(
          { ok: true, to, sent_text: body, say: "Sent! It should land on your phone in a few seconds." },
          { status: 200, headers: CORS },
        );
      },
    },
  },
});
