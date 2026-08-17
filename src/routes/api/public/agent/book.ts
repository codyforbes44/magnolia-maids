import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { ServiceKey } from "@/lib/pricing";
import { SERVICE_RATES, bandForSqft, quoteVisit, serviceLabel, sqftLabel } from "@/lib/pricing";
import { TIME_SLOTS, checkDate, slotsForDate, slotLabel } from "@/lib/availability";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const SERVICE_KEYS = SERVICE_RATES.map((r) => r.key) as [ServiceKey, ...ServiceKey[]];
const FREQUENCIES = ["One-time", "Monthly", "Biweekly", "Weekly"] as const;

const Input = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().min(6).max(300),
  service: z.enum(SERVICE_KEYS),
  frequency: z.enum(FREQUENCIES).default("One-time"),
  bedrooms: z.number().int().min(1).max(8),
  bathrooms: z.number().min(1).max(8),
  square_feet: z.coerce.number().min(100).max(20000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().min(3).max(30),
  notes: z.string().trim().max(1000).optional(),
});

export const Route = createFileRoute("/api/public/agent/book")({
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
                "Need name, email, address, service, bedrooms, bathrooms, date (YYYY-MM-DD) and slot (morning, midday, afternoon, sat-morning, sat-midday). Ask the caller for whatever is missing.",
              issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
            },
            { status: 400, headers: CORS },
          );
        }

        const d = parsed.data;
        const day = checkDate(d.date, d.service);
        if (!day.available) {
          return Response.json({ ok: false, error: day.reason }, { status: 200, headers: CORS });
        }
        const option = slotsForDate(d.date, d.service).find((o) => o.slot.key === d.slot);
        if (!option || !option.available) {
          const open = slotsForDate(d.date, d.service)
            .filter((o) => o.available)
            .map((o) => slotLabel(o.slot));
          return Response.json(
            {
              ok: false,
              error: open.length
                ? `That window isn't available. Open windows that day: ${open.join(", ")}.`
                : "No windows are open that day — offer another date.",
            },
            { status: 200, headers: CORS },
          );
        }

        const cal = await import("@/lib/google-calendar.server");
        if (cal.calendarConfigured()) {
          try {
            const busy = await cal.listBusy(d.date);
            if (cal.countBooked(busy, d.date, d.slot) >= cal.CREW_CAPACITY) {
              return Response.json(
                { ok: false, error: "A crew is already committed to that window. Offer the caller another date or time." },
                { status: 200, headers: CORS },
              );
            }
          } catch {
            /* calendar read failure shouldn't block a booking */
          }
        }

        const slot = TIME_SLOTS.find((s) => s.key === d.slot)!;
        const window = slotLabel(slot);
        const sqftBand = bandForSqft(d.square_feet ?? null);
        const estimate = quoteVisit({
          service: d.service,
          frequency: d.frequency,
          bedrooms: d.bedrooms,
          bathrooms: d.bathrooms,
          sqft: sqftBand,
        });

        const { saveContactSubmission } = await import("@/lib/returning-contact.server");
        const saved = await saveContactSubmission({
          table: "booking_requests",
          email: d.email,
          phone: d.phone || null,
          appendColumn: "notes",
          source: "voice agent",
          summary: `${serviceLabel(d.service)} · ${d.date} · ${window}`,
          values: {
            name: d.name,
            email: d.email,
            phone: d.phone || null,
            address: d.address,
            bedrooms: String(d.bedrooms),
            bathrooms: String(d.bathrooms),
            service: d.service,
            frequency: d.frequency,
            preferred_day: d.date,
            preferred_time: window,
            notes: [
              d.notes,
              sqftBand ? `Home size: ${sqftLabel(sqftBand)}` : null,
              "Booked by Maggie (voice agent).",
            ]
              .filter(Boolean)
              .join(" — "),
            sms_consent: false,
          },
        });

        let calendarLink: string | null = null;
        if (cal.calendarConfigured()) {
          try {
            const event = await cal.createBookingEvent({
              dateIso: d.date,
              slotKey: d.slot,
              summary: `${serviceLabel(d.service)} — ${d.name}`,
              description: [
                `Booked by Maggie (voice agent)`,
                `Client: ${d.name}`,
                `Email: ${d.email}`,
                d.phone ? `Phone: ${d.phone}` : null,
                `Home: ${d.bedrooms} bd / ${d.bathrooms} ba${sqftBand ? ` · ${sqftLabel(sqftBand)}` : ""} · ${d.frequency}`,
                `Estimate: $${estimate.total}`,
                d.notes ? `Notes: ${d.notes}` : null,
                `Ref: ${saved.id}`,
              ]
                .filter(Boolean)
                .join("\n"),
              location: d.address,
            });
            calendarLink = event.link;
          } catch (e) {
            console.error("[agent/book] calendar event failed", e);
          }
        }

        try {
          const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
          const { bookingConfirmationCustomer, bookingNotificationAdmin } = await import("@/lib/email/templates");
          const details = {
            id: saved.id,
            name: d.name,
            email: d.email,
            phone: d.phone || null,
            address: d.address,
            bedrooms: String(d.bedrooms),
            bathrooms: String(d.bathrooms),
            service: serviceLabel(d.service),
            frequency: d.frequency,
            preferredDay: d.date,
            preferredTime: window,
            notes: d.notes || null,
          };
          const { loadPlanitCode } = await import("@/lib/partners.server");
          const customer = bookingConfirmationCustomer(details, await loadPlanitCode());
          const admin = bookingNotificationAdmin(details);
          await Promise.all([
            sendResendEmail({
              to: d.email,
              subject: customer.subject,
              html: customer.html,
              kind: "booking-agent",
              relatedId: saved.id,
              templateId: "booking-confirmation",
            }),
            sendResendEmail({
              to: NOTIFY_EMAIL,
              subject: `${admin.subject} (booked by Maggie)`,
              html: admin.html,
              kind: "booking-agent-admin",
              relatedId: saved.id,
            }),
          ]);
        } catch (e) {
          console.error("[agent/book] email failed", e);
        }

        return Response.json(
          {
            ok: true,
            reference: saved.id,
            date: d.date,
            window,
            service: serviceLabel(d.service),
            estimate: `$${estimate.total}`,
            calendar_event: Boolean(calendarLink),
            calendarLink,
            say: `You're on the schedule for ${d.date}, ${window}. I emailed the confirmation to ${d.email} and the office will confirm within one business hour.`,
          },
          { status: 200, headers: CORS },
        );
      },
    },
  },
});
