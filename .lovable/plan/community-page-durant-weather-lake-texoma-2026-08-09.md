# Community page: Durant weather + Lake Texoma

A new `/community` page in the main nav that gives Durant and Lake Texoma visitors real local value — live weather, lake attractions, and seasonal cleaning tips tied to the forecast — while linking naturally into quotes and booking.

## Navigation

Main nav becomes: Home, Services, Pricing, About, **Community**, Airbnb, Book. The same link is added to the mobile sheet menu and to the footer.

## Page sections

1. **Hero** — "Living well around Durant & Lake Texoma", botanical hero background matching the other pages, one CTA to the instant quote.
2. **Durant weather right now** — live current conditions (temperature, feels-like, wind, humidity, short forecast) plus a 5-day outlook in cards. National Weather Service attribution, an "updated" timestamp, and a graceful fallback panel if the service is unreachable — no broken layout, no invented numbers.
3. **What the forecast means for your home** — three short seasonal tips (pollen season, summer lake dust and humidity, winter entryway grit), each linking to the matching service page.
4. **Lake Texoma attractions** — cards for the marinas, state parks, fishing spots, public ramps, and shoreline towns we serve, each with a short description and a link to the official source so visitors can verify hours and fees themselves.
5. **Planning a lake weekend?** — ties into the existing Airbnb turnover, post-event, and Host Weekend offerings for people hosting guests on the water.
6. **Where we clean** — internal links into the Bryan County and Lake Texoma service-area pages plus the FAQ.
7. **Closing CTA** — the shared quote/call component already used sitewide.

## Content standards

Only verifiable, publicly documented facts about parks, marinas, and public ramps. Anything uncertain is described generally or omitted. No invented ratings, prices, hours, or testimonials.

## SEO

Own `head()` with a Durant/Lake Texoma community title and description, og/twitter tags, and a canonical URL on magnoliamaids.pro. Added to the sitemap. Single H1, semantic sections, descriptive alt text.

## Technical notes

- New route `src/routes/community.tsx` reusing `HeroBackground`, `QuoteCallCTA`, and existing card styling with semantic design tokens only.
- Weather from the free National Weather Service API (`api.weather.gov`, no key) via a server function in `src/lib/weather.functions.ts`, pinned to the Durant, OK grid point, cached ~30 minutes, returning a typed fallback shape on failure.
- The route loader preloads the forecast with TanStack Query `ensureQueryData`; the component reads it via `useSuspenseQuery`.
- Lake attraction entries live in a small `src/lib/community.ts` data module so they are easy to edit later.
- Mobile-first layout, verified for zero horizontal overflow at 390px, 768px, and 1280px.