# Make Maggie always answer in Slack

## What I found

- The webhook itself is healthy. I sent a signed Slack-style request to both the preview URL and magnoliamaids.pro: both returned `200` and echoed the verification challenge, so the signature check and the route are working.
- The inbound event table (`slack_events`) is completely empty — not one message from your DM, your @mention, or your channel post ever reached the app. Slack is not delivering events yet.
- Settings are correct: channel `#magnolia` (`C0BQPA52NCC`), "answer in channel" on, all notifications on.

So there are two separate things to fix: Slack's side isn't sending, and our side has gaps that would keep some of your three messages unanswered even once it does.

## Gaps on our side

1. **Plain channel messages are ignored by design.** Today Maggie only answers a DM or an explicit `@Maggie` mention. Your third test (a normal message in `#magnolia`) would be dropped even with events flowing.
2. **The 3-second rule.** Slack expects an acknowledgement within 3 seconds; Maggie's answer takes longer than that. Right now we think, then ack — so Slack marks the delivery failed and retries, and we throw every retry away. If the first attempt is ever cut short, the reply is lost with no trace.
3. **No visibility.** Events that get filtered out are never recorded, so "nothing happened" and "we chose to ignore it" look identical.
4. **`/maggie` slash command breaks.** Slack sends slash commands as form data, not JSON — the current handler fails to parse it and returns an error.

## What I'll change

**Webhook (`src/routes/api/public/hooks/slack.ts`)**
- Log every inbound event to `slack_events` first, before any filtering, with a reason when it's skipped.
- Acknowledge Slack immediately (under 3s) and run Maggie's answer in the background, so a slow model reply never causes a timeout.
- Stop blanket-ignoring retries; dedupe on Slack's `event_id` instead, which is the correct guard.
- Parse and handle `application/x-www-form-urlencoded` bodies so `/maggie` works: ack instantly, then post the answer back to the channel.

**Agent (`src/lib/slack-agent.server.ts`)**
- Answer plain messages in the configured channel too, not just mentions — with the guards that keep it sane: never reply to itself or other bots, skip thread noise it isn't part of unless mentioned, and always reply in a thread.
- Add a `channelMode` setting (`mention only` / `every message`) so you can dial that back from the admin page; default to answering everything in `#magnolia` plus all DMs, which is what you asked for.
- If the model call fails, post a short "couldn't answer that" in-thread and record the error, so silence is never the outcome.

**Admin (`/admin/slack`)**
- New "Received from Slack" list showing each inbound event, whether Maggie answered, and why not if she didn't.
- Channel-reply mode selector, and a diagnostics line showing whether the app is receiving events at all.

## Slack-side setup (needs you)

Since nothing is arriving, the app's Event Subscriptions almost certainly aren't active. In your Slack app config:
- **Event Subscriptions → Request URL:** `https://magnoliamaids.pro/api/public/hooks/slack` — it should show *Verified*.
- **Subscribe to bot events:** `app_mention`, `message.channels`, `message.groups`, `message.im`.
- **Scopes:** `app_mentions:read`, `channels:history`, `groups:history`, `im:history`, `chat:write`, `chat:write.public`, `commands`, `users:read`.
- **Reinstall the app to the workspace** after any scope change — new scopes do nothing until you reinstall.
- Confirm `@Maggie` is a member of `#magnolia`.

I'll give you an updated manifest pointed at the production domain (instead of the preview URL) as part of this work, so both events and `/maggie` land on the stable address.

## Verification

After the changes and the reinstall, I'll send a DM, an @mention, and a plain channel message, and confirm each one shows up in the inbound log with a posted reply.
