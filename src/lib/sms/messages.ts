import { SITE } from "../email/layout";

export type SmsBookingDetails = {
  id: string;
  name: string;
  service: string;
  frequency: string;
  bedrooms: string;
  bathrooms: string;
  preferredDay?: string | null;
  preferredTime?: string | null;
  estimate?: string | null;
};

const ref = (id: string) => id.slice(0, 8).toUpperCase();

/** Recap + next steps texted to the visitor the moment they submit. */
export function bookingConfirmationSms(b: SmsBookingDetails): string {
  const when = b.preferredDay
    ? `${b.preferredDay}${b.preferredTime ? ` · ${b.preferredTime}` : ""}`
    : "day TBD";
  return [
    `Magnolia Maids: Thanks ${b.name.split(" ")[0]}! We got your request.`,
    `${b.service} · ${b.frequency} · ${b.bedrooms} bd/${b.bathrooms} ba`,
    `Requested: ${when}`,
    b.estimate ? `Estimate: ${b.estimate}` : null,
    `Next: we confirm your exact arrival window within 1 business hour, then send written confirmation. Nothing is charged today.`,
    `Questions? Call ${SITE.phone}. Ref ${ref(b.id)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Heads-up text to the Magnolia Maids line. */
export function bookingAlertSms(b: SmsBookingDetails & { phone?: string | null }): string {
  const when = b.preferredDay
    ? `${b.preferredDay}${b.preferredTime ? ` ${b.preferredTime}` : ""}`
    : "no date";
  return `New booking: ${b.name} · ${b.service} · ${b.bedrooms}bd/${b.bathrooms}ba · ${when}${b.phone ? ` · ${b.phone}` : ""} · Ref ${ref(b.id)}`;
}
