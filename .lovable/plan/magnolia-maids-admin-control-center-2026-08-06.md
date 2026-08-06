# Magnolia Maids Admin Control Center

## What exists today

Three loosely connected pages behind login:

- `/admin` — booking requests: list, calendar, filters, CSV export, status dropdown, detail drawer
- `/admin/leads` — campaign leads: filters, CSV export, status, resend thank-you
- `/admin/facebook` — page connection, scheduling, insights, ads, lead ads

Each page re-checks admin rights on its own, re-implements its own table, filters, CSV export and drawer, and there is no navigation between them other than one pill button. There is no link to the admin from anywhere on the site.

## Gaps found

| Area | Current state |
| --- | --- |
| Career applications | Emailed only — never saved. If the inbox loses it, the applicant is gone. |
| Team / admin access | No way to see who has access or grant it. Requires a developer. |
| Pricing & offers | Hard-coded in `src/lib/pricing.ts`. Every price change needs a deploy. |
| Page copy, FAQs, testimonials, campaign landing pages | Hard-coded in route files and `src/lib/campaigns.ts`. |
| Grand opening banner | Hard-coded date and copy. |
| Email activity | No record of what was sent, to whom, or whether it landed. |
| Business settings | Phone, email, service areas, social handles scattered across files. |
| Chat concierge | Agent IDs and knowledge base are static files. |
| Overview / at-a-glance | None. No pipeline counts, no revenue view, no "what needs attention today". |
| Misleading control | The "Full administrative access" button just opens Facebook Business. |

## The plan

### 1. Admin shell

A dedicated admin layout with a collapsible left sidebar, separate from the public site chrome:

```text
Overview        pipeline, today's requests, revenue estimate, alerts
Bookings        requests + calendar
Leads           campaign leads
Applications    hiring pipeline
Marketing       campaigns, offers, Facebook, share assets
Content         pages, FAQs, testimonials, banner
Pricing         services, add-ons, discounts
Team            admins and staff access
Settings        business info, emails, chat concierge, integrations
```

Sidebar collapses to icons, admin identity and sign-out live in the shell header, and one admin-rights check happens in the layout instead of on every page. A shared table component gives every list the same search, filters, status pipeline, bulk actions, CSV export, and detail drawer — so behaviour is identical everywhere.

### 2. Career applications become real records

New applications table, and the application form writes to it before sending email. Admin gets a hiring pipeline (new → screening → interview → hired → passed), internal notes, resume of what they submitted, and CSV export. Existing email notifications keep working exactly as they do.

### 3. Editable pricing and offers

Service rates, per-bedroom and per-bathroom adders, add-ons, frequency discounts, and the Host Weekend bundle move into the database. The pricing page, booking wizard, quote API for the voice agent, campaign pages, and emails all read the same live values, so a price change updates everywhere at once. The current code values seed the tables so nothing changes on day one. Every edit is previewed with a live "sample 3bd/2ba quote" before saving.

### 4. Content management

Editable in the admin: hero headlines and subcopy, section blurbs, service descriptions, FAQs, testimonials, service-area lists, legal page text, grand-opening banner (date, time, copy, on/off), and the five campaign landing pages. Content is stored in the database with the current copy as the seed; public pages render from it with the seeded values as fallback, so the site never breaks on a missing record. Each editable page shows a "view live" link.

### 5. Team management

Invite by email, assign admin or staff, revoke access, and see who has what. Guardrails: you cannot remove your own admin role or delete the last remaining admin. Role changes run server-side with a role check, never from the browser.

### 6. Operations and visibility

- Overview page: new requests today, unanswered leads, upcoming jobs this week, estimated booked revenue, application count, and alerts for expiring Facebook tokens or failed emails
- Email activity log: every confirmation, notification, reminder, and thank-you with recipient, subject, status and a resend button
- Settings: business phone, email, address, hours, social handles, service areas, notification recipients, chat concierge agent IDs and knowledge base, plus a health panel showing email, database, chat, maps, and Facebook status
- The bogus "Full administrative access" button is replaced by the real Facebook section

## Technical notes

- New tables: `job_applications`, `service_rates`, `service_addons`, `site_content`, `campaign_content`, `business_settings`, `email_log`, plus a `staff` role added to the existing `app_role` enum. Each gets admin-only write policies through the existing `private.has_role` function, public read only where the site needs it (pricing, content), and explicit grants.
- Content and pricing seeds are literal inserts in the migration, taken verbatim from `src/lib/pricing.ts`, `src/lib/campaigns.ts`, and current route copy.
- `src/lib/pricing.ts` keeps its exported types and calculation functions; the rate values are loaded from the database and the current constants become the fallback, so `src/routes/api/public/quote.ts` and the booking wizard need no logic change.
- Admin data access moves into `src/lib/admin/*.functions.ts` server functions using `requireSupabaseAuth` plus an explicit admin role check, replacing the direct browser Supabase queries in the current pages.
- Public pages read content through a cached public server function using the publishable key, not the admin client, so SSR and SEO stay intact.
- Routes: new `src/routes/_authenticated/admin/route.tsx` layout with children for each section; existing `/admin`, `/admin/leads`, `/admin/facebook` URLs are preserved.
- Email sending is wrapped so every send writes an `email_log` row with its result.

## Sequencing

1. Admin shell, sidebar, shared table, overview page (existing three pages reorganized into it)
2. Applications table plus hiring pipeline
3. Team management
4. Pricing management wired to public site and quote API
5. Content management including campaigns and banner
6. Settings, email log, health panel

Each step is usable on its own, so the dashboard improves progressively rather than in one risky drop.
