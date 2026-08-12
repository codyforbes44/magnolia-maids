import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Magnolia Maids" },
      { name: "description", content: "Sign in to your Magnolia Maids account to manage visits and home details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function goToDashboard() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin");
    navigate({ to: roles && roles.length > 0 ? "/admin" : "/account" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void goToDashboard();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice("If an account exists for that email, a password reset link is on its way.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/account` },
        });
        if (error) throw error;
        setNotice("Account created. Check your inbox to confirm, then sign in to see your visits.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await goToDashboard();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError(result.error.message ?? "Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      await goToDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-bloom">
          <h1 className="font-display text-3xl font-semibold">
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create your account" : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "See your visits, service history, and home details in one place."
              : mode === "signup"
                ? "Use the email you booked with and we'll link your past visits automatically."
                : "Enter your email and we'll send you a secure reset link."}
          </p>
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-5 py-3 text-sm font-bold hover:bg-secondary disabled:opacity-60"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
                  <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.3v3.1A12 12 0 0 0 12 24Z" />
                  <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
                  <path fill="#EA4335" d="M12 4.7c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.3 6.7l4 3.1C6.3 6.9 8.9 4.7 12 4.7Z" />
                </svg>
                {googleLoading ? "Connecting…" : mode === "signup" ? "Sign up with Google" : "Continue with Google"}
              </button>
              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or use email
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}
          <form onSubmit={handleSubmit} className={mode === "forgot" ? "mt-6 space-y-4" : "space-y-4"}>
            <div>
              <label htmlFor="auth-email" className="text-sm font-semibold">Email</label>
              <input
                id="auth-email"
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              />
            </div>
            {mode !== "forgot" && (
            <div>
              <label htmlFor="auth-password" className="text-sm font-semibold">Password</label>
              <input
                id="auth-password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              />
            </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {notice && <p className="text-sm text-laurel">{notice}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-bold shadow-bloom hover:brightness-105 disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>
          {mode === "signin" && (
            <button
              onClick={() => {
                setMode("forgot");
                setError(null);
                setNotice(null);
              }}
              className="mt-3 min-h-11 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Forgot your password?
            </button>
          )}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
            className="mt-4 min-h-11 w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Need an account? Sign up" : mode === "signup" ? "Have an account? Sign in" : "← Back to sign in"}
          </button>
          <Link to="/" className="mt-6 flex min-h-11 items-center justify-center text-center text-xs text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}