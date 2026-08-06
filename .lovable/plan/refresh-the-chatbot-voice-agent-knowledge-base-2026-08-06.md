# Refresh the chatbot / voice-agent knowledge base

## What I found (verified against the code)

The knowledge base at `public/magnolia-maids-knowledge-base.md` and the live
prompt data in `src/agents/knowledge.ts` are accurate on prices, but both are
behind on newer offerings:

- **Bright Clean** is in the price table but has no "what's included"
  description anywhere in the knowledge base.
- **Seasonal campaign pages are missing entirely** — `/summer-on-the-lake`,
  `/referral-week`, and `/holiday-ready` exist in the app with real offers
  (Lake Texoma turnovers, referral credit for both parties, holiday deep clean +
  post-event bundle) but the agent has never heard of them.
- **`/post-event-cleaning` is missing** from the knowledge base website map
  (it is in the prompt data, but not in the uploaded document).
- Nothing tells the agent what happens **after** a booking: confirmation email,
  the calendar-hold file, and the next-day reminder email.
- No mention of the referral credit as an offer a caller can ask about.

## What I'll do

1. **Rewrite `public/magnolia-maids-knowledge-base.md`** so it covers everything
   the site offers today:
   - Add a Bright Clean description alongside the other services.
   - Add a new "Current promotions and campaigns" section with the three
     seasonal offers, what each includes, and the landing-page URL for each.
   - Add the referral credit (amount pulled from `src/lib/campaigns.ts`).
   - Add "what happens after you book" — confirmation email with the submission
     details, the add-to-calendar hold, and the reminder email.
   - Complete the website map with `/post-event-cleaning` and the three
     campaign pages.
   - Refresh the "last updated" line.

2. **Update `src/agents/knowledge.ts`** (the live prompt override the chat
   widget sends at session start) to match: campaign offers generated from
   `src/lib/campaigns.ts` so promos can never drift, the Bright Clean
   description, and the post-booking flow. Pricing keeps coming from
   `src/lib/pricing.ts` as it does now.

3. **Update `src/agents/magnolia-concierge.prompt.md`** with the same new
   talking points so the ElevenLabs system prompt and the document agree.

4. **Push the updated document to the ElevenLabs agent**
   (`agent_0001kygbk76rfwxrf6bef7z6xf1t`): upload the new file to the knowledge
   base, attach it to the agent, and detach/remove the previous version so there
   is only one source of truth. I'll confirm the agent's knowledge base lists the
   new document when it's done.

## Technical notes

- Campaign copy will be derived from the existing `CAMPAIGNS` definitions rather
  than retyped, matching how pricing is already generated.
- The ElevenLabs push uses the connector-synced `ELEVENLABS_API_KEY` against
  `api.elevenlabs.io/v1/convai` — no new secrets needed.
- No pricing values change; this is a coverage/accuracy update only.
