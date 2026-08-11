import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { ServiceKey } from "@/lib/pricing";
import { SERVICE_RATES } from "@/lib/pricing";
import { checkDate, earliestDate, slotsForDate, slotLabel, toISODate } from "@/lib/availability";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const SERVICE_KEYS = SERVICE_RATES.map((r) => r.key) as [ServiceKey, ...ServiceKey[]];

const Input = z.object({
  service: z.enum(SERVICE_KEYS).default("Standard Clean"),
  /** Specific day to check (YYYY-MM-DD). Omit to get the next open days. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** How many open days to return when no date is given. */
  days: z.number().int().min(1).max(7).default(3),
});

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export const Route = createFileRoute("/api/public/agent/availability")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        let payload: unknown = {};
        try {
          payload = await request.json();
        } catch {
          payload = {};
        }
        const parsed = Input.safeParse(payload ?? {});
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: "Provide `service` (exact service name), optional `date` (YYYY-MM-DD) and `days` (1-7)." },
            { status: 400, headers: CORS },
          );
        }
        const { service, date, days } = parsed.data;

        const cal = await import("@/lib/google-calendar.server");
        const useCalendar = cal.calendarConfigured();

        async function openSlots(iso: string) {
          const options = slotsForDate(iso, service).filter((o) => o.available);
          if (!options.length) return [];
          let busy: Awaited<ReturnType<typeof cal.listBusy>> = [];
          if (useCalendar) {
            try {
              busy = await cal.listBusy(iso);
            } catch {
              busy = [];
            }
          }
          return options
            .filter((o) => cal.countBooked(busy, iso, o.slot.key) < cal.CREW_CAPACITY)
            .map((o) => ({ slot: o.slot.key, label: slotLabel(o.slot) }));
        }

        if (date) {
          const day = checkDate(date, service);
          if (!day.available) {
            return Response.json({ ok: true, date, available: false, reason: day.reason, slots: [] }, { headers: CORS });
          }
          const slots = await openSlots(date);
          return Response.json(
            {
              ok: true,
              date,
              available: slots.length > 0,
              reason: slots.length ? undefined : "Every crew is booked that day — offer the next open date.",
              slots,
            },
            { headers: CORS },
          );
        }

        const results: Array<{ date: string; slots: Array<{ slot: string; label: string }> }> = [];
        let cursor = earliestDate(service);
        for (let i = 0; i < 21 && results.length < days; i++) {
          const iso = toISODate(cursor);
          if (checkDate(iso, service).available) {
            const slots = await openSlots(iso);
            if (slots.length) results.push({ date: iso, slots });
          }
          cursor = addDays(cursor, 1);
        }

        return Response.json({ ok: true, service, days: results }, { headers: CORS });
      },
    },
  },
});
