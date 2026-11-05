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
  heroImage: "estate" | "suburb";
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

const commonServices = (lead: "home" | "rental") => [
  { key: "Standard Clean", label: `Standard Clean · from $${STANDARD}`, blurb: `Recurring upkeep with ${BIWEEKLY}% off biweekly and ${WEEKLY}% off weekly.`, to: "/services" },
  { key: "Bright Clean", label: `Bright Clean · from $${BRIGHT}`, blurb: "Our most-booked tier — standard plus baseboards, doors, and detail work.", to: "/services" },
  { key: "Deep Clean", label: `Deep Clean · from $${DEEP}`, blurb: "Top-to-bottom reset for first visits, seasonal refreshes, and pre-listing prep.", to: "/services" },
  lead === "rental"
    ? { key: "Airbnb Turnover", label: `Airbnb Turnover · from $${AIRBNB}`, blurb: "Same-day flips with linens, staging, and a photo checklist.", to: "/airbnb-turnover" }
    : { key: "Move In / Out", label: `Move In / Out · from $${MOVE}`, blurb: "Cabinets in and out, tracks, windows — ready for the walkthrough.", to: "/services" },
  { key: "Post-Party", label: `Post-Event · from $${POST}`, blurb: "Holiday parties, graduations, game days, and gatherings.", to: "/post-event-cleaning" },
];

const sharedFaqs = (where: string): AreaFaq[] => [
  {
    q: `How much does house cleaning cost in ${where}?`,
    a: `Flat rates by home size, not by the hour. A 2 bed / 2 bath home starts at $${STANDARD} for a Standard Clean, $${BRIGHT} for a Bright Clean, and $${DEEP} for a Deep Clean. Larger homes, extra rooms, and add-ons are priced in the instant quote before you book.`,
  },
  {
    q: "Do I need to be home when you clean?",
    a: "No. Most clients leave a gate code, lockbox, or key with us. We lock up when we finish and send a photo recap of the finished rooms.",
  },
  {
    q: "Are you insured, and what if something's missed?",
    a: "We're insured and bonded, and every clean carries the 24-Hour Magnolia Guarantee: flag anything within a day and we come back and re-clean it free.",
  },
  {
    q: `How soon can you clean in ${where}?`,
    a: "We clean Monday through Friday, 8:00 AM to 5:00 PM CST. Most homes can be scheduled within a few days, and recurring plans keep the same standing day and crew.",
  },
];

export const SERVICE_AREA_PAGES: ServiceArea[] = [
  {
    slug: "park-cities",
    label: "Highland Park & University Park",
    name: "Highland Park & University Park",
    eyebrow: "SERVICE AREA · THE PARK CITIES",
    headline: "Discreet, detail-first cleaning in",
    headlineAccent: "the Park Cities",
    intro:
      "Highland Park and University Park homes deserve white-glove care — marble, hardwoods, custom millwork, and heirloom pieces. Our trained two-person crews know how to treat them, and they show up the same day every visit.",
    metaTitle: "House Cleaning in Highland Park & University Park | Magnolia Maids",
    metaDescription: `Upscale house cleaning in Highland Park and University Park, TX. Insured crews, flat rates — Standard from $${STANDARD}, deep cleans from $${DEEP}.`,
    keywords: "house cleaning Highland Park TX, maid service University Park, Park Cities cleaning service, luxury house cleaners Dallas 75205, 75225 maid service",
    heroImage: "estate",
    towns: [
      { name: "Highland Park", note: "Classic estates along Beverly Drive and Armstrong — fine finishes handled with care." },
      { name: "University Park", note: "SMU-adjacent family homes on school-year schedules." },
      { name: "Bluffview", note: "Tree-lined lots and mid-century homes just west of the Tollway." },
      { name: "Turtle Creek", note: "High-rise residences and townhomes with concierge entry." },
    ],
    highlights: [
      { title: "Fine-surface trained", desc: "Marble, natural stone, lacquer, and antique wood get the right products — never a one-size spray." },
      { title: "Discreet, consistent crews", desc: "The same vetted team every visit, briefed on your home, your staff, and your preferences." },
      { title: "Works with your household", desc: "We coordinate with house managers, nannies, and gate or alarm codes so the day runs smoothly." },
      { title: "Entertaining-ready", desc: "Pre-event polish and post-party resets around Park Cities holiday and SMU weekends." },
    ],
    rhythm: [
      { title: "Mondays & Tuesdays", desc: "Recurring Highland Park and University Park routes." },
      { title: "Wednesdays", desc: "Deep cleans and move in / move out projects." },
      { title: "Thursdays", desc: "Pre-event polish ahead of weekend entertaining." },
      { title: "Fridays", desc: "Guest-ready touch-ups and post-event resets." },
    ],
    services: commonServices("home"),
    faqs: [
      { q: "Can you care for marble, natural stone, and antiques?", a: "Yes. Crews use pH-neutral stone products and soft cloths on fine finishes, and we note any surfaces you'd rather we skip." },
      ...sharedFaqs("Highland Park and University Park"),
    ],
  },
  {
    slug: "preston-hollow",
    label: "Preston Hollow & North Dallas",
    name: "Preston Hollow & North Dallas",
    eyebrow: "SERVICE AREA · PRESTON HOLLOW",
    headline: "Estate-level house cleaning in",
    headlineAccent: "Preston Hollow",
    intro:
      "From the large-lot estates of Preston Hollow to Prestonwood and Far North Dallas, we keep big homes calm, polished, and guest-ready — on a schedule that never shifts.",
    metaTitle: "House Cleaning in Preston Hollow & North Dallas | Magnolia Maids",
    metaDescription: `Upscale house cleaning across Preston Hollow, Bluffview, Prestonwood, and Far North Dallas. Flat rates — Standard from $${STANDARD}, deep cleans from $${DEEP}.`,
    keywords: "house cleaning Preston Hollow, maid service North Dallas, Far North Dallas cleaning service, Prestonwood house cleaners, luxury maid service Dallas 75230",
    heroImage: "estate",
    towns: [
      { name: "Preston Hollow", note: "Our home base — estate homes, guest houses, and pool cabanas." },
      { name: "Prestonwood", note: "Established family homes near Preston and Belt Line." },
      { name: "Far North Dallas", note: "Newer builds and townhomes up to the George Bush Turnpike." },
      { name: "Lake Highlands", note: "Added on request when routes allow." },
    ],
    highlights: [
      { title: "Built for large homes", desc: "Square-footage pricing keeps big homes honest — no surprise hourly creep." },
      { title: "Guest houses and casitas", desc: "Add a guest house, pool bath, or media room to any visit." },
      { title: "Same crew, every time", desc: "Recurring clients keep the same team so nobody has to re-explain the dogs, the codes, or the good floors." },
      { title: "Photo recap after every visit", desc: "Approve the finished rooms from wherever your day takes you." },
    ],
    rhythm: [
      { title: "Mondays & Tuesdays", desc: "Recurring Preston Hollow and Bluffview routes." },
      { title: "Wednesdays", desc: "Deep cleans and full-day estate projects." },
      { title: "Thursdays", desc: "Far North Dallas and Prestonwood routes." },
      { title: "Fridays", desc: "Event prep and guest-ready cleans before the weekend." },
    ],
    services: commonServices("home"),
    faqs: [
      { q: "Can you clean a guest house or pool cabana in the same visit?", a: "Yes. Add it in the instant quote or tell us when you book and we'll price it plainly before you commit." },
      ...sharedFaqs("Preston Hollow and North Dallas"),
    ],
  },
  {
    slug: "collin-county",
    label: "Plano, Frisco, Allen & McKinney",
    name: "Plano, Frisco, Allen & McKinney",
    eyebrow: "SERVICE AREA · COLLIN COUNTY",
    headline: "Polished, reliable cleaning across",
    headlineAccent: "Collin County",
    intro:
      "Busy households in Plano, Frisco, Allen, and McKinney count on us for recurring upkeep, deep cleans, and same-day Airbnb turnovers near Legacy West and The Star.",
    metaTitle: "House Cleaning in Plano, Frisco, Allen & McKinney | Magnolia Maids",
    metaDescription: `Flat-rate house cleaning and Airbnb turnovers in Plano, Frisco, Allen, and McKinney, TX. Standard from $${STANDARD}, turnovers from $${AIRBNB}.`,
    keywords: "house cleaning Plano TX, maid service Frisco, Allen TX cleaning service, McKinney house cleaners, Airbnb cleaning Frisco, Collin County maid service",
    heroImage: "suburb",
    towns: [
      { name: "Plano", note: "West Plano and Willow Bend family homes near Legacy." },
      { name: "Frisco", note: "Newer builds and short-term rentals near The Star and PGA Frisco." },
      { name: "Allen", note: "Family homes on school-run schedules — we work around bus times." },
      { name: "McKinney", note: "Craig Ranch, Stonebridge, and historic downtown homes." },
    ],
    highlights: [
      { title: "School and work schedules respected", desc: "Pick an arrival window that fits — we hold the same slot every visit." },
      { title: "Same-day rental turnovers", desc: "Checkout to check-in in one window, with linens, staging, and photos." },
      { title: "New-build friendly", desc: "Post-move dust, fresh fixtures, and big open kitchens handled right." },
      { title: "Pet-smart crews", desc: "Pet- and kid-safe products by default, plus extra attention to hair and paw prints." },
    ],
    rhythm: [
      { title: "Mondays & Tuesdays", desc: "Plano and Allen recurring routes." },
      { title: "Wednesdays", desc: "Deep cleans and move in / move out jobs." },
      { title: "Thursdays", desc: "Frisco and McKinney routes." },
      { title: "Weekends", desc: "Airbnb turnovers by arrangement around event weekends." },
    ],
    services: commonServices("rental"),
    faqs: [
      { q: "Can you turn a Frisco or Plano rental over the same day?", a: `Yes. Turnovers start at $${AIRBNB} for a 2 bed / 2 bath and include linens, baths, kitchen, floors, trash, staging, and a photo checklist.` },
      ...sharedFaqs("Plano, Frisco, Allen, and McKinney"),
    ],
  },
  {
    slug: "addison-richardson-southlake",
    label: "Addison, Richardson & Southlake",
    name: "Addison, Richardson & Southlake",
    eyebrow: "SERVICE AREA · ADDISON · RICHARDSON · SOUTHLAKE",
    headline: "Upscale home cleaning in",
    headlineAccent: "Addison, Richardson & Southlake",
    intro:
      "Townhomes in Addison, family homes in Richardson's Canyon Creek, and Southlake's custom estates — one standard of care, flat pricing, and the same crew every visit.",
    metaTitle: "House Cleaning in Addison, Richardson & Southlake | Magnolia Maids",
    metaDescription: `Flat-rate house cleaning in Addison, Richardson, and Southlake, TX. Insured crews — Standard from $${STANDARD}, deep cleans from $${DEEP}.`,
    keywords: "house cleaning Addison TX, maid service Richardson, Southlake house cleaners, luxury cleaning service Southlake, Canyon Creek maid service",
    heroImage: "suburb",
    towns: [
      { name: "Addison", note: "Townhomes and condos near Addison Circle — lockbox entry welcome." },
      { name: "Richardson", note: "Canyon Creek and Prairie Creek family homes." },
      { name: "Southlake", note: "Custom estates near Southlake Town Square." },
    ],
    highlights: [
      { title: "Flat rates, no surprises", desc: "Home size and service set the price — you see it before you book." },
      { title: "Condo and HOA friendly", desc: "We follow building rules, parking, and elevator reservations." },
      { title: "Estate-ready crews", desc: "Large Southlake homes get the time and team size they need." },
      { title: "24-Hour Magnolia Guarantee", desc: "Flag anything within a day and we come back and fix it free." },
    ],
    rhythm: [
      { title: "Mondays", desc: "Addison and Richardson recurring routes." },
      { title: "Tuesdays & Wednesdays", desc: "Southlake estates and deep cleans." },
      { title: "Thursdays", desc: "Move in / move out projects." },
      { title: "Fridays", desc: "Guest-ready cleans before the weekend." },
    ],
    services: commonServices("home"),
    faqs: sharedFaqs("Addison, Richardson, and Southlake"),
  },
];

const LEGACY_SLUGS: Record<string, string> = { "bryan-county": "preston-hollow", "lake-texoma": "collin-county" };

export function getServiceArea(slug: string): ServiceArea | undefined {
  const key = LEGACY_SLUGS[slug] ?? slug;
  return SERVICE_AREA_PAGES.find((a) => a.slug === key);
}