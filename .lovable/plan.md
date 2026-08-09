# Magnolia Maids Franchising — offering site, operations manual, owner portal

Goal: package what Magnolia Maids already does in Durant into a franchise offering that looks
credible to serious candidates, while staying legally safe during the exploration stage.

## Legal guardrail (shapes all copy)

You are exploring, not selling. Until a Franchise Disclosure Document exists and Oklahoma
filing/registration questions are answered with counsel, the site must not make an offer or
imply one. Concretely:

- No earnings claims, no "make $X", no ROI charts, no royalty/fee numbers, no "we're accepting
  applications in these territories".
- Language is "expressing interest" / "join the waitlist", never "apply to buy a franchise".
- A short disclaimer on the page and on the form: this is not an offer to sell a franchise; an
  offer can only be made through an FDD in states where the brand is registered.
- Existing About copy says "No franchise scripts, no call-center runaround" — reword to keep the
  local-owner promise without contradicting the new page ("Locally owned and operated, never a
  call center").

## Phase 1 — Public franchise interest site (`/franchise`)

A single strong page in the botanical brand, mobile-first, matching the existing hero/section
rhythm:

- Hero: "Own a Magnolia Maids in your town" + interest CTA + the pre-offer disclaimer line.
- Why this brand: the real proof we can show honestly — instant-quote pipeline, customer account
  portal, automated follow-up emails, admin control center, published operations standards.
  Sell the system, not the numbers.
- What an owner gets: brand + territory, the Operations Manual, the booking/quote software,
  training curriculum, marketing kit (the existing Meta creatives, business cards, flyers),
  lead-follow-up automation.
- Who we're looking for: qualities, not qualifications-as-offer.
- Territory interest map: Oklahoma/North Texas region, "expressing interest" only — no
  "available territory" claims.
- Ownership process, stated as exploration stages: Interest -> Intro call -> Discovery ->
  FDD review when available -> Award.
- FAQ (franchise-specific, own JSON-LD FAQPage, unique meta/canonical/og), plus a plain-English
  "where we are in the process" note.
- Footer + nav link ("Franchising"), and a small mention on About.

Inquiry capture: `franchise_inquiries` table + a `/franchise` form (name, email, phone, target
city/state, timeline, liquid-capital range as a band, cleaning/business background, why
Magnolia Maids). Uses the same Zod-validated server-function pattern as the property inquiry
form, runs through the existing returning-contact dedupe + `contact_activity` logging, and
sends: confirmation email to the candidate (new blank-safe template in the catalog) and a
notification to the office.

Admin: `/admin/franchise` list + detail drawer with status pipeline (new -> contacted ->
discovery -> qualified -> on hold -> declined -> awarded), admin notes, email follow-up using
the existing template selector, and a nav entry. Overview alerts count new inquiries the same
way bookings and leads do.

## Phase 2 — Magnolia Maids Operations Manual

Turn the uploaded template into a finished, branded manual delivered as a print-ready PDF in
your documents area (and, optionally, a gated download for candidates later).

Customizations from the template:
- Brand voice, magnolia palette, cover, headers/footers, Maggie where appropriate.
- Real service tiers and scope pulled from `src/lib/pricing.ts` and the services page: Standard,
  Deep, Airbnb turnover, Bright Clean, Move-Out, Office, plus post-event and apartment turnover —
  the template is missing all four of your differentiated lines.
- Add checklists the template lacks but you sell: Airbnb turnover (linen/restock/staging/damage
  report), post-event, apartment turn (trash-out, key handoff, unit-ready photo).
- Chemicals/equipment: keep the color-coding and compatibility chart; you fill in the actual
  products you buy — I'll leave clearly marked fill-in fields rather than invent SDS data.
- Technology chapter (new): how owners use the quote pipeline, booking calendar, customer
  account portal, change requests, and email automations — this is your real differentiator and
  the template has no equivalent.
- Local section: Durant/Bryan County/Lake Texoma specifics, Oklahoma-flagged compliance items
  marked "verify with counsel/insurance broker" — no invented legal or insurance requirements.
- Appendices: sign-off log, QA scorecards, incident report, client welcome sheet.

## Phase 3 — Franchisee portal foundations

Scoped deliberately small first, so it's usable rather than half a franchise ERP:

- `franchise_locations` (name, owner user, territory, city/state, status) and a
  `franchise_owner` role in the existing role enum with `has_role` checks.
- Territory scoping: `location_id` on bookings/leads so an owner sees only their territory;
  corporate admin sees everything. This is the one change that touches existing queries.
- Owner dashboard at `/franchise-portal`: their bookings, leads, revenue estimate, QA scores.
- QA scorecards and training sign-offs from the manual, stored and reportable.
- Royalty/reporting deferred until the FDD defines the economics.

## Technical notes

- Routes: `src/routes/franchise.tsx` (public, SSR, own head/canonical/og + FAQPage JSON-LD),
  `src/routes/_authenticated/admin/franchise.tsx`, later `_authenticated/franchise-portal/`.
- Server functions in `src/lib/franchise.functions.ts`; inquiry insert goes through
  `saveContactSubmission` so repeat candidates append and show in the Returning contacts panel.
- Migration per phase: Phase 1 adds `franchise_inquiries` with GRANTs (authenticated + service
  role, no anon) and admin-only RLS via `private.has_role`; Phase 3 adds locations, role, and
  scoping columns.
- Emails via the existing catalog/override system so you can edit them in Admin -> Emails.
- Sitemap + robots updated for `/franchise`; admin and portal routes stay `noindex`.

## Suggested order

Phase 1 first — it starts collecting real candidate demand and costs the least. Phase 2 next,
since the manual is what makes Phase 1 credible and is required before you can train anyone.
Phase 3 only once you have a signed owner or the FDD is underway.

## Open items for you

- Confirm you want me to proceed phase by phase (I'd start with Phase 1 only).
- For the manual: your actual chemical brands, equipment supplier, and insurance carrier, or I
  leave those as marked fill-in fields.
