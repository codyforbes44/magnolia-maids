# Nextdoor integration for Magnolia Maids

## What Nextdoor actually allows

Nextdoor's developer platform is not self-serve. Everything below reflects the current developer portal (developer.nextdoor.com):

- **Ads API** — full campaign / ad group / ad / creative / media / reporting / custom-audience management, plus lead-gen ("PFQ") creatives. Access is by application, then you mint an access token inside Nextdoor Ads Manager.
- **Conversions API (CAPI)** — a `conversions/track` endpoint plus a Universal Pixel, so booking/quote conversions can be attributed back to Nextdoor ads. Same application path as the Ads API.
- **Publishing API** — create/edit/delete posts, events, and comments on a business feed. Separate application, separate OAuth client ID/secret.
- **Not available:** no public API for replying to Nextdoor Recommendations or private messages, and no documented lead-retrieval webhook (lead-gen leads are exported from Ads Manager / reporting).
- No public sandbox and no published rate limits.

Because access is gated behind approval forms, this plan is staged so the parts that need no approval ship first and start producing value immediately.

## Phase 1 — Ships now, no Nextdoor approval needed

1. **Nextdoor attribution across the funnel.** Tag every Nextdoor destination URL with UTM parameters, capture them on landing (`/quote`, `/booking`, campaign pages), persist them on the lead/booking record, and show the source in Admin → Leads and Admin → Bookings. This makes "how many jobs came from Nextdoor" answerable today.
2. **A Nextdoor campaign landing page** (`/nextdoor`) in the same pattern as the existing seasonal campaign pages, with Durant/Bryan County neighbor-focused copy, the instant-quote flow, and its own lead tagging.
3. **Universal Pixel scaffolding.** Add the pixel loader behind a `VITE_NEXTDOOR_PIXEL_ID` env value, firing page-view plus a lead event on quote and booking submissions. Inactive until the ID exists, so nothing breaks before approval.
4. **Admin → Nextdoor page** with a connection-status panel (mirrors `/admin/facebook`): shows which credentials are configured, which capabilities that unlocks, and step-by-step instructions for the two Nextdoor application forms.

## Phase 2 — After Ads API + CAPI approval

5. **Server-side Conversions API.** Send `quote_request`, `booking_request`, and `lead` events to `conversions/track` from the existing server functions, with hashed email/phone, deduplicated against the browser pixel. This is the highest-value piece: it makes Nextdoor's optimization actually work on real jobs booked, not just clicks.
6. **Ads reporting in the admin.** Pull advertiser/campaign/ad-group stats into the Nextdoor admin tab — spend, impressions, clicks, cost per lead — alongside the Facebook numbers so both channels can be compared in one place.
7. **Custom audiences.** Push a hashed customer list (past clients, quote abandoners) to `custom_audience/create` for retargeting and lookalike seeding, refreshed on demand from the admin.
8. **Lead-gen ad intake.** Since there is no lead webhook, add a scheduled pull of lead-gen reporting plus a CSV import in the admin so Nextdoor lead-form submissions land in Admin → Leads with the same confirmation emails as Facebook leads.

## Phase 3 — After Publishing API approval (optional)

9. **Business-feed posting from the admin** — compose, schedule, and delete Nextdoor posts and events (seasonal campaigns, hiring posts) from the same content tooling used for Facebook.

## What you need to do

- Submit the **Ads and Conversion API Request Form** on developer.nextdoor.com and, if you want feed posting, the **Publishing API** form.
- Once approved, generate an Ads API token in Ads Manager and grab your Universal Pixel ID.
- Give me the ad account ID and business page URL to pin, the way the Meta assets are pinned today.

I'll request the credentials as secrets when Phase 2 is ready to build — nothing to paste yet.

## Technical notes

- New `src/lib/nextdoor-config.ts` for pinned public IDs and capability/scope mapping, mirroring `src/lib/facebook-config.ts`.
- Server-only `src/lib/nextdoor.server.ts` for token handling and typed fetch wrappers; `src/lib/nextdoor.functions.ts` exposes admin-facing server functions, loaded lazily inside handlers so nothing server-only reaches the client bundle.
- CAPI events fire from existing handlers in `quote-request.functions.ts`, `bookings.functions.ts`, and `campaign-leads.functions.ts`; failures are logged and swallowed so a Nextdoor outage never blocks a booking.
- UTM capture adds nullable `utm_source` / `utm_medium` / `utm_campaign` columns to `campaign_leads` and `booking_requests` via migration, with grants and existing RLS unchanged.
- Secrets: `NEXTDOOR_ADS_TOKEN`, `NEXTDOOR_ADVERTISER_ID`, `NEXTDOOR_CAPI_TOKEN` (server), `VITE_NEXTDOOR_PIXEL_ID` (client).
- Admin route `src/routes/_authenticated/admin/nextdoor.tsx` plus a nav entry in `src/lib/admin/nav.ts`.
