import { z } from "zod";
import { attributionSchema } from "./attribution";
import { CONTACT_PREFS } from "./contact-pref";

export const CAMPAIGN_KEYS = [
  "summer-on-the-lake",
  "referral-week",
  "holiday-ready",
  "nextdoor-neighbors",
] as const;
export type CampaignKey = (typeof CAMPAIGN_KEYS)[number];

export const campaignLeadSchema = z.object({
  campaign: z.enum(CAMPAIGN_KEYS),
  name: z.string().trim().min(1, "Please tell us your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  homeSize: z.string().trim().max(120).optional().or(z.literal("")),
  preferredDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .optional()
    .or(z.literal("")),
  referralName: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  contactPref: z.enum(CONTACT_PREFS).default("email"),
  attribution: attributionSchema.partial().optional(),
});

export type CampaignLeadInput = z.infer<typeof campaignLeadSchema>;
