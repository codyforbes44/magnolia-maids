import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "ready" | "error";

declare global {
  interface Window {
    google?: typeof google;
    __splashInitMap?: () => void;
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

    window.__splashInitMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places&callback=__splashInitMap${
      channel ? `&channel=${channel}` : ""
    }`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return loadPromise;
}

export function useGoogleMaps(): Status {
  const [status, setStatus] = useState<Status>("idle");
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    loadMaps()
      .then(() => !cancelled && setStatus("ready"))
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);
  return status;
}