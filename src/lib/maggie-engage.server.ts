/**
 * Admin-driven Maggie engagement. Server-only.
 *
 * Two jobs:
 *  1. Store the "let Maggie engage" switches (master + per source) so the
 *     automated follow-up jobs know whether they're allowed to run.
 *  2. Engage one specific contact on demand: Maggie drafts a personal note
 *     from the record, then it goes out on the channel that person chose.
 */
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildAgentKnowledge } from "@/agents/knowledge";
import { normalizeContactPref, type ContactPref } from "@/lib/contact-pref";

const MODEL = "google/gemini-2.5-flash";
const SETTINGS_KEY = "maggie_engagement";

export const ENGAGE_SOURCES = [
  "campaign_leads",
  "booking_requests",
  "job_applications",
  "property_inquiries",
  "franchise_inquiries",
] as const;
export type EngageSource = (typeof ENGAGE_SOURCES)[number];

export const ENGAGE_SOURCE_LABELS: Record<EngageSource, string> = {
  campaign_leads: "Leads",
  booking_requests: "Booking requests",
  job_applications: "Job applicants",
  property_inquiries: "Property managers",
  franchise_inquiries: "Franchise inquiries",
};

export type EngagementSettings = {
  enabled: boolean;
  sources: Record<EngageSource, boolean>;
};

export const DEFAULT_ENGAGEMENT: EngagementSettings = {
  enabled: true,
  sources: {
    campaign_leads: true,
    booking_requests: true,
    job_applications: true,
    property_inquiries: false,
    franchise_inquiries: false,
  },
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function parseEngagement(raw: unknown): EngagementSettings {
  const value = (raw ?? {}) as Partial<EngagementSettings>;
  const sources = { ...DEFAULT_ENGAGEMENT.sources };
  for (const key of ENGAGE_SOURCES) {
    const v = (value.sources ?? {})[key];
    if (typeof v === "boolean") sources[key] = v;
  }
  return { enabled: typeof value.enabled === "boolean" ? value.enabled : DEFAULT_ENGAGEMENT.enabled, sources };
}

export async function loadEngagement(): Promise<EngagementSettings> {
  const db = await admin();
  const { data } = await db.from("business_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
  return parseEngagement(data?.value);
}

export async function saveEngagement(next: EngagementSettings): Promise<EngagementSettings> {
  const db = await admin();
  const value = parseEngagement(next);
  const { error } = await db
    .from("business_settings")
    .upsert({ key: SETTINGS_KEY, value, is_public: false }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return value;
}

/** Used by the automated follow-up jobs before they reach out to anyone. */
export async function autoEngageAllowed(source: EngageSource): Promise<boolean> {
  try {
    const s = await loadEngagement();
    return s.enabled && s.sources[source] !== false;
  } catch {
    return true;
  }
}

/* ------------------------------------------------------------------ */
/* One-off engagement                                                  */
/* ------------------------------------------------------------------ */

export type EngageRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contactPref: ContactPref;
  context: string;
  purpose: string;
};

const SELECTS: Record<EngageSource, string> = {
  campaign_leads: "id,name,email,phone,contact_pref,campaign,home_size,preferred_date,message",
  booking_requests:
    "id,name,email,phone,contact_pref,service,frequency,bedrooms,bathrooms,address,preferred_day,preferred_time,notes",
  job_applications: "id,name,email,phone,contact_pref,role,area,availability,experience,notes",
  property_inquiries:
    "id,contact_name,email,phone,contact_pref,property_name,total_units,turns_per_month,turnaround,notes",
  franchise_inquiries:
    "id,name,email,phone,contact_pref,target_city,target_state,timeline,capital_band,background,why,notes",
};

export async function loadRecord(source: EngageSource, id: string): Promise<EngageRecord> {
  const db = await admin();
  const { data, error } = await db.from(source).select(SELECTS[source]).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("That record no longer exists.");
  const r = data as Record<string, unknown>;
  const str = (k: string) => (r[k] == null || r[k] === "" ? null : String(r[k]));

  const base = {
    id,
    email: str("email"),
    phone: str("phone"),
    contactPref: normalizeContactPref(r["contact_pref"]),
  };

  switch (source) {
    case "campaign_leads":
      return {
        ...base,
        name: str("name") ?? "there",
        purpose: "lead_followup",
        context: `Campaign lead from ${str("campaign") ?? "the website"}. Home size: ${str("home_size") ?? "unknown"}. Preferred date: ${str("preferred_date") ?? "not given"}. They wrote: ${str("message") ?? "(nothing)"}`,
      };
    case "booking_requests":
      return {
        ...base,
        name: str("name") ?? "there",
        purpose: "booking_confirm",
        context: `Booking request: ${str("service")}, ${str("frequency")}, ${str("bedrooms")}bd/${str("bathrooms")}ba at ${str("address")}. Preferred ${str("preferred_day") ?? "no day"} ${str("preferred_time") ?? ""}. Notes: ${str("notes") ?? "(none)"}`,
      };
    case "job_applications":
      return {
        ...base,
        name: str("name") ?? "there",
        purpose: "applicant_screen",
        context: `Applicant for ${str("role")} in ${str("area")}. Availability: ${str("availability")}. Experience: ${str("experience") ?? "(not given)"}`,
      };
    case "property_inquiries":
      return {
        ...base,
        name: str("contact_name") ?? "there",
        purpose: "property_followup",
        context: `Property manager inquiry for ${str("property_name")}: ${str("total_units") ?? "?"} units, ${str("turns_per_month") ?? "?"} turns/month, turnaround ${str("turnaround") ?? "?"}. Notes: ${str("notes") ?? "(none)"}`,
      };
    case "franchise_inquiries":
      return {
        ...base,
        name: str("name") ?? "there",
        purpose: "franchise_followup",
        context: `Franchise inquiry for ${str("target_city") ?? "?"}, ${str("target_state") ?? "?"}. Timeline: ${str("timeline") ?? "?"}. Capital: ${str("capital_band") ?? "?"}. Background: ${str("background") ?? "(none)"} Why: ${str("why") ?? "(none)"}`,
      };
  }
}

const DRAFT_RULES = `You are Maggie, the Magnolia Maids virtual assistant, writing a personal follow-up to one person.
- Warm, local, concise. No markdown, no headings, no bullet lists.
- Never invent prices, dates, or promises the business facts don't support.
- Email version: 2-4 short paragraphs, plain sentences separated by blank lines, no greeting line that repeats their name twice, no signature block.
- Text version: at most 300 characters, one clear next step, ends with "Reply STOP to opt out".
- Always give one clear next step (reply, book, or call).`;

export type EngageDraft = { subject: string; email: string; sms: string };

export async function draftEngagement(record: EngageRecord, instruction?: string): Promise<EngageDraft> {
  const key = process.env["LOVABLE_API_KEY"];
  const fallback: EngageDraft = {
    subject: "Following up from Magnolia Maids",
    email: `Just checking in about your recent request with Magnolia Maids.\n\n${record.context}\n\nReply here or call (580) 745-0045 and we'll take it from there.`,
    sms: `Hi ${record.name}, it's Maggie at Magnolia Maids following up on your request. Reply here or call (580) 745-0045. Reply STOP to opt out`,
  };
  if (!key) return fallback;

  try {
    const gateway = createLovableAiGatewayProvider(key);
    const res = await generateText({
      model: gateway(MODEL),
      system: `${DRAFT_RULES}\n\n${buildAgentKnowledge()}`,
      prompt: `Write the follow-up for ${record.name}.\n\nWhat we know:\n${record.context}\n${instruction ? `\nThe owner asks you to: ${instruction}\n` : ""}\nReturn strict JSON only, no code fences: {"subject": string, "email": string, "sms": string}`,
    });
    const text = res.text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(text) as Partial<EngageDraft>;
    return {
      subject: (parsed.subject ?? fallback.subject).slice(0, 160),
      email: parsed.email ?? fallback.email,
      sms: (parsed.sms ?? fallback.sms).slice(0, 320),
    };
  } catch (e) {
    console.error("[maggie-engage] draft failed", e);
    return fallback;
  }
}

export type EngageResult = {
  channel: ContactPref;
  sent: boolean;
  reason?: string;
  draft: EngageDraft;
};

/** Draft + deliver on the contact's preferred channel (or a forced one). */
export async function engageRecord(args: {
  source: EngageSource;
  id: string;
  channel?: ContactPref | "auto";
  instruction?: string;
  by?: string;
}): Promise<EngageResult> {
  const record = await loadRecord(args.source, args.id);
  const channel = !args.channel || args.channel === "auto" ? record.contactPref : args.channel;
  const draft = await draftEngagement(record, args.instruction);

  const { agentMessageEmail } = await import("@/lib/email/agent-message");
  const rendered = agentMessageEmail({ name: record.name, message: draft.email, subject: draft.subject });

  const { dispatchFollowup } = await import("@/lib/followup-dispatch.server");
  const result = await dispatchFollowup(
    {
      name: record.name,
      email: record.email,
      phone: record.phone,
      contactPref: channel,
      sourceTable: args.source,
      sourceId: record.id,
    },
    {
      subject: rendered.subject,
      html: rendered.html,
      smsBody: draft.sms,
      callPurpose: record.purpose,
      callContext: `${record.context}\n\nTalking points: ${draft.email}`,
      kind: `maggie-engage-${args.source}`,
      relatedId: record.id,
    },
  );

  await logActivity(args.source, record, result.channel, result.sent, args.by);
  return { ...result, draft };
}

async function logActivity(
  source: EngageSource,
  record: EngageRecord,
  channel: ContactPref,
  sent: boolean,
  by?: string,
) {
  try {
    const db = await admin();
    await db.from("contact_activity").insert({
      record_table: source,
      record_id: record.id,
      event: sent ? "maggie_engaged" : "maggie_engage_failed",
      source: "admin",
      email: record.email,
      phone: record.phone,
      summary: `${sent ? "Maggie reached out" : "Maggie could not reach out"} by ${channel}${by ? ` (started by ${by})` : ""}`,
      payload: { channel, sent },
    } as never);
  } catch (e) {
    console.error("[maggie-engage] activity log failed", e);
  }
}
