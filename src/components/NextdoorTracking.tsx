import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { captureAttribution } from "@/lib/attribution";
import { NEXTDOOR_PIXEL_ID } from "@/lib/nextdoor-config";

declare global {
  interface Window {
    ndp?: ((...args: any[]) => void) & { q?: any[] };
  }
}

function loadPixel() {
  if (!NEXTDOOR_PIXEL_ID || typeof window === "undefined") return;
  if (window.ndp) return;
  const stub: any = function (...args: any[]) {
    (stub.q = stub.q || []).push(args);
  };
  window.ndp = stub;
  const s = document.createElement("script");
  s.src = "https://ads.nextdoor.com/public/pixel/ndp.js";
  s.async = true;
  document.head.appendChild(s);
  stub("init", NEXTDOOR_PIXEL_ID);
}

/** Fire a Nextdoor pixel event. Safe no-op when the pixel isn't configured. */
export function trackNextdoorEvent(
  event: "PAGE_VIEW" | "LEAD" | "CONVERSION",
  payload?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.ndp) return;
  try {
    window.ndp("track", event, payload ?? {});
  } catch {
    /* tracking must never break a submission */
  }
}

/**
 * Mounted once in the root. Records first-touch attribution and, when a pixel
 * id is configured, loads the Nextdoor Universal Pixel and reports page views.
 */
export function NextdoorTracking() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    captureAttribution();
    loadPixel();
  }, []);

  useEffect(() => {
    trackNextdoorEvent("PAGE_VIEW");
  }, [pathname]);

  return null;
}
