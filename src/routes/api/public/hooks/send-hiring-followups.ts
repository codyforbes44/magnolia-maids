import { createFileRoute } from "@tanstack/react-router";

/**
 * Auto-sends the "Facebook hiring lead — we'll be in touch" email roughly
 * 1–2 hours after a hiring lead arrives from Facebook Lead Ads.
 *
 * Runs every 15 minutes via pg_cron. The 60–150 minute window gives the job a
 * safety margin so a skipped run never drops a lead, and `followup_sent_at`
 * guarantees a single send per applicant.
 */
export const Route = createFileRoute("/api/public/hooks/send-hiring-followups")({
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
        const { facebookHiringFollowup } = await import("@/lib/email/facebook-hiring-followup");
        const { dispatchFollowup } = await import("@/lib/followup-dispatch.server");

        const now = Date.now();
        const olderThan = new Date(now - 60 * 60000).toISOString(); // at least 1h old
        const newerThan = new Date(now - 150 * 60000).toISOString(); // at most 2.5h old

        const { data: rows, error } = await supabaseAdmin
          .from("job_applications")
          .select("id,name,email,phone,area,role,availability,contact_pref")
          .eq("source", "facebook")
          .is("followup_sent_at", null)
          .neq("status", "rejected")
          .lte("created_at", olderThan)
          .gte("created_at", newerThan)
          .limit(50);

        if (error) {
          console.error("[hiring-followups] query failed", error.message);
          return Response.json({ error: "Query failed" }, { status: 500 });
        }

        const override = await loadOverride("facebook-hiring-followup");
        let sent = 0;
        let failed = 0;

        for (const row of rows ?? []) {
          const mail = applyOverride(
            facebookHiringFollowup({
              name: row.name,
              role: row.role,
              area: row.area,
              availability: row.availability,
            }),
            override,
          );

          const res = await dispatchFollowup(
            {
              name: row.name,
              email: row.email,
              phone: row.phone,
              contactPref: row.contact_pref,
              sourceTable: "job_applications",
              sourceId: row.id,
            },
            {
              subject: mail.subject,
              html: mail.html,
              smsBody:
                `Hi ${row.name.split(" ")[0]}, it's Maggie with Magnolia Maids about your ${row.role} application. ` +
                `Can we set up a quick chat? Reply here or call (580) 745-0045. Reply STOP to opt out.`,
              callPurpose: "Applicant follow-up",
              callContext: `Applicant for ${row.role} in ${row.area}, availability: ${row.availability}.`,
              kind: "careers-followup",
              templateId: "facebook-hiring-followup",
              relatedId: row.id,
            },
          );

          if (!res.sent) {
            failed += 1;
            console.error("[hiring-followups] send failed", row.id, res.reason);
            continue;
          }

          const { error: markError } = await supabaseAdmin
            .from("job_applications")
            .update({ followup_sent_at: new Date().toISOString() })
            .eq("id", row.id);
          if (markError) console.error("[hiring-followups] mark failed", row.id, markError.message);
          sent += 1;
        }

        return Response.json({ ok: true, candidates: rows?.length ?? 0, sent, failed });
      },
    },
  },
});