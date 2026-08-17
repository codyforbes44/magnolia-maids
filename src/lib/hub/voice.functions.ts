import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

function b64url(bytes: Uint8Array | string) {
  const bin =
    typeof bytes === "string" ? bytes : String.fromCharCode(...Array.from(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Twilio Voice access token (JWT, HS256) so the browser dialer can place and
 * receive calls as the Magnolia Maids business line.
 */
export const getVoiceToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ token: string | null; identity: string; from: string | null; reason?: string }> => {
      await assertAdmin(context as never);
      const accountSid = process.env["TWILIO_ACCOUNT_SID"];
      const keySid = process.env["TWILIO_API_KEY_SID"];
      const keySecret = process.env["TWILIO_API_KEY_SECRET"];
      const appSid = process.env["TWILIO_TWIML_APP_SID"];
      const from = process.env["TWILIO_FROM_NUMBER"] ?? null;
      const identity = `mm-admin-${context.userId.slice(0, 8)}`;

      if (!accountSid || !keySid || !keySecret || !appSid) {
        return { token: null, identity, from, reason: "not_configured" };
      }

      const now = Math.floor(Date.now() / 1000);
      const header = { alg: "HS256", typ: "JWT", cty: "twilio-fpa;v=1" };
      const payload = {
        jti: `${keySid}-${now}`,
        iss: keySid,
        sub: accountSid,
        iat: now,
        exp: now + 3600,
        grants: {
          identity,
          voice: {
            incoming: { allow: true },
            outgoing: { application_sid: appSid },
          },
        },
      };

      const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(keySecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const sig = new Uint8Array(
        await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput)),
      );
      return { token: `${signingInput}.${b64url(sig)}`, identity, from };
    },
  );

/** Records a browser call in the hub timeline once it ends. */
export const logHubCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        phone: z.string().trim().min(7).max(30),
        direction: z.enum(["in", "out"]),
        durationSecs: z.number().int().min(0).max(86400).default(0),
        status: z.string().trim().max(40).default("completed"),
        notes: z.string().trim().max(600).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { toE164 } = await import("@/lib/sms.server");
    const { recordMessage } = await import("./threads.server");
    const phone = toE164(data.phone) ?? data.phone;
    const mins = Math.floor(data.durationSecs / 60);
    const secs = data.durationSecs % 60;
    await recordMessage({
      channel: "call",
      direction: data.direction,
      contactKey: phone,
      phone,
      body:
        `${data.direction === "out" ? "Outgoing" : "Incoming"} call — ${mins}m ${secs}s` +
        (data.notes ? `\n${data.notes}` : ""),
      status: data.status,
      author: "browser-dialer",
    });
    return { ok: true };
  });
