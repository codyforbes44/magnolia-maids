# Dallas refresh: business card + collateral images

Recreate every image-based piece of collateral so nothing says Durant, Oklahoma, or (580) — all pieces show North Dallas, (214) 978-6445, hello@magnoliamaids.pro, magnoliamaids.pro, and the Dec 1 grand opening / 15% founder rate where it's promotional.

## New versions (old files kept, new ones added as next version)
1. **Business card** — front + back (3.5×2 in, print-ready with bleed) and a 2-page PDF. Front: logo, "Luxury Home Cleaning · North Dallas & the Park Cities". Back: phone, email, website, hours (Mon–Fri 8–5), QR code to the quote page.
2. **Facebook post** (1200×1200) — North Dallas promo with founder rate.
3. **Facebook cover with Maggie** (1640×624 + 820×312) — Dallas version.
4. **Social share image** (1200×630) — match the new Dallas share image.
5. **Hiring flyer** (PNG + PDF) and **Operations Assistant hiring post** — Dallas location.
6. **Maggie introduces Magnolia Maids** post — Dallas version.
7. **Social templates, seasonal campaigns, Meta ads** (PDFs + ZIPs) — rebuilt with Dallas copy and imagery.
8. Remove the old Durant promo image.

Not changed: the Desiree welcome post and ownership proposal (personal/legal documents), plan.It partner image (no location).

## Where it shows up
- Saved to your Files.
- The admin Document Library is updated to point at the new Dallas versions.

## Technical details
- Images via image generation (premium tier for text), then cropped/resized with PIL; PDFs assembled with reportlab; QR via `qrcode`.
- Each output rendered to PNG and visually checked for clipped text and stale wording.
- Copy into `public/docs/`, update entries in the admin documents route.
