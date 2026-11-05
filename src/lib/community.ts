export type Attraction = {
  name: string;
  kind: "State park" | "Marina" | "Public ramp" | "Lake town" | "In town";
  blurb: string;
  source: string;
  sourceLabel: string;
};

/**
 * Publicly documented North Dallas and Collin County destinations. Descriptions stay
 * general on purpose — hours, fees, and seasonal access change, so every card
 * links to the official source visitors should check before they go.
 */
export const ATTRACTIONS: Attraction[] = [
  { name: "Klyde Warren Park", kind: "In town", blurb: "A five-acre deck park built over Woodall Rodgers Freeway between Uptown and the Arts District, with food trucks, lawn games, and free programming most days.", source: "https://www.klydewarrenpark.org/", sourceLabel: "Klyde Warren Park" },
  { name: "Dallas Arboretum & Botanical Garden", kind: "State park", blurb: "Sixty-six acres of display gardens on the shore of White Rock Lake, famous for Dallas Blooms in spring and the pumpkin village each fall.", source: "https://www.dallasarboretum.org/", sourceLabel: "Dallas Arboretum" },
  { name: "Highland Park Village", kind: "In town", blurb: "One of the first planned shopping centers in the country, with Spanish-style architecture, boutiques, and restaurants in the heart of the Park Cities.", source: "https://hpvillage.com/", sourceLabel: "Highland Park Village" },
  { name: "Katy Trail", kind: "State park", blurb: "A tree-lined former rail line for walking, running, and cycling that links Uptown with the Park Cities and SMU.", source: "https://www.katytraildallas.org/", sourceLabel: "Friends of the Katy Trail" },
  { name: "SMU & Meadows Museum", kind: "In town", blurb: "Southern Methodist University anchors University Park, and its Meadows Museum holds one of the largest collections of Spanish art outside Spain.", source: "https://meadowsmuseumdallas.org/", sourceLabel: "Meadows Museum" },
  { name: "Legacy West", kind: "In town", blurb: "Plano's walkable district of shops, restaurants, and the Legacy Food Hall — a weekend favorite across Collin County.", source: "https://legacywest.com/", sourceLabel: "Legacy West" },
  { name: "Frisco Square & The Star", kind: "In town", blurb: "Frisco's downtown green and the Dallas Cowboys' headquarters, with concerts, markets, and game-day crowds year-round.", source: "https://www.visitfrisco.com/", sourceLabel: "Visit Frisco" },
  { name: "Historic Downtown McKinney", kind: "In town", blurb: "Brick streets, antique shops, and local restaurants around the 1876 courthouse square, home to Dickens-style holiday events each winter.", source: "https://www.visitmckinney.com/", sourceLabel: "Visit McKinney" },
  { name: "White Rock Lake", kind: "Marina", blurb: "A 1,000-acre city lake with a nine-mile loop trail, sailing clubs, and sunset views of the Dallas skyline.", source: "https://www.dallasparks.org/", sourceLabel: "Dallas Park & Recreation" },
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
    body: "South-central Texas runs heavy on tree pollen in spring. Window sills, ceiling fans, baseboards, and entry rugs hold the most of it — the details a deep clean is built around.",
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