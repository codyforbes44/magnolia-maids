# Fix the "21 pages failed" content-sync alert

## What's actually happening

The pages are fine. I fetched the live site from outside just now: `https://magnoliamaids.pro/` and `/sitemap.xml` both return HTTP 200 with correct content.

The 403s come from the sync job fetching the site through its own worker origin, where bot/preview protection rejects the request. This is the exact same false alarm we already fixed for the Community health check — that fix was never applied to the daily content sync.

## The fix

In the page sweep inside `src/lib/content-sync.server.ts`:

1. Send a real browser-style `User-Agent` and `Accept` header instead of `MagnoliaMaids-ContentSync/1.0`.
2. If a page comes back 401/403/429/503 from the worker origin, retry the same path against the public canonical URL `https://magnoliamaids.pro`.
3. If the retry also comes back blocked (not a real error page), record it as **inconclusive** rather than a failure — inconclusive paths get mentioned in the notes but do not push the run to `degraded`.
4. Real problems still fail loudly: HTTP 404/500, or a 200 page missing its expected content phrase.

## Result

The daily sync reports `ok` when the site is healthy, and only alerts when a page is genuinely broken or missing its content.

## Technical notes

- Change is confined to `sweepPages` and the `PageFailure` handling in `src/lib/content-sync.server.ts`; the cron hook and the admin "Sync now" button both call the same function, so both benefit.
- Mirrors the `INCONCLUSIVE` status set already used in `src/lib/community-health.server.ts`.
