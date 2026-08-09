import {
  SITE,
  callout,
  esc,
  firstName,
  isBlank,
  kvTable,
  paragraph,
  referenceLine,
  renderLayout,
  val,
} from "./layout";
import type { Rendered } from "./templates";

export type ChangeRequestPayload = {
  name?: string | null;
  kind: "reschedule" | "cancel";
  service?: string | null;
  currentDay?: string | null;
  currentTime?: string | null;
  preferredDay?: string | null;
  alternateDay?: string | null;
  preferredTime?: string | null;
  reason?: string | null;
  note?: string | null;
  address?: string | null;
  email?: string | null;
  bookingId?: string | null;
};

function rows(p: ChangeRequestPayload): Array<[string, string | null | undefined]> {
  return [
    ["Request", p.kind === "cancel" ? "Cancel this visit" : "Reschedule this visit"],
    ["Service", isBlank(p.service) ? null : val(p.service)],
    [
      "Currently scheduled",
      isBlank(p.currentDay) && isBlank(p.currentTime)
        ? null
        : [isBlank(p.currentDay) ? null : val(p.currentDay), isBlank(p.currentTime) ? null : val(p.currentTime)]
            .filter(Boolean)
            .join(" · "),
    ],
    ["Preferred new date", isBlank(p.preferredDay) ? null : val(p.preferredDay)],
    ["Backup date", isBlank(p.alternateDay) ? null : val(p.alternateDay)],
    ["Preferred window", isBlank(p.preferredTime) ? null : val(p.preferredTime)],
    ["Reason", isBlank(p.reason) ? null : val(p.reason)],
    ["Notes", isBlank(p.note) ? null : val(p.note)],
    ["Address", isBlank(p.address) ? null : val(p.address)],
  ].filter((r) => r[1] != null) as Array<[string, string]>;
}

/** Customer-facing acknowledgement that the office has the request. */
export function changeRequestReceived(p: ChangeRequestPayload): Rendered {
  const first = firstName(p.name);
  const cancelling = p.kind === "cancel";
  const body = `
    ${paragraph(`Hi <strong>${esc(first)}</strong> — we have your request and a Durant team member is reviewing it now.`)}
    ${paragraph(
      cancelling
        ? `Nothing is cancelled until we confirm it, so keep an eye out for our reply. If your plans change again, just reply to this email.`
        : `Nothing is moved until we confirm the new time. We'll reply with the closest slot to what you asked for.`,
    )}
    ${kvTable(rows(p))}
    ${callout("Need it handled today?", `Call or text ${SITE.phone} and a real person in Durant will sort it out.`, "info")}
    ${p.bookingId ? referenceLine(p.bookingId) : ""}
  `;
  return {
    subject: cancelling ? "We received your cancellation request" : "We received your reschedule request",
    html: renderLayout(body, {
      preview: cancelling
        ? "Your cancellation request is with our Durant office."
        : "Your reschedule request is with our Durant office.",
      heroEmoji: "🌿",
      heroTitle: cancelling ? "Cancellation requested" : "Reschedule requested",
      heroSubtitle: "Our office confirms every change by email.",
      ctaLabel: "View my visits",
      ctaUrl: `${SITE.url}/account/appointments`,
    }),
  };
}

/** Internal alert so the office can action the request. */
export function changeRequestAdmin(p: ChangeRequestPayload): Rendered {
  const body = `
    ${paragraph(`<strong>${esc(val(p.name, "A customer"))}</strong> requested a ${p.kind === "cancel" ? "cancellation" : "reschedule"} from their dashboard.`)}
    ${kvTable([...rows(p), ["Customer email", isBlank(p.email) ? null : val(p.email)]] as Array<[string, string]>)}
    ${p.bookingId ? referenceLine(p.bookingId) : ""}
  `;
  return {
    subject: `${p.kind === "cancel" ? "Cancellation" : "Reschedule"} request — ${val(p.name, "customer")}`,
    html: renderLayout(body, {
      preview: "A dashboard customer asked to change a visit.",
      heroEmoji: "🔔",
      heroTitle: "Service change request",
      heroSubtitle: "Confirm or propose a new time from the admin dashboard.",
      ctaLabel: "Open change requests",
      ctaUrl: `${SITE.url}/admin/change-requests`,
    }),
  };
}

/** Sent when the office approves or declines a request. */
export function changeRequestResolved(
  p: ChangeRequestPayload & { approved: boolean; adminResponse?: string | null },
): Rendered {
  const first = firstName(p.name);
  const cancelling = p.kind === "cancel";
  const headline = p.approved
    ? cancelling
      ? "Your visit is cancelled"
      : "Your new time is confirmed"
    : "About your request";
  const body = `
    ${paragraph(`Hi <strong>${esc(first)}</strong> —`)}
    ${paragraph(
      p.approved
        ? cancelling
          ? `That visit is cancelled and you won't be charged. Book again any time — your home profile is saved.`
          : `We moved your visit. The details below are what our team will work from.`
        : `We couldn't make that change work as asked. Here's what our office suggests instead.`,
    )}
    ${isBlank(p.adminResponse) ? "" : callout("From our office", esc(val(p.adminResponse)), p.approved ? "success" : "warn")}
    ${kvTable(rows(p))}
    ${p.bookingId ? referenceLine(p.bookingId) : ""}
  `;
  return {
    subject: headline,
    html: renderLayout(body, {
      preview: headline,
      heroEmoji: p.approved ? "✅" : "🌿",
      heroTitle: headline,
      heroSubtitle: `Magnolia Maids · ${SITE.phone}`,
      ctaLabel: "View my dashboard",
      ctaUrl: `${SITE.url}/account`,
    }),
  };
}

/** Welcome email after a customer creates a dashboard account. */
export function accountWelcome(name?: string | null): Rendered {
  const first = firstName(name);
  const body = `
    ${paragraph(`Hi <strong>${esc(first)}</strong> — your Magnolia Maids account is ready.`)}
    ${paragraph(`Your dashboard keeps everything in one place: upcoming visits, past cleans, and the home details our team needs to do a great job without calling you.`)}
    ${kvTable([
      ["Upcoming visits", "See what's booked and request a change"],
      ["Service history", "Rebook any past clean in two taps"],
      ["Home profile", "Entry details, pets, focus rooms, product preferences"],
    ])}
    ${callout("Tip", "Fill in your entry and pet details once — every cleaner sees them before they arrive.", "info")}
  `;
  return {
    subject: "Your Magnolia Maids dashboard is ready",
    html: renderLayout(body, {
      preview: "Manage visits, history, and your home profile in one place.",
      heroEmoji: "🌸",
      heroTitle: "Welcome to your dashboard",
      heroSubtitle: "Durant, OK · Locally owned",
      ctaLabel: "Open my dashboard",
      ctaUrl: `${SITE.url}/account`,
    }),
  };
}