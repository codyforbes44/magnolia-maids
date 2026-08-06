import { Suspense, lazy, useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import mascot from "@/assets/magnolia-mark-sm.webp";

/**
 * Lightweight launcher. The full conversational widget (and the ~800 KB
 * ElevenLabs SDK it pulls in) is only downloaded once the visitor engages,
 * keeping the initial page bundle small.
 */
const MagnoliaChatWidget = lazy(() =>
  import("./MagnoliaChatWidget").then((m) => ({ default: m.MagnoliaChatWidget })),
);

export function ChatLauncher() {
  const [loaded, setLoaded] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (loaded || dismissed) return;
    const t = setTimeout(() => setShowNudge(true), 6000);
    return () => clearTimeout(t);
  }, [loaded, dismissed]);

  if (loaded) {
    return (
      <Suspense fallback={null}>
        <MagnoliaChatWidget initialOpen />
      </Suspense>
    );
  }

  const prefetch = () => void import("./MagnoliaChatWidget");

  return (
    <>
      {showNudge && (
        <div className="fixed bottom-44 md:bottom-24 right-5 z-50 max-w-[260px] animate-in fade-in slide-in-from-bottom-2">
          <div className="relative rounded-2xl bg-white shadow-2xl ring-1 ring-primary/10 p-4">
            <button
              aria-label="Dismiss chat invitation"
              onClick={() => { setShowNudge(false); setDismissed(true); }}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <img src={mascot} alt="" width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-laurel">Need a hand? 🤍</p>
                <p className="mt-1 text-xs text-slate-600">
                  Ask me anything about pricing, Airbnb turnovers, or reserving founding-member rates!
                </p>
                <button
                  onClick={() => setLoaded(true)}
                  onMouseEnter={prefetch}
                  className="mt-2 min-h-11 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                >
                  Chat with Magnolia Maids
                </button>
              </div>
            </div>
            <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white ring-1 ring-primary/10" />
          </div>
        </div>
      )}

      <button
        onClick={() => setLoaded(true)}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        aria-label="Chat with Magnolia Maids"
        className="fixed bottom-24 md:bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-laurel text-white shadow-2xl ring-4 ring-white/60 hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-accent" />
        </span>
      </button>
    </>
  );
}
