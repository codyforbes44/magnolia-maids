import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Splash" },
      { name: "description", content: "How Splash collects, uses, and protects information you share when booking a cleaning." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Privacy Policy — Splash" },
      { property: "og:description", content: "How Splash handles your booking and contact information." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
});

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "what-we-collect", label: "What we collect" },
  { id: "how-we-use", label: "How we use it" },
  { id: "sharing", label: "Who we share with" },
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
      intro="This page is maintained by Splash to explain what information we collect when you visit splash.com or book a cleaning, and how we use it."
      toc={TOC}
    >
      <LegalSection id="overview" title="Overview">
        <p>
          Splash ("we", "us", "our") is a residential house cleaning company based in Miami, Florida.
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
        <p>We share limited information with service providers who help us operate Splash, including:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Our hosting and database provider, which stores booking records securely on our behalf.</li>
          <li>Email and SMS providers used to send confirmations and reminders.</li>
          <li>Payment processors, if you choose to pay online. We do not store card numbers ourselves.</li>
          <li>Address lookup services (such as Google Places) to help you enter your address quickly.</li>
        </ul>
        <p>We may also disclose information when required by law or to protect the rights, safety, or property of Splash, our customers, or our team.</p>
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
          We keep booking and contact records for as long as your account or relationship with Splash
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
        <p>Email <a href="mailto:hello@splash.com" className="text-primary underline">hello@splash.com</a> and we will respond within a reasonable time.</p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>Splash is not directed to children under 13 and we do not knowingly collect information from them.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>We may update this Privacy Policy from time to time. When we do, we will change the "Last updated" date at the top of this page. If the changes are significant, we will let existing customers know by email.</p>
      </LegalSection>

      <LegalSection id="contact" title="Contact us">
        <p>
          Splash · Miami, FL · (305) 555-0142 ·{" "}
          <a href="mailto:hello@splash.com" className="text-primary underline">hello@splash.com</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}