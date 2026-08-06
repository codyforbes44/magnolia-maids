# Durant-focused refresh: Post-Party and Airbnb Turnover services

## What I found (verified in the code)

- Both services already exist as canonical rates in `src/lib/pricing.ts`: Airbnb Turnover $119 base (recurring discounts allowed), Post-Party $169 base (one-time only, no recurring discount).
- Post-Party has no page of its own — it is only a tab on `/services` with four bullets ("Same or next-day slots", "Dishes, glassware & floors", "Stain treatment", "Deodorizing & fresh air"). It is absent from the homepage, the knowledge base, and structured data.
- Airbnb Turnover has a full landing page, an 8-stage checklist PDF, FAQs, and JSON-LD.
- Bug on `/airbnb-turnover`: the service-area answer lists "Lake Texoma, Lake Texoma" twice and omits Mead and Achille (which the About page does list).
- Airbnb copy is written for generic hosts; nothing speaks to what actually drives short-term-rental demand here — Lake Texoma shoreline rentals, Choctaw Casino & Resort visitors, and Southeastern Oklahoma State University event weekends.

## Recommended changes

### 1. Make Airbnb Turnover read like a Lake Texoma service
- Reframe the hero and "why hosts choose us" copy around lake-house realities: sand and lake grit, boat-day laundry volume, docks/patios and outdoor furniture, back-to-back weekend bookings, and Friday-afternoon check-ins.
- Add a "Lake house add-ons" strip: patio/deck reset, extra linen sets for bunk rooms, grill wipe-down, sand-and-mud entry treatment.
- Add a peak-season note (Memorial Day through Labor Day, plus SOSU graduation and Choctaw event weekends): standing weekend slots are reserved first, so hosts should lock a recurring turnover day.
- Fix the duplicated "Lake Texoma" in the service-area FAQ and align that list with the About page (add Mead, Achille, Kingston, Colbert).
- Add a short "hosts we serve" line covering Airbnb, VRBO, and privately booked lake cabins and stays near the casino.

### 2. Give Post-Party a real presence
- Rename the offering to **Post-Event Clean** (still keyed as `Post-Party` in pricing so nothing breaks) so it clearly covers the events Durant actually hosts: graduation and holiday parties, church and family gatherings, wedding-weekend house rentals, tailgates, and hunting-camp weekends.
- Build a dedicated `/post-event-cleaning` landing page mirroring the Airbnb page's structure: hero, what's included, a same/next-day timeline, an event-type grid, pricing pulled from `src/lib/pricing.ts`, FAQs, JSON-LD, and share buttons.
- Add **pre-event prep** as a companion option (guest-ready before people arrive), not just the morning-after cleanup — locally this is the more common request around graduations and holidays.
- Add a **Host Weekend bundle**: pre-event prep + post-event reset booked together at a modest bundle discount instead of two unrelated one-time jobs.
- Surface Post-Event on the homepage service grid and in the site nav services list.

### 3. Keep every surface consistent
- Update `src/agents/knowledge.ts` and `public/magnolia-maids-knowledge-base.md` with the new naming, lake-season guidance, pre-event option, and bundle so the chatbot and the ElevenLabs agent quote the same thing.
- Add the new service to `src/lib/structured-data.ts` (OfferCatalog) and to `sitemap.xml`.
- Reflect any new service option in the booking wizard so a visitor can actually book what the pages advertise.

## Pricing question for you

The bundle and the pre-event option need numbers. My suggestion:
- Pre-Event Prep: $149 base (2bd/2ba), same per-bedroom/bathroom adders as Post-Event.
- Host Weekend bundle (pre + post): 10% off the combined total.
- Lake-house peak season: no surcharge — keep the existing +15% condition range.

Say the word if you'd rather set different numbers, or if you want the bundle dropped.

## Technical notes

- All prices stay derived from `src/lib/pricing.ts`; the new page imports `getServiceRate`/`priceHome` exactly as `/services` does.
- Renaming is display-only: the `ServiceKey` union value `"Post-Party"` stays unchanged so existing bookings, the quote API (`src/routes/api/public/quote.ts`), and email templates keep working; a label map handles the user-facing name.
- The new route follows the existing pattern with `HeroBackground`, `ShareButtons`, head metadata, and a generated hero image.