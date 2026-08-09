# Refocus public site on client onboarding

Remove hiring/employment-classification language (W-2, 1099) from client-facing pages and de-emphasize careers so every public page drives quotes and bookings. The Careers page itself keeps both tracks.

## Public pages

- **Homepage** — remove the "We're hiring in Durant / Building our opening-day crew" section entirely, so the flow runs quote → services → seasonal offers → FAQ → book.
- **FAQ ("Who is coming into my home?")** — rewrite without classification labels: every teammate is background-checked, insured, trained on the same checklist, and you know who's arriving before they knock.
- **About page timeline (2026 entry)** — drop "W-2 or 1099 by choice"; keep flat pricing, trained crews, immaculate homes.
- **Navigation** — remove "Careers" from the main nav (Home, Services, Pricing, About, Airbnb, Book). Careers stays linked in the footer.
- Sweep the remaining public routes (services, pricing, service areas, Airbnb, apartment turnovers, post-event, seasonal pages) to confirm no other classification copy remains.

## Careers page (unchanged in substance)

`/about/careers` keeps the W-2 vs 1099 track comparison, role cards, pay ranges, FAQ, JobPosting schema, and the track selector in the application form. Only the footer links to it.

## Not changed

Admin dashboards, hiring emails, and the chatbot knowledge base keep their W-2/1099 details — those audiences need the distinction.

## Technical notes

- Files touched: `src/routes/index.tsx`, `src/lib/faq.ts`, `src/routes/about.index.tsx`, `src/components/SiteNav.tsx`.
- FAQ text is centralized, so the homepage accordion, `/faq`, and FAQPage JSON-LD update together.
- Clean up imports left unused after deleting the homepage hiring block; verify with a typecheck and a mobile/desktop render check for layout gaps.