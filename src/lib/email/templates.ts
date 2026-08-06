import { BRAND, SITE, callout, esc, heading, kvTable, nextSteps, paragraph, referenceLine, renderLayout, timeline } from "./layout";

export type Rendered = { subject: string; html: string };

/* ---------------------------- BOOKINGS ---------------------------- */

export type BookingDetails = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address: string;
  bedrooms: string;
  bathrooms: string;
  service: string;
  frequency: string;
  preferredDay?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  estimate?: string | null;
};

function bookingRows(b: BookingDetails) {
  return kvTable([
    ["Service", b.service],
    ["Frequency", b.frequency],
    ["Home size", `${b.bedrooms} bed · ${b.bathrooms} bath`],
    ["Address", b.address],
    ["Preferred day", b.preferredDay ?? "—"],
    ["Preferred time", b.preferredTime ?? "—"],
    ["Notes", b.notes ?? "—"],
    ["Estimate", b.estimate ?? "We'll confirm on the call"],
  ]);
}

export function bookingConfirmationCustomer(b: BookingDetails): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(b.name)}</strong>, thanks for choosing Magnolia Maids! 🌿`)}
    ${paragraph(`We got your request and a real human will confirm your visit within <strong>1 business hour</strong>. Here's what we have on file:`)}
    ${heading("What you submitted")}
    ${bookingRows(b)}
    ${heading("What happens next")}
    ${nextSteps([
      { title: "We confirm your details (within 1 business hour)", detail: `A Magnolia Maids coordinator reviews your request and ${b.phone ? `texts <strong>${esc(b.phone)}</strong>` : "emails you"} to lock in an exact arrival window.` },
      { title: "You get a written confirmation", detail: "Final flat-rate price, arrival window, and your cleaner's name — in writing, before anyone shows up." },
      { title: "Cleaning day", detail: "Your Durant crew arrives with every supply needed. No prep required — you just unlock the door." },
      { title: "Your 24-hour guarantee window opens", detail: "Payment is due the day of service. If anything falls short, tell us within 24 hours and we re-clean it free." },
    ])}
    ${callout("Our policies", `<strong>24-hour Magnolia Guarantee</strong> — if anything falls short, tell us within 24 hours and we re-clean it free.<br />Flat-rate pricing, no card required today — payment is due the day of service.<br />Reschedule or cancel free with 24 hours' notice.`, "success")}
    ${paragraph(`Something look wrong? Just reply to this email or call <a href="tel:${esc(SITE.phone.replace(/[^0-9+]/g, ""))}" style="color:${BRAND.forest};">${esc(SITE.phone)}</a> and we'll fix it.`)}
    ${referenceLine(b.id)}
  `;
  return {
    subject: `We got your Magnolia Maids request 🤍 — confirming within the hour`,
    html: renderLayout(body, {
      preview: `Your ${b.service} request is in. We'll confirm within 1 business hour.`,
      heroEmoji: "🤍",
      heroTitle: "Request received!",
      heroSubtitle: "Upscale home cleaning in Durant, Oklahoma.",
      ctaLabel: "View Magnolia Maids services",
      ctaUrl: `${SITE.url}/services`,
      footerNote: "Need to reschedule? Reply to this email — we'll take care of it.",
    }),
  };
}

export function bookingNotificationAdmin(b: BookingDetails): Rendered {
  const body = `
    ${paragraph(`<strong>New Magnolia Maids booking request</strong> from ${esc(b.name)}.`)}
    ${bookingRows(b)}
    ${callout("Contact", `📧 <a href="mailto:${esc(b.email)}" style="color:${BRAND.forest};">${esc(b.email)}</a>${b.phone ? ` · 📱 <a href="tel:${esc(b.phone)}" style="color:${BRAND.forest};">${esc(b.phone)}</a>` : ""}`, "info")}
  `;
  return {
    subject: `🤍 New booking · ${b.name} · ${b.service}`,
    html: renderLayout(body, {
      preview: `${b.name} · ${b.service} · ${b.bedrooms} bd / ${b.bathrooms} ba`,
      heroEmoji: "📬",
      heroTitle: "New booking request",
      heroSubtitle: `${b.service} · ${b.frequency}`,
      accent: BRAND.forest,
      ctaLabel: "Open admin",
      ctaUrl: `${SITE.url}/admin`,
    }),
  };
}

export type BookingStatus = "confirmed" | "scheduled" | "en_route" | "in_progress" | "completed" | "cancelled";

const STATUS_META: Record<BookingStatus, { emoji: string; title: string; sub: string; tone: "info" | "success" | "warn"; accent: string }> = {
  confirmed:   { emoji: "✅", title: "Your Magnolia Maids visit is confirmed", sub: "We're locked in.", tone: "success", accent: BRAND.sage },
  scheduled:   { emoji: "📅", title: "Your Magnolia Maids visit is scheduled", sub: "Save the date!", tone: "info", accent: BRAND.primary },
  en_route:    { emoji: "🚗", title: "Your cleaner is on the way", sub: "Arriving shortly.", tone: "info", accent: BRAND.primary },
  in_progress: { emoji: "🧼", title: "Cleaning in progress", sub: "Your home is being cared for right now.", tone: "info", accent: BRAND.primary },
  completed:   { emoji: "✨", title: "All done — enjoy that sparkle", sub: "Let us know how we did.", tone: "success", accent: BRAND.sage },
  cancelled:   { emoji: "😔", title: "Your Magnolia Maids visit was cancelled", sub: "We'd love a second shot.", tone: "warn", accent: BRAND.accent },
};

export function bookingStatusUpdate(
  b: BookingDetails,
  status: BookingStatus,
  extraMessage?: string,
): Rendered {
  const meta = STATUS_META[status];
  const body = `
    ${paragraph(`Hi <strong>${esc(b.name)}</strong>, quick update on your Magnolia Maids visit:`)}
    ${callout(`${meta.emoji} ${meta.title}`, extraMessage ?? meta.sub, meta.tone)}
    ${bookingRows(b)}
    ${status === "completed" ? paragraph(`If you loved it, a quick Google review helps our small crew a lot. 💙`) : ""}
  `;
  return {
    subject: `${meta.emoji} ${meta.title}`,
    html: renderLayout(body, {
      preview: meta.sub,
      heroEmoji: meta.emoji,
      heroTitle: meta.title,
      heroSubtitle: meta.sub,
      accent: meta.accent,
      ctaLabel: status === "completed" ? "Leave a review" : "Manage booking",
      ctaUrl: status === "completed" ? `${SITE.url}/about` : `${SITE.url}/booking`,
    }),
  };
}

/* ------------------------- AIRBNB TURNOVER ------------------------- */

export type TurnoverStage =
  | "requested"
  | "confirmed"
  | "checkout_verified"
  | "arrived"
  | "reset_in_progress"
  | "linens_swapped"
  | "photos_captured"
  | "ready_for_guest";

const TURNOVER_STAGES: TurnoverStage[] = [
  "requested",
  "confirmed",
  "checkout_verified",
  "arrived",
  "reset_in_progress",
  "linens_swapped",
  "photos_captured",
  "ready_for_guest",
];

const TURNOVER_LABEL: Record<TurnoverStage, string> = {
  requested: "Turnover requested",
  confirmed: "Turnover confirmed",
  checkout_verified: "Guest checkout verified",
  arrived: "Cleaner arrived on site",
  reset_in_progress: "Full reset in progress",
  linens_swapped: "Fresh linens & towels staged",
  photos_captured: "Listing photos captured",
  ready_for_guest: "Ready for next guest 🎉",
};

export function airbnbTurnoverConfirmation(b: BookingDetails, checkoutTime?: string): Rendered {
  const steps = TURNOVER_STAGES.map((s, i) => ({
    label: TURNOVER_LABEL[s],
    done: i === 0,
    current: i === 1,
  }));
  const body = `
    ${paragraph(`Hi <strong>${esc(b.name)}</strong>, your Airbnb turnover is booked with Magnolia Maids. We treat your listing like our own five-star property.`)}
    ${heading("What you submitted")}
    ${bookingRows(b)}
    ${heading("What happens next")}
    ${nextSteps([
      { title: "We confirm your turnover window (within 1 business hour)", detail: `We'll ${b.phone ? `text <strong>${esc(b.phone)}</strong>` : "email you"} to confirm checkout${checkoutTime ? ` at ${esc(checkoutTime)}` : ""} and next check-in times.` },
      { title: "Share access details", detail: "Reply with your lockbox code, smart-lock instructions, or supply-closet location and we'll store them securely." },
      { title: "Turnover day", detail: "We arrive within 15 minutes of guest checkout, run the full reset, and stage fresh linens and towels." },
      { title: "Proof it's guest-ready", detail: "Finished-space photos and any damage or restock notes land in your inbox before the next check-in." },
    ])}
    ${heading("Live turnover timeline")}
    ${paragraph(`We'll email you at each milestone — no wondering where things stand.`)}
    ${timeline(steps)}
    ${callout("Same-day turnover promise", `We arrive within 15 minutes of guest checkout${checkoutTime ? ` (${esc(checkoutTime)})` : ""} and finish before the next check-in window. Photos of the finished space land in your inbox.`, "success")}
    ${referenceLine(b.id)}
  `;
  return {
    subject: `🏝️ Your Airbnb turnover is booked with Magnolia Maids`,
    html: renderLayout(body, {
      preview: `We'll flip your listing between guests. Live timeline inside.`,
      heroEmoji: "🏝️",
      heroTitle: "Turnover locked in",
      heroSubtitle: "Five-star ready for your next guest.",
      accent: BRAND.sage,
      ctaLabel: "Download host checklist",
      ctaUrl: `${SITE.url}/airbnb-turnover`,
    }),
  };
}

export function airbnbTurnoverStatus(b: BookingDetails, stage: TurnoverStage, note?: string): Rendered {
  const idx = TURNOVER_STAGES.indexOf(stage);
  const steps = TURNOVER_STAGES.map((s, i) => ({
    label: TURNOVER_LABEL[s],
    done: i < idx,
    current: i === idx,
  }));
  const label = TURNOVER_LABEL[stage];
  const body = `
    ${paragraph(`Turnover update for <strong>${esc(b.address)}</strong>:`)}
    ${callout(label, note ?? "We'll email you again at the next milestone.", stage === "ready_for_guest" ? "success" : "info")}
    ${timeline(steps)}
  `;
  return {
    subject: `🏝️ Turnover · ${label}`,
    html: renderLayout(body, {
      preview: label,
      heroEmoji: stage === "ready_for_guest" ? "🎉" : "🏝️",
      heroTitle: label,
      heroSubtitle: b.address,
      accent: stage === "ready_for_guest" ? BRAND.sage : BRAND.primary,
    }),
  };
}

/* --------------------------- CAREERS --------------------------- */

export type CareersApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  role: string;
  availability: string;
  experience?: string | null;
  notes?: string | null;
};

function careersRows(a: CareersApplication) {
  return kvTable([
    ["Role", a.role],
    ["Availability", a.availability],
    ["Neighborhood", a.area],
    ["Phone", a.phone],
    ["Email", a.email],
    ["Experience", a.experience ?? "—"],
    ["Notes", a.notes ?? "—"],
  ]);
}

export function careersApplicationCandidate(a: CareersApplication): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(a.name)}</strong> — thanks for applying to join the Magnolia Maids crew!`)}
    ${heading("What you submitted")}
    ${careersRows(a)}
    ${heading("What happens next")}
    ${nextSteps([
      { title: "We review your application (1–2 business days)", detail: `Our hiring lead reads every application personally and matches it against open ${esc(a.role)} routes near ${esc(a.area)}.` },
      { title: "A quick call or text", detail: `We'll reach you at <strong>${esc(a.phone)}</strong> for a 10-minute chat about your availability: ${esc(a.availability)}.` },
      { title: "Paid 2-hour trial clean", detail: "If we're a fit, you shadow a lead cleaner and get paid for it — no unpaid tryouts, ever." },
      { title: "Offer and onboarding", detail: "Background check, uniform and supply kit, route assignment, and your first week on the schedule." },
    ])}
    ${callout("Good to know", `Pay starts at $22/hr + tips, weekly direct deposit, and you keep 100% of every tip. Uniforms and supplies on us.`, "success")}
    ${paragraph(`Need to update anything on your application? Just reply to this email.`)}
    ${referenceLine(a.id)}
  `;
  return {
    subject: `🤍 We got your Magnolia Maids application — talk soon`,
    html: renderLayout(body, {
      preview: `Thanks for applying. Our hiring lead reaches out within 2 business days.`,
      heroEmoji: "🌿",
      heroTitle: "Application received",
      heroSubtitle: "We're excited to meet you.",
      accent: BRAND.sage,
      ctaLabel: "See a day in the life",
      ctaUrl: `${SITE.url}/about/careers`,
    }),
  };
}

export function careersApplicationAdmin(a: CareersApplication): Rendered {
  const body = `
    ${paragraph(`<strong>New Magnolia Maids job application</strong> for <em>${esc(a.role)}</em>.`)}
    ${careersRows(a)}
  `;
  return {
    subject: `👋 New applicant · ${a.name} · ${a.role}`,
    html: renderLayout(body, {
      preview: `${a.name} — ${a.role} — ${a.area}`,
      heroEmoji: "👋",
      heroTitle: "New job application",
      heroSubtitle: `${a.role} · ${a.area}`,
      accent: BRAND.forest,
      ctaLabel: "Reply to candidate",
      ctaUrl: `mailto:${a.email}`,
    }),
  };
}

/* --------------------- LIFECYCLE & MARKETING-LITE --------------------- */

export function quoteFollowup(name: string, service: string): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(name)}</strong> — noticed you started a Magnolia Maids quote for <strong>${esc(service)}</strong> and didn't finish. Life happens! 🌿`)}
    ${paragraph(`Want us to lock in a $0-commitment estimate? Reply with a preferred day and we'll do the rest.`)}
    ${callout("Founding-member pricing ends Sept 1, 2026", "Book before grand opening and lock in 20% off your first three visits.", "warn")}
  `;
  return {
    subject: `Still want that sparkle, ${name}? 🤍`,
    html: renderLayout(body, {
      preview: `Pick up your Magnolia Maids quote — takes 60 seconds.`,
      heroEmoji: "💦",
      heroTitle: "Finish your Magnolia Maids quote",
      heroSubtitle: "60 seconds. Zero commitment.",
      ctaLabel: "Finish my quote",
      ctaUrl: `${SITE.url}/booking`,
    }),
  };
}

export function reviewRequest(name: string, cleaner?: string): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(name)}</strong> — hope your home is feeling fresh! ✨`)}
    ${paragraph(`${cleaner ? `${esc(cleaner)} and the ` : "The "}Magnolia Maids crew is a tiny local team, and a quick Google review truly changes our week. Would you leave one?`)}
  `;
  return {
    subject: `Loved your Magnolia Maids clean? A quick favor 💙`,
    html: renderLayout(body, {
      preview: `A 30-second review helps our small Durant crew grow.`,
      heroEmoji: "⭐",
      heroTitle: "Would you leave us a review?",
      heroSubtitle: "It takes 30 seconds and means the world.",
      accent: BRAND.accent,
      ctaLabel: "Leave a Google review",
      ctaUrl: "https://g.page/r/magnolia-maids-durant/review",
    }),
  };
}

export function referralThanks(name: string, referredName?: string): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(name)}</strong> — thank you for telling ${referredName ? `<strong>${esc(referredName)}</strong>` : "a friend"} about Magnolia Maids! 🤍`)}
    ${paragraph(`Once ${referredName ? esc(referredName) : "they"} book their first clean, we'll drop <strong>$40 credit</strong> onto your next visit. Automatic. No codes.`)}
  `;
  return {
    subject: `You're the best — $40 credit on the way 💙`,
    html: renderLayout(body, {
      preview: `Your Magnolia Maids referral credit is queued.`,
      heroEmoji: "🎁",
      heroTitle: "Thanks for the referral!",
      heroSubtitle: "$40 credit lands after their first visit.",
      accent: BRAND.sage,
    }),
  };
}

export function welcomePostFirstClean(name: string): Rendered {
  const body = `
    ${paragraph(`Welcome to the Magnolia Maids fam, <strong>${esc(name)}</strong>! 🤍`)}
    ${paragraph(`Your home is officially on our care list. A few perks that come with being a Magnolia Maids regular:`)}
    <ul style="padding-left:18px;color:${BRAND.body};font-size:15px;line-height:1.7;">
      <li>Same cleaner every visit whenever possible</li>
      <li>Locked-in pricing — no surprise upcharges</li>
      <li>Free re-clean within 24 hours if anything falls short</li>
      <li>Priority holiday scheduling</li>
    </ul>
  `;
  return {
    subject: `Welcome to the Magnolia Maids fam 🤍`,
    html: renderLayout(body, {
      preview: `The perks of being a Magnolia Maids regular.`,
      heroEmoji: "🎉",
      heroTitle: "Welcome aboard!",
      heroSubtitle: "Here's what's included with your Magnolia Maids care.",
      accent: BRAND.sage,
      ctaLabel: "Book your next visit",
      ctaUrl: `${SITE.url}/booking`,
    }),
  };
}

export function passwordResetNotice(name: string, resetUrl: string): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(name)}</strong>, we got a request to reset your Magnolia Maids admin password.`)}
    ${paragraph(`This link expires in <strong>60 minutes</strong>. If you didn't ask for a reset, you can safely ignore this email — nothing will change.`)}
  `;
  return {
    subject: `Reset your Magnolia Maids password`,
    html: renderLayout(body, {
      preview: `Reset your Magnolia Maids admin password.`,
      heroEmoji: "🔒",
      heroTitle: "Reset your password",
      heroSubtitle: "Link expires in 60 minutes.",
      accent: BRAND.forest,
      ctaLabel: "Reset password",
      ctaUrl: resetUrl,
    }),
  };
}

export function contactAcknowledgement(name: string, message: string): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(name)}</strong> — thanks for reaching out to Magnolia Maids. A real human will reply within <strong>1 business hour</strong>.`)}
    ${heading("Your message")}
    <blockquote style="margin:8px 0;padding:12px 16px;background:${BRAND.softer};border-left:4px solid ${BRAND.primary};border-radius:8px;color:${BRAND.body};font-size:14px;line-height:1.5;">${esc(message)}</blockquote>
  `;
  return {
    subject: `We got your message 🤍`,
    html: renderLayout(body, {
      preview: `A real human replies within 1 business hour.`,
      heroEmoji: "💬",
      heroTitle: "Message received",
      heroSubtitle: "We're on it.",
    }),
  };
}