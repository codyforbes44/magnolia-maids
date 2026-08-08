import { useEffect, useRef, useState } from "react";

/** Animated total. Bumps subtly whenever the price changes (reduced-motion safe). */
export function AnimatedPrice({ total, className = "" }: { total: number; className?: string }) {
  const prev = useRef(total);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (prev.current === total) return;
    prev.current = total;
    setBump(true);
    const t = setTimeout(() => setBump(false), 260);
    return () => clearTimeout(t);
  }, [total]);

  return (
    <span
      aria-live="polite"
      className={`inline-block tabular-nums motion-safe:transition-transform motion-safe:duration-200 ${
        bump ? "motion-safe:scale-110" : "motion-safe:scale-100"
      } ${className}`}
    >
      ${total}
    </span>
  );
}
