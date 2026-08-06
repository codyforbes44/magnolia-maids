# Business Card v2 — Photographic Magnolia

Replace the line-drawn geometric bloom on both card faces with the attached magnolia photograph, keeping the existing "Pressed Stillness" layout, palette, and typography.

## What changes

**Front**
- Remove the geometric petal linework cropping off the right edge.
- Place the photographic magnolia bloom, cleanly cut out on the ivory field, cropping off the right edge at the same scale and optical position.
- Keep the brass rosette icon, Italiana wordmark, brass hinge rule, "DURANT, OKLAHOMA", and the italic tagline exactly as they are.

**Back**
- Replace the brass line bloom in the left tonal band with the same photographic bloom, sized to sit centered in the band with clear margins.
- Keep the deep laurel field, wordmark, brass rule, contacts (580.745.0045, hello@magnoliamaids.pro, magnoliamaids.pro), and the BONDED · INSURED · BRYAN COUNTY footer unchanged.

**Icon**
- Default: keep the small brass rosette above the wordmark so the card retains one engraved mark. Say the word if you'd rather it match the photo.

## Print quality note

The attached file is a small 128px image — far below what a 300dpi print card needs. I'll re-render it into a high-resolution, background-free version of that same white magnolia (same bloom, same three dark leaves, same angle) before placing it, so both faces stay crisp at print size.

## Output

New versioned files, leaving the originals intact:
- `magnolia-maids-business-card-v2.pdf` — 3.5 x 2 in, 0.125 in bleed, two sides
- `magnolia-maids-card-front-v2.png`, `magnolia-maids-card-back-v2.png` — 300dpi previews

## Technical

- Regenerate the bloom art as a transparent PNG at ~1600px, then composite it in the existing card generation script.
- On the dark back, the photo's white petals carry enough contrast; a soft brass halo is added only if the leaves muddy against the laurel field.
- QA: render both faces at 300dpi and inspect for overlap, clipping, edge margins, and bleed correctness before delivering.