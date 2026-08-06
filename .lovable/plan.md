# Rebrand: Splash (Miami) → Magnolia Maids (Durant, OK)

A full brand, content, and design-system rebrand. Same site structure and features — new name, new market, new upscale look inspired by the magnolia bloom.

## Brand direction

Inspired by the attached magnolia: creamy ivory petals, soft cream shadow, deep glossy laurel-green leaves, a whisper of golden stamen.

- Palette: ivory/porcelain background, deep magnolia-leaf green as primary, warm brass/gold as accent, charcoal-green text.
- Typography: elegant high-contrast serif for headings (Cormorant / Instrument Serif register) with a clean, quiet sans for body — replaces the playful Fraunces + Nunito pairing.
- Tone: refined, understated Southern hospitality. Fewer emoji, calmer motion, generous whitespace, thin gold hairline dividers, subtle petal/leaf motifs instead of bubbles and waves.
- Mascot: the cartoon dolphin is retired. A minimal magnolia bloom mark becomes the logo; a soft magnolia hero image replaces the Miami interior.

## Name and location changes

- "Splash" → "Magnolia Maids" everywhere (nav, footer, titles, legal, emails, chat widget, admin).
- Miami / South Florida / neighborhood names → Durant, OK and the Bryan County area (Durant, Calera, Caddo, Mead, Colbert, Silo, Lake Texoma).
- Contact: hello@magnoliamaids.com, local Durant phone placeholder, Durant OK service area.
- Grand opening date and countdown kept, restyled to the new palette (say the word if the date should change).

## Pages reviewed and rewritten

Home, Services, Pricing, About, Careers, Airbnb Turnover, Booking, Auth, Privacy, Terms, Cookies, plus admin screen labels.

- Home: new magnolia hero, refined value props, Durant-area coverage list, testimonials rewritten with Oklahoma names, calmer animations.
- Services / Pricing: same offerings and interactive builders, upscale visual treatment, copy retuned to the Durant market.
- Airbnb Turnover: repositioned for Lake Texoma / Durant short-term rentals (casino and lake-weekend guests).
- About / Careers: Durant-rooted brand story and timeline; roles and pay ranges kept, copy localized.
- Legal pages: entity name, contact, and Oklahoma governing-law references.

## Technical notes

- `src/styles.css`: replace the Miami oklch tokens with the magnolia palette; rename `bg-ocean` / `text-ocean` / `bg-sky-wash` utilities to magnolia equivalents and update every consumer; swap the Google Fonts link in `__root.tsx`.
- Components: `SiteNav`, `SiteFooter`, `GrandOpeningBanner`, `BeforeAfter`, `LegalPage`, and the chat widget (renamed from `SplashChatWidget`).
- Email system: `src/lib/email/layout.ts` + `templates.ts` restyled and re-worded; sender display name becomes "Magnolia Maids" (still sending from the verified bookme.bet domain unless a new one is verified).
- SEO: every route `head()` title/description, JSON-LD `LocalBusiness` address/geo → Durant OK, `robots.txt`, `llms.txt`, sitemap.
- New assets generated: magnolia logo mark, hero image, and before/after replacements. Old `splash-mascot.png` / `miami-home.jpg` removed.
- No database, auth, booking-logic, or Facebook-integration changes.