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

function pick(fields: FieldData[], ...names: string[]) {
  for (const n of names) {
    const f = fields.find((x) => x.name === n || x.name.replace(/_/g, "") === n.replace(/_/g, ""));
    const v = f?.values?.[0]?.trim();
    if (v) return v;
  }
  return undefined;
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
 * Fetch a single leadgen record from Graph, store it in campaign_leads
 * (idempotent on the Facebook lead id) and fire the usual emails.
 */
export async function ingestLeadgen(opts: { leadgenId: string; pageId?: string; formName?: string | null }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");

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

  const campaign = campaignFromFormName(opts.formName);
  const meta = campaignMeta(campaign);
  const message = [
    `Facebook Lead Ads (lead ${lead.id}${lead.form_id ? `, form ${lead.form_id}` : ""}).`,
    pick(fields, "message", "what_can_we_help_with"),
  ]
    .filter(Boolean)
    .join(" ");

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
      phone: pick(fields, "phone_number", "phone") ?? null,
      home_size: pick(fields, "home_size", "how_many_bedrooms") ?? null,
      preferred_date: null,
      referral_name: null,
      message,
      status: "new",
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
    phone: pick(fields, "phone_number", "phone") ?? null,
    homeSize: pick(fields, "home_size") ?? null,
    preferredDate: null,
    referralName: null,
    message,
  };

  const admin = campaignLeadAdmin(payload);
  await sendResendEmail({ to: NOTIFY_EMAIL, subject: admin.subject, html: admin.html, reply_to: email });
  const customer = campaignLeadCustomer(payload);
  await sendResendEmail({ to: email, subject: customer.subject, html: customer.html, reply_to: NOTIFY_EMAIL });

  return { stored: true as const, id: row.id, campaign };
}