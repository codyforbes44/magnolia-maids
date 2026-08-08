/**
 * Returning-visitor handling.
 *
 * When someone submits a form again with an email or phone we already have on
 * file, we append the new details to their existing record instead of creating
 * a duplicate, and write a row to `contact_activity` so admins can see the
 * whole history of that person's submissions.
 */

export type ContactTable =
  | "booking_requests"
  | "campaign_leads"
  | "job_applications"
  | "property_inquiries";

type UpsertArgs = {
  table: ContactTable;
  /** Row we would have inserted for a brand-new contact. */
  values: Record<string, unknown>;
  email: string;
  phone?: string | null;
  /** Free-text column that gets appended to on a repeat visit. */
  appendColumn: "notes" | "message";
  /** Which form/page this submission came from (for the activity log). */
  source: string;
  /** Human summary for the activity log, e.g. "Deep clean · 3 bd / 2 ba". */
  summary?: string;
};

export type UpsertResult = {
  id: string;
  /** true when the details were appended to an existing record. */
  returning: boolean;
  /** How many submissions this contact has now made (including this one). */
  submissions: number;
};

const digits = (v?: string | null) => (v ?? "").replace(/\D/g, "");
const last10 = (v?: string | null) => {
  const d = digits(v);
  return d.length >= 10 ? d.slice(-10) : "";
};
/** PostgREST `or()` filters are comma separated — keep values free of separators. */
const safe = (v: string) => v.replace(/[(),*]/g, "");

function stamp() {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function findExisting(table: ContactTable, email: string, phone?: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const filters = [`email.ilike.${safe(email.trim())}`];
  const tail = last10(phone);
  if (tail) filters.push(`phone_digits.like.%${tail}`);

  const { data, error } = await (supabaseAdmin.from(table) as any)
    .select("*")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(`[returning-contact] lookup failed on ${table}`, error.message);
    return null;
  }
  return (data?.[0] as Record<string, unknown> | undefined) ?? null;
}

/** Merge the new submission into the existing row without losing older details. */
function mergeValues(
  existing: Record<string, unknown>,
  values: Record<string, unknown>,
  appendColumn: string,
  source: string,
) {
  const update: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (key === appendColumn) continue;
    // Never blank out something we already know from an earlier submission.
    if (value === null || value === undefined || value === "") continue;
    update[key] = value;
  }

  const incoming = String(values[appendColumn] ?? "").trim();
  const previous = String(existing[appendColumn] ?? "").trim();
  const entry = [`— ${stamp()} · new submission via ${source}`, incoming].filter(Boolean).join("\n");
  update[appendColumn] = previous ? `${previous}\n\n${entry}` : entry;

  // A repeat submission is a fresh request — pull it back into the new queue.
  if ("status" in existing) update.status = "new";

  return update;
}

async function logActivity(entry: {
  table: ContactTable;
  recordId: string;
  event: "created" | "appended";
  source: string;
  email: string;
  phone?: string | null;
  summary: string;
  payload: Record<string, unknown>;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("contact_activity").insert({
    record_table: entry.table,
    record_id: entry.recordId,
    event: entry.event,
    source: entry.source,
    email: entry.email,
    phone: entry.phone || null,
    summary: entry.summary,
    payload: entry.payload as never,
  });
  if (error) console.error("[returning-contact] activity log failed", error.message);
}

async function countSubmissions(table: ContactTable, recordId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("contact_activity")
    .select("id", { count: "exact", head: true })
    .eq("record_table", table)
    .eq("record_id", recordId);
  return count ?? 1;
}

/**
 * Inserts a new record, or appends to the existing one when the email or phone
 * is already on file. Always writes an activity log entry.
 */
export async function saveContactSubmission(args: UpsertArgs): Promise<UpsertResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const existing = await findExisting(args.table, args.email, args.phone);
  const summary = args.summary?.trim() || "New submission";

  if (existing?.["id"]) {
    const id = String(existing["id"]);
    const { error } = await (supabaseAdmin.from(args.table) as any)
      .update(mergeValues(existing, args.values, args.appendColumn, args.source))
      .eq("id", id);

    if (error) {
      console.error(`[returning-contact] append failed on ${args.table}`, error.message);
      throw new Error("Could not save your request. Please try again.");
    }

    await logActivity({
      table: args.table,
      recordId: id,
      event: "appended",
      source: args.source,
      email: args.email,
      phone: args.phone ?? null,
      summary,
      payload: args.values,
    });

    return { id, returning: true, submissions: await countSubmissions(args.table, id) };
  }

  const { data, error } = await (supabaseAdmin.from(args.table) as any)
    .insert(args.values)
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error(`[returning-contact] insert failed on ${args.table}`, error?.message);
    throw new Error("Could not save your request. Please try again.");
  }

  const id = String(data.id);
  await logActivity({
    table: args.table,
    recordId: id,
    event: "created",
    source: args.source,
    email: args.email,
    phone: args.phone ?? null,
    summary,
    payload: args.values,
  });

  return { id, returning: false, submissions: 1 };
}