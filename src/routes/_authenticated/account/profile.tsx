import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getAccountProfile, saveAccountProfile } from "@/lib/account.functions";
import { Card } from "@/components/account/AccountShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Magnolia Maids" },
      { name: "description", content: "Update your contact details, address, and communication preferences for your Magnolia Maids account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Profile,
});

const inputCls = "mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm";

function Profile() {
  const profileFn = useServerFn(getAccountProfile);
  const saveFn = useServerFn(saveAccountProfile);
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["account", "profile"], queryFn: () => profileFn({}) });

  const [form, setForm] = useState({ fullName: "", phone: "", contactPref: "email", marketingOptIn: false });
  const [identity, setIdentity] = useState<{ name: string; avatar: string | null; email: string; google: boolean }>({
    name: "",
    avatar: null,
    email: "",
    google: false,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data: userData }) => {
      const user = userData.user;
      if (!active || !user) return;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const pick = (key: string) => (typeof meta[key] === "string" ? (meta[key] as string) : "");
      setIdentity({
        name: pick("full_name") || pick("name") || "",
        avatar: pick("avatar_url") || pick("picture") || null,
        email: user.email ?? "",
        google: (user.app_metadata?.providers ?? []).includes("google") || user.app_metadata?.provider === "google",
      });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!data?.profile) return;
    setForm({
      fullName: data.profile.fullName ?? "",
      phone: data.profile.phone ?? "",
      contactPref: data.profile.contactPref ?? "email",
      marketingOptIn: !!data.profile.marketingOptIn,
    });
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: form } as never),
    onSuccess: () => {
      setSaved(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["account"] });
      setTimeout(() => setSaved(false), 4000);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Could not save"),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">How we reach you about your visits.</p>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          {identity.avatar ? (
            <img
              src={identity.avatar}
              alt={identity.name ? `${identity.name} profile photo` : "Your profile photo"}
              referrerPolicy="no-referrer"
              className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-lg font-bold">
              {(identity.name || identity.email || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">
              {identity.name || form.fullName || "Your account"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{identity.email || data?.email}</p>
            {identity.google && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Signed in with Google
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="text-sm font-semibold">
            Full name
            <input
              required
              maxLength={120}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Mobile phone (for booking updates)
            <input
              inputMode="tel"
              maxLength={40}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="text-sm font-semibold">
            Email (sign-in)
            <input disabled value={data?.email ?? ""} className={`${inputCls} opacity-70`} />
          </label>
          <label className="text-sm font-semibold">
            Best way to reach you
            <select
              value={form.contactPref}
              onChange={(e) => setForm({ ...form, contactPref: e.target.value })}
              className={inputCls}
            >
              <option value="email">Email</option>
              <option value="text">Text</option>
              <option value="call">Phone call</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2">
            <input
              type="checkbox"
              checked={form.marketingOptIn}
              onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
              className="h-5 w-5 rounded border-border"
            />
            Send me seasonal offers and Durant service updates
          </label>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-bold text-accent-foreground shadow-bloom disabled:opacity-60 sm:w-auto"
            >
              {save.isPending ? "Saving…" : "Save profile"}
            </button>
            {saved && <span className="text-sm font-semibold text-laurel">Saved</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}