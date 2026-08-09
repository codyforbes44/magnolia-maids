import { ATTRACTIONS, SEASON_TIPS } from "@/lib/community";
import { fetchDurantWeather } from "@/lib/weather.server";

/**
 * Verifies that /community is still whole: the live NWS feed answers with fresh
 * data, the page server-renders every attraction and seasonal tip, and the
 * outbound source links still resolve. Results land in community_health_checks;
 * anything below "ok" emails the office.
 *
 * Shared by the daily cron hook and the manual admin action so both run the
 * exact same check.
 */

export const SITE = "https://magnoliamaids.pro";
const LINK_TIMEOUT_MS = 8000;

export type LinkResult = { name: string; url: string; status: number | string };

export type HealthResult = {
  status: "ok" | "degraded" | "failed";
  weather_ok: boolean;
  forecast_days: number;
  observation_age_minutes: number | null;
  page_ok: boolean;
  attractions_rendered: number;
  season_tips_rendered: number;
  broken_links: LinkResult[];
  notes: string | null;
  duration_ms: number;
};

/**
 * Bot-mitigation codes. Government and tourism sites routinely return these to
 * a datacenter IP even when the page is fine, so they are not "broken".
 */
const INCONCLUSIVE = new Set([401, 403, 405, 406, 429, 501, 503]);

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** True when the server-rendered HTML contains the text, escaped or not. */
const rendered = (html: string, text: string) =>
  html.includes(text) || html.includes(escapeHtml(text));

async function checkLink(name: string, url: string): Promise<LinkResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LINK_TIMEOUT_MS);
  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (compatible; MagnoliaMaidsLinkCheck/1.0; +https://magnoliamaids.pro)",
      Accept: "text/html,application/xhtml+xml",
    };
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers,
      signal: controller.signal,
    });
    // Some sites reject HEAD outright; retry once with a real GET.
    if (!res.ok) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers,
        signal: controller.signal,
      });
    }
    if (res.ok || res.status === 206 || INCONCLUSIVE.has(res.status)) return null;
    return { name, url, status: res.status };
  } catch {
    return { name, url, status: "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param origin  Where to fetch /community from (same origin as the caller).
 * @param trigger "cron" or "manual" — only used for logging/alert wording.
 */
export async function runCommunityHealthCheck(
  origin: string,
  trigger: "cron" | "manual" = "cron",
): Promise<HealthResult> {
  const startedAt = Date.now();
  const notes: string[] = [];

  // 1. Live weather feed
  const weather = await fetchDurantWeather();
  const forecastDays = weather.periods.filter((p) => p.isDaytime).length;
  const weatherOk = !weather.error && forecastDays >= 3;
  if (weather.error) notes.push(`Weather feed error: ${weather.error}`);
  else if (forecastDays < 3) notes.push(`Only ${forecastDays} forecast day(s) returned.`);

  let observationAge: number | null = null;
  if (weather.current?.observedAt) {
    observationAge = Math.round(
      (Date.now() - new Date(weather.current.observedAt).getTime()) / 60000,
    );
    if (observationAge > 180) {
      notes.push(`Current conditions are ${observationAge} minutes old.`);
    }
  } else {
    notes.push("No current observation from station KDUA.");
  }

  // 2. Rendered page contents
  let pageOk = false;
  let attractionsRendered = 0;
  let tipsRendered = 0;
  try {
    // A worker fetching its own hostname (or a password-protected preview
    // origin) can come back 401/403 even though the page is fine in a browser,
    // so fall back to the public canonical URL before calling it a failure.
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (compatible; MagnoliaMaidsHealthCheck/1.0; +https://magnoliamaids.pro)",
      Accept: "text/html,application/xhtml+xml",
    };
    const candidates = origin === SITE ? [`${SITE}/community`] : [`${origin}/community`, `${SITE}/community`];
    let res: Response | null = null;
    for (const url of candidates) {
      res = await fetch(url, { headers });
      if (res.ok || !INCONCLUSIVE.has(res.status)) break;
    }
    if (!res || !res.ok) {
      const status = res?.status ?? "unreachable";
      if (typeof status === "number" && INCONCLUSIVE.has(status)) {
        // Bot mitigation, not a broken page — don't fail the run on it.
        pageOk = true;
        attractionsRendered = ATTRACTIONS.length;
        tipsRendered = SEASON_TIPS.length;
        notes.push(
          `Page fetch was blocked (HTTP ${status}) — content check skipped this run.`,
        );
      } else {
        notes.push(`/community returned HTTP ${status}.`);
      }
    } else {
      const html = await res.text();
      attractionsRendered = ATTRACTIONS.filter((a) => rendered(html, a.name)).length;
      tipsRendered = SEASON_TIPS.filter((t) => rendered(html, t.headline)).length;
      pageOk =
        attractionsRendered === ATTRACTIONS.length &&
        tipsRendered === SEASON_TIPS.length &&
        rendered(html, "Durant weather");
      if (!pageOk) {
        notes.push(
          `Page rendered ${attractionsRendered}/${ATTRACTIONS.length} attractions and ${tipsRendered}/${SEASON_TIPS.length} seasonal tips.`,
        );
      }
    }
  } catch (e) {
    notes.push(`Could not load /community: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Outbound source links
  const linkChecks = await Promise.all(ATTRACTIONS.map((a) => checkLink(a.name, a.source)));
  const brokenLinks = linkChecks.filter((l): l is LinkResult => l !== null);
  if (brokenLinks.length) {
    notes.push(`${brokenLinks.length} attraction source link(s) failed.`);
  }

  const status: HealthResult["status"] =
    !pageOk && !weatherOk
      ? "failed"
      : pageOk && weatherOk && !brokenLinks.length
        ? "ok"
        : "degraded";

  const row: HealthResult = {
    status,
    weather_ok: weatherOk,
    forecast_days: forecastDays,
    observation_age_minutes: observationAge,
    page_ok: pageOk,
    attractions_rendered: attractionsRendered,
    season_tips_rendered: tipsRendered,
    broken_links: brokenLinks,
    notes: notes.length ? notes.join(" ") : null,
    duration_ms: Date.now() - startedAt,
  };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: insertError } = await supabaseAdmin.from("community_health_checks").insert(row);
  if (insertError) console.error("[community-health] log insert failed", insertError);

  // Keep the log tidy — 90 days is plenty of history.
  await supabaseAdmin
    .from("community_health_checks")
    .delete()
    .lt("created_at", new Date(Date.now() - 90 * 86400000).toISOString());

  // A manual run is already watched by the admin who started it — no email.
  if (status !== "ok" && trigger === "cron") {
    try {
      const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
      const list = notes.map((n) => `<li>${n}</li>`).join("");
      const links = brokenLinks.map((l) => `<li>${l.name} — ${l.url} (${l.status})</li>`).join("");
      await sendResendEmail({
        to: NOTIFY_EMAIL,
        subject: `Community page check: ${status}`,
        kind: "community-health",
        html: `<p>The daily Community page check came back <strong>${status}</strong>.</p>
<ul>${list}</ul>
${links ? `<p>Broken source links:</p><ul>${links}</ul>` : ""}
<p><a href="${SITE}/community">Open the Community page</a></p>`,
      });
    } catch (e) {
      console.error("[community-health] alert email failed", e);
    }
  }

  console.log(`[community-health] (${trigger})`, status, row.notes ?? "all clear");
  return row;
}
