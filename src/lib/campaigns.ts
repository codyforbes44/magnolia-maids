import type { CampaignKey } from "./campaign-lead-schema";
import { getServiceRate, priceHostWeekend, HOST_WEEKEND_DISCOUNT } from "./pricing";

const STANDARD = getServiceRate("Standard Clean").base;
const BRIGHT = getServiceRate("Bright Clean").base;
const DEEP = getServiceRate("Deep Clean").base;
const TURNOVER = getServiceRate("Airbnb Turnover").base;
const POST = getServiceRate("Post-Party").base;
const PRE = getServiceRate("Pre-Event Prep").base;
const BUNDLE = priceHostWeekend({ bedrooms: 3, bathrooms: 2 });
const BUNDLE_PCT = Math.round(HOST_WEEKEND_DISCOUNT * 100);

export const REFERRAL_CREDIT = 25;

export type CampaignContent = {
  key: CampaignKey;
  path: string;
  label: string;
  /** Short offer line reused in emails and the form panel. */
  offer: string;
  eyebrow: string;
  season: string;
  headline: string;
  headlineAccent: string;
  sub: string;
  heroAlt: string;
  primaryCta: string;
  proof: string[];
  /** Three-up value blocks. */
  points: { title: string; desc: string }[];
  /** Offer card contents. */
  offerCard: { title: string; lines: { label: string; value: string }[]; note: string };
  steps: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  formHeading: string;
  formSub: string;
  /** Extra field shown for this campaign only. */
  extraField: "referral" | "date" | null;
  seo: { title: string; description: string; keywords: string };
};

export const CAMPAIGNS: Record<CampaignKey, CampaignContent> = {
  "summer-on-the-lake": {
    key: "summer-on-the-lake",
    path: "/summer-on-the-lake",
    label: "Summer on the Lake",
    offer: `Lake Texoma turnovers from $${TURNOVER}, plus ${BUNDLE_PCT}% off the Host Weekend bundle.`,
    eyebrow: "SUMMER CAMPAIGN · LAKE TEXOMA",
    season: "May through August",
    headline: "Docks are full.",
    headlineAccent: "Your calendar shouldn't scare you.",
    sub: `Peak season on Lake Texoma means back-to-back guests. We turn rentals and lake houses between stays — linens, restock, staging, and a supply report before the next check-in. Turnovers from $${TURNOVER}.`,
    heroAlt: "Lakeside porch set with white linens and magnolia blooms overlooking Lake Texoma at golden hour",
    primaryCta: "Reserve your summer block",
    proof: ["Same-day turnaround windows", "Kingston · Cartwright · Platter · Mead", "Photo-verified staging"],
    points: [
      {
        title: "Turnovers between guests",
        desc: `Checkout to check-in in a single window. Linens stripped and remade, kitchen reset, bathrooms sanitized, amenities restocked, and staging photos sent before we leave. From $${TURNOVER} for a 2 bed / 2 bath.`,
      },
      {
        title: "The Host Weekend bundle",
        desc: `Hosting family instead of guests? Pre-Event Prep at $${PRE} before they arrive and a Post-Event Clean at $${POST} after they leave, booked together for ${BUNDLE_PCT}% off — about $${BUNDLE.total} for a 3 bed / 2 bath.`,
      },
      {
        title: "Summer maintenance for lake houses",
        desc: `Sand, sunscreen, and wet towels all season. A Standard Clean at $${STANDARD} on a recurring plan keeps a second home ready — weekly saves 20%, biweekly 15%.`,
      },
    ],
    offerCard: {
      title: "Summer rates",
      lines: [
        { label: "Airbnb / VRBO turnover", value: `from $${TURNOVER}` },
        { label: "Standard Clean", value: `from $${STANDARD}` },
        { label: "Host Weekend bundle", value: `${BUNDLE_PCT}% off both visits` },
      ],
      note: "Flat rates for a 2 bed / 2 bath home. Larger homes add only for the extra rooms.",
    },
    steps: [
      { title: "Send us your season", desc: "Share your booking calendar or your busiest weekends — we map the turnover windows around them." },
      { title: "We lock the windows", desc: "Standing checkout-day slots so you never scramble for a cleaner in July." },
      { title: "Every turn, verified", desc: "Photos and a supply report after each visit, so you know the property is guest-ready without driving out." },
    ],
    faqs: [
      { q: "How fast is a turnover?", a: "Most 2–3 bedroom lake properties turn in 2 to 3 hours. Tell us your checkout and check-in times and we schedule inside that window." },
      { q: "Which lake communities do you cover?", a: "Kingston, Cartwright, Platter, Mead, Willis, and the Durant side of Lake Texoma, plus Durant, Calera, Silo, and Caddo." },
      { q: "Do you restock supplies?", a: "Yes — paper goods, soap, coffee, and linens from your par list. We send a low-stock report so you can reorder before it becomes a bad review." },
      { q: "Can I book just the busy weekends?", a: "You can. There is no contract. Standing slots simply get first claim on the calendar during peak weekends." },
    ],
    formHeading: "Hold your summer turnover slots",
    formSub: "Tell us the property and your busiest weekends. We reply with a flat rate and available windows within one business hour.",
    extraField: "date",
    seo: {
      title: "Summer on the Lake — Lake Texoma Turnover Cleaning | Magnolia Maids",
      description: `Peak-season Airbnb and VRBO turnover cleaning on Lake Texoma from $${TURNOVER}. Kingston, Cartwright, Platter, and Durant, OK. Same-day windows and photo-verified staging.`,
      keywords: "Lake Texoma turnover cleaning, Airbnb cleaning Kingston OK, vacation rental cleaning Durant OK, VRBO cleaner Cartwright, summer cleaning service Bryan County",
    },
  },

  "referral-week": {
    key: "referral-week",
    path: "/referral-week",
    label: "Referral Week",
    offer: `$${REFERRAL_CREDIT} credit for you and $${REFERRAL_CREDIT} off their first clean.`,
    eyebrow: "LIMITED CAMPAIGN · DURANT, OK",
    season: "One week, twice a year",
    headline: "Good homes",
    headlineAccent: "talk to each other.",
    sub: `Durant runs on word of mouth. Send a neighbor our way during Referral Week and you get $${REFERRAL_CREDIT} toward your next clean — they get $${REFERRAL_CREDIT} off their first. No cap on how many neighbors you send.`,
    heroAlt: "Two neighboring white southern homes at dusk with warm lit porches and magnolia trees",
    primaryCta: "Send a referral",
    proof: [`$${REFERRAL_CREDIT} for you`, `$${REFERRAL_CREDIT} for them`, "No limit on referrals"],
    points: [
      { title: "You get a credit", desc: `$${REFERRAL_CREDIT} comes off your next scheduled clean automatically once their first visit is complete. Nothing to print, clip, or remember.` },
      { title: "They get a welcome", desc: `Your neighbor's first clean is $${REFERRAL_CREDIT} off any service — a Standard Clean lands at $${STANDARD - REFERRAL_CREDIT} and a Bright Clean at $${BRIGHT - REFERRAL_CREDIT} for a 2 bed / 2 bath.` },
      { title: "Refer as many as you like", desc: "Five neighbors, five credits. Book a full block on your street and the whole neighborhood gets the same day of the week." },
    ],
    offerCard: {
      title: "The offer",
      lines: [
        { label: "Your credit", value: `$${REFERRAL_CREDIT}` },
        { label: "Their first clean", value: `$${REFERRAL_CREDIT} off` },
        { label: "Referral limit", value: "None" },
      ],
      note: "Credits post after their first completed visit and never expire while you're on the schedule.",
    },
    steps: [
      { title: "Send their name", desc: "Fill in the form with your neighbor's name — or forward them your referral link. That's the whole entry." },
      { title: "We reach out kindly", desc: "One friendly message mentioning you sent us. No pressure, no calls after hours, no list they can't leave." },
      { title: "Both credits post", desc: `Once their first clean is finished, $${REFERRAL_CREDIT} lands on your next invoice and theirs is already discounted.` },
    ],
    faqs: [
      { q: "How many neighbors can I refer?", a: "As many as you'd like. Each completed first clean earns a separate $25 credit on your account." },
      { q: "When does the credit apply?", a: "After your neighbor's first clean is completed. It comes off your next scheduled visit automatically — no code to enter." },
      { q: "Do I have to be a current client?", a: "No. If you refer someone before your own first clean, we hold the credit and apply it to your first visit instead." },
      { q: "Can businesses refer?", a: "Yes. Realtors, property managers, and Lake Texoma hosts earn the same credit per referred household." },
      { q: "How long does Referral Week run?", a: "One week, twice a year. Outside those weeks we still love referrals — the credit just isn't stacked." },
    ],
    formHeading: "Send a neighbor our way",
    formSub: "Give us their name and how to reach you. We handle the introduction and post both credits once their first clean is done.",
    extraField: "referral",
    seo: {
      title: "Referral Week — $25 for You, $25 for Them | Magnolia Maids Durant, OK",
      description: `Refer a neighbor during Magnolia Maids Referral Week and earn a $${REFERRAL_CREDIT} credit while they get $${REFERRAL_CREDIT} off their first clean in Durant, OK. No limit on referrals.`,
      keywords: "house cleaning referral Durant OK, cleaning service discount Bryan County, refer a friend maid service Oklahoma, Magnolia Maids referral",
    },
  },

  "holiday-ready": {
    key: "holiday-ready",
    path: "/holiday-ready",
    label: "Holiday Ready",
    offer: `Pre-holiday Deep Clean from $${DEEP}, post-event reset from $${POST}, ${BUNDLE_PCT}% off when bundled.`,
    eyebrow: "HOLIDAY CAMPAIGN · NOV 1 – DEC 20",
    season: "November 1 through December 20",
    headline: "Guests at six.",
    headlineAccent: "Ready by four.",
    sub: `Two cleans make the holidays: the deep one before family walks in, and the reset the morning after they leave. Deep Clean from $${DEEP}, post-event reset from $${POST}, and ${BUNDLE_PCT}% off when you book both.`,
    heroAlt: "Holiday dinner table set with brass candlesticks and magnolia garland in an elegant green dining room",
    primaryCta: "Reserve your holiday date",
    proof: ["Thanksgiving & Christmas dates", "Same or next-day resets", "24-Hour Magnolia Guarantee"],
    points: [
      { title: "The pre-holiday Deep Clean", desc: `Baseboards, blinds, inside the oven and fridge, guest room and guest bath, and every surface family will actually touch. From $${DEEP} for a 2 bed / 2 bath.` },
      { title: "The morning-after reset", desc: `Dishes and glassware, kitchen, every bath, floors, trash out, spot treatment on carpet and upholstery, then deodorize. From $${POST}, same or next day.` },
      { title: "Book both and save", desc: `The Host Weekend bundle takes ${BUNDLE_PCT}% off both visits — about $${BUNDLE.total} for a 3 bed / 2 bath instead of $${BUNDLE.raw}.` },
    ],
    offerCard: {
      title: "Holiday rates",
      lines: [
        { label: "Pre-holiday Deep Clean", value: `from $${DEEP}` },
        { label: "Post-event reset", value: `from $${POST}` },
        { label: "Both, booked together", value: `${BUNDLE_PCT}% off` },
      ],
      note: "December dates go first. Reserving two weeks out is the safest way to get the day you want.",
    },
    steps: [
      { title: "Tell us the dinner date", desc: "We work backward from when guests arrive and schedule the deep clean a day or two ahead so nothing has time to get dusty." },
      { title: "We prep the house", desc: "Guest room, guest bath, kitchen, and dining get the most attention — the rooms your family will actually live in." },
      { title: "We reset the morning after", desc: "You wake up to coffee instead of dishes. Same or next-day slots across Durant, Calera, Caddo, and Silo." },
    ],
    faqs: [
      { q: "How far ahead should I book?", a: "Two weeks for Thanksgiving and three for the week of Christmas. Those dates fill before any others on our calendar." },
      { q: "Can you clean on the holiday itself?", a: "We reserve holidays for our crew's families. We clean the day before and the day after, which is where it matters most anyway." },
      { q: "What if the mess is worse than expected?", a: "Very heavy events can price up to about 15% above the flat rate. We tell you before we start — never after." },
      { q: "Do you decorate or undecorate?", a: "We don't hang or take down decor, but we clean carefully around it and dust it in place during a deep clean." },
      { q: "What if I'm not happy with something?", a: "The 24-Hour Magnolia Guarantee: flag anything within a day and we re-clean it free." },
    ],
    formHeading: "Reserve your holiday date",
    formSub: "Tell us when guests arrive. We'll confirm the crew, the date, and a flat rate within one business hour.",
    extraField: "date",
    seo: {
      title: "Holiday Ready — Pre-Holiday Deep Clean in Durant, OK | Magnolia Maids",
      description: `Pre-holiday Deep Clean from $${DEEP} and same or next-day post-event resets from $${POST} across Durant, OK and Bryan County. Book both and save ${BUNDLE_PCT}%.`,
      keywords: "holiday cleaning Durant OK, Thanksgiving cleaning service Bryan County, Christmas deep clean Oklahoma, after party cleaning Durant, pre holiday house cleaning",
    },
  },
};

export const CAMPAIGN_LIST = Object.values(CAMPAIGNS);
