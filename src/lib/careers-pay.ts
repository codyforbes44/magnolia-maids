/**
 * Single source of truth for how Magnolia Maids talks about pay publicly.
 * We intentionally do NOT advertise wage figures — compensation is discussed
 * on the intro call so it can reflect role, experience, and availability.
 */
export const PAY = {
  headline: "Competitive pay + 100% of tips",
  cleaner: "Competitive hourly pay + tips",
  lead: "Competitive hourly pay + bonuses",
  turnover: "Competitive hourly pay + tips",
  w2: "Hourly pay, discussed on your intro call",
  contractor: "Per-job rate, discussed on your intro call",
  founding: "Top-of-range on either track",
} as const;