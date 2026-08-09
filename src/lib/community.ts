export type Attraction = {
  name: string;
  kind: "State park" | "Marina" | "Public ramp" | "Lake town" | "In town";
  blurb: string;
  source: string;
  sourceLabel: string;
};

/**
 * Publicly documented Lake Texoma and Durant destinations. Descriptions stay
 * general on purpose — hours, fees, and seasonal access change, so every card
 * links to the official source visitors should check before they go.
 */
export const ATTRACTIONS: Attraction[] = [
  {
    name: "Lake Texoma",
    kind: "Lake town",
    blurb:
      "One of the largest reservoirs in the country, built where the Red and Washita rivers meet. Managed by the U.S. Army Corps of Engineers, with public ramps, campgrounds, and day-use areas along the Oklahoma shoreline.",
    source: "https://www.swt.usace.army.mil/Locations/Tulsa-District-Lakes/Texas/Lake-Texoma/",
    sourceLabel: "U.S. Army Corps of Engineers",
  },
  {
    name: "Lake Texoma State Park",
    kind: "State park",
    blurb:
      "Oklahoma state park land on the north shore near Kingston, with shoreline access, picnic areas, and trails. A common jumping-off point for a first visit to the lake.",
    source: "https://www.travelok.com/state-parks/lake-texoma-state-park",
    sourceLabel: "TravelOK",
  },
  {
    name: "Tishomingo National Wildlife Refuge",
    kind: "State park",
    blurb:
      "Federal refuge on the Washita arm of Lake Texoma, known for wintering waterfowl, birding, and quiet walking routes about half an hour from Durant.",
    source: "https://www.fws.gov/refuge/tishomingo",
    sourceLabel: "U.S. Fish & Wildlife Service",
  },
  {
    name: "Striper fishing on Texoma",
    kind: "Marina",
    blurb:
      "Texoma is one of the few lakes where striped bass reproduce naturally, and guided striper trips run year-round. A fishing license valid for the lake is required — check current rules before you launch.",
    source: "https://www.wildlifedepartment.com/fishing/where/lake-texoma",
    sourceLabel: "Oklahoma Dept. of Wildlife Conservation",
  },
  {
    name: "Kingston & Cartwright",
    kind: "Lake town",
    blurb:
      "Shoreline communities north and west of the dam, full of lake houses and short-term rentals. We clean here with no travel fee.",
    source: "https://www.travelok.com/kingston",
    sourceLabel: "TravelOK",
  },
  {
    name: "Mead & Platter",
    kind: "Lake town",
    blurb:
      "Small Bryan County communities between Durant and the lake — quiet routes, big yards, and a short drive to the water.",
    source: "https://www.travelok.com/durant",
    sourceLabel: "TravelOK",
  },
  {
    name: "Downtown Durant",
    kind: "In town",
    blurb:
      "Main Street shops, local restaurants, and the world's largest peanut monument. The heart of Bryan County and the center of our weekday routes.",
    source: "https://www.travelok.com/durant",
    sourceLabel: "TravelOK",
  },
  {
    name: "Three Valley Museum",
    kind: "In town",
    blurb:
      "Local history museum in Durant covering Bryan County, Choctaw Nation heritage, and the region's railroad and farming past.",
    source: "https://www.okhistory.org/publications/enc/entry?entry=DU011",
    sourceLabel: "Oklahoma Historical Society",
  },
  {
    name: "Choctaw Nation of Oklahoma",
    kind: "In town",
    blurb:
      "Durant is the headquarters of the Choctaw Nation, and its cultural center south of town shares Choctaw history, art, and language with visitors.",
    source: "https://www.choctawnation.com/",
    sourceLabel: "Choctaw Nation",
  },
];

export type SeasonTip = {
  season: string;
  months: string;
  headline: string;
  body: string;
  cta: { label: string; to: string };
};

export const SEASON_TIPS: SeasonTip[] = [
  {
    season: "Spring",
    months: "March – May",
    headline: "Oak and cedar pollen coats everything",
    body: "South-central Oklahoma runs heavy on tree pollen in spring. Window sills, ceiling fans, baseboards, and entry rugs hold the most of it — the details a deep clean is built around.",
    cta: { label: "See deep cleaning", to: "/services" },
  },
  {
    season: "Summer",
    months: "June – August",
    headline: "Lake dust, humidity, and a full guest calendar",
    body: "Boat bags, wet towels, and back-to-back guests wear a house down fast. Turnovers between stays keep the place fresh without eating your weekend.",
    cta: { label: "Airbnb turnovers", to: "/airbnb-turnover" },
  },
  {
    season: "Fall & winter",
    months: "September – February",
    headline: "Entryway grit and holiday hosting",
    body: "Wet leaves and red-dirt grit track straight to the entry and kitchen. Before family arrives, a one-time reset gets the guest bath, floors, and kitchen photo-ready.",
    cta: { label: "Holiday ready", to: "/holiday-ready" },
  },
];