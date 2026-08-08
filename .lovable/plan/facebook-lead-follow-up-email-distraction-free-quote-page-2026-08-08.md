# Facebook Lead Follow-Up Email + Distraction-Free Quote Page

## What we're building

1. A new **standalone instant quote page** at `/quote` — no header, no navigation, no footer, no chat bubble, no sticky mobile bar. Just the quote form, the live price, and a single "Book this clean" action.
2. A new **follow-up email template** the admin can send to any Facebook lead, with one big button pointing at that page (with the lead's name and, when known, service/home size prefilled through the link).
3. A **"Send instant-quote follow-up" button** in the admin Leads drawer, next to the existing "Resend thank-you email" action.

## The quote page

- Route `/quote`, rendered chrome-free: the global mobile book bar and chat launcher are suppressed on this path so the form is the only thing on screen.
- Reuses the existing quote engine (service, frequency, bedrooms/bathrooms, add-ons) so pricing always matches the rest of the site.
- Accepts link parameters so the email can preselect service, bedrooms, bathrooms, frequency, and the lead's name.
- Submitting carries the exact selection into the booking flow.
- Small trust line with the phone number as a fallback; `noindex` so it doesn't compete with the main pricing page in search.

## The email

Botanical Magnolia Maids styling matching the existing templates:
- Subject along the lines of "Your Durant cleaning price, {name} — 30 seconds".
- Short personal opener referencing their Facebook enquiry and the service they asked about.
- One primary CTA button to `/quote` with their details prefilled.
- Founding-member note and the call-us alternative.

## Admin action

In `/admin/leads`, the lead drawer gets a second email button. It sends the follow-up to that lead, shows success/failure inline, and is admin-gated the same way the existing resend action is.

## Technical notes

- New `src/routes/quote.tsx` (chrome-less, `noindex`), reusing `HomeDetailsPicker` / `src/lib/pricing.ts`; `__root.tsx` conditionally hides `MobileBookBar` and `ChatLauncher` on `/quote`.
- New template `instantQuoteFollowup(lead)` in `src/lib/email/` using the shared `renderLayout` from `src/lib/email/layout.ts`.
- New server fn `sendInstantQuoteFollowup` in `src/lib/campaign-leads.functions.ts`, `requireSupabaseAuth` + admin role check, loads the lead via the admin client and sends through `sendResendEmail`.
- Wire the button in `src/routes/_authenticated/admin/leads.tsx` with `useServerFn`.