/**
 * Editable SMS template catalog.
 *
 * Bodies use `{{variable}}` placeholders so admins can rewrite the copy in the
 * dashboard without touching code. `src/lib/sms/messages.ts` remains the
 * hard-coded fallback used when no override is stored.
 */

export type SmsVariableKey =
  | "name"
  | "firstName"
  | "phone"
  | "service"
  | "frequency"
  | "bedrooms"
  | "bathrooms"
  | "preferredDay"
  | "preferredTime"
  | "timeWindow"
  | "estimate"
  | "address"
  | "eta"
  | "reviewUrl"
  | "quoteUrl"
  | "ref"
  | "sitePhone";

export type SmsTemplateDef = {
  id: string;
  title: string;
  audience: "Customer" | "Internal" | "Lead" | "Compliance";
  trigger: string;
  variables: SmsVariableKey[];
  defaultBody: string;
};

export const SMS_VARIABLE_LABELS: Record<SmsVariableKey, string> = {
  name: "Full name",
  firstName: "First name",
  phone: "Phone",
  service: "Service",
  frequency: "Frequency",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  preferredDay: "Preferred day",
  preferredTime: "Preferred time",
  timeWindow: "Arrival window",
  estimate: "Estimate",
  address: "Address",
  eta: "Crew ETA",
  reviewUrl: "Review link",
  quoteUrl: "Quote link",
  ref: "Reference #",
  sitePhone: "Business phone",
};

/** Sample values shown in the preview until an admin saves their own. */
export const SMS_VARIABLE_DEFAULTS: Record<SmsVariableKey, string> = {
  name: "Sarah Whitfield",
  firstName: "Sarah",
  phone: "(580) 555-0134",
  service: "Deep Clean",
  frequency: "Every 2 weeks",
  bedrooms: "3",
  bathrooms: "2",
  preferredDay: "Wed, Aug 19",
  preferredTime: "Morning (8am-12pm)",
  timeWindow: "8:00 AM - 12:00 PM",
  estimate: "$249",
  address: "1420 Magnolia Ln, Durant, OK 74701",
  eta: "8:45-9:15 AM",
  reviewUrl: "https://g.page/r/magnolia-maids/review",
  quoteUrl: "https://magnoliamaids.pro/quote",
  ref: "8F3C21AB",
  sitePhone: "(580) 745-0045",
};

export const SMS_TEMPLATES: SmsTemplateDef[] = [
  {
    id: "booking-confirmation",
    title: "Booking confirmation",
    audience: "Customer",
    trigger: "Immediately after a booking request is submitted",
    variables: [
      "firstName",
      "service",
      "frequency",
      "bedrooms",
      "bathrooms",
      "preferredDay",
      "preferredTime",
      "estimate",
      "sitePhone",
      "ref",
    ],
    defaultBody: `Hi {{firstName}} — Magnolia Maids here. We received your {{service}} request. 🌿
{{frequency}} · {{bedrooms}} bd/{{bathrooms}} ba
Requested: {{preferredDay}} · {{preferredTime}}
Estimate: {{estimate}}
Next: we'll confirm your arrival window within 1 business hour. Nothing is charged today.
Questions? Call or text {{sitePhone}}. Ref #{{ref}}`,
  },
  {
    id: "booking-alert",
    title: "Dispatch alert",
    audience: "Internal",
    trigger: "Sent to the office line alongside the confirmation",
    variables: [
      "ref",
      "name",
      "service",
      "frequency",
      "bedrooms",
      "bathrooms",
      "preferredDay",
      "preferredTime",
      "phone",
      "estimate",
    ],
    defaultBody: `New Magnolia Maids request — Ref #{{ref}}
{{name}} · {{service}} · {{frequency}}
{{bedrooms}}bd/{{bathrooms}}ba · {{preferredDay}} · {{preferredTime}}
Phone: {{phone}}
Estimate: {{estimate}}`,
  },
  {
    id: "appointment-reminder",
    title: "Appointment reminder",
    audience: "Customer",
    trigger: "Daily job, 1 day before the scheduled clean",
    variables: ["firstName", "service", "frequency", "timeWindow", "address", "sitePhone", "ref"],
    defaultBody: `Reminder, {{firstName}} — your Magnolia Maids clean is tomorrow. 🌸
{{service}} · {{frequency}}
Arrival: {{timeWindow}}
At: {{address}}
Need to reschedule? Call or text {{sitePhone}} as soon as possible. Ref #{{ref}}`,
  },
  {
    id: "crew-eta",
    title: "Crew ETA",
    audience: "Customer",
    trigger: "Morning of the clean, once the route is set",
    variables: ["firstName", "eta", "sitePhone"],
    defaultBody: `Good morning, {{firstName}} — your Magnolia Maids crew is on the way and expects to arrive {{eta}}. We'll text you when we're pulling up. Need anything? {{sitePhone}}`,
  },
  {
    id: "crew-arrived",
    title: "Crew arrived",
    audience: "Customer",
    trigger: "When the crew pulls up",
    variables: ["firstName"],
    defaultBody: `Hi {{firstName}}, your Magnolia Maids crew has arrived and is getting started. Sit back and enjoy the fresh, clean feeling. ✨`,
  },
  {
    id: "completion",
    title: "Completion + review request",
    audience: "Customer",
    trigger: "After the job is marked complete",
    variables: ["firstName", "service", "reviewUrl", "sitePhone"],
    defaultBody: `Your clean is complete — thank you for welcoming Magnolia Maids into your home, {{firstName}}. 🌿
Service: {{service}}
We'd love your feedback if you have a moment.
{{reviewUrl}}
Questions? {{sitePhone}}`,
  },
  {
    id: "quote-follow-up",
    title: "Quote follow-up",
    audience: "Lead",
    trigger: "Lead requested a quote but hasn't finished it",
    variables: ["firstName", "estimate", "quoteUrl", "sitePhone"],
    defaultBody: `Hi {{firstName}} — thanks for reaching out to Magnolia Maids.
Your custom estimate starts at {{estimate}}.
Complete your instant quote in about 60 seconds and we'll lock in your arrival window:
{{quoteUrl}}
Questions? {{sitePhone}}`,
  },
  {
    id: "opt-out",
    title: "STOP auto-reply",
    audience: "Compliance",
    trigger: "Inbound STOP / UNSUBSCRIBE",
    variables: [],
    defaultBody: `You're unsubscribed. You won't receive text messages from Magnolia Maids again. Reply START to resubscribe.`,
  },
  {
    id: "opt-in",
    title: "START auto-reply",
    audience: "Compliance",
    trigger: "Inbound START / YES / SUBSCRIBE",
    variables: [],
    defaultBody: `Welcome back! You'll receive appointment confirmations, reminders, and crew ETA texts from Magnolia Maids. Reply STOP anytime.`,
  },
  {
    id: "help",
    title: "HELP auto-reply",
    audience: "Compliance",
    trigger: "Inbound HELP / INFO",
    variables: ["sitePhone"],
    defaultBody: `Magnolia Maids — upscale house cleaning in Durant, OK. Call or text {{sitePhone}}. Hours: Mon-Sat 8am-6pm. Reply STOP to unsubscribe. Msg & data rates may apply.`,
  },
  {
    id: "inbound-fallback",
    title: "Unknown keyword fallback",
    audience: "Compliance",
    trigger: "Any other inbound text",
    variables: ["sitePhone"],
    defaultBody: `Thanks for texting Magnolia Maids. For help, reply HELP. To stop texts, reply STOP. {{sitePhone}}`,
  },
];

export function getSmsTemplate(id: string) {
  return SMS_TEMPLATES.find((t) => t.id === id);
}

/**
 * Substitutes `{{var}}` placeholders. Lines whose only dynamic value resolves
 * to an empty string are dropped so optional fields never leave dangling labels.
 */
export function renderSmsBody(body: string, vars: Record<string, string | null | undefined>) {
  const lines = body.split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const tokens = [...line.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)];
    if (tokens.length > 0) {
      const allEmpty = tokens.every((m) => {
        const v = vars[m[1] as string];
        return v == null || String(v).trim() === "";
      });
      if (allEmpty) continue;
    }
    out.push(
      line.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_all, key: string) => {
        const v = vars[key];
        return v == null ? "" : String(v);
      }),
    );
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** GSM-aware segment estimate used in the admin preview. */
export function smsSegments(body: string) {
  const gsm = !/[^\u0000-\u007F]/.test(body);
  const limit = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  return body.length <= limit ? 1 : Math.ceil(body.length / multi);
}