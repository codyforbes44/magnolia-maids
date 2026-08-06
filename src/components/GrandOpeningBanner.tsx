import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PartyPopper, ArrowRight } from "lucide-react";

const LAUNCH = new Date("2026-10-01T09:00:00-04:00").getTime();

function useCountdown(target: number) {
  // Start with null so SSR and first client render match; hydrate on mount.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - (now ?? target));
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: now !== null && diff === 0, ready: now !== null };
}

export function GrandOpeningBanner() {
  const { days, hours, minutes, seconds, done, ready } = useCountdown(LAUNCH);
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-laurel via-primary to-accent text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sm">
        <span className="inline-flex items-center gap-2 font-bold">
          <PartyPopper className="h-4 w-4 shrink-0" />
          {done ? "We're officially OPEN in Durant!" : "Grand Opening · September 1, 2026"}
        </span>
        {!done && ready && (
          <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs md:text-sm bg-white/15 backdrop-blur px-2.5 py-1 rounded-full tabular-nums">
            <TimeBlock v={days} u="d" />
            <span aria-hidden>:</span>
            <TimeBlock v={hours} u="h" />
            <span aria-hidden>:</span>
            <TimeBlock v={minutes} u="m" />
            <span aria-hidden>:</span>
            <TimeBlock v={seconds} u="s" />
          </span>
        )}
        <Link
          to="/booking"
          className="inline-flex items-center gap-1 rounded-full bg-white text-primary px-3 py-1 text-xs font-bold hover:bg-white/90 transition"
        >
          Reserve founding rate <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function TimeBlock({ v, u }: { v: number; u: string }) {
  return (
    <span>
      {String(v).padStart(2, "0")}
      <span className="opacity-70">{u}</span>
    </span>
  );
}