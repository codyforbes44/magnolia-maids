# SMS end-to-end verification and compliance hardening

Now that the Sole Proprietor A2P campaign and +1 (580) 745-0045 are approved, here is what I verified in the code and what needs to change before texting is fully functional end to end.

## Already wired correctly

- Outbound sending goes through the Twilio connector gateway and prefers the Messaging Service SID (the approved A2P route) over a raw From number. Both are configured, along with the connector key.
- Every send is logged (recipient, kind, status, Twilio SID, error) and appears in the admin SMS log.
- Inbound webhook handles STOP/UNSUBSCRIBE/CANCEL/QUIT/END, START/YES/SUBSCRIBE, HELP/INFO, plus a fallback auto-reply, all with admin-editable templates and an owner email copy of each inbound text.
- SMS touchpoints exist for: booking confirmation, owner alert, appointment reminders, manual admin events, lead and hiring follow-ups (preferred-contact routing), Maggie's `send_text` voice tool, and the template test send.
- Consent checkboxes are on the booking, quote, and careers forms and are stored on each record.

## Gaps to fix

1. **Inbound requests are not signature-verified.** `TWILIO_AUTH_TOKEN` is not set, so `/api/public/twilio/inbound` accepts any POST and only logs a warning. Anyone could forge a STOP or a fake inbound message. Request the Twilio Auth Token as a secret and make verification mandatory in production while still allowing local dev.

2. **Form consent never reaches the central consent table.** `sms_consents` is only written by inbound STOP/START. `getSmsConsent()` returns `true` when no row exists, so a lead who left the box unchecked can still be texted by the preferred-contact follow-up path, Maggie's send_text tool, or Maggie engagement. Fix: write an opt-in row to `sms_consents` whenever a form is submitted with the box checked, and treat unknown numbers as not consented for outreach sends while keeping direct replies to an inbound text allowed.

3. **Preferred-contact = text bypasses the consent checkbox.** `dispatchFollowup` sends a text purely on contact preference. Change it to require a recorded opt-in (checkbox or inbound START), falling back to email otherwise.

4. **Campaign, property inquiry, Facebook lead, and Messenger records default consent to false** with no opt-in path. Confirm those paths never text without consent after the change above.

## Live end-to-end verification

After the fixes, run a real pass and report results:

- Send a live test text from the admin SMS template tester and confirm the Twilio SID plus a `sent` row in the admin SMS log.
- Confirm the Messaging Service SID in the app matches the approved A2P messaging service and that +1 (580) 745-0045 is attached to it.
- Verify the inbound webhook URL on the number/messaging service points at `https://magnoliamaids.pro/api/public/twilio/inbound`, then confirm HELP, STOP, and START from a real handset update `sms_consents` and return the right auto-reply.
- Trigger a booking submission and a reminder run to confirm the confirmation and reminder texts render and send.

## Technical notes

- Files touched: `src/lib/sms.server.ts` (consent default, opt-in recording), `src/lib/followup-dispatch.server.ts` (require opt-in), `src/routes/api/public/twilio/inbound.ts` (mandatory signature check), plus the booking/quote/careers server functions to record consent centrally.
- One new secret: `TWILIO_AUTH_TOKEN` (Twilio Console > Account Info). Separate from the connector key; used only for HMAC-SHA1 signature validation.
- No schema change required; `sms_consents` already exists with a unique phone key.