# Auto-send the Facebook hiring follow-up 1–2 hours after a lead arrives

Today the "Facebook hiring lead — we'll be in touch" email only goes out when an admin clicks it in Admin → Applications. This adds an automatic send that fires roughly 1–2 hours after a hiring lead comes in from Facebook, while keeping the manual button.

## How it will work

1. A Facebook hiring lead lands in Applications (via the existing Facebook lead webhook). It is tagged as coming from Facebook.
2. A background job runs every 15 minutes. It picks up Facebook-sourced applications created between 60 and 150 minutes ago that have not had a follow-up yet.
3. Each one gets the "Facebook hiring lead — we'll be in touch" email, using whatever wording is currently saved in Admin → Emails.
4. The application is stamped as followed-up so it can never be emailed twice, and the send shows in the email log.

The 60–150 minute window (rather than exactly 1–2 hours) gives the job a safety margin so a missed run does not skip a lead.

## Admin experience

- Applications list and drawer show whether the automatic follow-up already went out, and when.
- The manual "Facebook hiring follow-up" button stays available; sending it manually also stamps the record so the automatic job skips it.
- Only Facebook-sourced hiring leads are auto-emailed. Applications submitted on the Careers page keep their existing immediate confirmation and are not double-emailed.

## Technical notes

- Migration on `public.job_applications`: add `source text not null default 'website'` and `followup_sent_at timestamptz`, plus an index on `(source, followup_sent_at, created_at)`. Existing rows whose `notes` contain `Facebook Lead Ads` are backfilled to `source = 'facebook'` with `followup_sent_at = now()` so historical leads are not blasted.
- `src/lib/facebook.server.ts`: set `source: 'facebook'` on the hiring-form insert.
- New server route `src/routes/api/public/hooks/send-hiring-followups.ts`, mirroring `send-reminders.ts`: anon-key `apikey` header check, `supabaseAdmin` query for `source = 'facebook'`, `followup_sent_at is null`, `created_at` between now-150m and now-60m; render via `facebookHiringFollowup` + `applyOverride('facebook-hiring-followup')`; send through `sendResendEmail` with `templateId: 'facebook-hiring-followup'` and `relatedId`; then stamp `followup_sent_at`. Returns counts for observability.
- `pg_cron` schedule `*/15 * * * *` calling that route on the stable production URL with the anon key in the `apikey` header (insert tool, not a migration).
- `sendApplicantFollowup` in `src/lib/careers.functions.ts` also stamps `followup_sent_at` when the Facebook template is sent manually.
- `src/routes/_authenticated/admin/applications.tsx`: surface follow-up status.