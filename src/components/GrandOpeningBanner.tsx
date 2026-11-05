import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { OPENING_DATE } from "@/lib/availability";
import { getFounderSpots } from "@/lib/founder.functions";

const OPEN_AT = new Date(`${OPENING_DATE}T08:00:00-06:00`).getTime();

export function GrandOpeningBanner() {
  const [now, setNow] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    getFounderSpots().then((r) => setLeft(r.left)).catch(() => {});
    return () => clearInterval(t);
  }, []);
  if (now !== null && now >= OPEN_AT) return null;
  const ms = Math.max(0, OPEN_AT - (now ?? OPEN_AT));
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return (
    <div className="bg-primary text-primary-foreground text-center text-xs sm:text-sm px-3 py-2">
      <span className="font-semibold">Grand opening December 1, 2026</span>
      {now !== null && <span className="opacity-90"> · {days}d {hours}h to go</span>}
      <span className="opacity-90"> · First 100 clients get 15% off for life</span>
      {left !== null && left > 0 && <span className="opacity-90"> · {left} founder spots left</span>}
      <Link to="/quote" className="ml-2 underline font-semibold">Get my quote</Link>
    </div>
  );
}
