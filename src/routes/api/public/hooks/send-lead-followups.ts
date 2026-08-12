import { createFileRoute } from "@tanstack/react-router";

/**
 * Auto-sends the "Facebook lead — finish your instant quote" email ~3 minutes
 * after a quote lead arrives from Facebook Lead Ads.
 *
 * Runs every minute via pg_cron. The 3–30 minute window means a skipped run
 * never drops a lead, and `followup_sent_at` guarantees a single send.
 */
export const Route = createFileRoute("/api/public/hooks/send-lead-followups")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const anonKey =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
        const provided =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!anonKey || !provided || provided !== anonKey) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { applyOverride, loadOverride } = await import("@/lib/email/overrides.server");
        const { renderBaseForLead } = await import("@/lib/email/lead-emails.server");
        const { dispatchFollowup } = await import("@/lib/followup-dispatch.server");

        const now = Date.now();
        const olderThan = new Date(now - 3 * 60000).toISOString(); // at least 3 min old
        const newerThan = new Date(now - 30 * 60000).toISOString(); // at most 30 min old

        const { data: rows, error } = await supabaseAdmin
          .from("campaign_leads")
          .select(
            "id,campaign,name,email,phone,home_size,preferred_date,referral_name,message,contact_pref",
          )
          .eq("source", "facebook")
          .is("followup_sent_at", null)
          .lte("created_at", olderThan)
          .gte("created_at", newerThan)
          .limit(50);

        if (error) {
          console.error("[lead-followups] query failed", error.message);
          return Response.json({ error: "Query failed" }, { status: 500 });
        }

        const override = await loadOverride("facebook-quote-invite");
        let sent = 0;
        let failed = 0;

        for (const row of rows ?? []) {
          const mail = applyOverride(
            await renderBaseForLead("facebook-quote-invite", row),
            override,
          );

          const res = await dispatchFollowup(
            {
              name: row.name,
              email: row.email,
              phone: row.phone,
              contactPref: row.contact_pref,
              sourceTable: "campaign_leads",
              sourceId: row.id,
            },
            {
              subject: mail.subject,
              html: mail.html,
              smsBody:
                `Hi ${row.name.split(" ")[0]}, it's Maggie with Magnolia Maids. ` +
                `Ready to finish your instant quote? magnoliamaids.pro/quote — reply STOP to opt out.`,
              callPurpose: "Lead follow-up",
              callContext: "Facebook lead asked for a phone call about their quote.",
              kind: "lead-followup",
              templateId: "facebook-quote-invite",
              relatedId: row.id,
            },
          );

          if (!res.sent) {
            failed += 1;
            console.error("[lead-followups] send failed", row.id, res.reason);
            continue;
          }

          const { error: markError } = await supabaseAdmin
            .from("campaign_leads")
            .update({ followup_sent_at: new Date().toISOString() })
            .eq("id", row.id);
          if (markError) console.error("[lead-followups] mark failed", row.id, markError.message);
          sent += 1;
        }

        return Response.json({ ok: true, candidates: rows?.length ?? 0, sent, failed });
      },
    },
  },
});