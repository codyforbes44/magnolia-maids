import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const KIND = "email-agent";
/** Max agent-initiated emails to one address per rolling hour. */
const HOURLY_LIMIT = 3;

const LINKS = {
  quote: "https://magnoliamaids.pro/quote",
  booking: "https://magnoliamaids.pro/booking",
  services: "https://magnoliamaids.pro/services",
  careers: "https://magnoliamaids.pro/about/careers",
} as const;

const Input = z.object({
  to: z.string().trim().email(),
  name: z.string().trim().max(120).optional(),
  subject: z.string().trim().max(140).optional(),
  message: z.string().trim().min(10).max(2000),
  link: z.enum(["quote", "booking", "services", "careers", "none"]).optional(),
  /** Optional recap rows, e.g. { Service: "Deep Clean", Estimate: "$249" }. */
  details: z.record(z.string().max(60), z.string().max(200)).optional(),
});

async function overLimit(email: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("email_log")
      .select("id", { count: "exact", head: true })
      .eq("recipient", email)
      .eq("kind", KIND)
      .gte("created_at", since);
    return (count ?? 0) >= HOURLY_LIMIT;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/agent/send-email")({
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
                "Provide the caller's email in `to` and the body in `message`. Optional: `name`, `subject`, `details` (label/value pairs), and `link` (quote, booking, services, careers, none).",
            },
            { status: 400, headers: CORS },
          );
        }

        const data = parsed.data;
        const to = data.to.toLowerCase();

        if (await overLimit(to)) {
          return Response.json(
            {
              ok: false,
              error: `Already emailed ${to} ${HOURLY_LIMIT} times in the past hour. Tell them the earlier email is on its way.`,
            },
            { status: 200, headers: CORS },
          );
        }

        const { agentMessageEmail } = await import("@/lib/email/agent-message");
        const { sendResendEmail } = await import("@/lib/resend.server");

        const url = data.link && data.link !== "none" ? LINKS[data.link] : null;
        const rendered = agentMessageEmail({
          name: data.name ?? null,
          subject: data.subject ?? null,
          message: data.message,
          details: data.details ? Object.entries(data.details) : undefined,
          ctaUrl: url,
          ctaLabel:
            data.link === "booking"
              ? "Book my cleaning"
              : data.link === "careers"
                ? "See open roles"
                : data.link === "services"
                  ? "See services & pricing"
                  : "Get my instant quote",
        });

        const result = await sendResendEmail({
          to,
          subject: rendered.subject,
          html: rendered.html,
          kind: KIND,
          reply_to: "hello@magnoliamaids.pro",
        });

        if (!result.sent) {
          return Response.json(
            { ok: false, error: "Email is temporarily unavailable. Offer to text the details instead." },
            { status: 200, headers: CORS },
          );
        }

        // Copy the owner inbox with the full contents of what Maggie sent.
        try {
          const { interactionNoticeEmail } = await import("@/lib/email/interaction-notice");
          const { NOTIFY_EMAIL } = await import("@/lib/resend.server");
          const notice = interactionNoticeEmail({
            title: "Maggie emailed a visitor",
            emoji: "✉️",
            subject: `[Maggie email] ${rendered.subject} — ${to}`,
            rows: [
              ["Recipient", to],
              ["Name", data.name ?? "—"],
              ["Subject", rendered.subject],
              ["CTA link", url ?? "none"],
              ...(data.details ? Object.entries(data.details) : []),
            ],
            body: data.message,
          });
          await sendResendEmail({
            to: NOTIFY_EMAIL,
            subject: notice.subject,
            html: notice.html,
            kind: "agent-email-copy",
            reply_to: to,
          });
        } catch (e) {
          console.error("[agent/send-email] owner copy failed", e);
        }

        return Response.json(
          { ok: true, to, subject: rendered.subject, say: "Sent! Check your inbox in a minute — it's from Magnolia Maids." },
          { status: 200, headers: CORS },
        );
      },
    },
  },
});
