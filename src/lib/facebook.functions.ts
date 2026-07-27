import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GRAPH = "https://graph.facebook.com/v21.0";
const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_read_user_content",
  "pages_manage_engagement",
  "pages_manage_metadata",
].join(",");

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