import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Instagram } from "lucide-react";
import { getInstagramAccount, publishInstagramPost } from "@/lib/facebook.functions";
import { SITE_URL } from "@/lib/structured-data";

/** Ready-made posts. Images are served from the published site so Instagram can fetch them. */
const PRESETS = [
  {
    key: "launch",
    label: "First post — Dallas launch",
    image: "/social/astro-maids-instagram-post-dallas.jpg",
    caption:
      "Luxury home cleaning is coming to North Dallas. ✨ Astro Maids — Dallas opens December 1, 2026, and our first 100 clients get 15% off for life. Get your free quote at magnoliamaids.pro or call (214) 978-6445.\n\n#DallasTX #NorthDallas #ParkCities #HouseCleaning #MaidService #AstroMaids",
  },
  {
    key: "qr",
    label: "Follow-up — quote QR code",
    image: "/social/astro-maids-instagram-quote-qr-post.jpg",
    caption:
      "Curious what a spotless home costs? 📱 Scan the code or visit magnoliamaids.pro/quote to price your North Dallas home in about a minute — no scheduling required. Founding clients who book before we open December 1, 2026 get 15% off for life (first 100 only). Questions? Call or text (214) 978-6445.\n\n#DallasTX #NorthDallas #ParkCities #Plano #Frisco #HouseCleaning #AstroMaids",
  },
] as const;

export function InstagramPublisher({ pageId }: { pageId: string }) {
  const loadAccount = useServerFn(getInstagramAccount);
  const publish = useServerFn(publishInstagramPost);
  const [account, setAccount] = useState<{ id: string; username: string | null } | null>(null);
  const [checked, setChecked] = useState(false);
  const [presetKey, setPresetKey] = useState<string>(PRESETS[0].key);
  const preset = PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0];
  const [caption, setCaption] = useState<string>(PRESETS[0].caption);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    loadAccount({ data: { pageId } })
      .then((r) => active && setAccount(r.account))
      .catch(() => active && setAccount(null))
      .finally(() => active && setChecked(true));
    return () => {
      active = false;
    };
  }, [pageId, loadAccount]);

  async function handlePublish() {
    if (!window.confirm("Publish this post to Instagram now? It will be public immediately.")) return;
    setBusy(true);
    setMessage(null);
    try {
      await publish({ data: { pageId, imageUrl: `${SITE_URL}${preset.image}`, caption } });
      setMessage({ ok: true, text: "Posted to Instagram." });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Instagram post failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border p-4">
      <h2 className="flex items-center gap-2 font-heading text-lg">
        <Instagram className="h-5 w-5" aria-hidden="true" /> Instagram
      </h2>
      {!checked ? (
        <p className="mt-2 text-sm text-muted-foreground">Checking for a linked Instagram account…</p>
      ) : !account ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No Instagram account is linked yet. Switch @AstroMaidsTX to a Business account, link it to
          this Facebook Page in Instagram settings, then use “Re-authorize permissions” above.
        </p>
      ) : (
        <div className="mt-3 grid gap-3">
          <p className="text-sm text-muted-foreground">
            Posting as <strong className="text-foreground">@{account.username ?? "instagram"}</strong>
          </p>
          <label className="grid gap-1 text-sm">
            Post
            <select
              value={presetKey}
              onChange={(e) => {
                const next = PRESETS.find((p) => p.key === e.target.value) ?? PRESETS[0];
                setPresetKey(next.key);
                setCaption(next.caption);
              }}
              className="min-h-11 rounded-lg border bg-background px-3"
            >
              {PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <img src={preset.image} alt={preset.label} className="w-full rounded-lg border" />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={2200}
              rows={7}
              aria-label="Instagram caption"
              className="rounded-lg border bg-background p-3 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePublish}
              disabled={busy || !caption.trim()}
              className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Posting…" : "Post to Instagram"}
            </button>
            {message && (
              <span role="status" className={message.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
                {message.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
