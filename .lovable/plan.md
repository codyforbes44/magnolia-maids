# Facebook integration test results and fixes

I tested the live integration end to end against Meta's API and the published site.

## What works right now

- **App credentials and token are valid.** The saved access token is live, tied to the Magnolia app, and expires around **October 5, 2026** (~60 days out).
- **The Magnolia Maids Page is reachable** (id `1279466141909245`, Local service, published, 0 followers) with full admin tasks on the token.
- **The ad account is reachable and active** — `act_1943161863013194` ("magnolia", USD, active, owned by Business Manager "Cody Forbes").
- **The Lead Ads webhook works in production.** The verification handshake returns the challenge, and an unsigned POST is correctly rejected with 401.

## What is broken or blocked

1. **No Page is connected in the database.** The connections table is empty, so every Page feature in `/admin/facebook` — posts, comments, scheduling, Page insights, Lead Ads forms, webhook subscription — currently fails with "Page not connected". Biggest blocker, and one click from fixed.
2. **Four required permissions are missing from the token:** `pages_manage_posts`, `pages_read_user_content`, `pages_manage_engagement`, `read_insights`. Publishing, scheduling, comment reading/replying, and Page insights will error even after the Page is connected. Only a re-authorization through the Facebook consent screen can grant these.
3. **The webhook callback URL must be the apex domain.** `www.magnoliamaids.pro` and the lovable.app host both 302-redirect to `magnoliamaids.pro`, and Meta does not follow redirects — a webhook configured on the www host would silently fail verification. Correct URL: `https://magnoliamaids.pro/api/public/hooks/facebook-leadgen`.
4. **Import pulls in unrelated Pages.** The token manages four Pages; the "import from token" action saves all of them, so unrelated Pages show up in the admin list.
5. **Ads reporting is empty because the account has no campaigns yet** (0 campaigns, 0 insight rows, no pixel). Not a bug, but the panel reads as if something failed.
6. **No Instagram business account is linked** to the Page, and the Page is not verified.

## What gets built

**Connect-first admin experience.** When no Page is connected, `/admin/facebook` leads with a single prominent "Connect Magnolia Maids Page" action using the pinned page id, instead of a wall of failing panels. Page-dependent tabs render a clear "connect first" state rather than throwing.

**Permission-aware UI.** The health panel lists the four missing permissions with the exact feature each one blocks, and buttons for blocked features are disabled with the reason instead of firing a request that errors. The re-authorize button stays prominent until the scope set is complete.

**Webhook setup card.** Shows the exact apex callback URL to paste into Meta, the Page's subscription state (`leadgen`, `feed`), a copy button, and a warning when viewed on a host that redirects.

**Cleaner import.** Import defaults to the pinned Magnolia Maids Page only, with multi-Page import behind an "advanced" toggle so unrelated Pages stop appearing.

**Honest empty states.** The Ads tab distinguishes "no campaigns yet" from "request failed", and shows account name, currency, and status so a healthy zero-spend account is obvious.

**Token expiry warning.** The health panel flags the token when fewer than 30 days remain, so the October expiry is not a surprise.

## Technical notes

- `src/routes/_authenticated/admin/facebook.tsx`: connect gate, capability-driven disabled states, webhook card, ads empty state, expiry banner.
- `src/lib/facebook.functions.ts`: `getConnectionHealth` returns the canonical webhook URL and an `expiringSoon` flag; `getLeadAdsStatus` returns a distinct `notConnected` state instead of a raw Graph error string; `importPagesFromToken` gains an `onlyPinned` default.
- No schema or migration changes, and no changes to the webhook route — signature verification and the handshake both tested good.
- Two steps only you can do: complete the Facebook re-authorization for the four missing scopes, and set the webhook callback in the Meta app to the apex URL above.