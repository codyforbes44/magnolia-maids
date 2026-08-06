# Facebook Platform Review — Findings and Growth Plan

## What I verified live

I checked the "Magnolia" Facebook app, its saved access token, and the Pages/ad accounts it can reach.

- **The app credentials work.** The saved token is valid, tied to the Magnolia app, and expires **September 24, 2026**.
- **Nothing is actually connected inside the admin dashboard.** The connected-Pages table is empty, so `/admin/facebook` currently shows "No Pages connected yet". The import step has never completed (or was cleared).
- **The token can reach 4 Pages**, including **Magnolia Maids** (`1279466141909245`, Local service, published, 0 followers) with full admin tasks.
- **3 ad accounts are reachable**, one active personal account plus a Woody Ford account.
- **No Instagram business account is linked** to the Magnolia Maids Page.
- **Permission gap (this is the real blocker):** the saved token was granted `pages_show_list, pages_read_engagement, pages_manage_metadata, ads_management, ads_read, business_management, leads_retrieval, pages_manage_ads`. The admin dashboard's publishing, comment-reading, and comment-reply features require `pages_manage_posts`, `pages_read_user_content`, and `pages_manage_engagement` — which are **not** on this token. Those buttons will fail with a permission error the moment a Page is imported.

## Recommended work, in order

### 1. Fix the permission mismatch and get a Page connected (required first)
- Re-run the OAuth connect flow so the token carries the publishing/engagement scopes the dashboard already codes against, and add the newly available `leads_retrieval`, `ads_read`, and `read_insights` scopes to the request.
- Add a **connection health panel** to `/admin/facebook`: token validity, expiry date, and the exact list of granted vs. required permissions, with a one-click "Reconnect" when something is missing. This turns silent failures into a visible warning.
- Add a scheduled check that warns by email ~2 weeks before the token expires.

### 2. Lead Ads → campaign leads pipeline (highest business value)
The token already has `leads_retrieval`, and there is already a `campaign_leads` table, an admin leads console, and thank-you/reminder emails. Wiring Meta Lead Ads into it means a Facebook lead form gets the same instant confirmation email, reminder, and admin workflow as the website forms.
- Subscribe the Page to the `leadgen` webhook and add a verified webhook endpoint.
- Map each incoming lead into `campaign_leads` with its campaign name, then reuse the existing confirmation email.
- Backfill existing leads from the Page's lead forms on demand.

### 3. Ads performance panel
With `ads_read`/`ads_management` already granted, surface the numbers that matter for the Durant campaigns: spend, reach, cost per lead, and results per campaign for the ad account you choose, in a simple admin table with a date range. This closes the loop with the Summer on the Lake / Referral Week / Holiday Ready creatives already produced.

### 4. Page insights and content scheduling
- `pages_read_engagement` + `read_insights` unlocks follower growth, reach, and post engagement charts for the Magnolia Maids Page.
- Add **scheduled publishing** (Facebook supports future-dated Page posts) plus photo/link posts, so the seasonal campaign templates can be queued weeks ahead instead of posted manually.

### 5. Instagram (needs a setup step outside the app)
The Magnolia Maids Page has no linked Instagram business account. Once one is created and linked in Meta Business settings, the same app can publish to Instagram and read its insights. Worth doing — visual before/after cleaning content performs well locally — but it is a prerequisite step on Meta's side first.

### 6. Messenger auto-reply (optional, needs App Review)
Auto-answering Page messages requires `pages_messaging`, which Meta grants only after App Review with a business verification. Recommended only after the items above are live; the site already has the voice concierge covering most inbound questions.

## Notes on Meta approvals
Publishing, comment management, insights, ads reading, and lead retrieval all work in **standard access** for people who have a role on the app and admin the Page — no App Review needed for internal admin use. App Review + business verification is only required if the tools should work for other Page owners, or for Messenger automation.

## Technical details
- `src/lib/facebook.functions.ts`: expand `SCOPES`, add `debug_token` health function, add insights/scheduling/ads/lead functions.
- `src/routes/_authenticated/admin.facebook.tsx`: add health banner, insights tab, ads tab, scheduler UI.
- New `src/routes/api/public/hooks/facebook-leadgen.ts`: signed (`X-Hub-Signature-256`) webhook, `GET` verify handshake, inserts into `campaign_leads` via the service-role client.
- Reuse `src/lib/email/campaign-thankyou.ts` and the existing reminder cron for Meta-sourced leads.
- Token expiry warning added to the existing daily cron hook.

## Suggested first step
Items 1 and 2 together — a healthy connection plus Lead Ads flowing into the existing lead console — deliver the most value. Items 3 and 4 follow naturally.
