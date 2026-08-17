# Communications Hub — one phone-shaped view for everything

A new admin-only page at `/admin/hub` that looks and behaves like a premium, welcoming phone: a device frame with a status bar, a home-style dock of channels, and full-screen "apps" for each conversation type. Personalized to the signed-in admin — their name, their assigned records, their reminders.

## The interface

```text
+--------------------------------+
|  9:41   Magnolia Maids   ...   |   status bar: your name, live counts
|  Good evening, Cody            |
|  3 unread · 1 missed call      |
+--------------------------------+
|  [Keypad] [Texts] [Chats]      |
|  [Email]  [Messenger] [Slack]  |   dock: badge counts per channel
+--------------------------------+
|  Today                         |
|  - Reminders (auto + yours)    |
|  - Upcoming bookings           |
|  - Active Facebook campaigns   |
+--------------------------------+
```

Left rail on desktop keeps the phone visible while a wider conversation panel opens beside it; on mobile the phone is the whole screen. Botanical Magnolia palette, soft shadows, rounded 44px device corners, tactile press states — warm and human, not a dashboard grid.

## Channels

**Phone (live browser calling).** A real dialer: keypad, contact search, click-to-call from any record, incoming call screen with accept/decline, mute, hold, hang up, and live duration. Uses the Twilio Voice SDK in the browser with a short-lived access token minted server-side. Call history merges browser calls with Maggie's existing outbound calls, showing status timeline, duration, outcome, and transcript summary.

**Texts.** Real two-way SMS threads grouped per contact: inbound and outbound bubbles in order, a reply composer, template quick-picks, consent state shown on the thread (opted in / opted out / unknown), and delivery status per message. Existing SMS log rows are backfilled into threads so history is not lost.

**Chats (Maggie voice + text).** Website chat and voice conversations, with transcripts rendered as a conversation, the lead it was tied to, and a "continue by text/email/call" action.

**Email.** Threaded view of every message sent to and about a contact, with HTML preview, status, resend, and a compose box that uses the existing branded templates.

**Facebook Messenger.** Live threads from the page inbox with the existing auto-reply toggle, needs-attention flag, and a reply box.

**Slack.** The magnolia channel feed with Maggie's replies and the ability to post from the hub.

Every channel shares one contact identity, so opening a person shows a unified timeline across all six channels plus their bookings.

## Today panel

- **Reminders** — auto-generated (unanswered texts, missed calls, Messenger threads needing attention, follow-ups due, jobs tomorrow) plus personal to-dos you create, each with snooze, done, and an optional link to the record.
- **Upcoming bookings** — next 7 days with time, service, address, and one-tap call/text to the customer.
- **Facebook campaigns** — active campaigns with spend, leads, and cost per lead, plus a warning when a token is close to expiring.

## Technical notes

- Route: `src/routes/_authenticated/admin/hub.tsx` inside the existing admin shell, added to `ADMIN_NAV` at the top. Phone chrome as `src/components/hub/*`.
- New tables (all admin-only RLS with explicit grants): `message_threads` and `messages` for unified SMS/Messenger/email/chat threading keyed by contact identity; `admin_reminders` for personal to-dos; `call_recordings` metadata is read from existing `outbound_calls` / `call_status_events`.
- Inbound SMS webhook (`/api/public/twilio/inbound`) starts writing into `messages` in addition to today's `email_log` entry; `sendSms` records outbound messages the same way. Consent handling and STOP/START keywords are untouched.
- Live calling needs Twilio Voice, which the connector gateway does not cover: new secrets `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_TWIML_APP_SID`. A server function mints the JWT access token; `/api/public/twilio/voice` returns TwiML for outbound dial and incoming routing; `/api/public/twilio/voice-status` records status events. The `@twilio/voice-sdk` package is loaded client-side only.
- Data access through `src/lib/hub/*.functions.ts` server functions with `requireSupabaseAuth` plus an admin role check, matching the existing outreach pattern. Polling refresh on a short interval for unread counts, with realtime on the messages table where available.
- The existing `/admin/sms-log`, `/admin/email-log`, `/admin/conversations`, `/admin/calls`, and Messenger views stay as-is; the hub composes the same data into one place.

## Sequencing

1. Phone shell, dock, today panel (reminders, bookings, campaigns) with real data
2. Texts with full two-way threads and backfill
3. Email, Chats, Messenger, Slack panels on the shared thread model
4. Live browser calling once the Twilio Voice credentials are in place
