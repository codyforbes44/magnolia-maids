# Apartment & Property Management Turnovers

A new B2B service line for apartment complexes, duplex owners, and property managers in Durant / Bryan County who need move-in and move-out unit turns at volume. Because every contract is different (unit count, turn cadence, turnaround window), this line is quote-only: no public per-unit price, just a proposal request.

## What gets built

### 1. Landing page — `/apartment-turnovers`
Upscale botanical page matching the rest of the site, mobile-first:
- Hero aimed at property managers ("Unit turns your leasing office can count on"), phone CTA and a jump to the proposal form.
- Value blocks: guaranteed turnaround windows, same crew every turn, insured and background-checked, photo proof of completion, single monthly invoice.
- Move-out vs move-in checklist (two columns): what makes a unit rent-ready — appliance interiors, cabinets in/out, blinds, baseboards, tub/tile, fixtures, floors, window tracks, patio sweep, trash-out add-on.
- "How it works": submit unit list → walk-through and per-unit rate proposal → scheduled turns → photo report and invoice.
- Property-manager FAQ (turnaround, volume rates, after-hours access, lockbox/key handling, insurance certificates, invoicing terms, damage reporting).
- Proposal request form plus closing CTA band.

### 2. Full property intake form
Captures, with inline validation and mobile-friendly inputs:
- Property: complex/property name, address, total units, average turns per month, unit mix (studio/1bd/2bd/3bd+ counts), turnaround needed, whether trash-out or carpet care is required, access method, target start date.
- Contact: name, role/title, company, email, phone, notes.

On submit it saves the inquiry, emails the office a full detail table, and sends the manager a branded confirmation setting a same-business-day callback expectation.

### 3. Admin — Property inquiries
New "Properties" page in the admin sidebar listing every inquiry with date, property, units, turns/month, contact and status. Row click opens the existing detail drawer with the whole intake, status control, and CSV export — same pattern as Leads and Bookings.

### 4. Site-wide rollout
- Services page: new "Apartment & Property Turnovers" card in the quick-links row, marked "Custom quote" rather than a flat price.
- Homepage: a property-management band linking to the new page.
- Move-out cleaning page: cross-link for managers who land on the consumer page.
- Footer services list and sitemap.
- SEO: unique title/description/OG targeting "apartment turnover cleaning Durant OK" and "property management cleaning Bryan County"; Service + FAQPage JSON-LD; breadcrumbs.
- Chatbot: knowledge base gains an apartment-turnover section (quote-only, what's included, how to request a proposal) and is re-uploaded to the ElevenLabs agent.

## Technical notes

- **Database:** new `property_inquiries` table (property name, address, unit counts by type, total units, turns per month, turnaround, access notes, extras flags, contact fields, notes, status, attribution columns, timestamps). Anyone may submit through a validated insert policy, mirroring `booking_requests`; only admins can read, update, or delete. GRANTs are issued for `anon`, `authenticated`, and `service_role` to match those policies, plus the existing `touch_updated_at` trigger.
- **Server function:** `src/lib/property-inquiry.functions.ts` with a Zod schema, insert, and Resend dispatch through the existing `resend.server.ts` helper. Attribution (`utm_*`, referrer, landing path) is captured the same way as quote and booking submissions so Nextdoor/Facebook traffic is credited.
- **Emails:** two new templates in `src/lib/email/property-inquiry.ts` (admin notification, manager confirmation), registered in the admin email catalog so they appear in `/admin/emails` with sample data.
- **Pricing:** no changes to `src/lib/pricing.ts`; the existing "Move In / Out" residential rate stays as-is for homeowners. The B2B line deliberately shows no public rate.
- **Routes/nav:** `src/routes/apartment-turnovers.tsx`, `src/routes/_authenticated/admin/properties.tsx`, an entry in `src/lib/admin/nav.ts`, plus sitemap and footer links.

## Order of work

1. Migration for `property_inquiries`.
2. Server function, schema, and email templates.
3. Landing page and intake form.
4. Admin properties page and nav entry.
5. Cross-links, sitemap, structured data, knowledge-base refresh and ElevenLabs upload.