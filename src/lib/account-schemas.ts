import { z } from "zod";

export const ENTRY_METHODS = [
  { key: "someone_home", label: "Someone will be home" },
  { key: "lockbox", label: "Lockbox" },
  { key: "keypad", label: "Keypad / smart lock" },
  { key: "key_on_file", label: "Key on file with us" },
  { key: "garage", label: "Garage code" },
  { key: "other", label: "Other (see notes)" },
] as const;

export const PET_KINDS = ["dog", "cat", "bird", "reptile", "small animal", "other"] as const;

export const SCENT_PREFERENCES = [
  "No preference",
  "Fragrance free",
  "Light & fresh",
  "Citrus",
  "Lavender",
] as const;

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((v) => (v ? v : null));

export const homeProfileSchema = z.object({
  entryMethod: z.enum(ENTRY_METHODS.map((e) => e.key) as [string, ...string[]]),
  entryCode: optionalText(60),
  lockboxLocation: optionalText(200),
  alarmInstructions: optionalText(500),
  parkingNotes: optionalText(300),
  address: optionalText(300),
  bedrooms: optionalText(20),
  bathrooms: optionalText(20),
  squareFeet: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "" || v === null) return null;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 && n < 100000 ? Math.round(n) : null;
    }),
  skipRooms: optionalText(500),
  focusRooms: optionalText(500),
  productPreferences: optionalText(500),
  scentPreference: optionalText(60),
  suppliesNotes: optionalText(500),
  preferredFrequency: optionalText(40),
  preferredDay: optionalText(40),
  preferredWindow: optionalText(60),
  standingAddons: z.array(z.string().max(40)).max(12).default([]),
  billingEmail: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v), "Enter a valid email"),
  billingPhone: optionalText(40),
});
export type HomeProfileInput = z.infer<typeof homeProfileSchema>;

export const petSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Give your pet a name").max(60),
  kind: z.string().trim().min(1).max(30),
  temperament: optionalText(120),
  locationDuringClean: optionalText(160),
  notes: optionalText(400),
});
export type PetInput = z.infer<typeof petSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Your name helps our team greet you").max(120),
  phone: optionalText(40),
  contactPref: z.enum(["email", "text", "call"]),
  marketingOptIn: z.boolean().default(false),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const changeRequestSchema = z.object({
  bookingId: z.string().uuid(),
  kind: z.enum(["reschedule", "cancel"]),
  preferredDay: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  alternateDay: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  preferredTime: optionalText(60),
  reason: optionalText(120),
  note: optionalText(800),
});
export type ChangeRequestInput = z.infer<typeof changeRequestSchema>;