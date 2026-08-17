# plan.It Family — free for every new client, plus a "how to reach us" section

Two additions to the marketing site:

1. A partner perk: every new Magnolia Maids client on a recurring plan gets the plan.It **Family** package (normally $10/mo) free for as long as they stay on the plan.
2. A new marketing section showing all the ways clients can now interact with us.

## 1. The plan.It Family perk

**The offer, in plain words**
- Free plan.It Family — up to 5 seats, shared lists and grocery, calendar sync, and the same assistant on voice, Slack, email, and chat.
- Included free while the client stays on a recurring cleaning plan (weekly, biweekly, or monthly).
- Open to all new clients, ongoing — not limited to the founding-member window.
- No card needed to claim; a redemption code arrives by email after booking.

**Where it appears**
- Homepage: a partner perk band with the plan.It logo, a "$120/yr value, yours free" line, and a link to plan.It.
- Pricing page: a callout near the plan cards and a line in the recurring-discount area, so the perk reads as part of the recurring value.
- Booking and quote pages: a compact one-line strip ("Recurring plans include plan.It Family free").
- Services page and FAQ: one new FAQ entry under Pricing — what plan.It is, what's included, how to claim.
- Footer: plan.It listed as a partner.

**Claim flow (email, no new database tables)**
- Booking and quote confirmation emails get a branded plan.It block: what the perk is, that it's free while on a recurring plan, and a "Claim your plan.It Family seat" button.
- The code is a single shared promo code stored in business settings so you can change it from admin without a code change; emails read it at send time.
- Maggie's knowledge base learns the perk so she can explain and offer it on chat, voice, Slack, Messenger, and SMS.

## 2. "How to reach us" section

A new sitewide section (homepage, plus a block on the services page) covering the interaction options now live:

- **Pick how we contact you** — email, text, or call, chosen on every form and honored on every follow-up.
- **Maggie by chat or voice** — type or talk, switch mid-conversation, full-screen mode.
- **Text us** — SMS replies from our Durant number, with easy opt-out.
- **Messenger & Slack** — Maggie answers in Facebook Messenger, and in Slack.
- **Your client dashboard** — next visit, reschedule requests, service history, home and pet profile.

Each item gets an icon, one line of copy, and a link to the relevant page or action (start chat, book, sign in).

## Technical notes

- The plan.It logo is uploaded as a CDN asset pointer and imported where the perk renders; no binary committed to the repo.
- New `src/components/PartnerPerk.tsx` (full + strip variants, mirroring `AccountPromo`) and `src/components/InteractionChannels.tsx`, each with a shared data array so copy lives in one place.
- Perk copy lives in `src/lib/partners.ts`; the promo code lives in a `business_settings` key read by the email templates.
- Email block added through the existing helpers in `src/lib/email/layout.ts` so it inherits current branding and the override system.
- `src/agents/knowledge.ts` gains a partner-perk section and an interaction-channels section.
- Head metadata on touched routes stays unique; no new routes.