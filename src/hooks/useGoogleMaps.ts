import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "ready" | "error";

const LOAD_TIMEOUT_MS = 8000;

declare global {
  interface Window {
    google?: any;
    __magnoliaInitMap?: () => void;
  }
}

let loadPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.google?.maps?.importLibrary) return resolve();

    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return reject(new Error("Missing Google Maps browser key"));

    // Slow networks / blocked scripts should fail fast so the field can fall
    // back to plain manual entry instead of spinning forever.
    const timer = window.setTimeout(
      () => reject(new Error("Google Maps timed out")),
      LOAD_TIMEOUT_MS,
    );
    window.__magnoliaInitMap = () => {
      window.clearTimeout(timer);
      resolve();
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places&callback=__magnoliaInitMap${
      channel ? `&channel=${channel}` : ""
    }`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(s);
  });
  loadPromise.catch(() => {
    // Allow a later explicit retry to attempt a fresh load.
    loadPromise = null;
  });
  return loadPromise;
}

export function useGoogleMaps(): { status: Status; retry: () => void } {
  const [status, setStatus] = useState<Status>("idle");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    loadMaps()
      .then(() => !cancelled && setStatus("ready"))
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  return { status, retry: () => setAttempt((a) => a + 1) };
}