// Shared schema.org structured data for Magnolia Maids (Durant, OK).
export const SITE_URL = "https://magnoliamaids.pro";
export const BUSINESS_ID = `${SITE_URL}/#localbusiness`;
const LOGO = `${SITE_URL}/og-magnolia-maids.jpg`;

/** Cities, towns, and lake communities we clean in Bryan County, OK. */
export const SERVICE_AREAS = [
  { name: "Durant", type: "City" as const },
  { name: "Calera", type: "City" as const },
  { name: "Caddo", type: "City" as const },
  { name: "Silo", type: "City" as const },
  { name: "Bokchito", type: "City" as const },
  { name: "Colbert", type: "City" as const },
  { name: "Achille", type: "City" as const },
  { name: "Kingston", type: "City" as const },
  { name: "Mead", type: "City" as const },
  { name: "Cartwright", type: "City" as const },
];

export const areaServed = [
  ...SERVICE_AREAS.map((c) => ({
    "@type": c.type,
    name: c.name,
    address: { "@type": "PostalAddress", addressLocality: c.name, addressRegion: "OK", addressCountry: "US" },
  })),
  { "@type": "AdministrativeArea", name: "Bryan County, Oklahoma" },
  { "@type": "Place", name: "Lake Texoma" },
  {
    "@type": "GeoCircle",
    name: "Magnolia Maids service radius",
    geoMidpoint: { "@type": "GeoCoordinates", latitude: 33.9937, longitude: -96.3706 },
    geoRadius: "40000",
  },
];

import { getServiceRate } from "./pricing";

export const SERVICE_CATALOG = [
  { name: "Standard House Cleaning", description: "Weekly, biweekly, or monthly upkeep for Durant homes — surfaces, floors, kitchen, and baths.", price: getServiceRate("Standard Clean").base },
  { name: "Deep Cleaning", description: "Top-to-bottom detail clean including baseboards, vents, inside appliances, and grout.", price: getServiceRate("Deep Clean").base },
  { name: "Airbnb Turnover Cleaning", description: "Same-day guest-ready resets with linen swaps and a photo checklist for Lake Texoma rentals.", price: getServiceRate("Airbnb Turnover").base },
  { name: "Move In / Move Out Cleaning", description: "Cabinets in and out, windows, tracks, and a full deep sanitize before handover.", price: getServiceRate("Move In / Out").base },
  { name: "Post-Party Cleaning", description: "Same-day cleanup after events — dish reset, surface refresh, and odor removal.", price: getServiceRate("Post-Party").base },
];

/** Canonical LocalBusiness node. Emit once, on the homepage. */
export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HouseCleaningService"],
  "@id": BUSINESS_ID,
  name: "Magnolia Maids",
  legalName: "Magnolia Maids LLC",
  description:
    "Upscale residential house cleaning and maid service in Durant, Oklahoma, serving Bryan County, Lake Texoma, and surrounding towns.",
  url: `${SITE_URL}/`,
  logo: LOGO,
  image: LOGO,
  telephone: "+1-580-745-0045",
  email: "hello@magnoliamaids.pro",
  priceRange: "$$",
  currenciesAccepted: "USD",
  paymentAccepted: "Cash, Credit Card, Debit Card",
  foundingDate: "2026",
  sameAs: [
    "https://www.facebook.com/MagnoliaMaidsOK",
    "https://x.com/MagnoliaMaidsOK",
  ],
  slogan: "Immaculate homes, Southern grace.",
  knowsAbout: ["house cleaning", "deep cleaning", "move out cleaning", "Airbnb turnover cleaning", "eco-friendly cleaning"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Serving Durant & Bryan County",
    addressLocality: "Durant",
    addressRegion: "OK",
    postalCode: "74701",
    addressCountry: "US",
  },
  geo: { "@type": "GeoCoordinates", latitude: 33.9937, longitude: -96.3706 },
  hasMap: "https://www.google.com/maps/place/Durant,+OK",
  areaServed,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "09:00", closes: "15:00" },
  ],
  potentialAction: {
    "@type": "ReserveAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/booking`,
      actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
    },
    result: { "@type": "Reservation", name: "House cleaning appointment" },
  },
  makesOffer: SERVICE_CATALOG.map((s) => ({
    "@type": "Offer",
    name: s.name,
    priceSpecification: {
      "@type": "PriceSpecification",
      price: s.price,
      priceCurrency: "USD",
      valueAddedTaxIncluded: false,
      description: "Starting price",
    },
  })),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Cleaning services in Durant, OK",
    itemListElement: SERVICE_CATALOG.map((s) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: s.name,
        description: s.description,
        serviceType: s.name,
        provider: { "@id": BUSINESS_ID },
        areaServed,
      },
    })),
  },
};

/** Lightweight reference to the canonical business node, for non-home pages. */
export const businessRef = { "@id": BUSINESS_ID };

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}

export function serviceSchema(opts: { name: string; description: string; price?: number; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    serviceType: opts.name,
    url: `${SITE_URL}${opts.url}`,
    provider: {
      "@type": "LocalBusiness",
      "@id": BUSINESS_ID,
      name: "Magnolia Maids",
      telephone: "+1-580-745-0045",
      address: { "@type": "PostalAddress", addressLocality: "Durant", addressRegion: "OK", addressCountry: "US" },
    },
    areaServed,
    ...(opts.price
      ? { offers: { "@type": "Offer", price: opts.price, priceCurrency: "USD", availability: "https://schema.org/PreOrder", url: `${SITE_URL}/booking` } }
      : {}),
  };
}
