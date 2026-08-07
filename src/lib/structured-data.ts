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
  { name: "Pre-Event Prep Cleaning", description: "Guest-ready prep the day before graduations, holidays, showers, and reunions in Durant.", price: getServiceRate("Pre-Event Prep").base },
  { name: "Post-Event Cleaning", description: "Same or next-day cleanup after events — dish reset, surface refresh, stain treatment, and odor removal.", price: getServiceRate("Post-Party").base },
  { name: "Office & Commercial Cleaning", description: "After-hours cleaning for Durant offices, clinics, salons, and storefronts — desks, breakrooms, restrooms, trash and restock.", price: getServiceRate("Office Cleaning").base },
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
  knowsAbout: ["house cleaning", "deep cleaning", "move out cleaning", "Airbnb turnover cleaning", "office cleaning", "commercial janitorial cleaning", "eco-friendly cleaning"],
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
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: "+1-580-745-0045",
      email: "hello@magnoliamaids.pro",
      areaServed: "US-OK",
      availableLanguage: ["English"],
      hoursAvailable: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "18:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "09:00", closes: "15:00" },
      ],
    },
    {
      "@type": "ContactPoint",
      contactType: "reservations",
      url: `${SITE_URL}/booking`,
      email: "hello@magnoliamaids.pro",
      availableLanguage: ["English"],
    },
  ],
  openingHours: ["Mo-Fr 08:00-18:00", "Sa 09:00-15:00"],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "09:00", closes: "15:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday"], opens: "00:00", closes: "00:00" },
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

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** Verified brand profiles. Only add a URL here once the profile is live. */
export const SAME_AS = [
  "https://www.facebook.com/MagnoliaMaidsOK",
  "https://x.com/MagnoliaMaidsOK",
];

/**
 * Sitewide Organization node. Emitted once from __root.tsx so every page
 * reinforces the same brand entity, and linked to the LocalBusiness node.
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Magnolia Maids",
  legalName: "Magnolia Maids LLC",
  alternateName: "Magnolia Maids Durant",
  url: `${SITE_URL}/`,
  logo: {
    "@type": "ImageObject",
    url: LOGO,
    caption: "Magnolia Maids",
  },
  image: LOGO,
  description:
    "Magnolia Maids is an upscale residential and office cleaning company based in Durant, Oklahoma, serving Bryan County and Lake Texoma.",
  slogan: "Immaculate homes, Southern grace.",
  foundingDate: "2026",
  email: "hello@magnoliamaids.pro",
  telephone: "+1-580-745-0045",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Durant",
    addressRegion: "OK",
    postalCode: "74701",
    addressCountry: "US",
  },
  areaServed,
  sameAs: SAME_AS,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: "+1-580-745-0045",
      email: "hello@magnoliamaids.pro",
      areaServed: "US-OK",
      availableLanguage: ["English"],
    },
  ],
  subOrganization: { "@id": BUSINESS_ID },
};

/** WebSite node so Google can tie the domain to the brand entity. */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: "Magnolia Maids",
  inLanguage: "en-US",
  publisher: { "@id": ORGANIZATION_ID },
};

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
