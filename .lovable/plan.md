# Remove pre-launch / opening-day messaging

Magnolia Maids is now operating, so every public page should read like an open business: no September 1 date, no countdown, no "reserve before we open", and no founding-member framing.

## What changes on the public site

- **Homepage** — remove the "Grand Opening · September 1, 2026" badge, the "We open Sept 1" line, the "Reserve my Sept 1 slot" buttons, the "first slot" opening-day card, and the "Sept 1 / Grand opening" stat. Replace with open-for-business copy ("Now cleaning in Durant", next available visit, flat rate). "Our opening-day promises" becomes "Our promises". Page title and description rewritten without the opening date.
- **Booking page** — drop the grand-opening ribbon and the "first pick of Sept 1 slots" line; the page keeps its normal lead-time rules. Title/description rewritten.
- **Pricing, Airbnb turnover, post-event, planit-family** — "Founding-member rates", "Founding host rate", and "lock in launch pricing before Sept 1" become the standing offer: flat rates with recurring-plan discounts.
- **About timeline** — the "Sept 1, 2026 grand opening" entry becomes an "Opened in Durant" milestone; "Founding members now booking" becomes "Now booking across Durant and Bryan County".
- **FAQ** — "When does Magnolia Maids start cleaning?" is replaced with a currently-open answer (booking lead time and arrival windows). The same answer in the service-area pages is updated to match.
- **Service-area pages** — remove the opening-day question and the founding-rate promise.
- **Chat** — Maggie's launcher greeting and the chat footer drop the grand-opening line and founding-rate mention.
- **Careers** — "Founding Crew" becomes a standard cleaner role (House Cleaner, either track), and all "before our September 1, 2026 opening" phrasing is removed from the role cards, FAQ, application track selector, and the job-posting description.
- **Emails** — the quote and follow-up templates lose the "Founding-member pricing ends Sept 1" callout; replaced with the recurring-plan discount.
- **Machine-readable content** — `public/llms.txt` and the public knowledge base are updated so the chatbot and search crawlers stop saying we open September 1.
- **Maggie's knowledge** — the agent prompt and knowledge file drop "pre-launch", the grand-opening date, and founding rates so she never tells a caller we aren't open yet.
- The unused grand-opening countdown banner component is deleted.

## Not changed

- Booking availability rules stay exactly as they are (the September 1 floor is already in the past and blocks nothing).
- Admin pages, existing records, and archived marketing/social files keep their historical wording.

## Technical notes

Files touched: `src/routes/index.tsx`, `booking.tsx`, `pricing.tsx`, `airbnb-turnover.tsx`, `post-event-cleaning.tsx`, `planit-family.tsx`, `about.index.tsx`, `about.careers.tsx`, `src/lib/faq.ts`, `src/lib/service-areas.ts`, `src/lib/careers-pay.ts`, `src/lib/email/instant-quote.ts`, `src/lib/email/templates.ts`, `src/agents/knowledge.ts`, `src/agents/magnolia-concierge.prompt.md`, `public/llms.txt`, `public/magnolia-maids-knowledge-base.md`; delete `src/components/GrandOpeningBanner.tsx` (no imports).

FAQ copy is centralized, so the homepage accordion, `/faq`, and the FAQ structured data update together. After the edits: a typecheck, a repo-wide sweep for any remaining "Sept 1 / September 1, 2026 / founding" strings on public surfaces, and a mobile + desktop render check of the homepage and booking page for gaps left by removed blocks.
