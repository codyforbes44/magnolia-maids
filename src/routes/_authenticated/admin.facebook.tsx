import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import {
  deletePagePost,
  disconnectPage,
  getFacebookAuthUrl,
  listConnectedPages,
  listPagePosts,
  listPostComments,
  publishPagePost,
  replyToComment,
} from "@/lib/facebook.functions";

export const Route = createFileRoute("/_authenticated/admin/facebook")({
  head: () => ({
    meta: [
      { title: "Admin — Facebook | Splash" },
      { name: "description", content: "Manage Splash Facebook Page posts and comments." },
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

function FacebookAdminPage() {
  const getAuthUrl = useServerFn(getFacebookAuthUrl);
  const loadPages = useServerFn(listConnectedPages);
  const loadPosts = useServerFn(listPagePosts);
  const publish = useServerFn(publishPagePost);
  const remove = useServerFn(deletePagePost);
  const loadComments = useServerFn(listPostComments);
  const reply = useServerFn(replyToComment);
  const unlink = useServerFn(disconnectPage);

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [newLink, setNewLink] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

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
    if (!activePageId) return;
    setLoadingPosts(true);
    setError(null);
    loadPosts({ data: { pageId: activePageId } })
      .then((res: any) => setPosts(res.data ?? []))
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoadingPosts(false));
  }, [activePageId]);

  async function connectFacebook() {
    try {
      setError(null);
      const { authUrl } = await getAuthUrl({ data: { origin: window.location.origin } });
      window.location.href = authUrl;
    } catch (e: any) {
      setError(String(e.message ?? e));
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
    <div className="min-h-screen bg-background flex flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-ocean">Admin</p>
            <h1 className="font-heading text-3xl">Facebook Manager</h1>
            <p className="text-sm text-muted-foreground">Publish posts and reply to comments on connected Pages.</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
            >
              ← Bookings
            </Link>
            <button
              onClick={connectFacebook}
              className="rounded-md bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1465d0]"
            >
              {pages.length ? "Reconnect / add Page" : "Connect Facebook Page"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {pages.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <h2 className="font-heading text-xl">No Pages connected yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Click <strong>Connect Facebook Page</strong> to authorize Splash to read and post on your Page. You'll be
              sent to Facebook to approve permissions.
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
                    activePageId === p.page_id ? "border-ocean bg-ocean/5" : "hover:bg-accent"
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
              <div className="rounded-xl border p-4">
                <h2 className="font-heading text-lg">New post</h2>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  placeholder="What's happening at Splash today?"
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Optional link (https://…)"
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handlePublish}
                    disabled={publishing || !newMessage.trim()}
                    className="rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {publishing ? "Publishing…" : "Publish"}
                  </button>
                </div>
              </div>

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
                            <img
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
                              <button onClick={() => openComments(post.id)} className="text-ocean hover:underline">
                                View comments
                              </button>
                              {post.permalink_url && (
                                <a
                                  href={post.permalink_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-ocean hover:underline"
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
                                          className="rounded bg-ocean px-3 py-1 text-xs font-semibold text-white"
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
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}