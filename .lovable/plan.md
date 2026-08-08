# Refactor /quote for a mobile-first, high-converting experience

The `/quote` page is the landing page we send Facebook leads to: no header, no footer, just price + contact. Right now it is one long scroll where the price sits mid-page and the contact form is a 7-field block at the bottom. On a phone the price scrolls out of view exactly when someone is deciding, and the form asks for more than we need.

## What changes for the visitor

**1. Guided steps instead of one long form**
Three light steps with a slim progress bar at the top:
- Step 1 — Your clean: service + how often
- Step 2 — Your home: bedrooms, bathrooms, add-ons, pets
- Step 3 — Where to send it: contact + preferred day/time

Back/Continue at each step, state kept so nothing is lost when stepping back. On desktop the three steps render as a single two-column layout (choices left, price rail right) so larger screens are not artificially throttled.

**2. Price always visible**
A sticky price bar pinned to the bottom on mobile (safe-area aware) showing the live total, a one-line summary (service · beds/baths · frequency), and the primary action. It animates the number when it changes so the impact of an add-on is obvious. On desktop the same information becomes a sticky right-hand summary card.

**3. A shorter, friendlier form**
Only name, email or phone (at least one required), and preferred day/time stay required-ish; address and notes become optional and collapse behind "Add address / notes". Inline validation on blur, correct mobile keyboards (`inputMode`, `autoComplete`), phone auto-formatting, errors announced to screen readers, and the first invalid field scrolled into view.

**4. Clearer confirmation**
The success state recaps the exact quote sent, gives the call button, and states plainly that nothing is booked or charged.

**5. Trust + polish**
A compact reassurance line (flat rate, insured, no payment now), tap targets at 44px minimum, reduced-motion respected, and larger touch spacing on the steppers.

## Technical notes

- Refactor `src/routes/quote.tsx` into a small step machine (local `useState` step index), extracting presentational pieces into `src/components/quote/` (`QuoteStepper`, `StickyQuoteBar`, `QuoteSummaryCard`, `QuoteContactForm`) so the route file stays readable.
- Validation moves to a shared Zod schema in the same folder, used for both per-step gating and the final submit; server validation in `src/lib/quote-request.functions.ts` stays the source of truth and is unchanged.
- Pricing keeps coming from `src/lib/pricing.ts` (`quoteVisit`, `getServiceRate`) and home details keep using the shared `HomeDetailsPicker` — no pricing logic is duplicated or changed.
- Search-param prefill (`fromQuoteSearch`, `name`) keeps working, and prefilled leads skip straight to the step that still needs input.
- Submission still writes a `campaign_leads` row (campaign "instant-quote") and sends the admin + customer emails exactly as today. No booking is created.
- Layout follows the responsive rules: `grid-cols-[minmax(0,1fr)_auto]` header rows, `min-w-0` on text containers, `shrink-0` on icons; all colors stay on semantic tokens.
