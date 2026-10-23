# Update the share image for the paused homepage

## What changes
- Create a new 1200x630 link-preview image using the resting Maggie artwork: Maggie on the right, a soft cream and sage area on the left with "Magnolia Maids" and "Maggie is taking a little rest." in the brand fonts.
- Use it as the homepage preview on Facebook, iMessage, X, and LinkedIn instead of the old cleaning-promo image.
- Replace the old site-wide share image file so any older shared links also show the resting message.

## Technical details
- Make the image with imagegen from `src/assets/maggie-resting.jpg`, framed at 1200x630 and kept to a few hundred KB.
- Save it over `public/og-magnolia-maids.jpg`, plus a copy at `public/og-maggie-resting.jpg`. Using a new file name gets around cached previews.
- In the head() of `src/routes/index.tsx`, add `og:image` and `twitter:image` set to `https://magnoliamaids.pro/og-maggie-resting.jpg`, plus `og:image:width` and `og:image:height`.
- The new image reaches the live site on the next publish. After that, Facebook's Sharing Debugger can refresh its cached preview.
