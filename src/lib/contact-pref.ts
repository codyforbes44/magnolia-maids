/**
 * How a person wants Magnolia Maids (and Maggie) to reach back out. Shared by
 * every public form, the Facebook lead importer, and the follow-up jobs so a
 * lead never gets a text when they asked for a call.
 */
export const CONTACT_PREFS = ["email", "text", "call"] as const;
export type ContactPref = (typeof CONTACT_PREFS)[number];

export const CONTACT_PREF_LABELS: Record<ContactPref, string> = {
  email: "Email",
  text: "Text message",
  call: "Phone call",
};

export const CONTACT_PREF_HINTS: Record<ContactPref, string> = {
  email: "We'll send everything in writing.",
  text: "Quick answers straight to your phone.",
  call: "Maggie or the team will ring you.",
};

export const DEFAULT_CONTACT_PREF: ContactPref = "email";

export function normalizeContactPref(value: unknown): ContactPref {
  const v = String(value ?? "").trim().toLowerCase();
  if (v.startsWith("text") || v.includes("sms") || v.includes("message")) return "text";
  if (v.startsWith("call") || v.includes("phone")) return "call";
  return "email";
}