import logoAsset from "@/assets/planit-logo.png.asset.json";

/**
 * Partner perk: every Magnolia Maids client on a recurring plan gets the
 * plan.It "Family" package free for as long as they stay on the plan.
 * Single source of truth for site copy, emails, and Maggie's knowledge base.
 */
export const PLANIT = {
  name: "plan.It",
  url: "https://planit-me.lovable.app",
  pricingUrl: "https://planit-me.lovable.app/pricing",
  /** Magnolia Maids partner landing page on plan.It — used for every outbound CTA. */
  partnerUrl: "https://planit-me.lovable.app/magnolia",
  logo: logoAsset.url,
  plan: "Family",
  monthly: 10,
  annualValue: 120,
  seats: 5,
  tagline: "Your calm operating system for daily life.",
  summary:
    "Tasks, calendar, appointments, bills, documents, and groceries in one place — with an assistant you can reach by voice, Slack, email, or chat.",
  eligibility: "Free while you're on a recurring Magnolia Maids plan — weekly, biweekly, or monthly.",
  claim: "We email your redemption code after you book. No card required.",
  features: [
    "Everything in plan.It Pro",
    "Up to 5 seats for your household",
    "Shared categories and grocery list",
    "Per-seat task assignment",
    "Shared documents and appointments",
    "Family billing portal",
  ],
} as const;

/** Fallback promo code when no admin override is set in business settings. */
export const PLANIT_DEFAULT_CODE = "MAGNOLIA-FAMILY";

/** Settings key holding the current plan.It redemption code. */
export const PLANIT_CODE_SETTING = "planit_promo_code";

export function planitClaimUrl(code: string = PLANIT_DEFAULT_CODE) {
  return `${PLANIT.partnerUrl}?plan=family&cycle=monthly&code=${encodeURIComponent(code)}`;
}
