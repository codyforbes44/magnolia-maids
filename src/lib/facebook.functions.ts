import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  FACEBOOK_AD_ACCOUNT_ID,
  FACEBOOK_BUSINESS_ID,
  FACEBOOK_PAGE_ID,
  FEATURE_SCOPES,
} from "@/lib/facebook-config";

const GRAPH = "https://graph.facebook.com/v21.0";

/** Everything the admin dashboard actually calls. Keep in sync with REQUIRED_SCOPES. */
export const REQUIRED_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_read_user_content",
  "pages_manage_engagement",
  "pages_manage_metadata",
  "read_insights",
  "leads_retrieval",
  "ads_read",
] as const;

/** Requested at connect time: required set plus useful extras. */
const SCOPES = [...REQUIRED_SCOPES, "ads_management", "business_management"].join(",");

function signState(userId: string): string {
  const secret = process.env.FACEBOOK_APP_SECRET;
  if (!secret) throw new Error("FACEBOOK_APP_SECRET is not set");
  const ts = Date.now().toString();
  const payload = `${userId}.${ts}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyState(state: string): { userId: string } | null {
  try {
    const secret = process.env.FACEBOOK_APP_SECRET;
    if (!secret) return null;
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [userId, ts, sig] = parts;
    const expected = createHmac("sha256", secret).update(`${userId}.${ts}`).digest("hex");
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    if (Date.now() - parseInt(ts, 10) > 15 * 60 * 1000) return null;
    return { userId };
  } catch {
    return null;
  }
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

function getRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/facebook/callback`;
}

export const getFacebookAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { origin: string }) => z.object({ origin: z.string().url() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) throw new Error("FACEBOOK_APP_ID is not set");
    const state = signState(context.userId);
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: getRedirectUri(data.origin),
      state,
      scope: SCOPES,
      response_type: "code",
    });
    return {
      authUrl: `https://www.facebook.com/v21.0/dialog/oauth?${params}`,
      redirectUri: getRedirectUri(data.origin),
    };
  });

export const listConnectedPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("facebook_connections")
      .select("id, page_id, page_name, category, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

async function loadPageToken(pageId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("facebook_connections")
    .select("page_access_token")
    .eq("page_id", pageId)
    .maybeSingle();
  if (error || !data) throw new Error("Page not connected");
  return data.page_access_token;
}

async function graph(path: string, token: string, init?: RequestInit) {
  const url = new URL(`${GRAPH}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString(), init);
  const body = await res.text();
  if (!res.ok) throw new Error(`Facebook ${res.status}: ${body.slice(0, 400)}`);
  return body ? JSON.parse(body) : {};
}

export const listPagePosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string; limit?: number }) =>
    z.object({ pageId: z.string().min(1), limit: z.number().min(1).max(50).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = await loadPageToken(data.pageId);
    const fields = "id,message,created_time,permalink_url,full_picture,likes.summary(true),comments.summary(true),shares";
    return graph(
      `/${data.pageId}/posts?fields=${encodeURIComponent(fields)}&limit=${data.limit ?? 20}`,
      token,
    );
  });

export const publishPagePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string; message: string; link?: string }) =>
    z
      .object({
        pageId: z.string().min(1),
        message: z.string().trim().min(1).max(5000),
        link: z.string().url().optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = await loadPageToken(data.pageId);
    const body = new URLSearchParams({ message: data.message });
    if (data.link) body.set("link", data.link);
    return graph(`/${data.pageId}/feed`, token, { method: "POST", body });
  });

export const deletePagePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string; postId: string }) =>
    z.object({ pageId: z.string().min(1), postId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = await loadPageToken(data.pageId);
    return graph(`/${data.postId}`, token, { method: "DELETE" });
  });

export const listPostComments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string; postId: string }) =>
    z.object({ pageId: z.string().min(1), postId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = await loadPageToken(data.pageId);
    const fields = "id,from,message,created_time,like_count";
    return graph(`/${data.postId}/comments?fields=${encodeURIComponent(fields)}&limit=50`, token);
  });

export const replyToComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string; commentId: string; message: string }) =>
    z
      .object({
        pageId: z.string().min(1),
        commentId: z.string().min(1),
        message: z.string().trim().min(1).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = await loadPageToken(data.pageId);
    const body = new URLSearchParams({ message: data.message });
    return graph(`/${data.commentId}/comments`, token, { method: "POST", body });
  });

export const disconnectPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string }) => z.object({ pageId: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("facebook_connections").delete().eq("page_id", data.pageId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const importPagesFromToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const shortToken = process.env.FACEBOOK_USER_ACCESS_TOKEN;
    if (!appId || !appSecret) throw new Error("FACEBOOK_APP_ID / FACEBOOK_APP_SECRET are not set");
    if (!shortToken) throw new Error("FACEBOOK_USER_ACCESS_TOKEN is not set");

    // 1) Exchange short-lived user token for a long-lived one
    const exchangeUrl = new URL(`${GRAPH}/oauth/access_token`);
    exchangeUrl.searchParams.set("grant_type", "fb_exchange_token");
    exchangeUrl.searchParams.set("client_id", appId);
    exchangeUrl.searchParams.set("client_secret", appSecret);
    exchangeUrl.searchParams.set("fb_exchange_token", shortToken);
    const exRes = await fetch(exchangeUrl.toString());
    const exBody = await exRes.text();
    if (!exRes.ok) throw new Error(`Token exchange failed ${exRes.status}: ${exBody.slice(0, 400)}`);
    const exJson = JSON.parse(exBody) as { access_token: string };
    const longToken = exJson.access_token;

    // 2) Fetch pages the user manages, with per-page access tokens
    const pagesUrl = new URL(`${GRAPH}/me/accounts`);
    pagesUrl.searchParams.set("access_token", longToken);
    pagesUrl.searchParams.set("fields", "id,name,category,access_token");
    pagesUrl.searchParams.set("limit", "100");
    const pagesRes = await fetch(pagesUrl.toString());
    const pagesBody = await pagesRes.text();
    if (!pagesRes.ok) throw new Error(`/me/accounts failed ${pagesRes.status}: ${pagesBody.slice(0, 400)}`);
    const pagesJson = JSON.parse(pagesBody) as {
      data: Array<{ id: string; name: string; category?: string; access_token: string }>;
    };
    const pages = pagesJson.data ?? [];
    if (pages.length === 0) {
      return { ok: true as const, imported: 0, pages: [] as Array<{ id: string; name: string }> };
    }

    // 3) Upsert into facebook_connections
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = pages.map((p) => ({
      page_id: p.id,
      page_name: p.name,
      category: p.category ?? null,
      page_access_token: p.access_token,
      connected_by: context.userId,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabaseAdmin
      .from("facebook_connections")
      .upsert(rows, { onConflict: "page_id" });
    if (error) throw new Error(error.message);

    return {
      ok: true as const,
      imported: rows.length,
      pages: pages.map((p) => ({ id: p.id, name: p.name })),
    };
  });
/* ------------------------------------------------------------------ */
/* Connection health, insights, ads, lead ads                          */
/* ------------------------------------------------------------------ */

export const getConnectionHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { inspectToken, userToken } = await import("@/lib/facebook.server");
    const required = [...REQUIRED_SCOPES] as string[];
    const emptyCapabilities = Object.fromEntries(
      Object.keys(FEATURE_SCOPES).map((k) => [k, false]),
    ) as Record<keyof typeof FEATURE_SCOPES, boolean>;

    let token: string | null = null;
    try {
      token = userToken();
    } catch {
      token = null;
    }
    if (!token) {
      return {
        configured: false as const,
        missingScopes: required,
        valid: false,
        scopes: [] as string[],
        daysLeft: null as number | null,
        expiresAt: null as number | null,
        error: "FACEBOOK_USER_ACCESS_TOKEN is not set",
        pages: 0,
        capabilities: emptyCapabilities,
        page: null as null | { id: string; name: string; connected: boolean },
        adAccount: null as null | { id: string; name: string; currency: string; status: number },
        business: null as null | { id: string; name: string },
      };
    }

    const info = await inspectToken(token);
    const scopes = info.scopes ?? [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("facebook_connections")
      .select("id", { count: "exact", head: true });
    const { data: pageRow } = await supabaseAdmin
      .from("facebook_connections")
      .select("page_id, page_name")
      .eq("page_id", FACEBOOK_PAGE_ID)
      .maybeSingle();

    const capabilities = Object.fromEntries(
      Object.entries(FEATURE_SCOPES).map(([feature, needed]) => [
        feature,
        (needed as readonly string[]).every((s) => scopes.includes(s)),
      ]),
    ) as Record<keyof typeof FEATURE_SCOPES, boolean>;

    let adAccount: { id: string; name: string; currency: string; status: number } | null = null;
    let business: { id: string; name: string } | null = null;
    if (scopes.includes("ads_read")) {
      try {
        const { graphGet } = await import("@/lib/facebook.server");
        const acct = await graphGet(`/${FACEBOOK_AD_ACCOUNT_ID}`, token, {
          fields: "id,name,account_status,currency,business",
        });
        adAccount = {
          id: acct.id,
          name: acct.name,
          currency: acct.currency,
          status: Number(acct.account_status ?? 0),
        };
        business = acct.business
          ? { id: acct.business.id, name: acct.business.name }
          : { id: FACEBOOK_BUSINESS_ID, name: "Business Manager" };
      } catch {
        adAccount = null;
      }
    }

    return {
      configured: true as const,
      valid: info.valid,
      scopes,
      missingScopes: required.filter((s) => !scopes.includes(s)),
      expiresAt: info.expiresAt,
      daysLeft: info.daysLeft,
      error: info.error,
      pages: count ?? 0,
      capabilities,
      page: {
        id: FACEBOOK_PAGE_ID,
        name: pageRow?.page_name ?? "Magnolia Maids",
        connected: Boolean(pageRow),
      },
      adAccount,
      business,
    };
  });

/**
 * Connect the pinned Magnolia Maids Page straight from the stored user token —
 * no OAuth round trip, since the token already manages the Page — and subscribe
 * it to Lead Ads webhooks in the same step.
 */
export const connectMagnoliaPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { graphGet, userToken } = await import("@/lib/facebook.server");
    const token = userToken();

    const res = await graphGet("/me/accounts", token, {
      fields: "id,name,category,access_token",
      limit: "100",
    });
    const page = (res.data ?? []).find((p: any) => String(p.id) === FACEBOOK_PAGE_ID);
    if (!page) {
      throw new Error(
        "The Magnolia Maids Page is not available to this access token. Re-authorize with pages_show_list.",
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("facebook_connections").upsert(
      {
        page_id: page.id,
        page_name: page.name,
        category: page.category ?? null,
        page_access_token: page.access_token,
        connected_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page_id" },
    );
    if (error) throw new Error(error.message);

    let subscribed = false;
    let subscribeError: string | null = null;
    try {
      await graph(`/${page.id}/subscribed_apps`, page.access_token, {
        method: "POST",
        body: new URLSearchParams({ subscribed_fields: "leadgen,feed" }),
      });
      subscribed = true;
    } catch (e: any) {
      subscribeError = String(e.message ?? e);
    }

    return { ok: true as const, pageId: page.id, pageName: page.name, subscribed, subscribeError };
  });

/** Lead Ads wiring: webhook subscription state, forms on the Page, leads stored. */
export const getLeadAdsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("campaign_leads")
      .select("id", { count: "exact", head: true })
      .like("message", "%Facebook Lead Ads%");

    let subscribedFields: string[] = [];
    let forms: Array<{ id: string; name: string; status: string; leads: number }> = [];
    let error: string | null = null;
    try {
      const token = await loadPageToken(FACEBOOK_PAGE_ID);
      const subs = await graph(`/${FACEBOOK_PAGE_ID}/subscribed_apps`, token);
      subscribedFields = (subs.data ?? []).flatMap((a: any) => a.subscribed_fields ?? []);
      const res = await graph(
        `/${FACEBOOK_PAGE_ID}/leadgen_forms?fields=id,name,status,leads_count&limit=25`,
        token,
      );
      forms = (res.data ?? []).map((f: any) => ({
        id: f.id,
        name: f.name,
        status: f.status ?? "UNKNOWN",
        leads: Number(f.leads_count ?? 0),
      }));
    } catch (e: any) {
      error = String(e.message ?? e);
    }

    return {
      pageId: FACEBOOK_PAGE_ID,
      subscribedToLeadgen: subscribedFields.includes("leadgen"),
      subscribedFields,
      forms,
      storedLeads: count ?? 0,
      error,
    };
  });

export const schedulePagePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string; message: string; link?: string; publishAt: string }) =>
    z
      .object({
        pageId: z.string().min(1),
        message: z.string().trim().min(1).max(5000),
        link: z.string().url().optional().or(z.literal("")),
        publishAt: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const when = Math.floor(new Date(data.publishAt).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(when)) throw new Error("Invalid publish time");
    if (when < now + 600) throw new Error("Facebook requires scheduling at least 10 minutes out");
    if (when > now + 75 * 86400) throw new Error("Facebook allows scheduling up to 75 days out");

    const token = await loadPageToken(data.pageId);
    const body = new URLSearchParams({
      message: data.message,
      published: "false",
      scheduled_publish_time: String(when),
    });
    if (data.link) body.set("link", data.link);
    return graph(`/${data.pageId}/feed`, token, { method: "POST", body });
  });

export const listScheduledPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string }) => z.object({ pageId: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = await loadPageToken(data.pageId);
    const fields = "id,message,scheduled_publish_time,created_time";
    return graph(`/${data.pageId}/scheduled_posts?fields=${encodeURIComponent(fields)}&limit=25`, token);
  });

export const listPageInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string; days?: number }) =>
    z.object({ pageId: z.string().min(1), days: z.number().min(1).max(90).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = await loadPageToken(data.pageId);
    const metrics = [
      "page_impressions_unique",
      "page_post_engagements",
      "page_fans",
      "page_views_total",
    ].join(",");
    const since = Math.floor((Date.now() - (data.days ?? 28) * 86400000) / 1000);
    const until = Math.floor(Date.now() / 1000);
    const res = await graph(
      `/${data.pageId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}`,
      token,
    );
    const rows = (res.data ?? []).map((m: any) => ({
      name: m.name as string,
      title: (m.title as string) ?? m.name,
      total: (m.values ?? []).reduce(
        (sum: number, v: any) => sum + (typeof v.value === "number" ? v.value : 0),
        0,
      ),
      latest: (m.values ?? []).at(-1)?.value ?? 0,
    }));
    return { metrics: rows };
  });

export const listAdInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number }) => z.object({ days: z.number().min(1).max(90).optional() }).parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { graphGet, userToken } = await import("@/lib/facebook.server");
    const token = userToken();
    const preset = (data.days ?? 28) <= 7 ? "last_7d" : (data.days ?? 28) <= 30 ? "last_30d" : "last_90d";

    const leadsOf = (actions: any[]) =>
      Number(
        (actions ?? []).find(
          (a: any) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped",
        )?.value ?? 0,
      );

    const acct = await graphGet(`/${FACEBOOK_AD_ACCOUNT_ID}`, token, {
      fields: "id,name,account_status,currency,business",
    });

    const base = {
      accountId: acct.id as string,
      accountName: (acct.name as string) ?? "magnolia",
      currency: (acct.currency as string) ?? "USD",
      accountStatus: Number(acct.account_status ?? 0),
      businessName: acct.business?.name ?? null,
    };

    try {
      const [summaryRes, campaignRes] = await Promise.all([
        graphGet(`/${FACEBOOK_AD_ACCOUNT_ID}/insights`, token, {
          date_preset: preset,
          level: "account",
          fields: "spend,impressions,clicks,ctr,cpc,reach,actions",
        }),
        graphGet(`/${FACEBOOK_AD_ACCOUNT_ID}/insights`, token, {
          date_preset: preset,
          level: "campaign",
          fields: "campaign_name,spend,impressions,clicks,ctr,cpc,actions",
          limit: "50",
        }),
      ]);

      const s = (summaryRes.data ?? [])[0];
      const spend = Number(s?.spend ?? 0);
      const leads = leadsOf(s?.actions);
      const summary = s
        ? {
            spend,
            impressions: Number(s.impressions ?? 0),
            reach: Number(s.reach ?? 0),
            clicks: Number(s.clicks ?? 0),
            ctr: Number(s.ctr ?? 0),
            cpc: Number(s.cpc ?? 0),
            leads,
            costPerLead: leads > 0 ? spend / leads : null,
          }
        : null;

      const campaigns: Array<{
        name: string;
        spend: number;
        impressions: number;
        clicks: number;
        ctr: number;
        cpc: number;
        leads: number;
      }> = (campaignRes.data ?? []).map((r: any) => ({
        name: String(r.campaign_name ?? "Campaign"),
        spend: Number(r.spend ?? 0),
        impressions: Number(r.impressions ?? 0),
        clicks: Number(r.clicks ?? 0),
        ctr: Number(r.ctr ?? 0),
        cpc: Number(r.cpc ?? 0),
        leads: leadsOf(r.actions),
      }));

      return {
        account: {
          ...base,
          summary,
          campaigns,
          error: null as string | null,
        },
      };
    } catch (e: any) {
      return {
        account: {
          ...base,
          summary: null as null | {
            spend: number;
            impressions: number;
            reach: number;
            clicks: number;
            ctr: number;
            cpc: number;
            leads: number;
            costPerLead: number | null;
          },
          campaigns: [] as Array<{
            name: string;
            spend: number;
            impressions: number;
            clicks: number;
            ctr: number;
            cpc: number;
            leads: number;
          }>,
          error: String(e.message ?? e),
        },
      };
    }
  });

export const subscribePageToLeadgen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string }) => z.object({ pageId: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = await loadPageToken(data.pageId);
    const body = new URLSearchParams({ subscribed_fields: "leadgen,feed" });
    return graph(`/${data.pageId}/subscribed_apps`, token, { method: "POST", body });
  });

export const importRecentLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string }) => z.object({ pageId: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = await loadPageToken(data.pageId);
    const { ingestLeadgen } = await import("@/lib/facebook.server");
    const forms = await graph(`/${data.pageId}/leadgen_forms?fields=id,name,status&limit=25`, token);

    let imported = 0;
    let skipped = 0;
    for (const form of forms.data ?? []) {
      const leads = await graph(`/${form.id}/leads?fields=id&limit=50`, token);
      for (const lead of leads.data ?? []) {
        try {
          const res = await ingestLeadgen({
            leadgenId: String(lead.id),
            pageId: data.pageId,
            formName: form.name,
          });
          if (res.stored) imported += 1;
          else skipped += 1;
        } catch {
          skipped += 1;
        }
      }
    }
    return { imported, skipped, forms: (forms.data ?? []).length };
  });
