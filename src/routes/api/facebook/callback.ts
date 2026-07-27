import { createFileRoute } from "@tanstack/react-router";
import { verifyState } from "@/lib/facebook.functions";

const GRAPH = "https://graph.facebook.com/v21.0";

function html(status: number, title: string, message: string) {
  return new Response(
    `<!doctype html><html><head><title>${title}</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:system-ui;max-width:520px;margin:80px auto;padding:24px;text-align:center;background:#f6fbff;color:#0b3b5c">
<h1 style="color:#0891b2">${title}</h1>
<p>${message}</p>
<p><a href="/admin/facebook" style="color:#0891b2">Return to Admin</a></p>
</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export const Route = createFileRoute("/api/facebook/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error_description") || url.searchParams.get("error");
        if (err) return html(400, "Connection cancelled", err);
        if (!code || !state) return html(400, "Missing parameters", "Missing code or state.");

        const verified = verifyState(state);
        if (!verified) return html(400, "Invalid state", "State could not be verified. Try again.");

        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;
        if (!appId || !appSecret) return html(500, "Missing config", "FACEBOOK_APP_ID / FACEBOOK_APP_SECRET not set.");

        const redirectUri = `${url.origin}/api/facebook/callback`;

        // 1. Exchange code -> short-lived user token
        const tokenRes = await fetch(
          `${GRAPH}/oauth/access_token?${new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            redirect_uri: redirectUri,
            code,
          })}`,
        );
        const tokenBody = await tokenRes.json();
        if (!tokenRes.ok) return html(400, "Token exchange failed", JSON.stringify(tokenBody).slice(0, 300));

        // 2. Long-lived user token
        const llRes = await fetch(
          `${GRAPH}/oauth/access_token?${new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: appId,
            client_secret: appSecret,
            fb_exchange_token: tokenBody.access_token,
          })}`,
        );
        const llBody = await llRes.json();
        const userToken = llBody.access_token || tokenBody.access_token;

        // 3. Fetch Pages (each page includes a page access token that's effectively long-lived for admins)
        const pagesRes = await fetch(
          `${GRAPH}/me/accounts?fields=id,name,category,access_token&access_token=${encodeURIComponent(userToken)}`,
        );
        const pagesBody = await pagesRes.json();
        if (!pagesRes.ok) return html(400, "Failed to list pages", JSON.stringify(pagesBody).slice(0, 300));

        const pages: Array<{ id: string; name: string; category?: string; access_token: string }> =
          pagesBody.data ?? [];
        if (pages.length === 0) {
          return html(
            400,
            "No Pages found",
            "This Facebook account has no Pages you can manage, or you didn't grant page permissions.",
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const rows = pages.map((p) => ({
          page_id: p.id,
          page_name: p.name,
          category: p.category ?? null,
          page_access_token: p.access_token,
          connected_by: verified.userId,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await supabaseAdmin
          .from("facebook_connections")
          .upsert(rows, { onConflict: "page_id" });
        if (error) return html(500, "Save failed", error.message);

        return html(
          200,
          "Connected!",
          `Linked ${pages.length} Page${pages.length === 1 ? "" : "s"}: ${pages.map((p) => p.name).join(", ")}.`,
        );
      },
    },
  },
});