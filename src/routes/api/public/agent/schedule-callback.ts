import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const Input = z.object({
  contact_name: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  email: z.string().email().optional(),
  purpose: z.string().max(60).optional(),
  context: z.string().max(1500).optional(),
  /** ISO datetime the caller asked to be reached. */
  callback_at: z.string().optional(),
});

export const Route = createFileRoute("/api/public/agent/schedule-callback")({
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
                "Provide contact_name and phone. Optional: email, purpose, context (why we're calling back), callback_at (ISO time).",
            },
            { status: 400, headers: CORS },
          );
        }

        const { toE164, isOptedOut } = await import("@/lib/outbound-calls.server");
        const phone = toE164(parsed.data.phone);
        if (!phone) {
          return Response.json(
            { ok: false, error: "That number doesn't look valid. Ask the caller to repeat it." },
            { status: 400, headers: CORS },
          );
        }
        if (await isOptedOut(phone)) {
          return Response.json(
            { ok: false, error: "That number asked not to be called. Offer email or text instead." },
            { status: 200, headers: CORS },
          );
        }

        const scheduledAt = parsed.data.callback_at ? new Date(parsed.data.callback_at) : null;
        const validSchedule = scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : null;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("outbound_calls").insert({
          contact_name: parsed.data.contact_name,
          phone: parsed.data.phone,
          phone_e164: phone,
          email: parsed.data.email ?? null,
          purpose: parsed.data.purpose ?? "general_followup",
          context_note: parsed.data.context ?? null,
          agent_id: "agent_0001kygbk76rfwxrf6bef7z6xf1t",
          scheduled_at: validSchedule ? validSchedule.toISOString() : null,
          status: validSchedule ? "scheduled" : "queued",
          created_by_label: "maggie",
        });
        if (error) {
          return Response.json({ ok: false, error: "Couldn't save the callback." }, { status: 500, headers: CORS });
        }

        try {
          const { interactionNoticeEmail } = await import("@/lib/email/interaction-notice");
          const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
          const notice = interactionNoticeEmail({
            title: "Maggie queued a callback",
            emoji: "📞",
            subject: `[Callback queued] ${parsed.data.contact_name} · ${phone}`,
            rows: [
              ["Contact", parsed.data.contact_name],
              ["Phone", phone],
              ["Email", parsed.data.email ?? "—"],
              ["Purpose", parsed.data.purpose ?? "general_followup"],
              ["When", validSchedule ? validSchedule.toLocaleString() : "As soon as possible"],
            ],
            body: parsed.data.context ?? "",
          });
          await sendResendEmail({
            to: NOTIFY_EMAIL,
            subject: notice.subject,
            html: notice.html,
            kind: "agent-callback-queued",
          });
        } catch (e) {
          console.error("[agent/schedule-callback] notice failed", e);
        }

        return Response.json(
          {
            ok: true,
            say: validSchedule
              ? "Perfect — I've got you down for a call back then."
              : "Got it — someone from our team will ring you back shortly.",
          },
          { status: 200, headers: CORS },
        );
      },
    },
  },
});
