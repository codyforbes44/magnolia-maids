# Client Dashboard — customer account experience

A signed-in home for Magnolia Maids customers: see upcoming and past cleans, manage their
appointments, and keep a saved home profile (entry, pets, preferences) so every visit runs
the same way without re-explaining.

## What the customer gets

**Overview** (`/account`)
- Warm greeting with next visit front and centre: date, arrival window, service, price, status.
- Quick actions: Book another clean, Request a change, Update home profile, Call the office.
- At-a-glance cards: total cleans completed, current plan (weekly/biweekly/monthly/one-time),
  saved home profile completeness nudge, referral link.

**Service history** (`/account/history`)
- Reverse-chronological list of every past visit with service, date, address, price and status.
- Filter by service type and year; each row opens the same detail view as an appointment.
- "Book this again" repeats a past visit in one tap.

**Appointments** (`/account/appointments` and `/account/appointments/$id`)
- Upcoming and past tabs; mobile-first cards, desktop table.
- Detail page shows the full booking: service, frequency, date/time window, home size, address,
  add-ons, notes, price estimate and status timeline (Requested -> Confirmed -> Scheduled ->
  Completed).
- **Request a change** and **Request cancellation** open a short form (preferred new dates,
  reason, note). It creates a request the office confirms — nothing on the calendar moves on its
  own. Customer sees "Change requested" with a pending badge until the office responds.

**Home profile** (`/account/home`)
- Entry & access: how we get in (someone home / lockbox / keypad / key on file / garage code),
  code fields, alarm instructions, parking notes.
- Pets: add multiple pets with name, type, temperament and where they'll be during the clean.
- Home details & preferences: beds, baths, square footage, rooms to skip, focus areas, product
  and scent preferences, supplies notes.
- Plan & billing preferences: frequency, preferred day and arrival window, standing add-ons,
  billing contact email/phone.
- Everything autosaves per section, is echoed into new bookings, and appears to the office on the
  admin booking detail.

**Profile & sign out** (`/account/profile`)
- Name, email, phone, password change, sign-out.

## Getting in

- Customers sign up with email + password from a "My account" link in the header and footer.
- On first sign-in, every existing booking and quote matching their email (or phone) is claimed
  automatically and appears in their history — no support ticket required.
- Confirmation and follow-up emails gain a "View your account" button.
- Signing in as an admin still lands in the admin console; customers never see admin surfaces.

## Design

Existing botanical brand: magnolia cream surfaces, deep green accents, generous spacing, rounded
cards, existing typography. Mobile-first — bottom-anchored primary action, single-column cards,
44px tap targets, sticky section nav on desktop (left rail) that collapses to a scrollable tab bar
on mobile. All colors via existing design tokens.

## Technical notes

**Database (one migration)**
- `customer_profiles` — one row per auth user (name, phone, marketing prefs), auto-created on
  signup by trigger; RLS scoped to `auth.uid()`, admins can read via `private.has_role`.
- `customer_homes` — entry method, codes, alarm/parking notes, beds/baths, sqft, skip/focus rooms,
  product prefs, preferred frequency/day/window, standing add-ons, billing contact.
- `customer_pets` — name, type, temperament, location during clean, notes.
- `booking_requests` gains `customer_id uuid` (nullable) plus an index; `campaign_leads` likewise.
- `service_change_requests` — booking id, type (reschedule | cancel), preferred dates, reason,
  status, admin response.
- Sensitive access codes are readable only by the owner and admins; GRANTs issued for
  `authenticated` and `service_role` on every new table (no `anon`).

**Claiming past work**
- A `claimCustomerRecords` server function (`requireSupabaseAuth`) stamps `customer_id` on
  `booking_requests` / `campaign_leads` where the email matches the verified auth email, or the
  normalised phone matches the profile phone. Runs on first dashboard load and after profile phone
  changes. Email match only trusts the verified auth email, never client input.

**Routes and data**
- New pathless layout `src/routes/_authenticated/account/route.tsx` renders `AccountShell`
  (sidebar/tab nav, header, sign-out) around `<Outlet />`; children are the pages above.
- All reads/writes go through `src/lib/account.functions.ts` server functions using
  `requireSupabaseAuth`, called from components with TanStack Query (loaders stay under the
  `_authenticated` gate where useful).
- Zod validation shared between form and server; inline field errors, optimistic saves, toasts.

**Admin side**
- Admin booking drawer shows the linked customer, their home profile (entry, pets, preferences).
- New `/admin/change-requests` list (and a badge in the admin nav) to approve, reschedule or deny
  change requests; approving updates the booking and emails the customer.

**Email**
- New templates: "Change request received", "Change confirmed", "Cancellation confirmed", plus a
  "Your account is ready" welcome — all through the existing catalog so they stay editable in
  Admin -> Emails and blank-safe.

**SEO / access**
- Account routes are `noindex` and live under the existing `_authenticated` gate.
