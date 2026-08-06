import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — Magnolia Maids" },
      { name: "description", content: "The terms that apply when you book a cleaning with Magnolia Maids in Durant, Oklahoma." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Terms of Service — Magnolia Maids" },
      { property: "og:description", content: "The terms that apply when you book a cleaning with Magnolia Maids." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

const TOC = [
  { id: "agreement", label: "Your agreement" },
  { id: "bookings", label: "Bookings & quotes" },
  { id: "access", label: "Access to your home" },
  { id: "pricing", label: "Pricing & payment" },
  { id: "cancellations", label: "Cancellations & rescheduling" },
  { id: "guarantee", label: "Sparkle Guarantee" },
  { id: "not-included", label: "What we don't do" },
  { id: "liability", label: "Liability" },
  { id: "conduct", label: "Respectful conduct" },
  { id: "law", label: "Governing law" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="July 26, 2026"
      intro="These terms apply when you request a quote or book a cleaning with Magnolia Maids. Please read them — booking a service means you agree to them."
      toc={TOC}
    >
      <LegalSection id="agreement" title="Your agreement with Magnolia Maids">
        <p>
          By requesting a quote, booking a cleaning, or otherwise using magnoliamaids.com, you agree to
          these Terms of Service and to our{" "}
          <a href="/privacy" className="text-primary font-bold underline">Privacy Policy</a>. If
          you do not agree, please do not use the service.
        </p>
      </LegalSection>

      <LegalSection id="bookings" title="Bookings & quotes">
        <p>
          Quotes shown on the website are estimates based on the home details you provide. Final
          pricing is confirmed by email or text before your first visit. A booking is confirmed only
          when we send you a confirmation message.
        </p>
        <p>
          You are responsible for giving us accurate information about your home, access, pets, and
          any conditions we should know about (for example, recent renovations or biohazards).
        </p>
      </LegalSection>

      <LegalSection id="access" title="Access to your home">
        <p>
          You are responsible for making sure our crew can safely enter your home at the scheduled
          time. If we cannot enter (no answer, wrong code, blocked entry), a lockout fee equal to
          50% of the visit may apply.
        </p>
        <p>
          For safety, we ask that firearms, cash, and irreplaceable valuables be secured before we
          arrive. Please let us know about pets that will be home during the visit.
        </p>
      </LegalSection>

      <LegalSection id="pricing" title="Pricing & payment">
        <p>
          Prices are quoted in US dollars and do not include tips (tips are appreciated but never
          expected). Payment is due on the day of service unless otherwise agreed.
        </p>
        <p>
          Recurring plan pricing is locked while your plan stays active. If your home changes
          materially — added rooms, long gaps between visits, or extra scope — we will re-quote in
          writing before the next visit.
        </p>
      </LegalSection>

      <LegalSection id="cancellations" title="Cancellations & rescheduling">
        <ul className="list-disc pl-5 space-y-1">
          <li>Cancel or reschedule at least 24 hours before your visit at no charge.</li>
          <li>Cancellations inside 24 hours may be charged 50% of the visit.</li>
          <li>Same-day cancellations or lockouts may be charged the full visit rate.</li>
        </ul>
      </LegalSection>

      <LegalSection id="guarantee" title="24-hour Sparkle Guarantee">
        <p>
          If you're not happy with a specific area, tell us within 24 hours of the visit and we
          will return to re-clean that area at no additional cost. The guarantee applies to areas
          we cleaned during the original visit.
        </p>
      </LegalSection>

      <LegalSection id="not-included" title="What we don't do">
        <p>To keep our crew safe and our work focused, we do not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Clean exterior windows above the ground floor.</li>
          <li>Handle biohazards, mold remediation, pest infestations, or human/animal waste beyond routine bathroom cleaning.</li>
          <li>Move heavy furniture or large appliances.</li>
          <li>Provide childcare, pet care, or errand services.</li>
        </ul>
      </LegalSection>

      <LegalSection id="liability" title="Liability">
        <p>
          Magnolia Maids is fully insured. If something is damaged during a visit because of our work,
          please tell us within 48 hours so we can investigate and, where appropriate, repair or
          replace the item.
        </p>
        <p>
          To the fullest extent permitted by Oklahoma law, Magnolia Maids' total liability for any claim
          related to a visit is limited to the amount you paid for that visit. We are not liable
          for indirect, incidental, or consequential damages.
        </p>
      </LegalSection>

      <LegalSection id="conduct" title="Respectful conduct">
        <p>
          Our crew members are people, not products. We reserve the right to end a visit and end
          our relationship with any customer who behaves in a way that is unsafe, harassing, or
          discriminatory toward our team.
        </p>
      </LegalSection>

      <LegalSection id="law" title="Governing law">
        <p>These Terms are governed by the laws of the State of Oklahoma, without regard to its conflict-of-laws principles. Any dispute will be handled in the state or federal courts located in Bryan County, Oklahoma.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to these terms">
        <p>We may update these Terms from time to time. The version in effect for a given cleaning is the version posted at the time you booked it. Continued use of Magnolia Maids after changes are posted means you accept the new Terms.</p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Magnolia Maids · Durant, OK · (580) 555-0142 ·{" "}
          <a href="mailto:hello@magnoliamaids.com" className="text-primary underline">hello@magnoliamaids.com</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}