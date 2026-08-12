# Maggie in the Messenger inbox

Maggie can already answer, quote, capture leads, and book on the website and by phone. This gives her the same abilities inside Facebook Messenger, with you in control.

## How it works

**Auto-reply toggle.** A switch on the Marketing > Messenger tab turns Maggie's automatic replies on or off. When on, every new Messenger message from a customer gets an answer from Maggie within seconds, around the clock. When off, nothing sends automatically.

**Draft with Maggie.** Every thread gets a "Draft with Maggie" button. She reads the conversation and writes a reply into the reply box, which you can edit before sending. Works whether auto-reply is on or off.

**You can always take over.** The moment you send a manual reply in a thread, Maggie pauses automatic replies in that thread. A per-thread badge shows "Maggie handling" or "You're handling", with a one-click switch back. Maggie also hands off on her own when someone asks for a human, complains, or the question is outside what she knows — and the handoff shows in the inbox as "Needs you".

**What Maggie can do in a chat**
- Answer questions using the same knowledge base the website chat and phone agent use (services, hours, service areas, guarantee, policies).
- Give real quotes from the live pricing engine, including the square-footage adjustment — never invented numbers.
- Capture the person's name, phone, and email and save them as a lead in the leads dashboard, tagged as a Messenger lead, with the Facebook profile name attached.
- Check real availability and book the appointment, creating the same booking record, confirmation email, and calendar hold as a website booking.

**Guardrails**
- Replies only go out inside Facebook's 24-hour messaging window; outside it the thread is flagged for you instead of failing silently.
- Maggie never replies to her own messages or to yours, and never sends twice for the same customer message.
- Rate limited per thread, with a cap on consecutive Maggie messages before it hands off to you.
- Every automatic reply is logged and mirrored to the owner notification email, same as other Maggie interactions.

## Technical notes

- New `messenger_threads` table (page_id, thread_id, person id/name, auto-reply state, handoff reason, last inbound/outbound ids and timestamps, last AI reply at) plus `messenger_messages` for the durable transcript and dedupe. Admin-only RLS, service-role writes from the webhook. Auto-reply master switch stored in `business_settings`.
- New `/api/public/hooks/facebook-messenger` route reusing the same app-secret signature verification as the leadgen hook, and the Page subscription list in `facebook.functions.ts` grows to include `messages` and `messaging_postbacks`.
- New `src/lib/messenger-agent.server.ts`: builds the prompt from `src/agents/knowledge.ts` + `src/lib/pricing.ts`, calls the Lovable AI Gateway with tool definitions for `get_quote`, `check_availability`, `book_appointment`, `capture_lead`, and `handoff_to_human`, reusing the logic behind the existing `/api/public/agent/*` routes so pricing and booking cannot drift.
- Webhook flow: verify signature -> persist inbound message -> skip if auto-reply off, thread paused, echo, or duplicate mid -> run the agent -> send via Graph `POST /{page-id}/messages` -> persist the outbound message and update thread state.
- New server functions in `src/lib/facebook.functions.ts`: `draftMessengerReply`, `setThreadAutoReply`, `setMessengerAutoReply` (global). Messenger transcript reads prefer stored rows and fall back to Graph.
- `src/routes/_authenticated/admin/facebook.tsx`: global auto-reply switch, per-thread handling badge and pause/resume, "Needs you" filter, and the Draft with Maggie button in the reply composer.
- Requires the `pages_messaging` permission, already requested at connect time; if the token lacks it the panel keeps showing the existing re-authorize prompt.