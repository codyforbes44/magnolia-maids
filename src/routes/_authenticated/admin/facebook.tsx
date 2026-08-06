import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  deletePagePost,
  disconnectPage,
  getFacebookAuthUrl,
  getConnectionHealth,
  getLeadAdsStatus,
  connectMagnoliaPage,
  importPagesFromToken,
  importRecentLeads,
  listAdInsights,
  listPageInsights,
  listScheduledPosts,
  listConnectedPages,
  listPagePosts,
  listPostComments,
  publishPagePost,
  replyToComment,
  schedulePagePost,
  subscribePageToLeadgen,
} from "@/lib/facebook.functions";
import {
  FACEBOOK_AD_ACCOUNT_ID,
  FACEBOOK_PAGE_HANDLE,
  FACEBOOK_PAGE_URL,
  FACEBOOK_WEBHOOK_HOST,
  FACEBOOK_WEBHOOK_URL,
  SCOPE_CAPABILITIES,
} from "@/lib/facebook-config";

export const Route = createFileRoute("/_authenticated/admin/facebook")({
  head: () => ({
    meta: [
      { title: "Admin — Facebook | Magnolia Maids" },
      { name: "description", content: "Manage Magnolia Maids Facebook Page posts and comments." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FacebookAdminPage,
});

type Page = { id: string; page_id: string; page_name: string; category: string | null; created_at: string };
type Post = {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  likes?: { summary?: { total_count: number } };
  comments?: { summary?: { total_count: number } };
  shares?: { count: number };
};
type Comment = { id: string; from?: { name: string }; message: string; created_time: string; like_count?: number };
type Health = Awaited<ReturnType<typeof getConnectionHealth>>;
type LeadStatus = Awaited<ReturnType<typeof getLeadAdsStatus>>;
type AdsData = Awaited<ReturnType<typeof listAdInsights>>["account"];
type Tab = "posts" | "insights" | "ads" | "leads";

function FacebookAdminPage() {
  const getAuthUrl = useServerFn(getFacebookAuthUrl);
  const loadPages = useServerFn(listConnectedPages);
  const importFromToken = useServerFn(importPagesFromToken);
  const loadPosts = useServerFn(listPagePosts);
  const publish = useServerFn(publishPagePost);
  const remove = useServerFn(deletePagePost);
  const loadComments = useServerFn(listPostComments);
  const reply = useServerFn(replyToComment);
  const unlink = useServerFn(disconnectPage);
  const loadHealth = useServerFn(getConnectionHealth);
  const schedule = useServerFn(schedulePagePost);
  const loadScheduled = useServerFn(listScheduledPosts);
  const loadInsights = useServerFn(listPageInsights);
  const loadAds = useServerFn(listAdInsights);
  const subscribeLeadgen = useServerFn(subscribePageToLeadgen);
  const pullLeads = useServerFn(importRecentLeads);
  const connectPinnedPage = useServerFn(connectMagnoliaPage);
  const loadLeadStatus = useServerFn(getLeadAdsStatus);

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [newLink, setNewLink] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importAllPages, setImportAllPages] = useState(false);
  const [copied, setCopied] = useState(false);

  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const [tab, setTab] = useState<Tab>("posts");
  const [health, setHealth] = useState<Health | null>(null);
  const [publishAt, setPublishAt] = useState("");
  const [scheduled, setScheduled] = useState<Array<{ id: string; message?: string; scheduled_publish_time?: number }>>([]);
  const [insights, setInsights] = useState<Array<{ name: string; title: string; total: number; latest: number }> | null>(null);
  const [ads, setAds] = useState<AdsData | null>(null);
  const [leadStatus, setLeadStatus] = useState<LeadStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const can = (feature: "publish" | "comments" | "pageInsights" | "ads" | "leads") =>
    health?.capabilities?.[feature] ?? true;
  const blockedBy = (feature: "publish" | "comments" | "pageInsights" | "ads" | "leads") =>
    can(feature) ? undefined : `Needs Facebook permission: ${(health?.missingScopes ?? []).join(", ")}`;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadPages().then((rows) => {
      setPages(rows as Page[]);
      if (rows.length && !activePageId) setActivePageId((rows[0] as Page).page_id);
    }).catch((e) => setError(String(e.message ?? e)));
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    loadHealth()
      .then((h) => setHealth(h as Health))
      .catch((e) => setError(String(e.message ?? e)));
  }, [authed]);

  useEffect(() => {
    if (!activePageId) return;
    setLoadingPosts(true);
    setError(null);
    loadPosts({ data: { pageId: activePageId } })
      .then((res: any) => setPosts(res.data ?? []))
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoadingPosts(false));
  }, [activePageId]);

  useEffect(() => {
    if (!activePageId) return;
    setInsights(null);
    setScheduled([]);
    if (tab === "insights") {
      loadInsights({ data: { pageId: activePageId, days: 28 } })
        .then((r: any) => setInsights(r.metrics ?? []))
        .catch((e) => setError(String(e.message ?? e)));
    }
    if (tab === "posts") {
      loadScheduled({ data: { pageId: activePageId } })
        .then((r: any) => setScheduled(r.data ?? []))
        .catch(() => setScheduled([]));
    }
    if (tab === "ads" && ads === null) {
      loadAds({ data: { days: 28 } })
        .then((r) => setAds(r.account))
        .catch((e) => setError(String(e.message ?? e)));
    }
    if (tab === "leads" && leadStatus === null) {
      loadLeadStatus()
        .then((r) => setLeadStatus(r as LeadStatus))
        .catch((e) => setError(String(e.message ?? e)));
    }
  }, [tab, activePageId]);

  async function run(key: string, fn: () => Promise<string>) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      setNotice(await fn());
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  async function handleSchedule() {
    if (!activePageId || !newMessage.trim() || !publishAt) return;
    await run("schedule", async () => {
      await schedule({
        data: {
          pageId: activePageId,
          message: newMessage.trim(),
          link: newLink.trim() || undefined,
          publishAt: new Date(publishAt).toISOString(),
        },
      });
      setNewMessage("");
      setNewLink("");
      setPublishAt("");
      const r: any = await loadScheduled({ data: { pageId: activePageId } });
      setScheduled(r.data ?? []);
      return "Post scheduled on Facebook.";
    });
  }

  async function connectFacebook() {
    try {
      setError(null);
      const { authUrl } = await getAuthUrl({ data: { origin: window.location.origin } });
      window.location.href = authUrl;
    } catch (e: any) {
      setError(String(e.message ?? e));
    }
  }

  async function handleImportFromToken() {
    setImporting(true);
    setError(null);
    setImportNotice(null);
    try {
      const res = await importFromToken({ data: { allPages: importAllPages } });
      setImportNotice(
        res.imported === 0
          ? importAllPages
            ? "No Pages found for that token. Make sure the token has pages_show_list."
            : "The Magnolia Maids Page is not available to this token. Re-authorize with pages_show_list, or enable “include all Pages”."
          : `Imported ${res.imported} Page${res.imported === 1 ? "" : "s"}: ${res.pages.map((p) => p.name).join(", ")}`,
      );
      const rows = (await loadPages()) as Page[];
      setPages(rows);
      if (rows.length && !activePageId) setActivePageId(rows[0].page_id);
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setImporting(false);
    }
  }

  async function handlePublish() {
    if (!activePageId || !newMessage.trim()) return;
    setPublishing(true);
    setError(null);
    try {
      await publish({ data: { pageId: activePageId, message: newMessage.trim(), link: newLink.trim() || undefined } });
      setNewMessage("");
      setNewLink("");
      const res: any = await loadPosts({ data: { pageId: activePageId } });
      setPosts(res.data ?? []);
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm("Delete this post from Facebook?")) return;
    try {
      await remove({ data: { pageId: activePageId, postId } });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e: any) {
      setError(String(e.message ?? e));
    }
  }

  async function openComments(postId: string) {
    setOpenPostId(postId);
    setComments([]);
    try {
      const res: any = await loadComments({ data: { pageId: activePageId, postId } });
      setComments(res.data ?? []);
    } catch (e: any) {
      setError(String(e.message ?? e));
    }
  }

  async function sendReply(commentId: string) {
    const message = replyDraft[commentId]?.trim();
    if (!message) return;
    try {
      await reply({ data: { pageId: activePageId, commentId, message } });
      setReplyDraft((d) => ({ ...d, [commentId]: "" }));
      if (openPostId) await openComments(openPostId);
    } catch (e: any) {
      setError(String(e.message ?? e));
    }
  }

  async function handleDisconnect(pageId: string) {
    if (!confirm("Disconnect this Page? You'll need to reconnect to manage it again.")) return;
    try {
      await unlink({ data: { pageId } });
      const rows = (await loadPages()) as Page[];
      setPages(rows);
      setActivePageId(rows[0]?.page_id ?? "");
      setPosts([]);
    } catch (e: any) {
      setError(String(e.message ?? e));
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Facebook manager"
        description="Publish posts, reply to comments, and review Page insights, ads, and Lead Ads."
        actions={
          <>
            <a
              href="https://business.facebook.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1465d0]"
            >
              Full administrative access
            </a>
            <button
              onClick={() =>
                run("connect-pinned", async () => {
                  const r = await connectPinnedPage();
                  const rows = (await loadPages()) as Page[];
                  setPages(rows);
                  setActivePageId(r.pageId);
                  setHealth((await loadHealth()) as Health);
                  setLeadStatus(null);
                  return r.subscribed
                    ? `${r.pageName} connected and subscribed to Lead Ads.`
                    : `${r.pageName} connected. Lead Ads subscription failed: ${r.subscribeError}`;
                })
              }
              disabled={busy === "connect-pinned"}
              className="rounded-md bg-laurel px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy === "connect-pinned" ? "Connecting…" : "Connect Magnolia Maids Page"}
            </button>
            <button
              onClick={connectFacebook}
              className="rounded-md border border-[#1877F2] bg-white px-4 py-2 text-sm font-semibold text-[#1877F2] hover:bg-[#1877F2]/5"
            >
              Re-authorize permissions
            </button>
            <button
              onClick={handleImportFromToken}
              disabled={importing}
              title="Uses the FACEBOOK_USER_ACCESS_TOKEN secret to fetch and save your Pages"
              className="rounded-md border border-primary bg-white px-4 py-2 text-sm font-semibold text-laurel hover:bg-laurel/5 disabled:opacity-60"
            >
              {importing ? "Importing…" : importAllPages ? "Import all Pages" : "Import Page from token"}
            </button>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={importAllPages}
                onChange={(e) => setImportAllPages(e.target.checked)}
              />
              Advanced: include all Pages on the token
            </label>
          </>
        }
      />

        {importNotice && (
          <div className="mb-4 rounded-md border border-primary/40 bg-laurel/5 p-3 text-sm text-laurel">
            {importNotice}
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-md border border-primary/40 bg-laurel/5 p-3 text-sm text-laurel">{notice}</div>
        )}

        {health && (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Page</p>
              <p className="font-semibold">{health.page?.name ?? "Magnolia Maids"}</p>
              <a href={FACEBOOK_PAGE_URL} target="_blank" rel="noreferrer" className="text-xs text-laurel hover:underline">
                facebook.com/{FACEBOOK_PAGE_HANDLE} ↗
              </a>
              <p className={`mt-1 text-xs ${health.page?.connected ? "text-muted-foreground" : "text-destructive"}`}>
                {health.page?.connected ? "Connected" : "Not connected yet"}
              </p>
            </div>
            <div className="rounded-xl border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ad account</p>
              <p className="font-semibold">{health.adAccount?.name ?? "magnolia"}</p>
              <p className="text-xs text-muted-foreground">{FACEBOOK_AD_ACCOUNT_ID}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {health.adAccount
                  ? `${health.adAccount.currency} · ${health.adAccount.status === 1 ? "Active" : `Status ${health.adAccount.status}`}`
                  : "Awaiting ads_read permission"}
              </p>
            </div>
            <div className="rounded-xl border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Business</p>
              <p className="font-semibold">{health.business?.name ?? "Business Manager"}</p>
              <p className="text-xs text-muted-foreground">{health.business?.id ?? "—"}</p>
            </div>
          </div>
        )}

        {health && (
          <div
            className={`mb-4 rounded-xl border p-4 text-sm ${
              health.valid && health.missingScopes.length === 0
                ? "border-primary/40 bg-laurel/5"
                : "border-amber-500/50 bg-amber-50"
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold">
                {health.valid ? "Connection healthy" : "Connection needs attention"}
              </span>
              <span className="text-muted-foreground">Pages connected: {health.pages}</span>
              {health.daysLeft != null && (
                <span className={health.expiringSoon ? "font-semibold text-destructive" : "text-muted-foreground"}>
                  Token expires in {health.daysLeft} day{health.daysLeft === 1 ? "" : "s"}
                  {health.expiringSoon ? " — re-authorize soon to avoid an outage" : ""}
                </span>
              )}
              {health.error && <span className="text-destructive">{health.error}</span>}
            </div>
            {health.missingScopes.length > 0 && (
              <div className="mt-2 text-muted-foreground">
                <p>
                  These permissions are missing — press <em>Re-authorize permissions</em> and approve every box on the
                  Facebook consent screen:
                </p>
                <ul className="mt-2 space-y-1">
                  {health.missingScopes.map((s) => (
                    <li key={s} className="text-xs">
                      <code className="font-semibold">{s}</code> — blocks: {SCOPE_CAPABILITIES[s] ?? "extra features"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mb-4 rounded-xl border p-4 text-sm">
          <p className="font-semibold">Lead Ads webhook</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste this exact URL into the Meta app webhook settings and subscribe the <code>leadgen</code> field. Meta
            does not follow redirects, so it must be the apex host <code>{FACEBOOK_WEBHOOK_HOST}</code>.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="break-all rounded-md bg-muted px-2 py-1 text-xs">{FACEBOOK_WEBHOOK_URL}</code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(FACEBOOK_WEBHOOK_URL);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="rounded-md border border-primary px-3 py-1 text-xs font-semibold text-laurel"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            {leadStatus && !leadStatus.notConnected && (
              <span className={leadStatus.subscribedToLeadgen ? "text-xs text-muted-foreground" : "text-xs text-amber-700"}>
                {leadStatus.subscribedToLeadgen ? "Page subscribed to leadgen" : "Page not subscribed to leadgen yet"}
              </span>
            )}
          </div>
        </div>

        {pages.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <h2 className="font-heading text-xl">No Pages connected yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Click <strong>Connect Magnolia Maids Page</strong> to link facebook.com/{FACEBOOK_PAGE_HANDLE} using the
              stored business token — no Facebook redirect needed. If that fails, use{" "}
              <strong>Re-authorize permissions</strong> to approve access again.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Pages</p>
              {pages.map((p) => (
                <div
                  key={p.page_id}
                  className={`rounded-lg border p-3 text-sm ${
                    activePageId === p.page_id ? "border-primary bg-laurel/5" : "hover:bg-accent"
                  }`}
                >
                  <button
                    onClick={() => setActivePageId(p.page_id)}
                    className="block w-full text-left"
                  >
                    <div className="font-semibold">{p.page_name}</div>
                    <div className="text-xs text-muted-foreground">{p.category ?? "Page"}</div>
                  </button>
                  <button
                    onClick={() => handleDisconnect(p.page_id)}
                    className="mt-2 text-xs text-destructive hover:underline"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </aside>

            <section className="space-y-6">
              <div className="flex flex-wrap gap-2 border-b pb-2">
                {([
                  ["posts", "Posts"],
                  ["insights", "Page insights"],
                  ["ads", "Ads performance"],
                  ["leads", "Lead Ads"],
                ] as [Tab, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold ${
                      tab === key ? "bg-laurel text-white" : "hover:bg-accent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "insights" && (
                <div className="rounded-xl border p-4">
                  <h2 className="font-heading text-lg">Last 28 days</h2>
                  {!can("pageInsights") ? (
                    <p className="mt-2 text-sm text-amber-700">
                      Page insights need <code>read_insights</code>. Re-authorize permissions above.
                    </p>
                  ) : insights === null ? (
                    <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
                  ) : insights.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No insight data yet.</p>
                  ) : (
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      {insights.map((m) => (
                        <div key={m.name} className="rounded-lg border p-3">
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{m.title}</dt>
                          <dd className="font-heading text-2xl">{m.total.toLocaleString()}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              )}

              {tab === "ads" && (
                <div className="space-y-4">
                  {ads === null ? (
                    <p className="text-sm text-muted-foreground">Loading ad account…</p>
                  ) : (
                    <div className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <h3 className="font-heading text-lg">{ads.accountName}</h3>
                        <span className="text-xs text-muted-foreground">
                          {FACEBOOK_AD_ACCOUNT_ID}
                          {ads.businessName ? ` · ${ads.businessName}` : ""} ·{" "}
                          {ads.accountStatus === 1 ? "Active" : `Status ${ads.accountStatus}`}
                        </span>
                      </div>

                      {ads.error ? (
                        <p className="mt-2 text-sm text-destructive">{ads.error}</p>
                      ) : (
                        <>
                          {ads.summary && (
                            <dl className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                              {[
                                ["Spend", `${ads.currency} ${ads.summary.spend.toFixed(2)}`],
                                ["Reach", ads.summary.reach.toLocaleString()],
                                ["Clicks", ads.summary.clicks.toLocaleString()],
                                ["Leads", ads.summary.leads.toLocaleString()],
                                [
                                  "Cost / lead",
                                  ads.summary.costPerLead == null
                                    ? "—"
                                    : `${ads.currency} ${ads.summary.costPerLead.toFixed(2)}`,
                                ],
                              ].map(([label, value]) => (
                                <div key={label} className="rounded-lg border p-3">
                                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                                  <dd className="font-heading text-xl">{value}</dd>
                                </div>
                              ))}
                            </dl>
                          )}

                          {ads.campaigns.length === 0 ? (
                            <p className="mt-3 text-sm text-muted-foreground">No spend in the last 28 days.</p>
                          ) : (
                            <ul className="mt-3 space-y-2">
                              {ads.campaigns.map((c) => (
                                <li key={c.name} className="rounded-lg border p-3 text-sm">
                                  <div className="font-semibold">{c.name}</div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {ads.currency} {c.spend.toFixed(2)} spend · {c.impressions.toLocaleString()} impressions ·{" "}
                                    {c.clicks.toLocaleString()} clicks · {Number(c.ctr).toFixed(2)}% CTR · {c.leads} leads
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === "leads" && (
                <div className="rounded-xl border p-4 text-sm">
                  <h2 className="font-heading text-lg">Meta Lead Ads → Magnolia leads</h2>
                  <p className="mt-2 text-muted-foreground">
                    New Lead Ads submissions land in <Link to="/admin/leads" className="text-laurel underline">Campaign leads</Link>{" "}
                    and trigger the same thank-you and admin emails as the landing pages.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Webhook URL: <code>https://magnoliamaids.pro/api/public/hooks/facebook-leadgen</code> (field:{" "}
                    <code>leadgen</code>)
                  </p>

                  {leadStatus === null ? (
                    <p className="mt-3 text-xs text-muted-foreground">Checking Lead Ads wiring…</p>
                  ) : (
                    <div className="mt-3 rounded-lg border p-3">
                      <p>
                        <strong>{leadStatus.subscribedToLeadgen ? "Subscribed" : "Not subscribed"}</strong> to{" "}
                        <code>leadgen</code>
                        {leadStatus.subscribedFields.length > 0 && (
                          <span className="text-muted-foreground"> · fields: {leadStatus.subscribedFields.join(", ")}</span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {leadStatus.storedLeads} Lead Ads submission{leadStatus.storedLeads === 1 ? "" : "s"} imported
                        into the leads dashboard.
                      </p>
                      {leadStatus.error && <p className="mt-1 text-xs text-destructive">{leadStatus.error}</p>}
                      {leadStatus.forms.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs">
                          {leadStatus.forms.map((f) => (
                            <li key={f.id}>
                              <span className="font-semibold">{f.name}</span> — {f.status.toLowerCase()} · {f.leads}{" "}
                              lead{f.leads === 1 ? "" : "s"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      disabled={busy === "subscribe" || !can("leads")}
                      title={blockedBy("leads")}
                      onClick={() =>
                        run("subscribe", async () => {
                          await subscribeLeadgen({ data: { pageId: activePageId } });
                          setLeadStatus((await loadLeadStatus()) as LeadStatus);
                          return "Page subscribed to leadgen + feed updates.";
                        })
                      }
                      className="rounded-md bg-laurel px-4 py-2 font-semibold text-white disabled:opacity-60"
                    >
                      {busy === "subscribe" ? "Subscribing…" : "Subscribe this Page"}
                    </button>
                    <button
                      disabled={busy === "pull" || !can("leads")}
                      title={blockedBy("leads")}
                      onClick={() =>
                        run("pull", async () => {
                          const r = await pullLeads({ data: { pageId: activePageId } });
                          setLeadStatus((await loadLeadStatus()) as LeadStatus);
                          return `Imported ${r.imported} new lead${r.imported === 1 ? "" : "s"} (${r.skipped} already on file) across ${r.forms} form(s).`;
                        })
                      }
                      className="rounded-md border border-primary px-4 py-2 font-semibold text-laurel disabled:opacity-60"
                    >
                      {busy === "pull" ? "Importing…" : "Import existing leads"}
                    </button>
                  </div>
                </div>
              )}

              {tab === "posts" && (
              <>
              <div className="rounded-xl border p-4">
                <h2 className="font-heading text-lg">New post</h2>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  placeholder="What's happening at Magnolia Maids today?"
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Optional link (https://…)"
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                <div className="mt-3 flex justify-end">
                  <input
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                    className="mr-auto rounded-md border bg-background px-3 py-2 text-sm"
                    aria-label="Schedule publish time"
                  />
                  <button
                    onClick={handleSchedule}
                    disabled={busy === "schedule" || !newMessage.trim() || !publishAt || !can("publish")}
                    title={blockedBy("publish")}
                    className="mr-2 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-laurel disabled:opacity-50"
                  >
                    {busy === "schedule" ? "Scheduling…" : "Schedule"}
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishing || !newMessage.trim() || !can("publish")}
                    title={blockedBy("publish")}
                    className="rounded-md bg-laurel px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {publishing ? "Publishing…" : "Publish"}
                  </button>
                </div>
                {!can("publish") && (
                  <p className="mt-2 text-xs text-amber-700">
                    Publishing and scheduling need <code>pages_manage_posts</code>. Re-authorize permissions above.
                  </p>
                )}
              </div>

              {scheduled.length > 0 && (
                <div className="rounded-xl border p-4">
                  <h2 className="font-heading text-lg">Scheduled</h2>
                  <ul className="mt-2 space-y-2 text-sm">
                    {scheduled.map((s) => (
                      <li key={s.id} className="rounded-lg border p-3">
                        <p className="whitespace-pre-wrap">{s.message || <em>(no text)</em>}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Publishes{" "}
                          {s.scheduled_publish_time
                            ? new Date(s.scheduled_publish_time * 1000).toLocaleString()
                            : "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h2 className="mb-3 font-heading text-lg">Recent posts</h2>
                {loadingPosts ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No posts yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {posts.map((post) => (
                      <li key={post.id} className="rounded-xl border p-4">
                        <div className="flex items-start gap-4">
                          {post.full_picture && (
                            <img loading="lazy" decoding="async"
                              src={post.full_picture}
                              alt=""
                              className="h-20 w-20 flex-none rounded-md object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="whitespace-pre-wrap text-sm">{post.message || <em>(no text)</em>}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(post.created_time).toLocaleString()} · 👍{" "}
                              {post.likes?.summary?.total_count ?? 0} · 💬{" "}
                              {post.comments?.summary?.total_count ?? 0} · 🔁 {post.shares?.count ?? 0}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs">
                              <button onClick={() => openComments(post.id)} className="text-laurel hover:underline">
                                View comments
                              </button>
                              {post.permalink_url && (
                                <a
                                  href={post.permalink_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-laurel hover:underline"
                                >
                                  Open on Facebook ↗
                                </a>
                              )}
                              <button onClick={() => handleDelete(post.id)} className="text-destructive hover:underline">
                                Delete
                              </button>
                            </div>

                            {openPostId === post.id && (
                              <div className="mt-4 space-y-3 rounded-md border bg-muted/30 p-3">
                                {comments.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">No comments.</p>
                                ) : (
                                  comments.map((c) => (
                                    <div key={c.id} className="rounded bg-background p-2 text-sm">
                                      <div className="text-xs text-muted-foreground">
                                        <strong>{c.from?.name ?? "User"}</strong> ·{" "}
                                        {new Date(c.created_time).toLocaleString()} · 👍 {c.like_count ?? 0}
                                      </div>
                                      <p className="mt-1 whitespace-pre-wrap">{c.message}</p>
                                      <div className="mt-2 flex gap-2">
                                        <input
                                          value={replyDraft[c.id] ?? ""}
                                          onChange={(e) =>
                                            setReplyDraft((d) => ({ ...d, [c.id]: e.target.value }))
                                          }
                                          placeholder="Reply…"
                                          className="flex-1 rounded border bg-background px-2 py-1 text-xs"
                                        />
                                        <button
                                          onClick={() => sendReply(c.id)}
                                          className="rounded bg-laurel px-3 py-1 text-xs font-semibold text-white"
                                        >
                                          Send
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              </>
              )}
            </section>
          </div>
        )}
    </>
  );
}