// Shared schema.org structured data for Astro Maids (Dallas, TX).
export const SITE_URL = "https://magnoliamaids.pro";
export const BUSINESS_ID = `${SITE_URL}/#localbusiness`;
const LOGO = `${SITE_URL}/og-astro-maids.jpg`;

/** Cities and neighborhoods we clean in North Dallas, TX. */
export const SERVICE_AREAS = [
  { name: "Dallas", type: "City" as const },
  { name: "Highland Park", type: "City" as const },
  { name: "University Park", type: "City" as const },
  { name: "Plano", type: "City" as const },
  { name: "Frisco", type: "City" as const },
  { name: "Allen", type: "City" as const },
  { name: "McKinney", type: "City" as const },
  { name: "Addison", type: "City" as const },
  { name: "Richardson", type: "City" as const },
  { name: "Southlake", type: "City" as const },
];

export const areaServed = [
  ...SERVICE_AREAS.map((c) => ({
    "@type": c.type,
    name: c.name,
    address: { "@type": "PostalAddress", addressLocality: c.name, addressRegion: "TX", addressCountry: "US" },
  })),
  { "@type": "AdministrativeArea", name: "North Dallas, TX" },
  { "@type": "Place", name: "Collin County" },
  {
    "@type": "GeoCircle",
    name: "Astro Maids service radius",
    geoMidpoint: { "@type": "GeoCoordinates", latitude: 32.8668, longitude: -96.8037 },
    geoRadius: "40000",
  },
];

import { getServiceRate } from "./pricing";

export const SERVICE_CATALOG = [
  { name: "Standard House Cleaning", description: "Weekly, biweekly, or monthly upkeep for Dallas homes — surfaces, floors, kitchen, and baths.", price: getServiceRate("Standard Clean").base },
  { name: "Deep Cleaning", description: "Top-to-bottom detail clean including baseboards, vents, inside appliances, and grout.", price: getServiceRate("Deep Clean").base },
  { name: "Airbnb Turnover Cleaning", description: "Same-day guest-ready resets with linen swaps and a photo checklist for Collin County rentals.", price: getServiceRate("Airbnb Turnover").base },
  { name: "Move In / Move Out Cleaning", description: "Cabinets in and out, windows, tracks, and a full deep sanitize before handover.", price: getServiceRate("Move In / Out").base },
  { name: "Pre-Event Prep Cleaning", description: "Guest-ready prep the day before graduations, holidays, showers, and reunions in Dallas.", price: getServiceRate("Pre-Event Prep").base },
  { name: "Post-Event Cleaning", description: "Same or next-day cleanup after events — dish reset, surface refresh, stain treatment, and odor removal.", price: getServiceRate("Post-Party").base },
  { name: "Office & Commercial Cleaning", description: "After-hours cleaning for Dallas offices, clinics, salons, and storefronts — desks, breakrooms, restrooms, trash and restock.", price: getServiceRate("Office Cleaning").base },
];

/** Canonical LocalBusiness node. Emit once, on the homepage. */
export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HouseCleaningService"],
  "@id": BUSINESS_ID,
  name: "Astro Maids",
  legalName: "Astro Maids LLC",
  alternateName: ["Astro Maids Dallas", "Astro Maids Dallas TX"],
  additionalType: "https://www.wikidata.org/wiki/Q1786291",
  description:
    "Upscale residential house cleaning and maid service in Dallas, Texas, serving North Dallas, Collin County, and surrounding towns.",
  url: `${SITE_URL}/`,
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/` },
  keywords:
    "house cleaning Dallas TX, maid service Dallas Texas, cleaning service North Dallas, deep cleaning Dallas, move out cleaning Dallas, Airbnb turnover cleaning Collin County, office cleaning Dallas TX",
  logo: LOGO,
  image: LOGO,
  telephone: "+1-214-978-6445",
  email: "hello@magnoliamaids.pro",
  priceRange: "$$",
  currenciesAccepted: "USD",
  paymentAccepted: "Cash, Credit Card, Debit Card",
  foundingDate: "2026",
  sameAs: [
    "https://www.facebook.com/MagnoliaMaidsOK",
    "https://x.com/MagnoliaMaidsOK",
    "https://www.instagram.com/AstroMaidsTX",
  "https://www.instagram.com/AstroMaidsTX",
  ],
  slogan: "Immaculate homes, Southern grace.",
  knowsAbout: ["house cleaning", "deep cleaning", "move out cleaning", "Airbnb turnover cleaning", "office cleaning", "commercial janitorial cleaning", "eco-friendly cleaning"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Serving North Dallas and the Park Cities",
    addressLocality: "Dallas",
    addressRegion: "TX",
    postalCode: "75225",
    addressCountry: "US",
  },
  geo: { "@type": "GeoCoordinates", latitude: 32.8668, longitude: -96.8037 },
  hasMap: "https://www.google.com/maps/place/Dallas,+TX",
  areaServed,
  serviceArea: {
    "@type": "GeoCircle",
    geoMidpoint: { "@type": "GeoCoordinates", latitude: 32.8668, longitude: -96.8037 },
    geoRadius: "40000",
  },
  availableChannel: {
    "@type": "ServiceChannel",
    name: "Online booking",
    serviceUrl: `${SITE_URL}/booking`,
    servicePhone: { "@type": "ContactPoint", telephone: "+1-214-978-6445", contactType: "reservations" },
    availableLanguage: ["English"],
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: "+1-214-978-6445",
      email: "hello@magnoliamaids.pro",
      areaServed: "US-TX",
      availableLanguage: ["English"],
      hoursAvailable: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "17:00" },
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
  openingHours: ["Mo-Fr 08:00-17:00"],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "17:00",
    },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "00:00", closes: "00:00" },
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
    name: "Cleaning services in Dallas, TX",
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
  "https://www.instagram.com/AstroMaidsTX",
];

/**
 * Sitewide Organization node. Emitted once from __root.tsx so every page
 * reinforces the same brand entity, and linked to the LocalBusiness node.
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Astro Maids",
  legalName: "Astro Maids LLC",
  alternateName: "Astro Maids Dallas",
  url: `${SITE_URL}/`,
  logo: {
    "@type": "ImageObject",
    url: LOGO,
    caption: "Astro Maids",
  },
  image: LOGO,
  description:
    "Astro Maids is an upscale residential and office cleaning company based in Dallas, Texas, serving North Dallas and Collin County.",
  slogan: "Immaculate homes, Southern grace.",
  foundingDate: "2026",
  email: "hello@magnoliamaids.pro",
  telephone: "+1-214-978-6445",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dallas",
    addressRegion: "TX",
    postalCode: "75225",
    addressCountry: "US",
  },
  areaServed,
  sameAs: SAME_AS,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: "+1-214-978-6445",
      email: "hello@magnoliamaids.pro",
      areaServed: "US-TX",
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
  name: "Astro Maids",
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
      name: "Astro Maids",
      telephone: "+1-214-978-6445",
      address: { "@type": "PostalAddress", addressLocality: "Dallas", addressRegion: "TX", addressCountry: "US" },
    },
    areaServed,
    ...(opts.price
      ? { offers: { "@type": "Offer", price: opts.price, priceCurrency: "USD", availability: "https://schema.org/PreOrder", url: `${SITE_URL}/booking` } }
      : {}),
  };
}
