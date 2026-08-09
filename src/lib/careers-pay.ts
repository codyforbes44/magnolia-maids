/**
 * Single source of truth for advertised pay at Magnolia Maids.
 * Benchmarked to Durant / Bryan County, OK market wages and to a
 * sustainable ~35-40% labor cost against our published service prices.
 */
export const PAY = {
  hourlyMin: 14,
  hourlyMax: 21,
  hourlyRange: "$14–$21/hr",
  cleaner: "$14–$17/hr + tips",
  lead: "$18–$21/hr + bonuses",
  turnover: "$15–$18/hr + tips",
  w2: "$14–$21/hr + 100% of tips",
  contractorMin: 55,
  contractorMax: 95,
  contractor: "$55–$95 per job (route-based)",
} as const;