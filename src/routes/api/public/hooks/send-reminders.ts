import { createFileRoute } from "@tanstack/react-router";
import { CAMPAIGNS } from "@/lib/campaigns";
import { holdReminder, type ReminderLead } from "@/lib/email/reminder";
import { sendResendEmail } from "@/lib/resend.server";
import { sendSms } from "@/lib/sms.server";
import { appointmentReminderSms } from "@/lib/sms/messages";


/** Local (America/Chicago) calendar date, N days from now, as YYYY-MM-DD. */
function chicagoDate(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Mirrors the .ics flow: chosen date, else a placeholder one week after signup. */
function holdDateFor(preferred: string | null, createdAt: string) {
  if (preferred) return { holdDate: preferred, placeholder: false };
  const d = new Date(new Date(createdAt).getTime() + 7 * 86400000);
  return { holdDate: d.toISOString().slice(0, 10), placeholder: true };
}

export const Route = createFileRoute("/api/public/hooks/send-reminders")({
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

        const target = chicagoDate(1); // the hold lands tomorrow
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Only rows that could still map onto tomorrow: an explicit date, or a
        // placeholder hold from a signup in the last ~10 days.
        const floor = new Date(Date.now() - 30 * 86400000).toISOString();

        const [bookings, leads] = await Promise.all([
          supabaseAdmin
            .from("booking_requests")
            .select("id,name,email,phone,address,service,frequency,bedrooms,bathrooms,preferred_day,preferred_time,created_at,sms_consent")
            .is("reminder_sent_at", null)
            .neq("status", "cancelled")
            .gte("created_at", floor),
          supabaseAdmin
            .from("campaign_leads")
            .select("id,campaign,name,email,phone,home_size,preferred_date,created_at,sms_consent")
            .is("reminder_sent_at", null)
            .neq("status", "closed")
            .gte("created_at", floor),
        ]);


        if (bookings.error || leads.error) {
          console.error("[reminders] query failed", bookings.error ?? leads.error);
          return Response.json({ error: "Query failed" }, { status: 500 });
        }

        const due: {
          lead: ReminderLead;
          phone: string | null;
          smsConsent: boolean | null;
          sms: import("@/lib/sms/messages").SmsReminderDetails | null;
        }[] = [];

        for (const b of bookings.data ?? []) {
          const { holdDate, placeholder } = holdDateFor(b.preferred_day, b.created_at);
          if (holdDate !== target) continue;
          due.push({
            lead: {
              id: b.id,
              source: "booking",
              name: b.name,
              email: b.email,
              phone: b.phone,
              holdDate,
              placeholder,
              details: [
                ["Service", b.service],
                ["Frequency", b.frequency],
                ["Home", `${b.bedrooms} bd / ${b.bathrooms} ba`],
                ["Address", b.address],
                ["Preferred time", b.preferred_time ?? "Flexible"],
              ],
            },
            phone: b.phone,
            smsConsent: b.sms_consent,
            sms: {
              id: b.id,
              name: b.name,
              service: b.service,
              frequency: b.frequency,
              bedrooms: b.bedrooms,
              bathrooms: b.bathrooms,
              preferredDay: b.preferred_day,
              preferredTime: b.preferred_time,
              address: b.address,
            },
          });
        }

        for (const l of leads.data ?? []) {
          const { holdDate, placeholder } = holdDateFor(l.preferred_date, l.created_at);
          if (holdDate !== target) continue;
          const meta = CAMPAIGNS[l.campaign as keyof typeof CAMPAIGNS];
          due.push({
            lead: {
              id: l.id,
              source: "campaign",
              campaign: l.campaign,
              campaignLabel: meta?.label ?? l.campaign,
              name: l.name,
              email: l.email,
              phone: l.phone,
              holdDate,
              placeholder,
              details: [["Home size", l.home_size ?? "—"]],
            },
            phone: l.phone,
            smsConsent: l.sms_consent,
            sms: null,
          });
        }


        let sent = 0;
        const failed: string[] = [];

        for (const lead of due) {
          const { subject, html } = holdReminder(lead);
          const res = await sendResendEmail({
            to: lead.email,
            subject,
            html,
            reply_to: "hello@magnoliamaids.pro",
            templateId: "hold-reminder",
          });
          if (!res.sent) {
            failed.push(lead.id);
            continue;
          }
          const table = lead.source === "booking" ? "booking_requests" : "campaign_leads";
          const { error } = await supabaseAdmin
            .from(table)
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", lead.id);
          if (error) console.error("[reminders] mark failed", lead.id, error.message);
          sent += 1;
        }

        // Facebook token expiry warning — runs with the same daily job.
        let facebookTokenDaysLeft: number | null = null;
        try {
          const { inspectToken, userToken } = await import("@/lib/facebook.server");
          const info = await inspectToken(userToken());
          facebookTokenDaysLeft = info.daysLeft;
          if (!info.valid || (info.daysLeft != null && info.daysLeft <= 14)) {
            const { NOTIFY_EMAIL } = await import("@/lib/resend.server");
            await sendResendEmail({
              to: NOTIFY_EMAIL,
              subject: info.valid
                ? `⚠️ Facebook access token expires in ${info.daysLeft} days`
                : "⚠️ Facebook access token is no longer valid",
              html: `<p>The Magnolia Maids Facebook connection needs attention.</p>
                <p>Valid: <strong>${info.valid ? "yes" : "no"}</strong><br/>
                Days left: <strong>${info.daysLeft ?? "unknown"}</strong><br/>
                ${info.error ? `Error: ${info.error}<br/>` : ""}</p>
                <p>Reconnect at <a href="https://magnoliamaids.pro/admin/facebook">/admin/facebook</a>.</p>`,
            });
          }
        } catch (e) {
          console.error("[reminders] facebook token check skipped", e);
        }

        return Response.json({
          ok: true,
          target,
          candidates: due.length,
          sent,
          failed: failed.length,
          facebookTokenDaysLeft,
        });
      },
    },
  },
});
