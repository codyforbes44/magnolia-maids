# Mobile hero refactor (homepage)

## What the screenshot shows
On a real phone the hero eats the entire first screen and gives back almost nothing:

- The grand-opening pill wraps onto two lines and pushes everything down.
- The headline renders at ~40px across three lines, so the subhead and buttons sit below the fold.
- The paragraph repeats the same "September 1, 2026 at 8:00 AM CST" line already in the pill.
- The primary button is partly covered by the floating chat bubble.
- The sticky bottom bar already says "Book a Cleaning", so the in-hero button is a third duplicate CTA.
- No photo, no price, no proof appears above the fold — nothing that makes the visitor want to scroll.

## The new mobile hero (under 375px, one screen)

```text
┌───────────────────────────────┐
│  photo band w/ soft ivory fade│  durant-home.webp, ~30vh
│   ● Opening Sep 1 · Durant OK │  single-line pill on the image
├───────────────────────────────┤
│  A quietly immaculate home,   │  32px display, 2-3 tight lines
│  every single week.           │
│  White-glove cleaning for     │  1 short line, no date repeat
│  Durant & Bryan County.       │
│  ┌─────────────────────────┐  │
│  │ Get my instant price  → │  │  single primary CTA
│  └─────────────────────────┘  │
│  Standard from $129 · flat    │  price + trust microline
│  Insured · Eco-safe · 24hr    │  3 chips, horizontal scroll
└───────────────────────────────┘
```

Changes, in order:

1. **Photo-first framing.** Reuse the existing hero photo through `HeroBackground` (light tone) as a short top band on mobile so the section reads as a premium home, not a wall of text. Desktop layout stays exactly as it is today.
2. **One-line badge.** Shorten mobile copy to "Opening Sep 1, 2026 · Durant, OK" with the live dot; the full string stays on `sm:` and up.
3. **Right-size the headline.** Drop mobile size to ~`text-[2rem]` with tighter leading and remove the `whitespace-nowrap` that forces awkward breaks; keep the laurel accent phrase.
4. **Trim the subhead** to one sentence and delete the duplicated launch date/time (it lives in the badge).
5. **Single primary CTA on mobile.** Keep one full-width "Get my instant price" that scrolls to the instant-quote widget; demote "Reserve my Sept 1 slot" to a quiet text link, since the sticky bar already owns booking. Both buttons return at `sm:` and up.
6. **Clear the chat bubble.** Add bottom-right padding on the mobile CTA row so the floating chat launcher never overlaps a tappable button.
7. **Value microline + trust chips.** Show "Standard clean from $129 · flat price, no hourly surprises" (read live from `lib/pricing.ts`, no hardcoding) and a compact scrollable row of Insured / Eco-safe / 24-hr guarantee, replacing the current avatar-stack row on mobile.
8. **Scroll affordance.** Subtle down-cue under the hero so the fold reads as a beginning, not an end.

## Technical notes

- Work stays in `src/routes/index.tsx` (hero section only) plus a small mobile-tone prop on `src/components/HeroBackground.tsx` if the band needs a shorter crop. No pricing, booking, or backend logic changes.
- Responsive rules follow the project pattern: mobile-first classes with `sm:`/`md:` restoring current desktop output; grid + `min-w-0` + `shrink-0` on any mixed text/icon row.
- Colors stay on existing tokens (ivory-wash, laurel, accent) — no new hardcoded values.
- Verified after the change with a 375px Playwright capture to confirm headline, CTA, price line, and chips all land above the fold with no chat-bubble overlap.
