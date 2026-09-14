# One-page job application for any role

A single, self-contained application page at `/apply` that works for every kind of applicant — house cleaner, team lead, operations assistant, or someone applying on spec — instead of sending people to role-specific pages.

## What the applicant sees

One page, no multi-step wizard, with the site header and footer like any other page:

1. **Short intro** — who we're hiring, pay-free framing, Durant / Bryan County / Lake Texoma area, and the plan.It Family perk for team members.
2. **Which role** — a dropdown covering House Cleaner, Team Lead, Operations Assistant (remote, part-time), and "Other / not sure", plus a free-text box that appears for "Other".
3. **Employment type** — Part-time, Full-time, Open to either.
4. **About you** — name, email, phone, city/area, preferred contact method (email, text, call), SMS consent checkbox (same wording used elsewhere for compliance).
5. **Availability** — days/times plus hours per week.
6. **Experience and anything else** — two short text areas.
7. **Submit** — then a friendly confirmation panel on the same page: what happens next, expected reply time, office phone, and a link back to the careers page.

Fields that only matter for the remote office role (tools you know) appear only when that role is selected, so the form stays short for everyone else.

## Where it connects

- Existing careers pages keep working. The Careers page and the Operations Assistant page each get a link to the new general application for people whose role isn't listed.
- Submissions land in Admin → Applications exactly like current ones, with the chosen role, and flow into the existing applicant emails, Slack alert, and Maggie follow-up.
- The applicant gets the existing confirmation email; office gets the existing internal copy. The Operations Assistant version is used automatically when that role is chosen.

## Technical notes

- New route `src/routes/apply.tsx` with its own `head()` (title, description, og/twitter tags) and an `Apply` component; reuses `ContactPrefPicker`, `SmsConsentCheckbox`, and existing form styling.
- Submits through the existing `submitCareersApplication` server function in `src/lib/careers.functions.ts`. Its schema already covers role, employmentType, hoursPerWeek, tools, contactPref and smsConsent, so no schema or database change is needed.
- `isOpsAssistantRole` already routes to the ops-assistant email templates based on the role string, so choosing that role in the dropdown gets the right emails automatically.
- Add the page to `public/llms.txt` and the sitemap alongside the other public routes.
- No migration, no new tables, no new emails.
