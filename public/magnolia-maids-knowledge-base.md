# Magnolia Maids — Agent Knowledge Base

Upload this file to the ElevenLabs agent's Knowledge Base (or point the agent at
https://magnoliamaids.pro/magnolia-maids-knowledge-base.md).
Last updated: August 2026. Source of truth for prices: `src/lib/pricing.ts`.

---

## 1. Company facts

| Field | Value |
| --- | --- |
| Business name | Magnolia Maids |
| What we do | Upscale residential house cleaning and Airbnb/short-term-rental turnovers |
| Home base | Durant, Oklahoma |
| Service area | Bryan County — Durant, Calera, Caddo, Silo, Bokchito, Mead, and the Lake Texoma area |
| Phone | (580) 745-0045 |
| Email | hello@magnoliamaids.pro |
| Website | https://magnoliamaids.pro |
| Facebook | https://www.facebook.com/MagnoliaMaidsOK |
| X (Twitter) | https://x.com/MagnoliaMaidsOK |
| Grand opening | September 1, 2026 at 8:00 AM CST |
| Hours | Mon–Fri 8:00 AM–6:00 PM CST · Sat 9:00 AM–4:00 PM CST · Sunday closed |

**Pre-launch status (important):** Magnolia Maids is a brand-new business. We are
taking reservations now at founding-member rates; the first cleanings happen on
opening day, September 1, 2026. Never claim years in business, review counts,
star ratings, homes cleaned, or customer testimonials — we have none yet.

### Policies
- **The 24-Hour Magnolia Guarantee:** if anything is missed, we come back and
  re-clean it within 24 hours at no charge.
- **Cancellation:** 24 hours' notice to cancel or reschedule without a fee.
- **Insurance:** crews are insured and background-checked.
- **Products:** standard supplies included; plant-based, pet-safe eco products
  available as an add-on.

---

## 2. Services and pricing

All base prices are flat rates that **include a 2 bedroom / 2 bathroom home**.
Extras are charged only above that baseline.
Final quotes can run up to about 15% higher for condition, pets, or heavy build-up.

### How to compute a quote (follow this exactly)

**Always verify with the `get_quote` tool before speaking a total.** Call
`GET https://magnoliamaids.pro/api/public/quote?service=&bedrooms=&bathrooms=&frequency=`
(bathrooms as a decimal, e.g. `2.5`) and read back its `total` exactly — it is
already rounded to whole dollars and computed from the live pricing module. The
formula below is a fallback reference; if it ever disagrees with the tool, the
tool is correct. If the tool fails, do not guess — offer the booking page or a
callback.

```
extraBeds  = max(0, bedrooms  - 2)
extraBaths = max(0, bathrooms - 2)        # decimal, e.g. 2.5 baths -> 0.5
subtotal   = base + extraBeds * perBed + extraBaths * perBath
total      = round(subtotal * (1 - discount))    # whole dollars
```

Rules that are easy to get wrong — read them before every quote:
- **Bathrooms are counted as a decimal.** A 2.5-bath home has **0.5** extra
  bathrooms, not 1 and not 1.5. A 1.5-bath home has **0** extra bathrooms.
  "Half baths bill at half rate" means exactly this: 0.5 x the per-bathroom rate.
- Homes smaller than 2bd/2ba pay the base rate; there is no discount for being
  under the included size.
- **Always quote whole dollars.** Never say cents.
- Apply the frequency discount to the subtotal, never to the base alone.
- Before you say the number out loud, recompute it from your own line items and
  confirm they add up. If they don't, redo the math rather than guessing.

| Service | Base (2bd/2ba) | Extra bedroom | Extra bathroom | Recurring discounts? |
| --- | --- | --- | --- | --- |
| Standard Clean | $129 | +$20 | +$15 | Yes |
| Bright Clean | $179 | +$25 | +$20 | Yes |
| Deep Clean | $249 | +$35 | +$30 | No (one-time) |
| Airbnb Turnover | $119 | +$20 | +$15 | Yes |
| Move In / Move Out | $279 | +$40 | +$30 | No (one-time) |
| Post-Party | $169 | +$25 | +$20 | No (one-time) |

### Frequency discounts (Standard Clean and Airbnb Turnover only)
| Frequency | Discount |
| --- | --- |
| One-time | 0% |
| Monthly | 10% |
| Biweekly | 15% |
| Weekly | 20% |

### Example quotes
- Standard Clean, 3bd/2ba, biweekly: 129 + 20 = 149 → 15% off = **$127**
- Standard Clean, 4bd/2.5ba, biweekly: 129 + (2 x 20 = 40) + (0.5 x 15 = 7.50)
  = 176.50 → 15% off (176.50 x 0.85 = 150.03) = **$150**
- Standard Clean, 3bd/1.5ba, weekly: 129 + 20 + 0 (1.5 baths is under the
  included 2) = 149 → 20% off = **$119**
- Deep Clean, 4bd/3ba, one-time: 249 + 70 + 30 = **$349**
- Deep Clean, 3bd/2.5ba, "every two weeks": deep cleans are one-time, so **no**
  discount: 249 + 35 + 15 = **$299**
- Airbnb Turnover, 2bd/1ba, weekly: 119 → 20% off = **$95**
- Move In / Move Out, 4bd/3.5ba, one-time: 279 + 80 + 45 = **$404**

Always compute from this table. If the caller wants an exact, itemized number,
send them to https://magnoliamaids.pro/booking — the wizard shows a live estimate.

### Add-ons
| Add-on | Price |
| --- | --- |
| Eco-friendly products | +$15 |
| Inside the fridge | +$25 |
| Inside the oven | +$25 |
| Laundry & linens | +$35 |
| Interior windows | +$30 |
| Extra bath detail | +$20 |

### What each service includes
**Standard Clean** — weekly, biweekly, or monthly upkeep. Dust and wipe all
surfaces, vacuum and mop floors, kitchen and bathroom refresh, beds made, trash
out. Best for tidy homes on a regular rhythm.

**Deep Clean** — everything in Standard, plus baseboards, vents and fans, inside
the microwave and oven, tile/grout/shower scrub. Best for a first visit or a
seasonal reset.

**Airbnb Turnover** — same-day 2-hour flips, hotel-grade linen swap, photo
checklist every turn, restock and damage alerts. Best for hosts on tight
turnarounds.

**Move In / Move Out** — inside all cabinets and drawers, inside fridge and
appliances, windows, sills and tracks. Inspection-ready and deposit-safe.

**Post-Party** — same or next-day slots, dishes, glassware and floors, stain
treatment, deodorizing. The morning-after reset.

---

## 3. Airbnb turnover specialty

Magnolia Maids is an Airbnb / short-term-rental turnover specialist. Every turn
runs on an 8-stage checklist:

1. Arrival and damage check
2. Strip and start laundry
3. Kitchen reset
4. Bathroom reset
5. Living areas and floors
6. Restock consumables
7. Staging photos for the listing
8. Final walkthrough and host report

Hosts can download the free checklist PDF at
https://magnoliamaids.pro/airbnb-turnover.

---

## 4. What a visit looks like

- **0:00** Crew arrives on time and walks the space with you.
- **0:05** Top-to-bottom, back-to-front so nothing gets re-cleaned.
- **0:30** Kitchen and baths get the heavy attention.
- **1:30** Living zones — dust, vacuum, mop, make the beds.
- **Final** Walkthrough with you. Anything off, we stay until it's right.

---

## 5. Careers

We are hiring house cleaners in Durant ahead of the September 1, 2026 opening.
Send candidates to https://magnoliamaids.pro/about/careers, or take their name,
phone, email, and availability for a recruiter callback. Do not quote a specific
wage unless it appears on the careers page.

---

## 6. Website map

| URL | What's there |
| --- | --- |
| https://magnoliamaids.pro | Home — services overview, grand-opening countdown, founding-member offer |
| https://magnoliamaids.pro/services | All services and what's included |
| https://magnoliamaids.pro/pricing | Flat-rate pricing builder and frequency discounts |
| https://magnoliamaids.pro/airbnb-turnover | Airbnb turnover page + free 8-stage checklist PDF |
| https://magnoliamaids.pro/booking | 4-step booking wizard with live estimate |
| https://magnoliamaids.pro/about | About Magnolia Maids |
| https://magnoliamaids.pro/about/careers | Careers / apply to clean with us |
| https://magnoliamaids.pro/privacy | Privacy policy |
| https://magnoliamaids.pro/terms | Terms of service |
| https://magnoliamaids.pro/cookies | Cookie policy |

---

## 7. FAQ

**When do you open?** September 1, 2026 at 8:00 AM CST. You can reserve a slot
now at founding-member pricing.

**Where do you clean?** Durant and the rest of Bryan County — Calera, Caddo,
Silo, Bokchito, Mead, and around Lake Texoma. Ask about anywhere else and we'll
check.

**How much does it cost?** Flat rates by service and home size — see the table
above. A 2bd/2ba standard clean starts at $129.

**Do I have to be home?** No. Many clients leave a code or a key; we confirm
entry details when we book.

**Do you bring supplies?** Yes, everything is included. Eco-friendly, pet-safe
products are a $15 add-on.

**Are you insured?** Yes — insured and background-checked crews.

**What if I'm not happy?** The 24-Hour Magnolia Guarantee: tell us within 24
hours and we re-clean the area free.

**Can I cancel?** Yes, with 24 hours' notice, no fee.

**Do you do Airbnbs?** Yes — that's a specialty. Same-day 2-hour flips with an
8-stage checklist and photo documentation.

**Do you offer recurring service?** Yes: monthly 10% off, biweekly 15% off,
weekly 20% off on Standard Cleans and Airbnb Turnovers.

**Are you hiring?** Yes — magnoliamaids.pro/about/careers.

---

## 8. Guardrails

- Never invent prices, availability, reviews, or staff details.
- No medical, legal, or financial advice. No politics or religion.
- Never share customer or employee personal information.
- Emergencies: tell the caller to hang up and dial 911.
- If you don't know something: "I don't have that in front of me, but I can have
  the team call you right back" — then take name, phone, and best time.
- Escalate to a human on: lawsuit, attorney, legal action, injury, emergency,
  "speak to a manager," "a real person," or a refund dispute.

## 9. Pronunciation

- Durant → DURR-ant
- Bryan County → BRY-an County
- Lake Texoma → Lake tex-OH-ma
- Magnolia → mag-NOH-lee-uh
- Airbnb → AIR-bee-en-bee
