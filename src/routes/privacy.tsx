import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Astro Maids" },
      { name: "description", content: "How Astro Maids of Dallas, TX collects, uses, and protects the information you share when booking a house cleaning." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Privacy Policy — Astro Maids" },
      { property: "og:description", content: "How Astro Maids of Dallas, TX handles your booking and contact information." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://magnoliamaids.pro/privacy" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-astro-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-astro-maids.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/privacy" }],
  }),
});

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "what-we-collect", label: "What we collect" },
  { id: "how-we-use", label: "How we use it" },
  { id: "sharing", label: "Who we share with" },
  { id: "sms", label: "Text messaging (SMS)" },
  { id: "cookies", label: "Cookies & analytics" },
  { id: "retention", label: "Retention" },
  { id: "your-rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact us" },
];

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="July 26, 2026"
      intro="This page is maintained by Astro Maids to explain what information we collect when you visit astromaids.com or book a cleaning, and how we use it."
      toc={TOC}
    >
      <LegalSection id="overview" title="Overview">
        <p>
          Astro Maids ("we", "us", "our") is a residential house cleaning company based in Dallas, Texas.
          This Privacy Policy applies to information collected through our website, booking forms,
          and email communications with customers. It does not describe practices of third parties
          whose services we link to.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" title="What we collect">
        <p>When you request a quote or book a cleaning, we collect:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Contact information you provide: name, email address, phone number.</li>
          <li>Service address and details about your home (bedrooms, bathrooms, add-ons).</li>
          <li>Preferred visit day, time window, and any notes you send us.</li>
          <li>Basic technical data your browser sends: IP address, device type, and pages visited.</li>
        </ul>
        <p>We do not ask for, and do not intentionally collect, government IDs, financial account numbers, or sensitive personal data through this website.</p>
      </LegalSection>

      <LegalSection id="how-we-use" title="How we use it">
        <p>We use the information you share to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Confirm and schedule your cleaning and communicate with you about it.</li>
          <li>Provide quotes, receipts, and reminders.</li>
          <li>Respond to questions and improve our service.</li>
          <li>Keep records required for tax, accounting, and dispute resolution.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection id="sharing" title="Who we share with">
        <p>We share limited information with service providers who help us operate Astro Maids, including:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Our hosting and database provider, which stores booking records securely on our behalf.</li>
          <li>Email and SMS providers used to send confirmations and reminders.</li>
          <li>Payment processors, if you choose to pay online. We do not store card numbers ourselves.</li>
          <li>Address lookup services (such as Google Places) to help you enter your address quickly.</li>
        </ul>
        <p>We may also disclose information when required by law or to protect the rights, safety, or property of Astro Maids, our customers, or our team.</p>
      </LegalSection>

      <LegalSection id="sms" title="Text messaging (SMS)">
        <p>
          We send text messages only to people who have opted in — by checking an optional, unchecked
          consent box on our booking, quote, or careers forms, or by asking us directly to text them.
          Consent is never a condition of purchase or employment. Message frequency varies; message and
          data rates may apply. Reply STOP to unsubscribe or HELP for help.
        </p>
        <p className="font-semibold">
          No mobile information will be shared with third parties or affiliates for marketing or
          promotional purposes. Text messaging originator opt-in data and consent are not shared with
          any third parties. We use a messaging provider solely to deliver the messages you requested.
        </p>
        <p>
          Full details are in our{" "}
          <a href="/sms-terms" className="text-primary font-bold underline">SMS Messaging Terms</a>.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies & analytics">
        <p>
          Our website uses a small number of cookies and similar technologies to keep the site
          working and to understand how it is used. For details, see our{" "}
          <a href="/cookies" className="text-primary font-bold underline">Cookie Policy</a>.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="How long we keep it">
        <p>
          We keep booking and contact records for as long as your account or relationship with Astro Maids
          is active, and for a reasonable period after that to meet tax, accounting, and legal
          obligations. When we no longer need your information, we delete or anonymize it.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="Your choices and rights">
        <p>You can:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Ask us what information we have about you.</li>
          <li>Ask us to correct or delete your information.</li>
          <li>Unsubscribe from marketing emails at any time using the link in the email.</li>
          <li>Ask us not to contact you for marketing purposes.</li>
        </ul>
        <p>Email <a href="mailto:hello@magnoliamaids.pro" className="text-primary underline">hello@astromaids.com</a> and we will respond within a reasonable time.</p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>Astro Maids is not directed to children under 13 and we do not knowingly collect information from them.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>We may update this Privacy Policy from time to time. When we do, we will change the "Last updated" date at the top of this page. If the changes are significant, we will let existing customers know by email.</p>
      </LegalSection>

      <LegalSection id="contact" title="Contact us">
        <p>
          Astro Maids · Dallas, TX · (214) 978-6445 ·{" "}
          <a href="mailto:hello@magnoliamaids.pro" className="text-primary underline">hello@astromaids.com</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}