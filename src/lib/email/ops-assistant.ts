import {
  SITE,
  callout,
  esc,
  firstName,
  heading,
  isBlank,
  kvTable,
  nextSteps,
  paragraph,
  referenceLine,
  renderLayout,
  val,
} from "./layout";
import { planitPerkBlock } from "./partner-perk";
import { PLANIT } from "../partners";
import type { Rendered } from "./templates";

export type OpsAssistantApplication = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  area?: string | null;
  availability?: string | null;
  hoursPerWeek?: string | null;
  tools?: string | null;
  experience?: string | null;
  notes?: string | null;
};

function rows(a: OpsAssistantApplication) {
  return kvTable([
    ["Name", val(a.name)],
    ["Email", val(a.email)],
    ["Phone", val(a.phone)],
    ["Where you're based", val(a.area)],
    ["Weekly availability", val(a.availability)],
    ["Hours per week", val(a.hoursPerWeek)],
    ["Tools you know", val(a.tools)],
    ["Experience", val(a.experience)],
    ["Anything else", val(a.notes)],
  ]);
}

/** Applicant confirmation for the part-time, work-from-home Operations Assistant role. */
export function opsAssistantApplicationCandidate(
  a: OpsAssistantApplication,
  planitCode?: string,
): Rendered {
  const first = firstName(a.name);
  const body = `
    ${paragraph(`Hi <strong>${esc(first)}</strong> — thank you for applying to be our part-time, work-from-home <strong>Operations Assistant</strong> at Magnolia Maids.`)}
    ${paragraph(`This is the role that keeps our days running: scheduling cleans, answering client texts and emails, and making sure every crew knows exactly where to be. We read every application personally.`)}
    ${heading("What you submitted")}
    ${rows(a)}
    ${heading("What happens next")}
    ${nextSteps([
      { title: "We review your application (1–2 business days)", detail: "Our hiring lead reads each one and looks at your availability against our morning coverage needs." },
      { title: "A 15-minute intro call", detail: isBlank(a.phone)
          ? `We'll reply to <strong>${esc(val(a.email))}</strong> to set up a short call about the role, hours, and pay.`
          : `We'll reach you at <strong>${esc(val(a.phone))}</strong> for a short call about the role, hours, and pay.` },
      { title: "A paid working session", detail: "You'll spend about an hour in our dashboard with us — scheduling a couple of real jobs and replying to sample client messages. Paid, always." },
      { title: "Offer and onboarding", detail: "Background check, logins, and a walkthrough of our playbook. Most new assistants are up and running in a week." },
    ])}
    ${callout(
      "Good to know",
      "This is a part-time, fully remote position on Central time. You'll need reliable internet, a quiet space for calls, and a laptop. Compensation is hourly and discussed on the intro call.",
      "success",
    )}
    ${heading("A perk that starts on day one")}
    ${paragraph(`Everyone on the Magnolia Maids team gets the plan.It ${esc(PLANIT.plan)} plan free — a $${esc(PLANIT.monthly)}/mo household planner with ${esc(PLANIT.seats)} seats, on us.`)}
    ${planitPerkBlock(planitCode, "team")}
    ${paragraph(`Need to update something on your application? Just reply to this email, or call or text <strong>${esc(SITE.phone)}</strong> — a real person answers Monday–Friday, 8:00 AM–5:00 PM CST.`)}
    ${a.id ? referenceLine(a.id) : ""}
  `;

  return {
    subject: `${first}, we got your Operations Assistant application 🌿`,
    html: renderLayout(body, {
      preview: "Thanks for applying — here's exactly what happens next.",
      heroEmoji: "🌿",
      heroTitle: "Application received",
      heroSubtitle: "Operations Assistant · Part-time · Work from home",
      ctaLabel: "See life at Magnolia Maids",
      ctaUrl: `${SITE.url}/about/careers`,
      footerNote:
        "— The Magnolia Maids hiring team · Upscale home cleaning for Durant, Bryan County and Lake Texoma.",
    }),
  };
}

/** Internal copy of the same application, sent to the Magnolia Maids inbox. */
export function opsAssistantApplicationAdmin(a: OpsAssistantApplication): Rendered {
  const body = `
    ${paragraph(`<strong>${esc(val(a.name, "A candidate"))}</strong> applied for the part-time Operations Assistant role.`)}
    ${rows(a)}
    ${paragraph(`Reply directly to this email to reach them, or open the Applications dashboard to move them through the pipeline.`)}
    ${a.id ? referenceLine(a.id) : ""}
  `;
  return {
    subject: `New Operations Assistant application — ${val(a.name, "candidate")}`,
    html: renderLayout(body, {
      preview: `Operations Assistant application from ${val(a.name, "a candidate")}.`,
      heroEmoji: "🗂️",
      heroTitle: "Operations Assistant application",
      heroSubtitle: val(a.area, "Remote · Part-time"),
      ctaLabel: "Open Applications",
      ctaUrl: `${SITE.url}/admin/applications`,
    }),
  };
}
