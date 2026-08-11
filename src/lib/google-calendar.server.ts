/**
 * Google Calendar access for Magnolia Maids scheduling.
 * Runs server-side only, through the Lovable connector gateway.
 */

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

/** Local business timezone — all crew scheduling is Durant, OK time. */
export const CAL_TZ = "America/Chicago";

/** Start hour (24h, local) and duration in hours for each booking window. */
const SLOT_TIMES: Record<string, { start: number; hours: number }> = {
  morning: { start: 8, hours: 3 },
  midday: { start: 11, hours: 3 },
  afternoon: { start: 14, hours: 3 },
  "sat-morning": { start: 9, hours: 3 },
  "sat-midday": { start: 12, hours: 3 },
};

/** How many crews can be on a job at the same time. */
export const CREW_CAPACITY = Number(process.env["CREW_CAPACITY"] ?? 1) || 1;

export function slotTimes(slotKey: string) {
  return SLOT_TIMES[slotKey] ?? null;
}

/** RFC3339 timestamp with the Durant offset applied by Google via timeZone. */
function localIso(dateIso: string, hour: number) {
  const hh = String(Math.floor(hour)).padStart(2, "0");
  const mm = String(Math.round((hour % 1) * 60)).padStart(2, "0");
  return `${dateIso}T${hh}:${mm}:00`;
}

function calendarId() {
  return process.env["GOOGLE_CALENDAR_ID"] || "primary";
}

function keys() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const calKey = process.env["GOOGLE_CALENDAR_API_KEY"];
  if (!lovableKey || !calKey) return null;
  return { lovableKey, calKey };
}

export function calendarConfigured() {
  return keys() !== null;
}

async function call(path: string, init: { method?: string; body?: unknown; query?: Record<string, string> } = {}) {
  const k = keys();
  if (!k) throw new Error("google_calendar_not_configured");
  const url = new URL(`${GATEWAY}${path}`);
  for (const [key, value] of Object.entries(init.query ?? {})) url.searchParams.set(key, value);

  const res = await fetch(url.toString(), {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${k.lovableKey}`,
      "X-Connection-Api-Key": k.calKey,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[calendar] ${init.method ?? "GET"} ${path} failed [${res.status}]: ${text.slice(0, 500)}`);
    throw new Error(`calendar_http_${res.status}`);
  }
  return text ? JSON.parse(text) : {};
}

export type BusyBlock = { start: string; end: string };

/** Existing Magnolia Maids events between two local datetimes. */
export async function listBusy(dateIso: string): Promise<BusyBlock[]> {
  const data = (await call("/freeBusy", {
    method: "POST",
    body: {
      timeMin: `${dateIso}T00:00:00`,
      timeMax: `${dateIso}T23:59:59`,
      timeZone: CAL_TZ,
      items: [{ id: calendarId() }],
    },
  })) as { calendars?: Record<string, { busy?: BusyBlock[] }> };
  const cal = data.calendars?.[calendarId()];
  return cal?.busy ?? [];
}

function overlaps(a: { start: Date; end: Date }, b: { start: Date; end: Date }) {
  return a.start < b.end && b.start < a.end;
}

/** How many crews are already committed to a given date + slot. */
export function countBooked(busy: BusyBlock[], dateIso: string, slotKey: string) {
  const times = slotTimes(slotKey);
  if (!times) return 0;
  const start = new Date(`${localIso(dateIso, times.start)}`);
  const end = new Date(`${localIso(dateIso, times.start + times.hours)}`);
  return busy.filter((b) =>
    overlaps({ start, end }, { start: new Date(b.start), end: new Date(b.end) }),
  ).length;
}

export type CreateEventInput = {
  dateIso: string;
  slotKey: string;
  summary: string;
  description: string;
  location?: string | null;
  attendeeEmail?: string | null;
};

export async function createBookingEvent(input: CreateEventInput) {
  const times = slotTimes(input.slotKey);
  if (!times) throw new Error("unknown_slot");
  const event = (await call(`/calendars/${encodeURIComponent(calendarId())}/events`, {
    method: "POST",
    body: {
      summary: input.summary,
      description: input.description,
      location: input.location || undefined,
      start: { dateTime: localIso(input.dateIso, times.start), timeZone: CAL_TZ },
      end: { dateTime: localIso(input.dateIso, times.start + times.hours), timeZone: CAL_TZ },
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 120 }] },
    },
  })) as { id?: string; htmlLink?: string };
  return { id: event.id ?? null, link: event.htmlLink ?? null };
}
