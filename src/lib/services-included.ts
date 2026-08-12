/**
 * "What's included?" comparison matrix for /services.
 * Defaults live in code; admins can override them from /admin/services-included,
 * which stores the matrix in site_content (scope "services", key "included_matrix").
 */

export const INCLUDED_SCOPE = "services";
export const INCLUDED_KEY = "included_matrix";

export type IncludedServiceKey =
  | "standard"
  | "deep"
  | "airbnb"
  | "move"
  | "prep"
  | "party"
  | "office";

export type IncludedRow = { label: string; services: IncludedServiceKey[] };

export const INCLUDED_SERVICE_KEYS: IncludedServiceKey[] = [
  "standard",
  "deep",
  "airbnb",
  "move",
  "prep",
  "party",
  "office",
];

export const INCLUDED_SERVICE_TITLES: Record<IncludedServiceKey, string> = {
  standard: "Standard Clean",
  deep: "Deep Clean",
  airbnb: "Airbnb Turnover",
  move: "Move In / Out",
  prep: "Pre-Event Prep",
  party: "Post-Event Clean",
  office: "Office Cleaning",
};

/** label, then a checked flag per service in INCLUDED_SERVICE_KEYS order. */
const DEFAULT_MATRIX: [string, ...boolean[]][] = [
  ["Dust, vacuum, mop", true, true, true, true, true, false, true],
  ["Kitchen & baths refresh", true, true, true, true, true, true, true],
  ["Baseboards & vents", false, true, false, true, false, false, false],
  ["Inside oven & microwave", false, true, false, true, false, false, false],
  ["Inside cabinets & drawers", false, false, false, true, false, false, false],
  ["Interior windows & tracks", false, false, false, true, false, false, false],
  ["Linen swap & bed staging", false, false, true, false, true, false, false],
  ["Guest room & guest bath detail", false, false, true, false, true, false, false],
  ["Photo checklist per visit", false, false, true, false, false, false, true],
  ["Same or next-day availability", false, false, true, false, true, true, false],
  ["Stain & odor treatment", false, false, false, false, false, true, false],
  ["After-hours & weekend scheduling", false, false, true, false, false, true, true],
  ["Trash, recycling & supply restock", false, false, true, false, false, false, true],
];

export const DEFAULT_INCLUDED_ROWS: IncludedRow[] = DEFAULT_MATRIX.map(([label, ...flags]) => ({
  label,
  services: INCLUDED_SERVICE_KEYS.filter((_, i) => flags[i] === true),
}));

/** Accepts the stored JSON shape and returns clean rows, or null when unusable. */
export function parseIncludedRows(value: unknown): IncludedRow[] | null {
  if (!Array.isArray(value)) return null;
  const rows: IncludedRow[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const label = (raw as { label?: unknown }).label;
    if (typeof label !== "string" || !label.trim()) continue;
    const services = (raw as { services?: unknown }).services;
    const list = Array.isArray(services)
      ? INCLUDED_SERVICE_KEYS.filter((k) => (services as unknown[]).includes(k))
      : [];
    rows.push({ label: label.trim(), services: list });
  }
  return rows.length ? rows : null;
}
