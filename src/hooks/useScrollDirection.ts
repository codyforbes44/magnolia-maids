import { useEffect, useState } from "react";

/**
 * Reports the last meaningful scroll direction plus whether the page is still
 * near the top. Used to slide pinned mobile UI out of the way while the reader
 * is moving down the page toward the primary calls to action.
 */
export function useScrollDirection(threshold = 8) {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = Math.max(0, window.scrollY);
      setAtTop(y < 24);
      if (Math.abs(y - last) >= threshold) {
        setDirection(y > last ? "down" : "up");
        last = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { direction, atTop };
}