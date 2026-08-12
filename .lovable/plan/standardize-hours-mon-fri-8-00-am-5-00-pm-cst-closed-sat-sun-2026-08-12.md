# Standardize hours: Mon–Fri 8:00 AM–5:00 PM CST, closed Sat & Sun

Today the site states hours three different ways (Mon–Fri 8–6 with Sat 9–4 in the knowledge base and agent prompt, Sat 9–3 in the booking rules, "Mon–Sat 8am–6pm" in the footer, and Sa 09:00–15:00 in search-engine structured data). Everything gets corrected to a single truth: **Mon–Fri 8:00 AM–5:00 PM CST, Saturday closed, Sunday closed.**

## Public-facing copy

- Footer contact block: "Mon–Fri · 8am–5pm CST" (currently "Mon–Sat · 8am–6pm").
- Booking page availability notes: "Monday–Friday 8:00 AM–5:00 PM CST. Closed Saturday and Sunday."
- Knowledge base page and `llms.txt` hours line updated to the new hours.

## Search engines

Structured data (LocalBusiness / opening hours) drops the Saturday entry and changes weekday closing from 18:00 to 17:00, so Google shows the correct hours.

## Maggie (chat + voice)

- Agent prompt and shared knowledge file updated with the new hours so Maggie never quotes 6 PM or Saturday again.
- Outbound calling window narrows from 8:00 AM–8:00 PM any day to **Mon–Fri 8:00 AM–5:00 PM Central**. Anything queued outside that window is held to the next open weekday, matching the existing hold behavior.

## Booking calendar (per your decision)

Saturday stays internally bookable — the calendar keeps the two Saturday windows so you can still take a Saturday job by request. Public copy simply no longer advertises Saturday. The one visible change is that the note under the calendar states weekday hours and describes Saturday as by-request rather than standard.

## Careers page

- Shift description changes from "8am–4pm, Monday to Saturday" to a Monday–Friday framing.
- The "Part-time · Weekends" role becomes a part-time weekday role, and the application availability options drop "Weekends".

## Technical notes

Files touched: `src/components/SiteFooter.tsx`, `src/lib/structured-data.ts`, `src/lib/availability.ts` (notes text only — slot definitions unchanged), `src/agents/knowledge.ts`, `src/agents/magnolia-concierge.prompt.md`, `public/magnolia-maids-knowledge-base.md`, `public/llms.txt`, `src/lib/outbound-calls.server.ts` (`CALL_WINDOW` plus weekday guard in the scheduling helper), `src/routes/about.careers.tsx`. No database or schema changes.
