/**
 * Nextdoor integration configuration.
 *
 * Nextdoor's developer platform is application-gated: the Ads API and
 * Conversions API are granted through the "Ads and Conversion API Request
 * Form", after which a token is minted inside Nextdoor Ads Manager. Until
 * those credentials exist, everything here degrades to attribution-only
 * tracking, which needs no approval.
 */

/** Public business page — update if the Nextdoor page URL changes. */
export const NEXTDOOR_PAGE_URL = "https://nextdoor.com/pages/magnolia-maids-durant-ok/";

export const NEXTDOOR_ADS_MANAGER_URL = "https://ads.nextdoor.com/v2/manage/api";
export const NEXTDOOR_DEVELOPER_URL = "https://developer.nextdoor.com/reference/applying-for-access";

/** Browser pixel id — set VITE_NEXTDOOR_PIXEL_ID once the pixel is created. */
export const NEXTDOOR_PIXEL_ID: string =
  (import.meta.env?.VITE_NEXTDOOR_PIXEL_ID as string | undefined) ?? "";

/** Canonical UTM tags to paste into Nextdoor ad destination URLs. */
export const NEXTDOOR_UTM = {
  source: "nextdoor",
  medium: "paid_social",
} as const;

export function nextdoorLink(path: string, campaign: string, content?: string): string {
  const url = new URL(path, "https://magnoliamaids.pro");
  url.searchParams.set("utm_source", NEXTDOOR_UTM.source);
  url.searchParams.set("utm_medium", NEXTDOOR_UTM.medium);
  url.searchParams.set("utm_campaign", campaign);
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}

export type NextdoorCapability = {
  key: string;
  label: string;
  description: string;
  /** Which credential unlocks it. */
  requires: "none" | "pixel" | "ads" | "capi" | "publishing";
};

export const NEXTDOOR_CAPABILITIES: NextdoorCapability[] = [
  {
    key: "attribution",
    label: "Click attribution",
    description:
      "Every Nextdoor destination URL carries UTM tags. Leads and bookings record the channel they arrived from, visible in Leads and Bookings.",
    requires: "none",
  },
  {
    key: "landing",
    label: "Neighbor landing page",
    description: "A dedicated /nextdoor landing page with Durant-neighbor copy and its own lead tagging.",
    requires: "none",
  },
  {
    key: "pixel",
    label: "Universal Pixel",
    description: "Browser-side page views and lead events so Nextdoor can optimise delivery. Needs a pixel id.",
    requires: "pixel",
  },
  {
    key: "capi",
    label: "Conversions API",
    description:
      "Server-side quote, booking and lead events sent to conversions/track with hashed contact data. Needs Ads + CAPI approval.",
    requires: "capi",
  },
  {
    key: "ads",
    label: "Ads reporting & audiences",
    description:
      "Campaign, ad group and creative stats plus hashed custom audiences for retargeting. Needs an Ads Manager API token.",
    requires: "ads",
  },
  {
    key: "publishing",
    label: "Business feed posting",
    description:
      "Publish and schedule posts and events on the Nextdoor business feed. Needs separate Publishing API approval.",
    requires: "publishing",
  },
];
