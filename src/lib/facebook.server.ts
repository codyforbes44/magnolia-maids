/**
 * Server-only Facebook Graph helpers. Never imported from client code —
 * route/server-function handlers import this lazily.
 */
import { CAMPAIGNS } from "@/lib/campaigns";
import { CAMPAIGN_KEYS } from "@/lib/campaign-lead-schema";
import { campaignLeadAdmin, campaignLeadCustomer, type CampaignLead } from "@/lib/email/campaign";

export const GRAPH = "https://graph.facebook.com/v21.0";

export async function graphGet(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${GRAPH}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  const body = await res.text();
  if (!res.ok) throw new Error(`Facebook ${res.status}: ${body.slice(0, 400)}`);
  return body ? JSON.parse(body) : {};
}

export function userToken(): string {
  const t = process.env["FACEBOOK_USER_ACCESS_TOKEN"];
  if (!t) throw new Error("FACEBOOK_USER_ACCESS_TOKEN is not set");
  return t;
}

/** debug_token against the app token, so we can report scopes + expiry. */
export async function inspectToken(token: string) {
  const appId = process.env["FACEBOOK_APP_ID"];
  const appSecret = process.env["FACEBOOK_APP_SECRET"];
  if (!appId || !appSecret) throw new Error("FACEBOOK_APP_ID / FACEBOOK_APP_SECRET not set");
  const res = await graphGet("/debug_token", `${appId}|${appSecret}`, { input_token: token });
  const d = res.data ?? {};
  const expiresAt: number | null = d.expires_at ? d.expires_at * 1000 : null;
  return {
    valid: Boolean(d.is_valid),
    appId: d.app_id ?? null,
    scopes: (d.scopes ?? []) as string[],
    expiresAt,
    daysLeft: expiresAt ? Math.round((expiresAt - Date.now()) / 86400000) : null,
    error: d.error?.message ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Lead Ads ingestion                                                  */
/* ------------------------------------------------------------------ */

type FieldData = { name: string; values: string[] };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function pick(fields: FieldData[], ...names: string[]) {
  for (const n of names) {
    const f = fields.find((x) => norm(x.name) === norm(n));
    const v = f?.values?.[0]?.trim();
    if (v) return v;
  }
  return undefined;
}

/** Anything we didn't explicitly map, so no answer is silently dropped. */
function leftovers(fields: FieldData[], used: string[]) {
  const usedSet = new Set(used.map(norm));
  return fields
    .filter((f) => !usedSet.has(norm(f.name)) && f.values?.[0]?.trim())
    .map((f) => `${f.name.replace(/[_?]/g, " ").trim()}: ${f.values[0].trim()}`);
}

/** Best-effort match of a Lead Ads form name onto one of our campaign keys. */
export function campaignFromFormName(formName?: string | null): string {
  const slug = (formName ?? "").toLowerCase();
  for (const key of CAMPAIGN_KEYS) {
    const words = key.split("-").filter((w) => w.length > 3);
    if (words.some((w) => slug.includes(w))) return key;
  }
  return "facebook-lead-ads";
}

function campaignMeta(campaign: string) {
  const known = (CAMPAIGNS as Record<string, { label: string; offer: string; path: string }>)[campaign];
  return {
    label: known?.label ?? "Facebook Lead Ads",
    offer: known?.offer ?? "Founding-member pricing for Durant homes",
    path: known?.path ?? "/booking",
  };
}

/**
 * Fetch a single leadgen record from Graph and store it in the table that
 * matches the form: the hiring form lands in job_applications, everything
 * else in campaign_leads. Idempotent on the Facebook lead id.
 */
export async function ingestLeadgen(opts: { leadgenId: string; pageId?: string; formName?: string | null }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
  const { FACEBOOK_LEAD_FORMS } = await import("@/lib/facebook-config");

  // Page token preferred (leads_retrieval is page-scoped), fall back to user token.
  let token: string;
  if (opts.pageId) {
    const { data } = await supabaseAdmin
      .from("facebook_connections")
      .select("page_access_token")
      .eq("page_id", opts.pageId)
      .maybeSingle();
    token = data?.page_access_token ?? userToken();
  } else {
    token = userToken();
  }

  const lead = await graphGet(`/${opts.leadgenId}`, token, {
    fields: "id,created_time,field_data,form_id",
  });
  const fields: FieldData[] = lead.field_data ?? [];

  const email = pick(fields, "email", "work_email");
  const name =
    pick(fields, "full_name") ??
    [pick(fields, "first_name"), pick(fields, "last_name")].filter(Boolean).join(" ").trim();
  if (!email || !name) return { stored: false as const, reason: "missing_name_or_email" };

  const formId = lead.form_id ? String(lead.form_id) : "";
  const phone = pick(fields, "phone_number", "phone", "phone_number_") ?? null;
  const origin = `Facebook Lead Ads (lead ${lead.id}${formId ? `, form ${formId}` : ""}).`;

  /* ---------------- Hiring form -> job_applications ---------------- */
  if (FACEBOOK_LEAD_FORMS[formId]?.destination === "applications") {
    const { careersApplicationAdmin, careersApplicationCandidate } = await import("@/lib/email/templates");

    const role = pick(fields, "what_is_your_preferred_role?", "preferred_role", "role") ?? "Not sure yet";
    const availability =
      pick(fields, "what_is_your_preferred_schedule?", "preferred_schedule", "availability") ?? "Flexible";
    const area = pick(fields, "area", "city", "what_area_do_you_live_in?") ?? "Durant / Bryan County";
    const experience = pick(fields, "experience", "cleaning_experience") ?? null;
    const extras = leftovers(fields, [
      "email",
      "full_name",
      "first_name",
      "last_name",
      "phone_number",
      "phone",
      "what_is_your_preferred_role?",
      "what_is_your_preferred_schedule?",
      "area",
      "city",
      "experience",
    ]);
    const notes = [origin, ...extras].join(" · ");

    const { data: dupe } = await supabaseAdmin
      .from("job_applications")
      .select("id")
      .eq("email", email)
      .like("notes", `%lead ${lead.id}%`)
      .maybeSingle();
    if (dupe) return { stored: false as const, reason: "duplicate", id: dupe.id, destination: "applications" as const };

    const { data: appRow, error: appError } = await supabaseAdmin
      .from("job_applications")
      .insert({
        name,
        email,
        phone: phone ?? "Not provided",
        area,
        role,
        availability,
        experience,
        notes,
        status: "new",
        source: "facebook",
      })
      .select("id")
      .single();
    if (appError) throw new Error(appError.message);

    const application = {
      id: appRow.id as string,
      name,
      email,
      phone: phone ?? "Not provided",
      area,
      role,
      availability,
      experience,
      notes,
    };
    const adminMail = careersApplicationAdmin(application);
    await sendResendEmail({
      to: NOTIFY_EMAIL,
      subject: adminMail.subject,
      html: adminMail.html,
      reply_to: email,
      kind: "careers-admin",
      templateId: "careers-admin",
      relatedId: application.id,
    });
    const candidate = careersApplicationCandidate(application);
    await sendResendEmail({
      to: email,
      subject: candidate.subject,
      html: candidate.html,
      reply_to: NOTIFY_EMAIL,
      kind: "careers-confirmation",
      templateId: "careers-candidate",
      relatedId: application.id,
    });

    return { stored: true as const, id: appRow.id, destination: "applications" as const };
  }

  /* ---------------- Everything else -> campaign_leads ---------------- */
  const campaign = campaignFromFormName(opts.formName);
  const meta = campaignMeta(campaign);

  const service = pick(fields, "service", "which_service", "what_service_do_you_need?");
  const frequency = pick(fields, "how_often", "frequency", "how_often?");
  const bedrooms = pick(fields, "bedrooms", "how_many_bedrooms");
  const bathrooms = pick(fields, "bathrooms", "how_many_bathrooms");
  const homeSize =
    pick(fields, "home_size") ??
    (bedrooms || bathrooms
      ? `${bedrooms ?? "?"} bed · ${bathrooms ?? "?"} bath`
      : null);

  const extras = leftovers(fields, [
    "email",
    "work_email",
    "full_name",
    "first_name",
    "last_name",
    "phone_number",
    "phone",
    "service",
    "how_often",
    "bedrooms",
    "bathrooms",
    "home_size",
    "message",
    "what_can_we_help_with",
  ]);

  const message = [
    origin,
    service ? `Service: ${service}` : null,
    frequency ? `Frequency: ${frequency}` : null,
    homeSize ? `Home: ${homeSize}` : null,
    ...extras,
    pick(fields, "message", "what_can_we_help_with"),
  ]
    .filter(Boolean)
    .join(" · ");

  // Idempotency: the Graph lead id is embedded in the stored message.
  const { data: existing } = await supabaseAdmin
    .from("campaign_leads")
    .select("id")
    .eq("email", email)
    .like("message", `%lead ${lead.id}%`)
    .maybeSingle();
  if (existing) return { stored: false as const, reason: "duplicate", id: existing.id };

  const { data: row, error } = await supabaseAdmin
    .from("campaign_leads")
    .insert({
      campaign,
      name,
      email,
      phone,
      home_size: homeSize,
      preferred_date: null,
      referral_name: null,
      message,
      status: "new",
      source: "facebook",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const payload: CampaignLead = {
    id: row.id,
    campaign,
    campaignLabel: meta.label,
    offer: meta.offer,
    path: meta.path,
    name,
    email,
    phone,
    homeSize,
    preferredDate: null,
    referralName: null,
    message,
  };

  const admin = campaignLeadAdmin(payload);
  await sendResendEmail({ to: NOTIFY_EMAIL, subject: admin.subject, html: admin.html, reply_to: email, templateId: "campaign-lead-admin" });
  const customer = campaignLeadCustomer(payload);
  await sendResendEmail({ to: email, subject: customer.subject, html: customer.html, reply_to: NOTIFY_EMAIL, templateId: "campaign-lead-customer" });

  return { stored: true as const, id: row.id, campaign, destination: "leads" as const };
}