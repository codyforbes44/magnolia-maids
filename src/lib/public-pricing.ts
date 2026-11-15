import { getServiceRate, quoteVisit, type ServiceKey } from "./pricing";

/** Advertised founding-member visit: 2bd/2ba, under 1,200 sq ft, no extras. */
export function headlinePrice(service: ServiceKey): number {
  if (!["Standard Clean", "Bright Clean", "Deep Clean"].includes(service)) {
    return getServiceRate(service).base;
  }
  return quoteVisit({ service, frequency: "Biweekly", bedrooms: 2, bathrooms: 2, sqft: "s", addons: [], founder: true }).total;
}

export const HEADLINE_TERMS = "Founding-member rates for 2 bedrooms / 2 bathrooms under 1,200 sq ft, without add-ons. Fresh and Bright include biweekly savings; Deep includes the founder discount only. Other frequencies, larger homes and extras change your quote.";