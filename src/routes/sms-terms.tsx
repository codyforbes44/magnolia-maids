import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/sms-terms")({
  component: SmsTermsPage,
  head: () => ({
    meta: [
      { title: "SMS Messaging Terms — Magnolia Maids" },
      { name: "description", content: "How Magnolia Maids text messaging works: how you opt in, message frequency, rates, STOP and HELP keywords, and privacy." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "SMS Messaging Terms — Magnolia Maids" },
      { property: "og:description", content: "Opt-in details, message frequency, STOP/HELP keywords, and privacy for Magnolia Maids text messages." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://magnoliamaids.pro/sms-terms" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/sms-terms" }],
  }),
});

const TOC = [
  { id: "program", label: "Program description" },
  { id: "opt-in", label: "How you opt in" },
  { id: "messages", label: "Message types & frequency" },
  { id: "rates", label: "Cost & carriers" },
  { id: "stop", label: "STOP & HELP" },
  { id: "privacy", label: "Privacy" },
  { id: "contact", label: "Contact" },
];

function SmsTermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="SMS Messaging Terms & Conditions"
      updated="August 12, 2026"
      intro="These terms govern the Magnolia Maids text messaging program for customers and job applicants in Durant, Oklahoma and surrounding Bryan County communities."
      toc={TOC}
    >
      <LegalSection id="program" title="Program description">
        <p>
          Magnolia Maids operates a residential house cleaning service. Our SMS program sends
          appointment-related and account-related text messages to customers who request them, and
          hiring-related messages to job applicants who request them. Messages are sent from
          (580) 745-0045.
        </p>
        <p className="font-semibold">
          Consent to receive text messages is never required to purchase a cleaning, receive a quote,
          or be considered for employment.
        </p>
      </LegalSection>

      <LegalSection id="opt-in" title="How you opt in (call to action)">
        <p>You will only receive text messages from Magnolia Maids if you take one of these actions:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Website booking form</strong> (<a href="/booking" className="text-primary underline">magnoliamaids.pro/booking</a>) —
            after entering your name, mobile number, and service address, you may check an
            optional box that is <strong>unchecked by default</strong>, labeled: "Yes, text me. By checking this box,
            I agree to receive text messages from Magnolia Maids about my quote, appointment confirmations,
            crew ETA, and reminders at the mobile number I provided, sent by an automated system. Consent is not
            a condition of purchase. Message frequency varies. Message and data rates may apply. Reply STOP to
            unsubscribe, HELP for help. See our Messaging Terms and Privacy Policy."
          </li>
          <li>
            <strong>Instant quote form</strong> (<a href="/quote" className="text-primary underline">magnoliamaids.pro/quote</a>) —
            the same optional, unchecked consent checkbox with identical disclosure language.
          </li>
          <li>
            <strong>Careers application</strong> (<a href="/about/careers" className="text-primary underline">magnoliamaids.pro/about/careers</a>) —
            applicants may check an optional, unchecked box consenting to texts about their application,
            interview scheduling, and hiring updates, with the same disclosures.
          </li>
          <li>
            <strong>Verbally or in writing</strong> — if you call or text us at (580) 745-0045 and ask us to text
            you, or ask our office staff to send updates by text. We log the date, time, and source of that
            request. Replying to a message you send us is always permitted.
          </li>
        </ul>
        <p>
          Each opt-in is recorded with a timestamp, the phone number, the exact consent language shown, and the
          page or channel where consent was given. We do not buy, rent, or import phone number lists, and we never
          text a number that has not opted in.
        </p>
      </LegalSection>

      <LegalSection id="messages" title="Message types & frequency">
        <ul className="list-disc pl-5 space-y-1">
          <li>Quote confirmations and follow-ups you requested.</li>
          <li>Booking confirmations, schedule changes, and reminders before your cleaning.</li>
          <li>Crew "on the way" and completion notices.</li>
          <li>Occasional customer care and service updates.</li>
          <li>For applicants: interview scheduling and hiring status.</li>
        </ul>
        <p>
          Message frequency varies by activity — typically 2–6 messages per month, plus messages tied to a
          scheduled visit. Example message: "Magnolia Maids: your cleaning is confirmed for Tue 9/1 at 10:00 AM.
          Reply STOP to opt out, HELP for help."
        </p>
      </LegalSection>

      <LegalSection id="rates" title="Cost & carrier notice">
        <p>
          Magnolia Maids does not charge for text messages, but <strong>message and data rates may apply</strong> from
          your mobile carrier. Carriers are not liable for delayed or undelivered messages.
        </p>
      </LegalSection>

      <LegalSection id="stop" title="Opting out (STOP) and help (HELP)">
        <p>
          Reply <strong>STOP</strong> to any message to unsubscribe. You will receive one final confirmation message
          and no further texts unless you opt in again. STOPALL, UNSUBSCRIBE, CANCEL, END, and QUIT are also honored.
        </p>
        <p>
          Reply <strong>HELP</strong> for help, or contact us at (580) 745-0045 or{" "}
          <a href="mailto:hello@magnoliamaids.pro" className="text-primary underline">hello@magnoliamaids.pro</a>.
          Reply <strong>START</strong> to resume messages after opting out.
        </p>
      </LegalSection>

      <LegalSection id="privacy" title="Privacy">
        <p>
          <strong>
            No mobile information will be shared with third parties or affiliates for marketing or promotional
            purposes. Text messaging originator opt-in data and consent are not shared with any third parties.
          </strong>{" "}
          We use a messaging service provider solely to deliver the messages you requested on our behalf.
          See our <a href="/privacy" className="text-primary font-bold underline">Privacy Policy</a> and{" "}
          <a href="/terms" className="text-primary font-bold underline">Terms of Service</a>.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Magnolia Maids · Durant, OK · (580) 745-0045 ·{" "}
          <a href="mailto:hello@magnoliamaids.pro" className="text-primary underline">hello@magnoliamaids.pro</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
