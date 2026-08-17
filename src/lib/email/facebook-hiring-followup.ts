import { SITE, callout, esc, firstName, isBlank, nextSteps, paragraph, renderLayout, val } from "./layout";
import { planitPerkBlock } from "./partner-perk";
import { PLANIT } from "../partners";
import type { Rendered } from "./templates";

export type FacebookHiringFollowupInput = {
  name: string;
  role?: string | null;
  area?: string | null;
  availability?: string | null;
};

/**
 * First reply to a Facebook hiring-ad lead: confirms we received their interest,
 * gives real context about the job here in Durant, and sets the expectation that
 * a person — not a bot — will reach out shortly.
 */
export function facebookHiringFollowup(i: FacebookHiringFollowupInput, planitCode?: string): Rendered {
  const first = firstName(i.name);
  const role = val(i.role, "a cleaning position");
  const area = val(i.area, "");
  const availability = val(i.availability, "");

  const body = `
    ${paragraph(`Hi <strong>${esc(first)}</strong>, it's Maggie with Magnolia Maids — thank you for reaching out about ${esc(role)} through our Facebook ad.`)}
    ${paragraph(
      isBlank(area)
        ? `We're a locally owned, upscale home cleaning company based in Durant, serving Bryan County and Lake Texoma.`
        : `We're a locally owned, upscale home cleaning company based in Durant, and we're actively hiring for the <strong>${esc(area)}</strong> area.`,
    )}
    ${callout(
      "What the work looks like",
      "Daytime hours on a steady weekly route, supplies and uniforms provided, and mileage reimbursement for Team Leads who drive their own vehicle between homes. Most of our specialists work weekdays with weekends off.",
    )}
    ${
      isBlank(availability)
        ? ""
        : paragraph(`You told us your availability is <strong>${esc(availability)}</strong> — that helps us match you to a route quickly.`)
    }
    ${nextSteps([
      { title: "We'll reach out shortly", detail: "A member of our hiring team will contact you by phone, text or email." },
      { title: "A quick conversation", detail: "We'll go over the role, compensation, schedule and the areas you'd cover." },
      { title: "Meet the team", detail: "If it's a fit, we'll set up a short in-person interview here in Durant." },
    ])}
    ${paragraph(`Nothing else is needed from you right now — just keep an eye on your phone and inbox. If you'd like to reach us first, call or text <strong>${esc(SITE.phone)}</strong> and a real person will answer.`)}
    ${paragraph(`One more thing: everyone on our crew gets the plan.It Family plan free — a $${PLANIT.monthly}/mo household planner, on us for as long as you're with Magnolia Maids.`)}
    ${planitPerkBlock(planitCode, "team")}
  `;

  return {
    subject: `${first}, thanks for your interest in joining Magnolia Maids`,
    html: renderLayout(body, {
      preview: `We received your interest — a member of our hiring team will reach out shortly.`,
      heroEmoji: "🌿",
      heroTitle: "Thanks for reaching out",
      heroSubtitle: "A member of our hiring team will be in touch shortly.",
      ctaLabel: "See the role details",
      ctaUrl: `${SITE.url}/about/careers`,
      footerNote:
        "— Maggie & the Magnolia Maids team · Upscale home cleaning for Durant, Bryan County and Lake Texoma.",
    }),
  };
}