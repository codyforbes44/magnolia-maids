# Twilio A2P 10DLC Campaign Registration — Magnolia Maids

Use this copy to complete the Twilio A2P 10DLC campaign registration form shown in your screenshot. The campaign is transactional, not promotional, so sample messages should reflect appointment/service notifications only.

## Messaging Service

Select your existing Messaging Service (e.g., `MG0d0ae5bde296ffa29cae3f62f1f8e9a6c`). Before registering, remove any extra phone numbers from that service so only the Magnolia Maids business number is attached to the campaign.

## Campaign description

> This campaign sends transactional SMS notifications to Magnolia Maids customers regarding their residential cleaning service appointments. Messages include booking confirmations, appointment reminders, cleaner arrival updates, reschedule notices, and post-service follow-ups. Messages are sent only to customers who have provided their phone number and opted in to receive text communications about their service.

## Sample messages (use these exactly)

Fill all five sample-message fields. These must be representative of the actual messages you send.

**Sample message #1** — booking confirmation
> Magnolia Maids: Thanks! We got your request. Standard Cleaning · Weekly · 3 bd/2 ba. Requested: Friday morning. Next: we confirm your exact arrival window within 1 business hour. Nothing is charged today. Questions? Call (580) 745-0045. Ref ABC12345

**Sample message #2** — appointment reminder
> Magnolia Maids reminder: Your cleaning is scheduled for tomorrow, Aug 12, between 9:00 AM and 11:00 AM. Ref ABC12345. To reschedule, reply RESCHEDULE or call (580) 745-0045.

**Sample message #3** — cleaner arrival
> Magnolia Maids: Your cleaning team is on the way and expected to arrive at 9:15 AM. Ref ABC12345. Reply STOP to unsubscribe.

**Sample message #4** — reschedule notice
> Magnolia Maids: We've updated your appointment to Thursday, Aug 13, 1:00 PM - 3:00 PM. Ref ABC12345. Call (580) 745-0045 with questions.

**Sample message #5** — post-service follow-up
> Magnolia Maids: Your cleaning is complete. We hope you love the results! Review us at https://magnoliamaids.pro. Ref ABC12345. Reply STOP to opt out.

## Message contents

Check the boxes that match your message templates:

- [x] Messages will include embedded links. (quote/booking links, review link)
- [x] Messages will include phone numbers. (reply-to business number)
- [ ] Messages include content related to direct lending or other loan arrangement.
- [ ] Messages include age-gated content as defined by Carrier and CTIA guidelines.

## How do end-users consent to receive messages? (40–2048 characters)

> End users opt in by providing their phone number on the Magnolia Maids website (magnoliamaids.pro) booking form, instant quote form, or customer account profile, and checking a box consenting to receive SMS notifications about their cleaning service. Opt-in also occurs when a user texts START, BOOK, or SUBSCRIBE to the Magnolia Maids business number. We send only transactional messages related to the user's service and do not send marketing/promotional texts without separate explicit consent.

## Privacy Policy URL

```
https://magnoliamaids.pro/privacy
```

## Terms and Conditions URL

```
https://magnoliamaids.pro/terms
```

## Opt-in Keywords (max 255 characters)

```
START, SUBSCRIBE, BOOK
```

## Opt-in Message (20–320 characters)

> Magnolia Maids: You're opted in to receive booking and service updates by text. For help, reply HELP. To stop, reply STOP. Msg & data rates may apply. Visit https://magnoliamaids.pro/privacy.

## Next steps after registration

1. Ensure `TWILIO_MESSAGING_SERVICE_SID` and `TWILIO_FROM_NUMBER` are correctly set in the app's environment.
2. Add a visible SMS consent checkbox to any public form that collects phone numbers (booking, quote, account profile) using language similar to the consent paragraph above.
3. Honor HELP/STOP/START replies automatically through Twilio opt-out handling or a webhook.
4. If you want the same content available in the admin dashboard, approve the follow-up plan to add an SMS settings card to `/admin/settings` with the exact templates above and a consent copy helper.
