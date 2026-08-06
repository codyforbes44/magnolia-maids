/**
 * Single source of truth for Magnolia Maids pricing (Durant, OK market).
 *
 * Market check (Bryan County, OK): independent housekeepers list $12–$25/hr on
 * Care.com; insured agency crews in the Durant / Sherman–Denison corridor run
 * roughly $45–$60/hr of crew time. A standard 3bd/2ba house is ~2.5 crew-hours,
 * a deep clean ~5. Our flat rates below sit at the upper-middle of that band —
 * above solo cleaners, at or below national franchises (Molly Maid, Merry Maids).
 *
 * Every base price INCLUDES a 2 bedroom / 2 bathroom home. Extras are charged
 * only above that baseline, so the booking wizard and the pricing page agree.
 */

export const INCLUDED_BEDROOMS = 2;
export const INCLUDED_BATHROOMS = 2;

export type ServiceKey =
  | "Standard Clean"
  | "Deep Clean"
  | "Airbnb Turnover"
  | "Move In / Out"
  | "Post-Party";

export type ServiceRate = {
  key: ServiceKey;
  /** Flat rate for a 2bd/2ba Durant home. */
  base: number;
  /** Added per bedroom above 2. */
  perBed: number;
  /** Added per bathroom above 2 (half baths bill at half). */
  perBath: number;
  /** Whether recurring plans (and their discounts) apply. */
  recurring: boolean;
};

export const SERVICE_RATES: ServiceRate[] = [
  { key: "Standard Clean", base: 129, perBed: 20, perBath: 15, recurring: true },
  { key: "Deep Clean", base: 249, perBed: 35, perBath: 30, recurring: false },
  { key: "Airbnb Turnover", base: 119, perBed: 20, perBath: 15, recurring: true },
  { key: "Move In / Out", base: 279, perBed: 40, perBath: 30, recurring: false },
  { key: "Post-Party", base: 169, perBed: 25, perBath: 20, recurring: false },
];

export type FrequencyKey = "One-time" | "Monthly" | "Biweekly" | "Weekly";

export const FREQUENCY_RATES: { key: FrequencyKey; discount: number }[] = [
  { key: "One-time", discount: 0 },
  { key: "Monthly", discount: 0.1 },
  { key: "Biweekly", discount: 0.15 },
  { key: "Weekly", discount: 0.2 },
];

export function getServiceRate(key: ServiceKey): ServiceRate {
  return SERVICE_RATES.find((s) => s.key === key) ?? SERVICE_RATES[0];
}

export function getDiscount(service: ServiceKey, frequency: FrequencyKey): number {
  if (!getServiceRate(service).recurring) return 0;
  return FREQUENCY_RATES.find((f) => f.key === frequency)?.discount ?? 0;
}

/** Price a home from numeric counts. Bathrooms may be fractional (1.5). */
export function priceHome(opts: {
  service: ServiceKey;
  frequency: FrequencyKey;
  bedrooms: number;
  bathrooms: number;
}) {
  const rate = getServiceRate(opts.service);
  const extraBeds = Math.max(0, opts.bedrooms - INCLUDED_BEDROOMS);
  const extraBaths = Math.max(0, opts.bathrooms - INCLUDED_BATHROOMS);
  const raw = Math.round(rate.base + extraBeds * rate.perBed + extraBaths * rate.perBath);
  const discount = getDiscount(opts.service, opts.frequency);
  const total = Math.round(raw * (1 - discount));
  return {
    raw,
    total,
    discount,
    savings: raw - total,
    /** Upper bound of the quoted range: +15%, at least $25, for condition/pets. */
    high: total + Math.max(25, Math.round(total * 0.15)),
  };
}

/** Booking wizard labels → numeric counts. */
export const BEDROOM_OPTIONS: { label: string; count: number }[] = [
  { label: "Studio", count: 0 },
  { label: "1", count: 1 },
  { label: "2", count: 2 },
  { label: "3", count: 3 },
  { label: "4", count: 4 },
  { label: "5+", count: 5 },
];

export const BATHROOM_OPTIONS: { label: string; count: number }[] = [
  { label: "1", count: 1 },
  { label: "1.5", count: 1.5 },
  { label: "2", count: 2 },
  { label: "3", count: 3 },
  { label: "4+", count: 4 },
];

export function bedroomCount(label: string) {
  return BEDROOM_OPTIONS.find((b) => b.label === label)?.count ?? INCLUDED_BEDROOMS;
}
export function bathroomCount(label: string) {
  return BATHROOM_OPTIONS.find((b) => b.label === label)?.count ?? INCLUDED_BATHROOMS;
}
