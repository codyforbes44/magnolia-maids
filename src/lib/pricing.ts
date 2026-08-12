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

/* ------------------------------------------------------------------ *
 * Square footage tiers. Bedroom/bathroom counts alone under-price big
 * Durant homes (a 3/2 ranch and a 3/2 lake house are not the same job),
 * so every quote multiplies the cleaning portion by a size tier.
 * The smallest tier is 1.00 so published base prices stay honest.
 * ------------------------------------------------------------------ */

export type SqftBandKey = "s" | "m" | "l" | "xl" | "xxl";

export type SqftBand = {
  key: SqftBandKey;
  /** Button label shown to the visitor. */
  label: string;
  /** Short label for summaries and emails. */
  short: string;
  min: number;
  /** null = no upper bound */
  max: number | null;
  multiplier: number;
};

export const SQFT_BANDS: SqftBand[] = [
  { key: "s", label: "Under 1,200 sq ft", short: "<1,200 sq ft", min: 0, max: 1199, multiplier: 1 },
  { key: "m", label: "1,200 – 1,799 sq ft", short: "1,200–1,799 sq ft", min: 1200, max: 1799, multiplier: 1.15 },
  { key: "l", label: "1,800 – 2,499 sq ft", short: "1,800–2,499 sq ft", min: 1800, max: 2499, multiplier: 1.3 },
  { key: "xl", label: "2,500 – 3,499 sq ft", short: "2,500–3,499 sq ft", min: 2500, max: 3499, multiplier: 1.5 },
  { key: "xxl", label: "3,500+ sq ft", short: "3,500+ sq ft", min: 3500, max: null, multiplier: 1.75 },
];

export function getSqftBand(key: string | null | undefined): SqftBand | undefined {
  return SQFT_BANDS.find((b) => b.key === key);
}

export function sqftMultiplier(key: string | null | undefined): number {
  return getSqftBand(key)?.multiplier ?? 1;
}

export function sqftLabel(key: string | null | undefined): string | null {
  return getSqftBand(key)?.short ?? null;
}

/** Map a raw square footage number (voice agent, admin builder) to a band. */
export function bandForSqft(sqft: number | null | undefined): SqftBandKey | null {
  if (typeof sqft !== "number" || !Number.isFinite(sqft) || sqft <= 0) return null;
  const band = SQFT_BANDS.find((b) => sqft >= b.min && (b.max === null || sqft <= b.max));
  return band?.key ?? "xxl";
}

export type ServiceKey =
  | "Standard Clean"
  | "Bright Clean"
  | "Deep Clean"
  | "Airbnb Turnover"
  | "Move In / Out"
  | "Pre-Event Prep"
  | "Post-Party"
  | "Office Cleaning";

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
  { key: "Bright Clean", base: 179, perBed: 25, perBath: 20, recurring: true },
  { key: "Deep Clean", base: 249, perBed: 35, perBath: 30, recurring: false },
  { key: "Airbnb Turnover", base: 119, perBed: 20, perBath: 15, recurring: true },
  { key: "Move In / Out", base: 279, perBed: 40, perBath: 30, recurring: false },
  { key: "Pre-Event Prep", base: 149, perBed: 25, perBath: 20, recurring: false },
  { key: "Post-Party", base: 169, perBed: 25, perBath: 20, recurring: false },
  // Small offices, clinics, salons, and storefronts in Durant. "Bedrooms"
  // bills as private offices/rooms above 2; "bathrooms" bills as restrooms.
  { key: "Office Cleaning", base: 189, perBed: 25, perBath: 20, recurring: true },
];

/**
 * Customer-facing labels. The keys above are stable identifiers used by the
 * database, the quote API, and email templates — only the label changes.
 */
export const SERVICE_LABELS: Record<ServiceKey, string> = {
  "Standard Clean": "Standard Clean",
  "Bright Clean": "Bright Clean",
  "Deep Clean": "Deep Clean",
  "Airbnb Turnover": "Airbnb Turnover",
  "Move In / Out": "Move In / Out",
  "Pre-Event Prep": "Pre-Event Prep",
  "Post-Party": "Post-Event Clean",
  "Office Cleaning": "Office & Commercial Clean",
};

export function serviceLabel(key: ServiceKey): string {
  return SERVICE_LABELS[key] ?? key;
}

/** Discount when Pre-Event Prep and Post-Event Clean are booked together. */
export const HOST_WEEKEND_DISCOUNT = 0.1;

/** Price the Host Weekend bundle: pre-event prep + post-event reset. */
export function priceHostWeekend(opts: { bedrooms: number; bathrooms: number }) {
  const pre = priceHome({ service: "Pre-Event Prep", frequency: "One-time", ...opts });
  const post = priceHome({ service: "Post-Party", frequency: "One-time", ...opts });
  const raw = pre.total + post.total;
  const total = Math.round(raw * (1 - HOST_WEEKEND_DISCOUNT));
  return { pre: pre.total, post: post.total, raw, total, savings: raw - total };
}

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
  /** Size tier key. Omitted / unknown behaves as the smallest tier (x1). */
  sqft?: SqftBandKey | null;
}) {
  const rate = getServiceRate(opts.service);
  const extraBeds = Math.max(0, opts.bedrooms - INCLUDED_BEDROOMS);
  const extraBaths = Math.max(0, opts.bathrooms - INCLUDED_BATHROOMS);
  const beforeSize = rate.base + extraBeds * rate.perBed + extraBaths * rate.perBath;
  const multiplier = sqftMultiplier(opts.sqft);
  const raw = Math.round(beforeSize * multiplier);
  const discount = getDiscount(opts.service, opts.frequency);
  const total = Math.round(raw * (1 - discount));
  return {
    raw,
    total,
    discount,
    savings: raw - total,
    sizeMultiplier: multiplier,
    sizeUpcharge: Math.round(beforeSize * multiplier) - Math.round(beforeSize),
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
  { label: "2.5", count: 2.5 },
  { label: "3", count: 3 },
  { label: "3.5", count: 3.5 },
  { label: "4+", count: 4 },
];

export function bedroomCount(label: string) {
  return BEDROOM_OPTIONS.find((b) => b.label === label)?.count ?? INCLUDED_BEDROOMS;
}
export function bathroomCount(label: string) {
  return BATHROOM_OPTIONS.find((b) => b.label === label)?.count ?? INCLUDED_BATHROOMS;
}

/* ------------------------------------------------------------------ *
 * Add-ons — one shared catalog for the booking wizard, the services
 * builder, the pricing page, and the /api/public/quote endpoint.
 * Add-ons are flat and are NOT discounted by frequency.
 * ------------------------------------------------------------------ */

export type AddonKey = "eco" | "fridge" | "oven" | "laundry" | "windows" | "bath";

export type Addon = {
  key: AddonKey;
  label: string;
  price: number;
  /** lucide icon name used by the shared picker */
  icon: "Leaf" | "Refrigerator" | "Wind" | "WashingMachine" | "DoorOpen" | "Bath";
};

export const ADDONS: Addon[] = [
  { key: "eco", label: "Eco-friendly products", price: 15, icon: "Leaf" },
  { key: "fridge", label: "Inside the fridge", price: 25, icon: "Refrigerator" },
  { key: "oven", label: "Inside the oven", price: 25, icon: "Wind" },
  { key: "laundry", label: "Laundry & linens", price: 35, icon: "WashingMachine" },
  { key: "windows", label: "Interior windows", price: 30, icon: "DoorOpen" },
  { key: "bath", label: "Extra bath detail", price: 20, icon: "Bath" },
];

export function getAddon(key: string): Addon | undefined {
  return ADDONS.find((a) => a.key === key);
}

export function addonsTotal(keys: readonly string[]): number {
  return keys.reduce((sum, k) => sum + (getAddon(k)?.price ?? 0), 0);
}

export function addonLabels(keys: readonly string[]): string[] {
  return keys.map((k) => getAddon(k)?.label).filter((l): l is string => !!l);
}

/** Extra home details a visitor can flag up front. They don't change the flat rate. */
export type HomeDetailFlags = { pets?: boolean; firstClean?: boolean };

/**
 * The one quote used everywhere: home size + service + frequency + add-ons.
 * Frequency discounts apply to the cleaning only; add-ons stay flat.
 */
export function quoteVisit(opts: {
  service: ServiceKey;
  frequency: FrequencyKey;
  bedrooms: number;
  bathrooms: number;
  addons?: readonly string[];
}) {
  const base = priceHome({
    service: opts.service,
    frequency: opts.frequency,
    bedrooms: opts.bedrooms,
    bathrooms: opts.bathrooms,
  });
  const extras = addonsTotal(opts.addons ?? []);
  const total = base.total + extras;
  return {
    ...base,
    extras,
    total,
    high: total + Math.max(25, Math.round(total * 0.15)),
  };
}

/* ------------------------------------------------------------------ *
 * Shared quote state <-> URL so every price surface hands the visitor
 * off to /booking without losing a single choice they already made.
 * ------------------------------------------------------------------ */

export type QuoteSelection = {
  service: ServiceKey;
  frequency: FrequencyKey;
  bedrooms: number;
  bathrooms: number;
  addons: AddonKey[];
  pets: boolean;
};

export const DEFAULT_SELECTION: QuoteSelection = {
  service: "Standard Clean",
  frequency: "Biweekly",
  bedrooms: INCLUDED_BEDROOMS,
  bathrooms: INCLUDED_BATHROOMS,
  addons: [],
  pets: false,
};

/** Search params accepted by /booking (and produced by every quote CTA). */
export type QuoteSearch = {
  service?: string;
  frequency?: string;
  beds?: number;
  baths?: number;
  addons?: string;
  pets?: boolean;
};

export function toQuoteSearch(sel: Partial<QuoteSelection>): QuoteSearch {
  const s: QuoteSearch = {};
  if (sel.service) s.service = sel.service;
  if (sel.frequency) s.frequency = sel.frequency;
  if (typeof sel.bedrooms === "number") s.beds = sel.bedrooms;
  if (typeof sel.bathrooms === "number") s.baths = sel.bathrooms;
  if (sel.addons?.length) s.addons = sel.addons.join(",");
  if (sel.pets) s.pets = true;
  return s;
}

export function fromQuoteSearch(search: QuoteSearch | undefined): QuoteSelection {
  const svc = SERVICE_RATES.find(
    (r) => r.key.toLowerCase() === String(search?.service ?? "").toLowerCase(),
  )?.key;
  const freq = FREQUENCY_RATES.find(
    (f) => f.key.toLowerCase() === String(search?.frequency ?? "").toLowerCase(),
  )?.key;
  const service = svc ?? DEFAULT_SELECTION.service;
  const recurring = getServiceRate(service).recurring;
  const addons = String(search?.addons ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter((a): a is AddonKey => !!getAddon(a));
  return {
    service,
    frequency: recurring ? freq ?? DEFAULT_SELECTION.frequency : "One-time",
    bedrooms: clampBeds(search?.beds ?? DEFAULT_SELECTION.bedrooms),
    bathrooms: clampBaths(search?.baths ?? DEFAULT_SELECTION.bathrooms),
    addons,
    pets: search?.pets === true,
  };
}

export const BED_MIN = 0;
export const BED_MAX = 6;
export const BATH_MIN = 1;
export const BATH_MAX = 6;

export function clampBeds(n: number) {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(BED_MAX, Math.max(BED_MIN, v)) : INCLUDED_BEDROOMS;
}
export function clampBaths(n: number) {
  const v = Math.round(Number(n) * 2) / 2;
  return Number.isFinite(v) ? Math.min(BATH_MAX, Math.max(BATH_MIN, v)) : INCLUDED_BATHROOMS;
}

/** "3" / "2.5" — the strings stored on booking_requests. */
export function countLabel(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
