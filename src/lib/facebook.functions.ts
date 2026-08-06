import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const required = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "pages_read_user_content",
      "pages_manage_engagement",
      "read_insights",
      "leads_retrieval",
      "ads_read",
    ];

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
      };
    }

    const info = await inspectToken(token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("facebook_connections")
      .select("id", { count: "exact", head: true });

    return {
      configured: true as const,
      valid: info.valid,
      scopes: info.scopes,
      missingScopes: required.filter((s) => !info.scopes.includes(s)),
      expiresAt: info.expiresAt,
      daysLeft: info.daysLeft,
      error: info.error,
      pages: count ?? 0,
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

    const accounts = await graphGet("/me/adaccounts", token, {
      fields: "id,name,account_status,currency",
      limit: "10",
    });
    const list: any[] = accounts.data ?? [];
    const out = [];
    for (const acct of list) {
      try {
        const ins = await graphGet(`/${acct.id}/insights`, token, {
          date_preset: preset,
          level: "campaign",
          fields: "campaign_name,spend,impressions,clicks,ctr,cpc,actions",
          limit: "25",
        });
        out.push({
          accountId: acct.id,
          accountName: acct.name,
          currency: acct.currency,
          campaigns: (ins.data ?? []).map((r: any) => ({
            name: r.campaign_name,
            spend: Number(r.spend ?? 0),
            impressions: Number(r.impressions ?? 0),
            clicks: Number(r.clicks ?? 0),
            ctr: Number(r.ctr ?? 0),
            cpc: Number(r.cpc ?? 0),
            leads: Number(
              (r.actions ?? []).find((a: any) => a.action_type === "lead")?.value ?? 0,
            ),
          })),
        });
      } catch (e: any) {
        out.push({ accountId: acct.id, accountName: acct.name, currency: acct.currency, campaigns: [], error: String(e.message ?? e) });
      }
    }
    return { accounts: out };
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
