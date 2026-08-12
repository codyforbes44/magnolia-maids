import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * ElevenLabs post-call webhook.
 * Emails the full conversation transcript (voice or text chat) to the owner inbox.
 * Configure this URL in the ElevenLabs workspace webhook settings; set
 * ELEVENLABS_WEBHOOK_SECRET to enable signature verification.
 */

const AGENT_NAMES: Record<string, string> = {
  agent_0001kygbk76rfwxrf6bef7z6xf1t: "Maggie",
  agent_7301kygd9bvsf9wbdy5y0tmx62ky: "Marina",
  agent_0801kygdnrpefymrd0hdh7549p4a: "Maya",
};

function verify(secret: string, header: string | null, raw: string) {
  if (!header) return false;
  // Header format: t=<timestamp>,v0=<hex hmac of `${t}.${body}`>
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  ) as Record<string, string>;
  const t = parts["t"];
  const sig = parts["v0"] ?? parts["v1"];
  if (!t || !sig) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function fmtDuration(secs?: number | null) {
  if (!secs && secs !== 0) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export const Route = createFileRoute("/api/public/elevenlabs/post-call")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();

        const secret = process.env["ELEVENLABS_WEBHOOK_SECRET"];
        if (secret) {
          const header =
            request.headers.get("elevenlabs-signature") ?? request.headers.get("ElevenLabs-Signature");
          if (!verify(secret, header, raw)) {
            return new Response("Invalid signature", { status: 401 });
          }
        } else {
          console.warn("[elevenlabs/post-call] ELEVENLABS_WEBHOOK_SECRET not set; skipping verification");
        }

        let payload: any = null;
        try {
          payload = JSON.parse(raw);
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }

        const d = payload?.data ?? payload ?? {};
        const agentId: string = d.agent_id ?? "";
        const agent = AGENT_NAMES[agentId] ?? d.agent_name ?? agentId ?? "Agent";
        const conversationId: string = d.conversation_id ?? "unknown";
        const meta = d.metadata ?? {};
        const analysis = d.analysis ?? {};

        const turns = (Array.isArray(d.transcript) ? d.transcript : []).map((t: any) => ({
          role: String(t.role ?? t.speaker ?? "user"),
          text: String(t.message ?? t.text ?? "").trim(),
          time:
            typeof t.time_in_call_secs === "number"
              ? `${Math.floor(t.time_in_call_secs / 60)}:${String(t.time_in_call_secs % 60).padStart(2, "0")}`
              : null,
        })).filter((t: { text: string }) => t.text.length > 0);

        const vars = d.conversation_initiation_client_data?.dynamic_variables ?? {};
        const results = analysis.data_collection_results ?? {};
        const collected = Object.entries(results).map(
          ([k, v]: [string, any]) => [k, String(v?.value ?? v ?? "—")] as [string, string],
        );

        try {
          const { interactionNoticeEmail } = await import("@/lib/email/interaction-notice");
          const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
          console.log("[elevenlabs/post-call] building notice");
          const notice = interactionNoticeEmail({
            title: `${agent} conversation transcript`,
            emoji: "🎙️",
            subject: `[${agent} chat] ${turns.length} messages · ${conversationId.slice(0, 12)}`,
            rows: [
              ["Agent", agent],
              ["Conversation ID", conversationId],
              ["Started", meta.start_time_unix_secs ? new Date(meta.start_time_unix_secs * 1000).toLocaleString("en-US", { timeZone: "America/Chicago" }) : "—"],
              ["Duration", fmtDuration(meta.call_duration_secs)],
              ["Channel", meta.phone_call ? "Phone" : "Website widget"],
              ["Caller", meta.phone_call?.external_number ?? vars.caller_number ?? "—"],
              ["Status", d.status ?? analysis.call_successful ?? "—"],
              ...collected,
            ],
            body: analysis.transcript_summary ?? null,
            transcript: turns,
          });
          const r = await sendResendEmail({
            to: NOTIFY_EMAIL,
            subject: notice.subject,
            html: notice.html,
            kind: "agent-transcript",
            relatedId: conversationId,
          });
          console.log("[elevenlabs/post-call] send result", JSON.stringify(r));
        } catch (e) {
          console.error("[elevenlabs/post-call] notification failed", e);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
