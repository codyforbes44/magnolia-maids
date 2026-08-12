import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmailLogRow = {
  id: string;
  createdAt: string;
  recipient: string;
  subject: string;
  kind: string;
  status: string;
  providerId: string | null;
  error: string | null;
  relatedId: string | null;
  bodyHtml: string | null;
  replyTo: string | null;
  fromAddress: string | null;
};

const listInput = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["all", "sent", "failed"]).default("all"),
  kind: z.string().trim().max(80).optional(),
  limit: z.number().int().min(1).max(500).default(200),
});

/** Reads the email half of the shared activity log, including message bodies. */
export const listEmailLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<{ rows: EmailLogRow[]; kinds: string[] }> => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("email_log")
      .select(
        "id,recipient,subject,kind,status,provider_id,error,related_id,created_at,body_html,reply_to,from_address",
      )
      .not("kind", "like", "sms%")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.status !== "all") query = query.eq("status", data.status);
    if (data.kind) query = query.eq("kind", data.kind);
    if (data.search) {
      const s = data.search.replace(/[%,]/g, " ");
      query = query.or(
        `recipient.ilike.%${s}%,subject.ilike.%${s}%,body_html.ilike.%${s}%,error.ilike.%${s}%,provider_id.ilike.%${s}%`,
      );
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const mapped: EmailLogRow[] = (rows ?? []).map((r) => ({
      id: r.id as string,
      createdAt: r.created_at as string,
      recipient: r.recipient as string,
      subject: r.subject as string,
      kind: r.kind as string,
      status: r.status as string,
      providerId: (r.provider_id as string | null) ?? null,
      error: (r.error as string | null) ?? null,
      relatedId: (r.related_id as string | null) ?? null,
      bodyHtml: (r.body_html as string | null) ?? null,
      replyTo: (r.reply_to as string | null) ?? null,
      fromAddress: (r.from_address as string | null) ?? null,
    }));

    const { data: kindRows } = await supabaseAdmin
      .from("email_log")
      .select("kind")
      .not("kind", "like", "sms%")
      .order("created_at", { ascending: false })
      .limit(1000);
    const kinds = Array.from(new Set((kindRows ?? []).map((k) => k.kind as string))).sort();

    return { rows: mapped, kinds };
  });