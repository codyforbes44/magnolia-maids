import { createFileRoute } from "@tanstack/react-router";
import { ATTRACTIONS, SEASON_TIPS } from "@/lib/community";
import { fetchDurantWeather } from "@/lib/weather.server";

/**
 * Daily verification that /community is still whole: the live NWS feed answers
 * with fresh data, the page server-renders every attraction and seasonal tip,
 * and the outbound source links still resolve. Results land in
 * community_health_checks; anything below "ok" emails the office.
 */

const SITE = "https://magnoliamaids.pro";
const LINK_TIMEOUT_MS = 8000;

type LinkResult = { name: string; url: string; status: number | string };

async function checkLink(name: string, url: string): Promise<LinkResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LINK_TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    // Some government sites reject HEAD; fall back to a ranged GET.
    if (res.status === 403 || res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { Range: "bytes=0-1024" },
        signal: controller.signal,
      });
    }
    return res.ok || res.status === 206 ? null : { name, url, status: res.status };
  } catch {
    return { name, url, status: "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

export const Route = createFileRoute("/api/public/hooks/community-health")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const anonKey =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
        const provided =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!anonKey || !provided || provided !== anonKey) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

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
          const origin = new URL(request.url).origin;
          const res = await fetch(`${origin}/community`, {
            headers: { "User-Agent": "MagnoliaMaids-HealthCheck/1.0" },
          });
          if (!res.ok) {
            notes.push(`/community returned HTTP ${res.status}.`);
          } else {
            const html = await res.text();
            attractionsRendered = ATTRACTIONS.filter((a) => html.includes(a.name)).length;
            tipsRendered = SEASON_TIPS.filter((t) => html.includes(t.headline)).length;
            pageOk =
              attractionsRendered === ATTRACTIONS.length &&
              tipsRendered === SEASON_TIPS.length &&
              html.includes("Durant weather");
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
        const linkChecks = await Promise.all(
          ATTRACTIONS.map((a) => checkLink(a.name, a.source)),
        );
        const brokenLinks = linkChecks.filter((l): l is LinkResult => l !== null);
        if (brokenLinks.length) {
          notes.push(`${brokenLinks.length} attraction source link(s) failed.`);
        }

        const status: "ok" | "degraded" | "failed" =
          !pageOk && !weatherOk ? "failed" : pageOk && weatherOk && !brokenLinks.length ? "ok" : "degraded";

        const row = {
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
        const { error: insertError } = await supabaseAdmin
          .from("community_health_checks")
          .insert(row);
        if (insertError) console.error("[community-health] log insert failed", insertError);

        // Keep the log tidy — 90 days is plenty of history.
        await supabaseAdmin
          .from("community_health_checks")
          .delete()
          .lt("created_at", new Date(Date.now() - 90 * 86400000).toISOString());

        if (status !== "ok") {
          try {
            const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
            const list = notes.map((n) => `<li>${n}</li>`).join("");
            const links = brokenLinks
              .map((l) => `<li>${l.name} — ${l.url} (${l.status})</li>`)
              .join("");
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

        console.log("[community-health]", status, row.notes ?? "all clear");
        return Response.json({ success: true, ...row });
      },
    },
  },
});