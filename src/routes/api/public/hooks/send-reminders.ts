import { createFileRoute } from "@tanstack/react-router";
import { CAMPAIGNS } from "@/lib/campaigns";
import { holdReminder, type ReminderLead } from "@/lib/email/reminder";
import { sendResendEmail } from "@/lib/resend.server";
import { sendSms } from "@/lib/sms.server";
import { appointmentReminderSms } from "@/lib/sms/messages";
import {
  DEFAULT_REMINDER_TIMING,
  parseReminderTiming,
  windowForService,
  type ReminderTiming,
} from "@/lib/reminder-timing";

const TZ = "America/Chicago";
/** The job runs hourly; anything whose send time landed in this window fires now. */
const CATCHUP_MS = 90 * 60 * 1000;

/** Milliseconds to add to a UTC instant to get the Chicago wall clock. */
function tzOffsetMs(at: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUTC - at;
}

/** Converts a Chicago wall-clock date + hour into a UTC instant. */
function chicagoInstant(ymd: string, hour: number, minute = 0): number {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return NaN;
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  return guess - tzOffsetMs(guess);
}

/** Best-effort arrival hour from a stored slot label like "Morning (8:00–11:00 AM)". */
function arrivalHour(preferredTime?: string | null): number {
  if (!preferredTime) return 9;
  const match = preferredTime.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return 9;
  let h = Number(match[1]);
  const mer = match[3]?.toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return Number.isFinite(h) ? h : 9;
}

/** Mirrors the .ics flow: chosen date, else a placeholder one week after signup. */
function holdDateFor(preferred: string | null, createdAt: string) {
  if (preferred) return { holdDate: preferred, placeholder: false };
  const d = new Date(new Date(createdAt).getTime() + 7 * 86400000);
  return { holdDate: d.toISOString().slice(0, 10), placeholder: true };
}

function offsetLabel(kind: "day" | "hour", n: number) {
  if (kind === "day") return n === 1 ? "tomorrow" : `in ${n} days`;
  return n === 1 ? "in about an hour" : `in ${n} hours`;
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

        const now = Date.now();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Admin-configured reminder windows (Settings → Reminder timing).
        let timing: ReminderTiming = DEFAULT_REMINDER_TIMING;
        const setting = await supabaseAdmin
          .from("business_settings")
          .select("value")
          .eq("key", "reminder_timing")
          .maybeSingle();
        if (setting.data?.value != null) timing = parseReminderTiming(setting.data.value);

        const floor = new Date(now - 60 * 86400000).toISOString();

        const [bookings, leads] = await Promise.all([
          supabaseAdmin
            .from("booking_requests")
            .select("id,name,email,phone,address,service,frequency,bedrooms,bathrooms,preferred_day,preferred_time,created_at,sms_consent")
            .neq("status", "cancelled")
            .gte("created_at", floor),
          supabaseAdmin
            .from("campaign_leads")
            .select("id,campaign,name,email,phone,home_size,preferred_date,created_at,sms_consent")
            .neq("status", "closed")
            .gte("created_at", floor),
        ]);

        if (bookings.error || leads.error) {
          console.error("[reminders] query failed", bookings.error ?? leads.error);
          return Response.json({ error: "Query failed" }, { status: 500 });
        }

        type Job = {
          lead: ReminderLead;
          table: "booking_requests" | "campaign_leads";
          offsetKey: string;
          phone: string | null;
          smsConsent: boolean | null;
          sms: import("@/lib/sms/messages").SmsReminderDetails | null;
        };

        const due: Job[] = [];

        /** Adds every configured reminder for one record whose send time is now. */
        function schedule(
          base: Omit<Job, "offsetKey" | "lead"> & { lead: Omit<ReminderLead, "leadTime"> },
          holdDate: string,
          service: string | null,
          preferredTime: string | null,
        ) {
          const w = windowForService(timing, service);
          const visit = chicagoInstant(holdDate, arrivalHour(preferredTime));
          if (!Number.isFinite(visit)) return;

          const fires: { key: string; at: number; label: string }[] = [
            ...w.daysBefore.map((d) => ({
              key: `d${d}`,
              at: chicagoInstant(holdDate, timing.sendHour) - d * 86400000,
              label: offsetLabel("day", d),
            })),
            ...w.hoursBefore.map((h) => ({
              key: `h${h}`,
              at: visit - h * 3600000,
              label: offsetLabel("hour", h),
            })),
          ];

          for (const f of fires) {
            if (f.at > now || now - f.at > CATCHUP_MS) continue;
            due.push({
              ...base,
              offsetKey: f.key,
              lead: { ...base.lead, leadTime: f.label },
            });
          }
        }

        for (const b of bookings.data ?? []) {
          const { holdDate, placeholder } = holdDateFor(b.preferred_day, b.created_at);
          schedule(
            {
              table: "booking_requests",
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
            },
            holdDate,
            b.service,
            b.preferred_time,
          );
        }

        for (const l of leads.data ?? []) {
          const { holdDate, placeholder } = holdDateFor(l.preferred_date, l.created_at);
          const meta = CAMPAIGNS[l.campaign as keyof typeof CAMPAIGNS];
          schedule(
            {
              table: "campaign_leads",
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
            },
            holdDate,
            null,
            null,
          );
        }

        // Drop anything already dispatched for that exact offset.
        let pending = due;
        if (due.length) {
          const existing = await supabaseAdmin
            .from("reminder_dispatches")
            .select("record_id, offset_key")
            .in("record_id", Array.from(new Set(due.map((j) => j.lead.id))));
          const seen = new Set((existing.data ?? []).map((r) => `${r.record_id}:${r.offset_key}`));
          pending = due.filter((j) => !seen.has(`${j.lead.id}:${j.offsetKey}`));
        }

        let sent = 0;
        let smsSent = 0;
        const failed: string[] = [];

        for (const job of pending) {
          const { lead, sms, phone, smsConsent } = job;
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

          // Send a matching SMS reminder when the customer opted in.
          if (sms && phone && smsConsent) {
            const { renderStoredSms } = await import("@/lib/sms/render.server");
            const { SITE } = await import("@/lib/email/layout");
            const tpl = await renderStoredSms("appointment-reminder", {
              name: sms.name,
              firstName: sms.name.trim().split(" ")[0] || "there",
              service: sms.service,
              frequency: sms.frequency,
              bedrooms: sms.bedrooms,
              bathrooms: sms.bathrooms,
              preferredDay: sms.preferredDay,
              preferredTime: sms.preferredTime,
              timeWindow: sms.timeWindow ?? sms.preferredTime ?? "flexible arrival window",
              address: sms.address,
              sitePhone: SITE.phone,
              ref: sms.id.slice(0, 8).toUpperCase(),
            });
            if (tpl?.enabled === false) {
              console.log("[reminders] sms template disabled — skipping", lead.id);
            } else {
              const smsRes = await sendSms({
                to: phone,
                body: tpl?.body ?? appointmentReminderSms(sms),
                kind: "sms-appointment-reminder",
                relatedId: lead.id,
                // Consent was verified on the lead/booking record above.
                allowUnknown: true,
              });
              if (smsRes.sent) smsSent += 1;
              else console.warn("[reminders] sms failed", lead.id, smsRes.reason);
            }
          }

          const mark = await supabaseAdmin.from("reminder_dispatches").insert({
            record_table: job.table,
            record_id: lead.id,
            offset_key: job.offsetKey,
            channel: "email",
          });
          if (mark.error) console.error("[reminders] mark failed", lead.id, mark.error.message);
          await supabaseAdmin
            .from(job.table)
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", lead.id);
          sent += 1;
        }

        // Facebook token expiry warning — runs once a day with the morning pass.
        let facebookTokenDaysLeft: number | null = null;
        const localHour = new Date(now + tzOffsetMs(now)).getUTCHours();
        if (localHour === timing.sendHour) {
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
        }

        return Response.json({
          ok: true,
          candidates: due.length,
          pending: pending.length,
          sent,
          smsSent,
          failed: failed.length,
          facebookTokenDaysLeft,
        });
      },
    },
  },
});
