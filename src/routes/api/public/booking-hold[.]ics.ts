import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CAMPAIGN_EMAIL_COPY } from "@/lib/email/campaign-thankyou";
import { SITE } from "@/lib/email/layout";

const querySchema = z.object({
  campaign: z.string().trim().max(64).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ref: z.string().trim().max(64).optional(),
});

const escapeIcs = (v: string) =>
  v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const ymd = (d: Date) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

export const Route = createFileRoute("/api/public/booking-hold/ics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });

        const { campaign, date, ref } = parsed.data;
        const copy = (campaign && CAMPAIGN_EMAIL_COPY[campaign]) || null;

        const start = date ? new Date(`${date}T00:00:00Z`) : new Date(Date.now() + 7 * 86400000);
        if (Number.isNaN(start.getTime())) return new Response("Invalid date", { status: 400 });
        const end = new Date(start.getTime() + 86400000);

        const title = copy?.calendarTitle ?? "Magnolia Maids — cleaning hold";
        const detail = copy?.calendarDetail ?? "Placeholder hold for your clean. We'll confirm the exact window by email or text.";
        const description = [
          detail,
          ref ? `Reference #${ref}` : null,
          `Magnolia Maids · ${SITE.phone}`,
          SITE.url,
        ]
          .filter(Boolean)
          .join("\n");

        const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
        const uid = `${ref ?? ymd(start)}-${campaign ?? "hold"}@magnoliamaids.pro`;

        const ics = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Magnolia Maids//Booking Hold//EN",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          "BEGIN:VEVENT",
          `UID:${escapeIcs(uid)}`,
          `DTSTAMP:${stamp}`,
          `DTSTART;VALUE=DATE:${ymd(start)}`,
          `DTEND;VALUE=DATE:${ymd(end)}`,
          `SUMMARY:${escapeIcs(title)}`,
          `DESCRIPTION:${escapeIcs(description)}`,
          "LOCATION:Durant\\, OK",
          `URL:${escapeIcs(`${SITE.url}/booking`)}`,
          "STATUS:TENTATIVE",
          "TRANSP:TRANSPARENT",
          "BEGIN:VALARM",
          "TRIGGER:-P1D",
          "ACTION:DISPLAY",
          "DESCRIPTION:Magnolia Maids clean tomorrow",
          "END:VALARM",
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n");

        return new Response(ics, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'attachment; filename="magnolia-maids-hold.ics"',
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
