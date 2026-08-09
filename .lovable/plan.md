# Pay review: bring Durant, OK wages back to market

## What I found

Advertised pay is well above the Durant/Bryan County market, and above what the job prices can support.

Market reference points (public wage data):
- Oklahoma building-cleaning occupations: mean about $13.90/hr, 75th percentile about $15.60/hr; first-line housekeeping supervisors mean about $19.40/hr.
- Oklahoma City housekeepers: median about $13.28/hr, 90th percentile $22.50. Durant is a smaller, lower-cost market than OKC.
- Oklahoma minimum wage: $7.25/hr.

What the site advertises today versus a market-aligned target:

| Role | Advertised now | Target |
| --- | --- | --- |
| House Cleaner | $18-$22/hr + tips | $14-$17/hr + 100% of tips |
| Team Lead | $22-$26/hr + bonuses | $18-$21/hr + bonuses + mileage |
| Airbnb Turnover Specialist | $20-$24/hr + tips | $15-$18/hr + tips |
| Headline / SEO / schema | "$18-$26/hr" | "$14-$21/hr + tips" |
| 1099 contractor | $35-$55 per job | $55-$95 per job |

## Why this matters beyond competitiveness

A Standard Clean is $129 and a Deep Clean is $249. A 2-person pod at $18-$22/hr on a 2.5-hour standard clean is roughly $100-$110 of direct wages before payroll taxes, supplies, insurance, and drive time - that job loses money. At $14-$17/hr the same job lands near a healthy 35-40% labor cost.

The 1099 rate has the opposite problem: $35-$55 per job is below market for a solo contractor cleaning a whole home and reads as unserious to experienced pros. Contractors should earn roughly 45-50% of the job price, which is about $55-$95 per job depending on service type.

## Two side issues found in the same content

- The perk "Transit stipend - $40/week toward gas, Metrorail, or rideshare" is leftover Miami copy, names a transit system Durant does not have, and now contradicts the Team Lead mileage policy. Replace with "Mileage reimbursed - Team Leads drive their own vehicle, reimbursed at the IRS rate."
- The $12 paid-lunch cash stipend is an unusual added cost for this market. Keep the paid 30-minute break and drop the cash, unless you want to keep it as a differentiator.

## What I will change

1. `src/routes/about.careers.tsx`
   - Role cards: the three new pay ranges above.
   - Perks: headline pay chip to "$14-$21/hr", swap transit stipend for mileage reimbursement, adjust the lunch perk.
   - Work tracks: W-2 to $14-$21/hr + 100% of tips; 1099 to $55-$95 per job; founding crew stays "top of range on either track".
   - Page meta description and JobPosting JSON-LD salary values.
   - FAQ answers that quote a wage.
2. `public/magnolia-maids-knowledge-base.md` - careers section ranges, so the chatbot and voice agent quote the same numbers.
3. `src/lib/email/facebook-hiring-followup.ts` and the careers email templates - keep wage language generic or matched to the new ranges.
4. Homepage hiring block - confirm no stale wage is quoted.

No customer pricing, booking, or service rates change.

## Technical notes

Pay strings are duplicated across the careers route, JSON-LD, the knowledge base, and email copy. I will centralize them in a `PAY` constant in `src/lib/careers-pay.ts` and reference it from the route and structured data, then regenerate the knowledge base text to match, so future changes are a single edit.