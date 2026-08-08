import { z } from "zod";

/**
 * First-touch marketing attribution.
 *
 * Every landing page stores the UTM tags (plus referrer and landing path) the
 * visitor arrived with, so a lead submitted three pages later still reports the
 * channel that actually paid for it — Nextdoor, Meta, organic, etc.
 */
export const attributionSchema = z.object({
  utmSource: z.string().trim().max(120).nullable().default(null),
  utmMedium: z.string().trim().max(120).nullable().default(null),
  utmCampaign: z.string().trim().max(160).nullable().default(null),
  utmContent: z.string().trim().max(160).nullable().default(null),
  referrer: z.string().trim().max(300).nullable().default(null),
  landingPath: z.string().trim().max(300).nullable().default(null),
});

export type Attribution = z.infer<typeof attributionSchema>;

export const EMPTY_ATTRIBUTION: Attribution = {
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  referrer: null,
  landingPath: null,
};

const STORAGE_KEY = "mm_attribution_v1";

function clean(v: string | null, max: number): string | null {
  if (!v) return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
}

/** Maps a raw referrer host to a channel when no UTM tags are present. */
function inferSource(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("nextdoor")) return "nextdoor";
    if (host.includes("facebook") || host.includes("instagram") || host === "m.me") return "meta";
    if (host.includes("google")) return "google";
    if (host.includes("bing")) return "bing";
    if (host.endsWith("magnoliamaids.pro")) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

/**
 * Called once per page load. Writes first-touch attribution and never
 * overwrites it, so a later internal navigation can't erase the ad click.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY_ATTRIBUTION;
  const existing = getAttribution();
  const params = new URLSearchParams(window.location.search);
  const utmSource = clean(params.get("utm_source"), 120);

  // Existing first-touch wins unless it was a bare organic visit and this one
  // carries real campaign tags.
  if (existing.utmSource && !(!existing.utmMedium && utmSource)) return existing;

  const referrer = clean(document.referrer || null, 300);
  const next: Attribution = {
    utmSource: utmSource ?? inferSource(referrer),
    utmMedium: clean(params.get("utm_medium"), 120),
    utmCampaign: clean(params.get("utm_campaign"), 160),
    utmContent: clean(params.get("utm_content") ?? params.get("utm_term"), 160),
    referrer,
    landingPath: clean(window.location.pathname + window.location.search, 300),
  };

  if (!next.utmSource && !next.referrer) return existing;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private browsing — attribution is best-effort */
  }
  return next;
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY_ATTRIBUTION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ATTRIBUTION;
    const parsed = attributionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_ATTRIBUTION;
  } catch {
    return EMPTY_ATTRIBUTION;
  }
}

/** Column mapping shared by campaign_leads and booking_requests. */
export function attributionColumns(a: Attribution | undefined) {
  return {
    utm_source: a?.utmSource ?? null,
    utm_medium: a?.utmMedium ?? null,
    utm_campaign: a?.utmCampaign ?? null,
    utm_content: a?.utmContent ?? null,
    referrer: a?.referrer ?? null,
    landing_path: a?.landingPath ?? null,
  };
}

/** Human label for the admin tables. */
export function sourceLabel(source: string | null | undefined): string {
  if (!source) return "Direct";
  const map: Record<string, string> = {
    nextdoor: "Nextdoor",
    meta: "Meta",
    facebook: "Facebook",
    instagram: "Instagram",
    google: "Google",
    bing: "Bing",
  };
  return map[source.toLowerCase()] ?? source;
}
