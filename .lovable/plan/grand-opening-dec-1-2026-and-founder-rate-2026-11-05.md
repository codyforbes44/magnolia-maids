# Grand opening Dec 1, 2026 and founder rate

## What visitors will see
- A thin banner across the whole public site with "Grand opening December 1, 2026" and a live countdown. It disappears after opening day.
- The homepage, pricing, booking, quote, about, Airbnb and FAQ pages talk about the grand opening again.
- The founder rate offer: **the first 100 clients get 15% off every cleaning, for life.**
- Quotes and the pricing calculator show the regular price, the 15% founder savings, and the founder price.
- The booking calendar won't allow any date before December 1, 2026. Its message reads "Our first cleanings start on opening day, December 1, 2026."
- A "Founder spots remaining" counter based on real bookings. It is hidden once all 100 spots are taken.

## Maggie and messages
- Maggie's scripts and knowledge for voice, chat, text and Messenger mention the Dec 1 opening and the founder rate. Her quotes include the 15% discount while spots remain.
- Quote and booking confirmation emails and texts mention the founder rate when it applies.

## Admin
- Bookings and quotes show a "Founder" tag on the first 100 clients.
- The admin quote builder has a founder rate on/off switch, turned on by default while spots remain.

## Technical details
- `src/lib/availability.ts`: set `OPENING_DATE = "2026-12-01"` and update the message.
- `src/lib/pricing.ts`: add `FOUNDER_DISCOUNT = 0.15` and `FOUNDER_LIMIT = 100`. Apply them in the quote breakdown (InstantQuote, HomeDetailsPicker, /quote, admin quote builder, `/api/public/quote`).
- Founder count = the number of distinct client emails across confirmed and pending bookings. It comes from a public server function that returns only the count.
- Recreate `GrandOpeningBanner.tsx` and mount it in `__root` on public routes only.
- Update `src/agents/knowledge.ts` and the concierge prompt so Maggie mentions the opening and founder rate instead of being told never to. Update `BUSINESS.status`, the structured data, llms.txt and the FAQ.
- Update the email and SMS templates to add a founder line.
- Add a test to `pricing` to cover the 15% discount and the 100-spot limit.
