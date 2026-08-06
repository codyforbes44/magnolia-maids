# Magnolia Maids Brand Kit (downloadable ZIP)

Package the finished brand assets into one downloadable kit so you can hand it to printers, contractors, or partners without hunting through files.

## What's in the kit

`magnolia-maids-brand-kit.zip` with folders:

**/business-card**
- `magnolia-maids-card-front-v3.png`, `magnolia-maids-card-back-v3.png` (300dpi, QR to booking)
- `magnolia-maids-business-card-v3.pdf` (print-ready)

**/logo**
- Magnolia mark exported as PNG with transparent background at 1024, 512, 256, 128, 64, 32 px
- Same mark as WebP at 1024 and 512 for web use

**/favicon**
- `favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon-180.png` (Apple touch), `favicon-512.png`
- `favicon.ico` (multi-size 16/32/48)

**/social**
- Facebook cover 1640x624 and 820x312
- Social share / OG image 1200x630

**/print**
- `magnolia-maids-hiring-flyer.pdf` and its PNG preview

**Root**
- `BRAND-GUIDE.md` — palette hex values (ivory, laurel green, brass), typography (Italiana wordmark + body face), logo clear-space and minimum-size rules, contact block: (580) 745-0045, hello@magnoliamaids.pro, magnoliamaids.pro, Facebook/X handles.

## Technical notes

- Source assets: `src/assets/magnolia-mark.webp`, `public/favicon.png`, `public/og-magnolia-maids.jpg`, and the existing v3 card + flyer files in the documents folder.
- Resizing done with Pillow/ImageMagick using Lanczos, square-padded (never stretched) so the mark keeps proportions at small sizes.
- Every generated raster gets visually inspected before packaging; the ZIP is written to the documents folder and surfaced as a downloadable artifact.
- No changes to the website itself — this is asset packaging only.
