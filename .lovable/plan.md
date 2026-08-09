# Remove advertised pay amounts

Pull every dollar figure tied to W-2 and 1099 opportunities out of the app. Nothing about the two tracks disappears — only the published wage numbers. Pay becomes a conversation during the interview instead of a public number.

## What changes

- **Careers page (`/about/careers`)**
  - Hero stat and perk card: "$14–$21/hr" becomes a non-numeric benefit ("Competitive pay + 100% of tips").
  - Role cards (House Cleaner, Team Lead, Airbnb Turnover): the pay line is replaced with a qualitative line such as "Competitive hourly pay + tips" — layout stays identical.
  - Track cards: W-2 shows "Hourly pay, discussed on your intro call"; 1099 shows "Per-job rate, discussed on your intro call"; Founding Crew keeps "Top-of-range on either track" without numbers.
  - Copy, FAQ answers, and the "W-2 or 1099 — your call" commitment lose "higher per-job rate" style dollar claims but keep the track distinction.
  - SEO title/description and the `JobPosting` structured data drop `baseSalary` and any wage text (a JobPosting without salary is valid).
- **Chatbot knowledge base** (`public/magnolia-maids-knowledge-base.md`): careers section keeps both tracks and all perks but removes the rate tables; adds an explicit rule that the agent must never quote a wage or per-job rate and should route candidates to the careers page or a recruiter callback. Re-upload the updated file to the ElevenLabs agent so voice/chat answers match.
- **Application confirmation email** (`src/lib/email/templates.ts`): the "Good to know" callout loses "$14–$21/hr" and "$55–$95 per job", keeping tips, weekly direct deposit, and supplies/uniforms.
- **Facebook hiring follow-up email**: verified for wage figures and cleaned if any remain.
- **`src/lib/careers-pay.ts`**: numeric fields are removed; the file becomes the single source for the non-numeric pay phrasing so every surface stays consistent.

## Verification

Search the whole codebase (routes, components, lib, emails, public assets) for wage-shaped strings — `/hr`, `per job`, hourly ranges — and confirm none remain in hiring context. Client-facing service prices are untouched. Typecheck plus a desktop and mobile render of the careers page to confirm no layout gaps where the pay lines were.
