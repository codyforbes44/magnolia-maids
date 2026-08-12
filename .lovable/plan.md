# Outbound calling with Maggie

Give Maggie the ability to phone leads, customers, and job applicants for follow-up, and give admins a place to queue, schedule, assign, and review those calls.

## What already exists

- The business line (580) 745-0045 is already registered in the voice platform and assigned to the Magnolia Maids concierge agent, and it supports outbound calling.
- Maggie already has tools for texting, emailing, checking availability, and booking on the calendar.
- Post-call transcripts already flow into the owner inbox through the post-call webhook.

## What gets built

### 1. Outbound call queue (database)

A new `outbound_calls` table holding one row per planned call: who to call (name, phone, email), which record it came from (booking request, campaign lead, property/franchise inquiry, job application), the purpose, a call script/goal note, the agent to use, scheduled time, status (queued, scheduled, dialing, completed, no answer, failed, canceled, do-not-call), assigned admin, attempt count, outcome notes, conversation ID, and transcript summary.

Plus a `call_opt_outs` table so anyone who asks not to be called is permanently excluded.

### 2. Admin console: Calls

A new admin page `/admin/calls` with:
- **Queue tab** — every planned call with filters by status, purpose, assignee, and date. Inline actions: call now, reschedule, reassign, cancel, mark do-not-call, add outcome notes.
- **New call** — pick a contact from existing leads/bookings/applicants (or type a number), choose the purpose from preset follow-up types, pick the agent, add context notes, and either dial immediately or schedule a time.
- **Bulk queue** — select multiple leads from an existing list and queue the same follow-up type for all of them, spaced out inside calling hours.
- **History tab** — completed calls with duration, outcome, transcript summary, and a link to the full transcript.

Existing admin lists (Leads, Bookings, Applications, Properties, Franchise) each get a "Queue call" action that pre-fills the new-call form with that contact.

### 3. Placing the call

A server function dials through the voice platform using the Magnolia number, passing the contact's name, purpose, prior context, quote/booking details, and calling instructions to the agent so Maggie opens the conversation already knowing why she is calling.

A small scheduler endpoint runs on a schedule and dials anything whose scheduled time has arrived, respecting calling rules.

### 4. Maggie can request follow-up calls herself

A new agent tool lets Maggie queue a callback during a chat or call ("I'll have someone call you tomorrow at 10") — it creates a queued call row rather than dialing instantly, so nothing goes out unsupervised.

### 5. Guardrails

- Calling hours limited to 8:00am–8:00pm Central; anything scheduled outside is held to the next open window.
- Opt-out list checked before every dial; "do not call" requests captured from transcripts are flagged for admin confirmation.
- Max attempts per contact (default 3) with a cool-down between attempts.
- Concurrency cap so the queue never dials a burst at once.
- Every dial is logged with who triggered it (admin name or Maggie).

### 6. Results loop

The existing post-call webhook is extended to match the conversation back to its call row: it stores duration, transcript, summary, and detected outcome (booked, callback requested, not interested, voicemail, do-not-call), updates the status, and emails the owner inbox as it does today.

## Technical notes

- Table `outbound_calls` and `call_opt_outs` in Lovable Cloud, admin-only RLS plus service-role grants, indexed on status/scheduled_at.
- Dialing via `POST /v1/convai/twilio/outbound-call` with `agent_phone_number_id` for the +1 580 745 0045 number, passing `conversation_initiation_client_data.dynamic_variables` for contact context and a per-call prompt override for the purpose.
- New files: `src/lib/outbound-calls.server.ts` (dial, guardrails, scheduling), `src/lib/outbound-calls.functions.ts` (admin server fns), `src/routes/_authenticated/admin/calls.tsx`, `src/routes/api/public/agent/schedule-call.ts` (Maggie's tool), `src/routes/api/public/calls/dispatch.ts` (scheduler tick, secret-protected).
- `src/routes/api/public/elevenlabs/post-call.ts` gains conversation-to-call reconciliation and outcome parsing.
- Agent-side: register the `schedule_callback` tool on all three agents and add outbound-call etiquette (identify business, state reason, honor do-not-call) to the shared knowledge base.
