/**
 * Pinned Magnolia Maids Meta assets. These are public identifiers (not secrets)
 * so every admin panel targets the right business instead of guessing from
 * whatever the access token happens to have.
 */
export const FACEBOOK_BUSINESS_ID = "1225204346447828";
export const FACEBOOK_BUSINESS_NAME = "Magnolia Maids (Cody Forbes Business Manager)";

/** Meta Ads account — always passed to Graph with the `act_` prefix. */
export const FACEBOOK_AD_ACCOUNT_ID = "act_1943161863013194";
export const FACEBOOK_AD_ACCOUNT_LABEL = "magnolia";

export const FACEBOOK_PAGE_ID = "1279466141909245";
export const FACEBOOK_PAGE_NAME = "Magnolia Maids";
export const FACEBOOK_PAGE_HANDLE = "MagnoliaMaidsOK";
export const FACEBOOK_PAGE_URL = "https://facebook.com/MagnoliaMaidsOK";

/**
 * Lead Ads forms on the Magnolia Maids Page, pinned so each one lands in the
 * right admin table instead of everything piling into campaign leads.
 */
export const FACEBOOK_LEAD_FORMS: Record<string, { destination: "leads" | "applications"; label: string }> = {
  "1801207874196436": { destination: "leads", label: "Cleaning quote request" },
  "939916635808326": { destination: "applications", label: "Join Magnolia Maids (hiring)" },
};

/**
 * Meta does not follow redirects on webhook callbacks, and the www host 302s to
 * the apex domain — so this apex URL is the only value that verifies.
 */
export const FACEBOOK_WEBHOOK_URL = "https://magnoliamaids.pro/api/public/hooks/facebook-leadgen";
export const FACEBOOK_WEBHOOK_HOST = "magnoliamaids.pro";

/** What each permission unlocks in the admin dashboard. */
export const SCOPE_CAPABILITIES: Record<string, string> = {
  pages_show_list: "Discover and connect the Magnolia Maids Page",
  pages_read_engagement: "Read Page posts and engagement counts",
  pages_manage_posts: "Publish, schedule, and delete Page posts",
  pages_read_user_content: "Read visitor comments on Page posts",
  pages_manage_engagement: "Reply to and moderate comments",
  pages_manage_metadata: "Subscribe the Page to Lead Ads webhooks",
  read_insights: "Page insights (reach, engagement, followers)",
  leads_retrieval: "Import Lead Ads submissions into the leads dashboard",
  ads_read: "Ads performance (spend, clicks, cost per lead)",
};

/** Scopes each dashboard feature needs. */
export const FEATURE_SCOPES = {
  publish: ["pages_manage_posts"],
  comments: ["pages_read_user_content", "pages_manage_engagement"],
  pageInsights: ["read_insights"],
  ads: ["ads_read"],
  leads: ["leads_retrieval", "pages_manage_metadata"],
} as const;
