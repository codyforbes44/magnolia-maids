import { getServiceRate, FREQUENCY_RATES } from "@/lib/pricing";

export type AreaFaq = { q: string; a: string };

export type ServiceArea = {
  slug: string;
  /** Short nav/card label */
  label: string;
  /** H1-ready name */
  name: string;
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  heroImage: "durant" | "lake";
  /** Towns / communities covered by this page */
  towns: { name: string; note: string }[];
  /** Unique, area-specific reasons to hire us here */
  highlights: { title: string; desc: string }[];
  /** What a typical week looks like in this area */
  rhythm: { title: string; desc: string }[];
  /** Services we push hardest in this area */
  services: { key: string; label: string; blurb: string; to: string }[];
  faqs: AreaFaq[];
};

const STANDARD = getServiceRate("Standard Clean").base;
const BRIGHT = getServiceRate("Bright Clean").base;
const DEEP = getServiceRate("Deep Clean").base;
const AIRBNB = getServiceRate("Airbnb Turnover").base;
const MOVE = getServiceRate("Move In / Out").base;
const POST = getServiceRate("Post-Party").base;
const BIWEEKLY = Math.round((FREQUENCY_RATES.find((f) => f.key === "Biweekly")?.discount ?? 0) * 100);
const WEEKLY = Math.round((FREQUENCY_RATES.find((f) => f.key === "Weekly")?.discount ?? 0) * 100);

export const SERVICE_AREA_PAGES: ServiceArea[] = [
  {
    slug: "bryan-county",
    label: "Bryan County",
    name: "Bryan County, Oklahoma",
    eyebrow: "SERVICE AREA · BRYAN COUNTY, OK",
    headline: "House cleaning across",
    headlineAccent: "Bryan County",
    intro:
      "Durant is home base, and everything inside Bryan County is a local drive for us — Calera, Caddo, Silo, Bokchito, Colbert, Achille, and Mead included. Same flat rates, same crews, no travel fee for county addresses.",
    metaTitle: "House Cleaning in Bryan County, OK | Magnolia Maids",
    metaDescription: `Flat-rate house cleaning across Bryan County, OK — Durant, Calera, Caddo, Silo, Colbert, and Mead. Standard from $${STANDARD}, deep cleans from $${DEEP}. No travel fee.`,
    keywords:
      "house cleaning Bryan County OK, maid service Durant Oklahoma, cleaning service Calera OK, Caddo OK house cleaners, Colbert OK cleaning service, Silo Bokchito Achille maid service",
    heroImage: "durant",
    towns: [
      { name: "Durant", note: "Our home base — Westwood, Northwest Durant, and the historic downtown blocks." },
      { name: "Calera", note: "Quick hop down 69/75; popular for biweekly upkeep on newer builds." },
      { name: "Caddo", note: "Acreage homes and farmhouses where mudrooms and porches matter." },
      { name: "Silo", note: "Family homes on school-run schedules — we work around bus times." },
      { name: "Bokchito", note: "Country properties; we plan for dust, gravel drives, and big kitchens." },
      { name: "Colbert", note: "Commuter households heading to Sherman/Denison — key or code entry welcome." },
      { name: "Achille", note: "Rural routes covered on our Tuesday and Thursday county loops." },
      { name: "Mead", note: "Between Durant and the lake, so it pairs well with rental turnovers." },
    ],
    highlights: [
      {
        title: "No travel fee inside the county",
        desc: "Whether you're two minutes from Main Street or fifteen out toward Achille, the price is the price. Rural mileage is on us.",
      },
      {
        title: "Built for gravel-drive dust",
        desc: "County homes get dustier faster. We add HEPA vacuuming and hard-surface detail on every visit here instead of charging it as an extra.",
      },
      {
        title: "School and shift schedules respected",
        desc: "Durant, Silo, Caddo, and Colbert schools all run different bells. Pick an arrival window that fits — we hold the same slot every visit.",
      },
      {
        title: "Same crew, every time",
        desc: "Recurring Bryan County clients keep the same two-person team so nobody has to re-explain the dog, the code, or the good floors.",
      },
    ],
    rhythm: [
      { title: "Mondays & Tuesdays", desc: "In-town Durant recurring routes — Westwood, Northwest Durant, and downtown." },
      { title: "Wednesdays", desc: "Deep cleans and move in / move out jobs that need a full day on site." },
      { title: "Thursdays", desc: "County loop: Calera, Caddo, Bokchito, Achille, and Silo." },
      { title: "Fridays & Saturdays", desc: "Event prep, post-party resets, and guest-ready cleans before the weekend." },
    ],
    services: [
      { key: "Standard Clean", label: `Standard Clean · from $${STANDARD}`, blurb: `Recurring upkeep with ${BIWEEKLY}% off biweekly and ${WEEKLY}% off weekly.`, to: "/services" },
      { key: "Bright Clean", label: `Bright Clean · from $${BRIGHT}`, blurb: "Our most-booked tier — standard plus baseboards, doors, and detail work.", to: "/services" },
      { key: "Deep Clean", label: `Deep Clean · from $${DEEP}`, blurb: "Top-to-bottom reset for first visits, spring cleaning, and long-neglected rooms.", to: "/services" },
      { key: "Move In / Out", label: `Move In / Out · from $${MOVE}`, blurb: "Cabinets in and out, tracks, windows — ready for the walkthrough.", to: "/services" },
      { key: "Post-Party", label: `Post-Event · from $${POST}`, blurb: "Graduations, holidays, church gatherings, reunions.", to: "/post-event-cleaning" },
    ],
    faqs: [
      {
        q: "Do you charge extra to drive outside Durant?",
        a: "No. Every address inside Bryan County — Calera, Caddo, Silo, Bokchito, Colbert, Achille, Mead — pays the same flat rate as a Durant home. If you're outside the county line we'll quote the difference plainly before you commit.",
      },
      {
        q: "How much does house cleaning cost in Bryan County?",
        a: `Flat rates by home size, not by the hour. A 2 bed / 2 bath home starts at $${STANDARD} for a Standard Clean, $${BRIGHT} for a Bright Clean, and $${DEEP} for a Deep Clean. Extra bedrooms, baths, and add-ons are priced in the instant quote before you book.`,
      },
      {
        q: "Can you clean a rural property with a gravel drive and outbuildings?",
        a: "Yes. Interior living space is what's quoted; garages, shops, and detached buildings are quoted separately. We plan for gravel dust with HEPA vacuuming and extra hard-surface passes at no added charge.",
      },
      {
        q: "Do I need to be home when you clean?",
        a: "No. Most Bryan County clients leave a door code or a key. We lock up when we finish and send a photo recap of the finished rooms.",
      },
      {
        q: "Which days do you serve the smaller towns?",
        a: "Our county loop runs Tuesdays and Thursdays through Calera, Caddo, Bokchito, Silo, and Achille. Colbert and Mead can be added most days. If those don't fit, ask — we route around confirmed bookings.",
      },
      {
        q: "Are you insured, and what if something's missed?",
        a: "We're insured and bonded, and every clean carries the 24-Hour Magnolia Guarantee: flag anything within a day and we come back and re-clean it free.",
      },
      {
        q: "How soon can you clean in Bryan County?",
        a: "We clean Monday through Friday, 8:00 AM to 5:00 PM CST, with Saturday windows by request. Most homes can be scheduled within a couple of days, and recurring plans keep the same standing day.",
      },
    ],
  },
  {
    slug: "lake-texoma",
    label: "Lake Texoma",
    name: "Lake Texoma",
    eyebrow: "SERVICE AREA · LAKE TEXOMA",
    headline: "Cabin, cottage, and rental cleaning at",
    headlineAccent: "Lake Texoma",
    intro:
      "Kingston, Cartwright, Mead, Platter, and the shoreline in between. Lake homes live on a different clock — checkout at 11, check-in at 4, and a boat's worth of sand on the floor. We built same-day turnovers around that.",
    metaTitle: "Lake Texoma Cleaning & Airbnb Turnovers | Magnolia Maids",
    metaDescription: `Same-day Lake Texoma cleaning and Airbnb turnovers from $${AIRBNB} — Kingston, Cartwright, Mead, and Platter. Linen swaps, staging, photo checklist, and flat rates.`,
    keywords:
      "Lake Texoma cleaning service, Airbnb cleaning Lake Texoma, Kingston OK house cleaning, Cartwright OK cleaners, vacation rental turnover Lake Texoma, cabin cleaning Texoma",
    heroImage: "lake",
    towns: [
      { name: "Kingston", note: "Short-term rentals and weekend cabins on the north shore." },
      { name: "Cartwright", note: "Marina-adjacent homes with heavy Friday-to-Sunday traffic." },
      { name: "Mead", note: "Halfway to Durant — easy to pair a rental flip with a home clean." },
      { name: "Platter", note: "Quiet coves and family lake houses used seasonally." },
      { name: "Willow Springs & Streetman", note: "Cove properties reachable on our lake route." },
      { name: "Durant lake commuters", note: "In-town owners who keep a rental out on the water." },
    ],
    highlights: [
      {
        title: "Same-day turnovers between guests",
        desc: "Checkout to check-in in one window — beds stripped and remade, baths reset, kitchen restocked, deck swept, and photos sent before the next guest pulls in.",
      },
      {
        title: "Sand, sunscreen, and lake grime",
        desc: "Different mess than a town house. We detail entry mats, sliders, deck doors, and shower floors where sand and sunscreen actually collect.",
      },
      {
        title: "Linen program and staging",
        desc: "Bring your own linens or use our swap service. Every flip ends staged the way your listing photos look, so reviews match the pictures.",
      },
      {
        title: "Photo checklist on every flip",
        desc: "Timestamped photos of each room, plus damage and low-supply notes — so you can approve a turnover from anywhere.",
      },
      {
        title: "Seasonal open and close",
        desc: "Spring open-up after the cabin sits all winter, and a full close-down deep clean when the season ends.",
      },
    ],
    rhythm: [
      { title: "Friday", desc: "Pre-arrival checks and guest-ready touch-ups before weekend check-ins." },
      { title: "Sunday & Monday", desc: "Peak turnover days — back-to-back flips across Kingston and Cartwright." },
      { title: "Midweek", desc: "Deep cleans, carpet and upholstery attention, and owner-stay prep." },
      { title: "Season change", desc: "Spring open-up and fall close-down for cabins that sit between visits." },
    ],
    services: [
      { key: "Airbnb Turnover", label: `Airbnb Turnover · from $${AIRBNB}`, blurb: "Same-day flips with linens, staging, and a photo checklist.", to: "/airbnb-turnover" },
      { key: "Deep Clean", label: `Deep Clean · from $${DEEP}`, blurb: "Season open-up or close-down for a cabin that's been sitting.", to: "/services" },
      { key: "Post-Party", label: `Post-Event · from $${POST}`, blurb: "Lake weekends, bachelorette parties, family reunions.", to: "/post-event-cleaning" },
      { key: "Standard Clean", label: `Standard Clean · from $${STANDARD}`, blurb: `Owner-occupied lake homes on recurring plans (${BIWEEKLY}% off biweekly).`, to: "/services" },
      { key: "Move In / Out", label: `Move In / Out · from $${MOVE}`, blurb: "Closing on a lake property or handing one over.", to: "/services" },
    ],
    faqs: [
      {
        q: "Can you turn a rental over the same day between guests?",
        a: `Yes — same-day flips are the core of what we do at the lake. Turnovers start at $${AIRBNB} for a 2 bed / 2 bath cabin and include linens, baths, kitchen, floors, trash, deck sweep, staging, and a photo checklist.`,
      },
      {
        q: "Which lake communities do you cover?",
        a: "Kingston, Cartwright, Mead, Platter, and the cove neighborhoods between them, plus Durant owners with a property on the water. No travel fee inside that footprint.",
      },
      {
        q: "Do you supply linens and consumables?",
        a: "You can stock your own or use our linen swap. Either way we track paper goods, soap, coffee, and trash liners and flag anything running low in the turnover report.",
      },
      {
        q: "How do you handle back-to-back weekend bookings?",
        a: "Send us your calendar (or connect your listing) and we schedule the whole weekend at once — Friday pre-arrival check, Sunday flip, Monday flip. Peak summer weekends should be booked ahead.",
      },
      {
        q: "What if a guest leaves damage or something's missing?",
        a: "It's documented with timestamped photos and sent to you the same day, before the next guest arrives, so you have what you need for a claim.",
      },
      {
        q: "Do you clean boats, docks, or outdoor spaces?",
        a: "Decks, patios, and entry areas are included when guests use them. Docks, boats, and detached shops aren't part of a standard flip — mention them when you book and we'll quote separately.",
      },
      {
        q: "Can you open the cabin for the season and close it down after?",
        a: "Yes. Spring open-up is a Deep Clean with dust, cobwebs, appliances, and linens refreshed; fall close-down adds fridge emptying, trash removal, and a final walkthrough with photos.",
      },
    ],
  },
];

export function getServiceArea(slug: string): ServiceArea | undefined {
  return SERVICE_AREA_PAGES.find((a) => a.slug === slug);
}