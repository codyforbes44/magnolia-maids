# Pause Magnolia Maids: "Maggie is resting" homepage

## What visitors will see

- A new, calm homepage: an illustration of Maggie resting (curled up with a magnolia blossom, soft evening light), in the existing magnolia palette and fonts.
- Headline: "Maggie is taking a little rest." Message: "Sometimes you need to pause in order to do it right. Magnolia Maids is taking a short break to come back better than ever. Thank you to every Durant family who welcomed us into their home."
- Small contact line ([hello@magnoliamaids.pro](mailto:hello@magnoliamaids.pro)) for current clients, no booking or quote buttons, no chat bubble, no promo nav.

## What gets archived

- All public marketing pages (services, pricing, booking, quote, about, careers, apply, Airbnb, event, move-out, apartment, campaigns, service areas, community, FAQ, franchise, plan.It, Nextdoor, etc.) are moved into an archive folder in the code, not deleted, so they can be restored in one step later.
- Any old public link redirects to the new homepage, so shared links and Google results land on the pause message instead of an error.
- Kept live: Privacy, Terms, SMS Terms, Cookies (legal requirement), sign-in / password reset, the admin dashboard, client account pages, and pay links/checkout return.
- Sitemap and the AI site summary shrink to just the homepage and legal pages.

## Behind the scenes (kept running)

- Admin dashboard, Comms Hub, and all records stay intact.
- Automated outreach (Maggie follow-up calls, auto texts/emails, Facebook auto-replies) is paused with the existing "engage Maggie" settings so no one is contacted to book a service that isn't available. Inbound texts STOP/HELP still work.

## Technical details

- Move archived route files to `src/_archive/routes/` (outside `src/routes`, so they are not built); keep shared components/libs untouched.
- Replace each archived path with a tiny redirect route (`beforeLoad: throw redirect({ to: "/", statusCode: 301 })`) to avoid 404s, including `service-areas/$area`.
- New `src/routes/index.tsx` with its own head() (title "Magnolia Maids is resting | Durant, OK", description, og tags, `robots: noindex` optional—kept indexable).
- Generate `src/assets/maggie-resting.webp` from the existing Maggie avatar for consistency.
- Simplify `SiteNav`/`SiteFooter` usage on the homepage (minimal header + legal links); hide `ChatLauncher` and `MobileBookBar` on `/`.
- Update `sitemap[.]xml.ts`, `public/llms.txt`; set business setting flags to disable auto follow-ups and outbound queue.
- Record in AGENTS.md: archived routes live in `src/_archive/routes` and restore by moving back.