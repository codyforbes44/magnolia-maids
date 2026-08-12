import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, EmptyState } from "@/components/admin/ui";
import {
  DEFAULT_MAGGIE_IMAGES,
  MAGGIE_AVATAR_KEY,
  MAGGIE_BUCKET,
  MAGGIE_PORTRAIT_KEY,
  MAGGIE_SIGNED_URL_TTL,
  fetchMaggieImageOverrides,
} from "@/lib/maggie-images";

export const Route = createFileRoute("/_authenticated/admin/maggie-images")({
  head: () => ({
    meta: [
      { title: "Admin — Maggie images | Magnolia Maids" },
      { name: "description", content: "Upload and manage the chatbot artwork for Maggie." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MaggieImagesPage,
});

type Slot = "avatar" | "portrait";

const SLOTS: { slot: Slot; key: string; title: string; description: string; fallback: string; aspect: string }[] = [
  {
    slot: "avatar",
    key: MAGGIE_AVATAR_KEY,
    title: "Chat avatar",
    description: "Small circular headshot used on the launcher, chat header, and message bubbles. Square image, 384×384 or larger.",
    fallback: DEFAULT_MAGGIE_IMAGES.avatar,
    aspect: "h-24 w-24 rounded-full object-cover",
  },
  {
    slot: "portrait",
    key: MAGGIE_PORTRAIT_KEY,
    title: "Fullscreen portrait",
    description: "Large artwork shown beside the chat in immersive fullscreen mode. Tall image, at least 896×1344.",
    fallback: DEFAULT_MAGGIE_IMAGES.portrait,
    aspect: "h-48 w-32 rounded-2xl object-cover",
  },
];

const MAX_BYTES = 5 * 1024 * 1024;

function MaggieImagesPage() {
  const [urls, setUrls] = useState<Record<Slot, string | null>>({ avatar: null, portrait: null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Slot | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const overrides = await fetchMaggieImageOverrides();
      setUrls({ avatar: overrides.avatar, portrait: overrides.portrait });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load images.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSetting(key: string, value: string | null) {
    const { error: upsertError } = await supabase
      .from("business_settings")
      .upsert({ key, value: value as never, is_public: true }, { onConflict: "key" });
    if (upsertError) throw new Error(upsertError.message);
  }

  async function handleUpload(slot: Slot, key: string, file: File) {
    setError(null);
    setStatus(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images must be 5 MB or smaller.");
      return;
    }
    setBusy(slot);
    try {
      const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
      const path = `${slot}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(MAGGIE_BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);

      const { data: signed, error: signError } = await supabase.storage
        .from(MAGGIE_BUCKET)
        .createSignedUrl(path, MAGGIE_SIGNED_URL_TTL);
      if (signError || !signed?.signedUrl) throw new Error(signError?.message ?? "Could not create image URL.");

      await saveSetting(key, signed.signedUrl);
      setUrls((prev) => ({ ...prev, [slot]: signed.signedUrl }));
      setStatus("Image updated — Maggie is using it now.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleReset(slot: Slot, key: string) {
    setError(null);
    setStatus(null);
    setBusy(slot);
    try {
      await saveSetting(key, null);
      setUrls((prev) => ({ ...prev, [slot]: null }));
      setStatus("Reverted to the built-in illustration.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset the image.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Maggie images"
        description="Upload the artwork Maggie uses across the chat experience."
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {status && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {status}
        </div>
      )}

      {loading ? (
        <EmptyState title="Loading images…" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {SLOTS.map((s) => (
            <SlotCard
              key={s.slot}
              {...s}
              current={urls[s.slot]}
              busy={busy === s.slot}
              onUpload={(file) => handleUpload(s.slot, s.key, file)}
              onReset={() => handleReset(s.slot, s.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SlotCard({
  title,
  description,
  fallback,
  aspect,
  current,
  busy,
  onUpload,
  onReset,
}: {
  title: string;
  description: string;
  fallback: string;
  aspect: string;
  current: string | null;
  busy: boolean;
  onUpload: (file: File) => void;
  onReset: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <SectionCard title={title} description={description}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <img
          src={current ?? fallback}
          alt={`${title} preview`}
          className={`${aspect} border border-border/60 bg-muted`}
        />
        <div className="flex-1 space-y-3">
          <p className="text-xs text-muted-foreground">
            {current ? "Custom image in use." : "Using the built-in illustration."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {busy ? "Uploading…" : current ? "Replace image" : "Upload image"}
            </button>
            {current && (
              <button
                type="button"
                disabled={busy}
                onClick={onReset}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Reset to default
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onUpload(file);
            }}
          />
        </div>
      </div>
    </SectionCard>
  );
}
