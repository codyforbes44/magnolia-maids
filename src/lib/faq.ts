import { CalendarCheck, LayoutDashboard, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { ADDONS, FREQUENCY_RATES, getServiceRate } from "@/lib/pricing";
import { PLANIT } from "@/lib/partners";

export type FaqItem = { q: string; a: string };
export type FaqGroup = { key: string; label: string; icon: LucideIcon; blurb: string; items: FaqItem[] };

/**
 * Single source of truth for the Magnolia Maids FAQ. Rendered on the homepage
 * accordion, the dedicated /faq page, and the FAQPage JSON-LD on both.
 */
export const faqGroups: FaqGroup[] = [
  {
    key: "pricing",
    label: "Pricing",
    icon: Sparkles,
    blurb: "Flat rates you see before you book.",
    items: [
      { q: "What does a cleaning cost in Durant?", a: `Flat rates, no hourly surprises. For a 2 bedroom / 2 bath home a Standard Clean starts at $${getServiceRate("Standard Clean").base}, a Bright Clean at $${getServiceRate("Bright Clean").base}, and a Deep Clean at $${getServiceRate("Deep Clean").base}. Every extra bedroom and bath is priced in the instant quote before you book.` },
      { q: "How do the recurring discounts work?", a: `Recurring plans take the price down every visit: ${FREQUENCY_RATES.filter((f) => f.discount > 0).map((f) => `${f.key} saves ${Math.round(f.discount * 100)}%`).join(", ")}. The discount applies automatically from your first visit and holds as long as you stay on the plan.` },
      { q: "Are add-ons priced separately?", a: `Yes, and always up front. ${ADDONS.map((a) => `${a.label} +$${a.price}`).join(", ")}. Pets are never an extra charge — we bring pet-safe products and plan for hair.` },
      { q: "When do I pay, and is a card required to book?", a: "No card is required to reserve a spot. You're charged on the day of service after the clean is finished, and nothing is billed if we can't get in or you cancel in time." },
      { q: "Are there travel fees outside Durant?", a: "No travel fee inside Durant and Bryan County, or for Lake Texoma rentals around Cartwright, Kingston, and Platter. Anything farther out we'll quote plainly before you commit." },
      { q: "What is the free plan.It Family perk?", a: `Every client on a recurring Magnolia Maids plan gets plan.It ${PLANIT.plan} free — a $${PLANIT.monthly}/month household planner with up to ${PLANIT.seats} seats for tasks, calendar, appointments, bills, documents, and a shared grocery list. We email your redemption code after you book, no card required, and it stays free as long as you're on a recurring plan.` },
    ],
  },
  {
    key: "scheduling",
    label: "Scheduling",
    icon: CalendarCheck,
    blurb: "Times that fit a real Durant week.",
    items: [
      { q: "When does Magnolia Maids start cleaning?", a: "Our first visits are on opening day, Tuesday September 1, 2026 at 8:00 AM CST. Reserve now and you lock founding-member rates for as long as you stay on a recurring plan." },
      { q: "How far ahead should I book?", a: "Opening-week and weekend slots go first. Most clients book one to two weeks out; recurring clients keep the same day and arrival window every visit." },
      { q: "Can I reschedule or cancel?", a: "Yes — up to 24 hours before your visit, no charge. Life in Durant happens. Inside 24 hours we'll always try to move you before anything is billed." },
      { q: "Do I need to be home during the cleaning?", a: "No. Most clients leave a code or key. We lock up when we're done and send a photo recap so you can see the finished rooms." },
      { q: "Do you offer same-day Airbnb turnovers?", a: "Yes. Same-day flips between checkout and check-in are our specialty for Lake Texoma cabins and in-town rentals, including linen swaps, staging, and a photo checklist." },
    ],
  },
  {
    key: "included",
    label: "What's included",
    icon: ShieldCheck,
    blurb: "The same checklist, every visit.",
    items: [
      { q: "What's covered in a standard visit?", a: "Kitchen and bathrooms cleaned and sanitized, all floors vacuumed and mopped, surfaces dusted, mirrors and glass wiped, beds made, and trash taken out. Bright Clean adds baseboards, doors, interior windows, and appliance fronts; Deep Clean adds vents, light fixtures, inside appliances, and grout scrubbing." },
      { q: "What isn't included?", a: "We don't do exterior windows, heavy clutter removal, biohazard or post-construction debris, or anything that requires a ladder above two steps. If a home needs more than a standard visit, we'll recommend a Deep Clean instead of quietly rushing." },
      { q: "What products and equipment do you bring?", a: "Everything. Eco-friendly, pet- and kid-safe, plant-based cleaners by default, plus our own vacuums and microfiber. Have a product you prefer we use — or avoid — just say so in the booking notes." },
      { q: "Who is coming into my home?", a: "A trained Magnolia Maids teammate — background-checked, insured, and working from the same checklist every visit. You'll know who's arriving before they knock." },
      { q: "What if something is missed?", a: "The 24-hour Magnolia Guarantee: tell us within a day and we come back and re-clean the area at no cost." },
    ],
  },
  {
    key: "account",
    label: "Your account",
    icon: LayoutDashboard,
    blurb: "A free dashboard for every client.",
    items: [
      { q: "Do I get an online account with Magnolia Maids?", a: "Yes, and it's free. Sign up with the same email you booked with and your past bookings and quotes attach to your account automatically — no app to download." },
      { q: "What can I do in the client dashboard?", a: "See your next visit with its date, arrival window, service, and flat rate; request a reschedule, skip, or cancellation; browse your full service history and rebook a past clean in one tap; and review your recurring plan and discount." },
      { q: "Can I save entry instructions, pet details, and preferences?", a: "Yes. Your home profile stores door codes, lockbox and parking notes, alarm details, pet names and temperaments, product preferences, and rooms to focus on or skip — so you never repeat yourself between visits." },
      { q: "How do I reschedule or cancel from my account?", a: "Open Appointments in your dashboard and submit a change request. Our Durant office confirms it the same business day, and you get an email once the new time is locked in." },
      { q: "Is my information secure?", a: "Access details are tied to your login and visible only to you and our office team. You can update or remove anything in your home profile at any time." },
    ],
  },
];

export const faqs: FaqItem[] = faqGroups.flatMap((g) => g.items);

export const faqPageSchema = (url: string) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${url}#faq`,
  url,
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

/**
 * FAQPage JSON-LD limited to specific groups, for pages that only surface a
 * slice of the FAQ (pricing, services). Keeps every page's markup in sync with
 * the copy actually rendered on it.
 */
export const faqGroupSchema = (url: string, groupKeys: string[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${url}#faq`,
  url,
  mainEntity: faqGroups
    .filter((g) => groupKeys.includes(g.key))
    .flatMap((g) => g.items)
    .map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
});
