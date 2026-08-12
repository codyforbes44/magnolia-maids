import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Magnolia Maids Admin" },
      { name: "description", content: "Choose a new password for your Magnolia Maids admin account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/admin" }), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-bloom">
          <h1 className="font-display text-3xl font-semibold">Set a new password</h1>
          {done ? (
            <p className="mt-4 text-sm text-laurel">Password updated. Taking you to the admin dashboard…</p>
          ) : !ready ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Open this page from the reset link in your email. If you arrived here directly, request a new link from the{" "}
              <Link to="/auth" search={{ redirect: undefined }} className="underline">sign in page</Link>.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-password" className="text-sm font-semibold">New password</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="text-sm font-semibold">Confirm password</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-bold shadow-bloom hover:brightness-105 disabled:opacity-60"
              >
                {loading ? "Please wait…" : "Update password"}
              </button>
            </form>
          )}
          <Link to="/" className="mt-6 flex min-h-11 items-center justify-center text-center text-xs text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}