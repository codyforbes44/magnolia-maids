# Maggie in Slack

Maggie already works on the website, by phone, by email/text, and in the Facebook Messenger inbox. This adds Slack: she posts what's happening in the business to your `#magnolia` channel, answers questions there, and can take a few actions when you ask.

## One decision up front

You picked both "each app user connects their own Slack" and "custom Slack app so Maggie can reply in-channel." Those two can't both be true — receiving Slack events requires one custom Slack app installed in your workspace, and Lovable's per-user connector can only send. Since Maggie is already a member of your workspace through hello@magnoliamaids.pro and lives in one channel, this plan builds the **custom Slack app** (one workspace install). If you later want each admin to link their personal Slack, that can be layered on separately.

## What you get

**Notifications into #magnolia**
- New lead, new booking request, new job applicant, new property/franchise inquiry
- Finished Maggie phone calls (outcome + short summary), and Messenger threads that need you
- Each post is a compact card with the person's name, contact preference, what they asked for, and a link straight to that record in the admin dashboard
- Per-event on/off switches so you only get what you care about

**Maggie answers in-channel**
- Mention `@Maggie` in `#magnolia`, or DM her, and she replies in a thread
- She uses the same knowledge base and the same live pricing engine as the website chat and phone agent, so quotes are real numbers, never invented
- She follows the thread, so you can go back and forth naturally

**Actions from Slack**
- Ask for a quote ("3 bed 2 bath 2,400 sq ft deep clean in Durant") and get the real price breakdown
- Look up a lead, applicant, or booking by name or phone and get the current record plus its outreach history
- Tell Maggie to follow up with someone and she drafts and sends on that person's preferred channel — the same engagement path as the "Engage Maggie" button in the admin
- Check today's and this week's schedule
- Anything that sends a message to a customer confirms in-channel first, so nothing goes out by accident

**Admin Slack panel** (`/admin/slack`)
- Connection status, workspace and channel, and a "Send test message" button
- Channel picker, notification toggles, and a master switch for Maggie answering in Slack
- A log of every Slack message sent and received, with the outcome

## Setup you'll do once

I'll create the app code and webhook URL first, then hand you a ready-to-paste Slack app manifest with the URL already filled in. You create the app at api.slack.com/apps from that manifest, install it to your workspace, invite it to `#magnolia`, and then give me the Bot User OAuth Token and Signing Secret to store as secrets. No other Slack setup is needed.

## Technical notes

- Custom Slack app, not the managed Slack connector: Events API requires a request URL, which the connector can't provide. Secrets: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`.
- New `src/routes/api/public/hooks/slack.ts` — handles `url_verification`, verifies `X-Slack-Signature` with the v0 HMAC scheme plus a 5-minute timestamp window, acks within 3 seconds, then processes the event. Ignores bot/self messages and dedupes on Slack `event_id`.
- New `src/lib/slack.server.ts` — thin Web API client (`chat.postMessage`, `conversations.list`, `auth.test`, `users.info`), Block Kit builders for the notification cards, and settings/log persistence. Checks both HTTP status and the `ok` field on every response.
- New `src/lib/slack-agent.server.ts` — mirrors `messenger-agent.server.ts`: prompt from `src/agents/knowledge.ts`, Lovable AI Gateway tool loop with `get_quote`, `lookup_record`, `check_availability`, `engage_contact`, `list_schedule`, all delegating to the existing `/api/public/agent/*` routes, `src/lib/pricing.ts`, and `maggie-engage.server.ts` so nothing drifts.
- New `src/lib/slack.functions.ts` server functions for the admin panel: status, channel list, settings read/write, send test, read log.
- Migration: `slack_events` (event_id unique, dedupe + inbound log) and `slack_messages` (outbound log with channel, thread_ts, kind, payload, status). Admin-only RLS, service-role writes, GRANTs per table.
- Settings stored in `business_settings` under `slack` (channel id, per-event toggles, answer-in-channel switch).
- Notification hooks added at the existing insert points (lead, booking, application, property, franchise, post-call, Messenger handoff) as fire-and-forget calls that never block or fail the underlying submission.
- New route `src/routes/_authenticated/admin/slack.tsx` plus an entry in `src/lib/admin/nav.ts`.
