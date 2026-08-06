import { BRAND, SITE, callout, esc, heading, kvTable, paragraph, renderLayout, timeline } from "./layout";

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
    ${paragraph(`Hi <strong>${esc(b.name)}</strong>, thanks for choosing Magnolia Maids! 🌊`)}
    ${paragraph(`We got your request and a real human will confirm your visit within <strong>1 business hour</strong>. Here's what we have on file:`)}
    ${bookingRows(b)}
    ${callout("What happens next", `We'll text ${esc(b.phone || "you")} to lock in a time window, then send a calendar invite. Your cleaner arrives with all supplies — you just relax.`, "info")}
    ${paragraph(`Reference #: <code style="background:${BRAND.softer};padding:2px 6px;border-radius:4px;color:${BRAND.ocean};">${esc(b.id)}</code>`)}
  `;
  return {
    subject: `We got your Magnolia Maids request 🐬 — confirming within the hour`,
    html: renderLayout(body, {
      preview: `Your ${b.service} request is in. We'll confirm within 1 business hour.`,
      heroEmoji: "🐬",
      heroTitle: "Request received!",
      heroSubtitle: "We're already prepping your sparkle.",
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
    ${callout("Contact", `📧 <a href="mailto:${esc(b.email)}" style="color:${BRAND.ocean};">${esc(b.email)}</a>${b.phone ? ` · 📱 <a href="tel:${esc(b.phone)}" style="color:${BRAND.ocean};">${esc(b.phone)}</a>` : ""}`, "info")}
  `;
  return {
    subject: `🐬 New booking · ${b.name} · ${b.service}`,
    html: renderLayout(body, {
      preview: `${b.name} · ${b.service} · ${b.bedrooms} bd / ${b.bathrooms} ba`,
      heroEmoji: "📬",
      heroTitle: "New booking request",
      heroSubtitle: `${b.service} · ${b.frequency}`,
      accent: BRAND.ocean,
      ctaLabel: "Open admin",
      ctaUrl: `${SITE.url}/admin`,
    }),
  };
}

export type BookingStatus = "confirmed" | "scheduled" | "en_route" | "in_progress" | "completed" | "cancelled";

const STATUS_META: Record<BookingStatus, { emoji: string; title: string; sub: string; tone: "info" | "success" | "warn"; accent: string }> = {
  confirmed:   { emoji: "✅", title: "Your Magnolia Maids visit is confirmed", sub: "We're locked in.", tone: "success", accent: BRAND.turquoise },
  scheduled:   { emoji: "📅", title: "Your Magnolia Maids visit is scheduled", sub: "Save the date!", tone: "info", accent: BRAND.primary },
  en_route:    { emoji: "🚗", title: "Your cleaner is on the way", sub: "Arriving shortly.", tone: "info", accent: BRAND.primary },
  in_progress: { emoji: "🧼", title: "Cleaning in progress", sub: "Making waves right now.", tone: "info", accent: BRAND.primary },
  completed:   { emoji: "✨", title: "All done — enjoy that sparkle", sub: "Let us know how we did.", tone: "success", accent: BRAND.turquoise },
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
    ${bookingRows(b)}
    ${heading("Live turnover timeline")}
    ${paragraph(`We'll email you at each milestone — no wondering where things stand.`)}
    ${timeline(steps)}
    ${callout("Same-day turnover promise", `We arrive within 15 minutes of guest checkout${checkoutTime ? ` (${esc(checkoutTime)})` : ""} and finish before the next check-in window. Photos of the finished space land in your inbox.`, "success")}
  `;
  return {
    subject: `🏝️ Your Airbnb turnover is booked with Magnolia Maids`,
    html: renderLayout(body, {
      preview: `We'll flip your listing between guests. Live timeline inside.`,
      heroEmoji: "🏝️",
      heroTitle: "Turnover locked in",
      heroSubtitle: "Five-star ready for your next guest.",
      accent: BRAND.turquoise,
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
      accent: stage === "ready_for_guest" ? BRAND.turquoise : BRAND.primary,
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
    ${paragraph(`Our hiring lead will call or text you within <strong>2 business days</strong> to chat about the ${esc(a.role)} role. If we're a fit, we do a paid 2-hour trial clean — no unpaid tryouts, ever.`)}
    ${heading("What you submitted")}
    ${careersRows(a)}
    ${callout("Good to know", `Pay starts at $22/hr + tips, weekly direct deposit, and you keep 100% of every tip. Uniforms and supplies on us.`, "success")}
  `;
  return {
    subject: `🐬 We got your Magnolia Maids application — talk soon`,
    html: renderLayout(body, {
      preview: `Thanks for applying. Our hiring lead reaches out within 2 business days.`,
      heroEmoji: "🌊",
      heroTitle: "Application received",
      heroSubtitle: "We're excited to meet you.",
      accent: BRAND.turquoise,
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
      accent: BRAND.ocean,
      ctaLabel: "Reply to candidate",
      ctaUrl: `mailto:${a.email}`,
    }),
  };
}

/* --------------------- LIFECYCLE & MARKETING-LITE --------------------- */

export function quoteFollowup(name: string, service: string): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(name)}</strong> — noticed you started a Magnolia Maids quote for <strong>${esc(service)}</strong> and didn't finish. Life happens! 🌊`)}
    ${paragraph(`Want us to lock in a $0-commitment estimate? Reply with a preferred day and we'll do the rest.`)}
    ${callout("Founding-member pricing ends Oct 1, 2026", "Book before grand opening and lock in 20% off your first three visits.", "warn")}
  `;
  return {
    subject: `Still want that sparkle, ${name}? 🐬`,
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
      ctaUrl: "https://g.page/r/splash-miami/review",
    }),
  };
}

export function referralThanks(name: string, referredName?: string): Rendered {
  const body = `
    ${paragraph(`Hi <strong>${esc(name)}</strong> — thank you for telling ${referredName ? `<strong>${esc(referredName)}</strong>` : "a friend"} about Magnolia Maids! 🐬`)}
    ${paragraph(`Once ${referredName ? esc(referredName) : "they"} book their first clean, we'll drop <strong>$40 credit</strong> onto your next visit. Automatic. No codes.`)}
  `;
  return {
    subject: `You're the best — $40 credit on the way 💙`,
    html: renderLayout(body, {
      preview: `Your Magnolia Maids referral credit is queued.`,
      heroEmoji: "🎁",
      heroTitle: "Thanks for the referral!",
      heroSubtitle: "$40 credit lands after their first visit.",
      accent: BRAND.turquoise,
    }),
  };
}

export function welcomePostFirstClean(name: string): Rendered {
  const body = `
    ${paragraph(`Welcome to the Magnolia Maids fam, <strong>${esc(name)}</strong>! 🐬`)}
    ${paragraph(`Your home is officially on our care list. A few perks that come with being a Magnolia Maids regular:`)}
    <ul style="padding-left:18px;color:${BRAND.body};font-size:15px;line-height:1.7;">
      <li>Same cleaner every visit whenever possible</li>
      <li>Locked-in pricing — no surprise upcharges</li>
      <li>Free re-clean within 24 hours if anything falls short</li>
      <li>Priority holiday scheduling</li>
    </ul>
  `;
  return {
    subject: `Welcome to the Magnolia Maids fam 🐬`,
    html: renderLayout(body, {
      preview: `The perks of being a Magnolia Maids regular.`,
      heroEmoji: "🎉",
      heroTitle: "Welcome aboard!",
      heroSubtitle: "Here's what's included with your Magnolia Maids care.",
      accent: BRAND.turquoise,
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
      accent: BRAND.ocean,
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
    subject: `We got your message 🐬`,
    html: renderLayout(body, {
      preview: `A real human replies within 1 business hour.`,
      heroEmoji: "💬",
      heroTitle: "Message received",
      heroSubtitle: "We're on it.",
    }),
  };
}