# Move Magnolia Maids to North Dallas

Remove every Durant / Oklahoma / Texoma reference (about 850 mentions in about 100 files) and rebrand the whole site, Maggie, emails, texts and admin as an upscale North Dallas service.

## Service area (new)
- Highland Park & University Park
- Preston Hollow & North Dallas
- Plano, Frisco, Allen, McKinney
- Addison, Richardson, Southlake

Each gets its own service-area page with local copy (neighborhood names, home styles, ZIP codes). All Durant, Calera, Caddo, Denison, Sherman, Lake Texoma and other Oklahoma/Texoma area pages are removed.

## Pricing (raised for Dallas)
Proposed new base prices (the square-footage multipliers and add-ons stay the same):
- Standard: $129 to $169
- Deep: $249 to $329
- Airbnb turnover: $119 to $149
- Move-out and post-event go up by the same ~30%

The live quote, booking, the admin quote builder, the PDF quote, the quote lookup Maggie uses, and Maggie's pricing notes all update together.

## Contact and identity
- Phone: you picked a new Dallas number but didn't give it. Every place that shows the phone number will read from one setting, so it changes in one spot when you send it. Until then the current number stays. The texting and calling line in Twilio has to be swapped on your side too.
- Address and map pin: North Dallas (Preston Hollow area) and Central Time. Hours stay Mon–Fri 8–5.
- Search and Google info: Dallas, TX business details, service-area list, a new sitemap, and new page titles and descriptions.
- Weather widget moves to Dallas. Address autocomplete and the map focus on the Dallas area.

## Content sweep
- Public pages: home, services, pricing, about, careers, FAQ, community, franchise, Airbnb, move-out, post-event, plan.It, quote, booking, legal and SMS terms.
- Maggie and the other agents: prompts, knowledge base, scripts, and the voice agent's saved knowledge.
- All email and text templates, Slack/Messenger replies, the outbound calling scripts, and Facebook/Nextdoor copy.
- Documents: the operations manual, AI summary file and knowledge base text get updated. PDFs that say Durant are rebuilt (operations manual, call forms) and flagged in the document library.
- Careers: pay ranges move to Dallas-market rates.

## New imagery
Generate new photos for the top of every public page: upscale North Dallas homes (Highland Park style brick and stone estates, modern Frisco/Plano homes, bright interiors), keeping the magnolia color scheme and logo.

## Not changing
- Past leads, bookings and applicants keep their saved addresses.
- Look and feel, the magnolia brand and Maggie stay.
- The Facebook page name/URL (MagnoliaMaidsOK) — you'll need to rename it on Facebook; I'll update the link once you do.

## Technical details
- Add `src/lib/business-info.ts` (name, phone, address, geo, timezone, areas); point SiteFooter, structured-data, emails, SMS, agents and LegalPage to it.
- Rewrite `src/lib/service-areas.ts` with new slugs; `service-areas.$area.tsx` and sitemap read from it.
- Update `src/lib/pricing.ts` base rates; update the `pricing.test` values if present; re-sync ElevenLabs knowledge via `elevenlabs-admin.server.ts`.
- Weather lat/lon to Dallas; Places autocomplete bias to Dallas bounds.
- Update the `business_settings` row in the database (city, timezone, phone) with a migration.
- Final check: search for durant|oklahoma|texoma|bryan county|580 returns nothing outside past migrations; typecheck; load key pages.
