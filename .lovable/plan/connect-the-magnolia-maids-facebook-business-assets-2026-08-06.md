# Connect the Magnolia Maids Facebook business assets

Verified live against the Graph API with the credentials already stored in the project:

- Ad account `act_1943161863013194` — name "magnolia", USD, status active, owned by Business Manager `1225204346447828`.
- Page "Magnolia Maids" — id `1279466141909245`, category "Local service" (this is facebook.com/MagnoliaMaidsOK).
- The stored access token is valid and does not expire until Sep 2026.

Two real gaps found:

1. Nothing in the app pins these IDs. The Ads panel loops over all four ad accounts on the token (including unrelated "Woody Ford", "Cody Forbes", "cre-25-0601"), and the page must be connected by hand through OAuth.
2. The token is missing four permissions the admin dashboard already assumes: `pages_manage_posts`, `pages_read_user_content`, `pages_manage_engagement`, `read_insights`. Publishing, scheduling, and Page insights will fail until the token is re-authorized with those scopes.

## What gets built

**Pinned business config.** A single source of truth holding the business ID, ad account ID, page ID, and page handle, so every panel targets Magnolia Maids assets instead of guessing.

**One-click connect.** An admin action that pulls the Magnolia Maids page token straight from the stored token and saves the connection — no OAuth round trip needed since the page is already granted. It also subscribes the page to lead webhooks in the same step.

**Ads panel scoped to the right account.** Insights, campaign spend, clicks, CTR, cost-per-lead read from `act_1943161863013194` only, with the other accounts hidden. Adds an account-level summary row (spend, leads, cost per lead) above the campaign table.

**Honest health panel.** Shows connected page, ad account, and business by name; lists exactly which scopes are missing and what breaks because of each; and offers a re-authorize button that requests the full scope set. Features that need a missing scope render disabled with the reason instead of throwing a Graph error.

**Lead Ads wiring check.** Shows whether the page is subscribed to `leadgen`, which forms exist on the account, and how many leads have been imported into the leads dashboard.

## Technical notes

- New `src/lib/facebook-config.ts` exporting `FACEBOOK_BUSINESS_ID`, `FACEBOOK_AD_ACCOUNT_ID`, `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_HANDLE` (non-secret IDs, safe in code).
- `src/lib/facebook.functions.ts`: add `connectMagnoliaPage` (reads `/me/accounts`, finds the pinned page id, upserts into `facebook_connections`, then POSTs `subscribed_apps` with `leadgen,feed`); rewrite `listAdInsights` to hit the pinned account directly with an account-level `insights` call plus the campaign breakdown; extend `getConnectionHealth` to return page/ad-account/business names and a per-scope capability map.
- `src/routes/_authenticated/admin/facebook.tsx`: header strip with the three connected assets, capability-aware disabling, connect button, and the summary row on the Ads tab.
- No schema changes; `facebook_connections` already stores page tokens under admin-only RLS.
- The missing scopes cannot be granted from code — the re-authorize flow already exists (`getFacebookAuthUrl`) and requests them; you complete the Facebook consent screen once.
