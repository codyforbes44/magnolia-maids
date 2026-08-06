import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/cookies")({
  component: CookiesPage,
  head: () => ({
    meta: [
      { title: "Cookie Policy — Magnolia Maids" },
      { name: "description", content: "How Magnolia Maids of Durant, OK uses cookies and similar technologies across our website and booking forms." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Cookie Policy — Magnolia Maids" },
      { property: "og:description", content: "How Magnolia Maids of Durant, OK uses cookies across our website." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://magnolia-maids.lovable.app/cookies" },
      { property: "og:image", content: "https://magnolia-maids.lovable.app/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnolia-maids.lovable.app/og-magnolia-maids.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnolia-maids.lovable.app/cookies" }],
  }),
});

const TOC = [
  { id: "what", label: "What cookies are" },
  { id: "types", label: "Types we use" },
  { id: "third-parties", label: "Third-party cookies" },
  { id: "control", label: "How to control them" },
  { id: "changes", label: "Changes" },
];

function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      updated="July 26, 2026"
      intro="This page explains the small text files ('cookies') and similar technologies that magnoliamaids.com uses, and how you can control them."
      toc={TOC}
    >
      <LegalSection id="what" title="What cookies are">
        <p>Cookies are small pieces of data your browser stores when you visit a website. They let a site remember you between pages and visits — for example, so a booking form doesn't forget your progress when you refresh the page.</p>
      </LegalSection>

      <LegalSection id="types" title="Types of cookies we use">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <b className="text-foreground">Strictly necessary.</b> Keep the site working — for example, remembering that you're signed in to the admin area or that you completed a step of the booking form. The site does not function properly without these.
          </li>
          <li>
            <b className="text-foreground">Preferences.</b> Remember small choices you make (like which service tab you last opened on the pricing page) so the site feels less repetitive.
          </li>
          <li>
            <b className="text-foreground">Analytics.</b> Help us understand how visitors use magnoliamaids.com in aggregate — which pages are popular, where people get stuck — so we can improve the site. These do not identify you by name.
          </li>
        </ul>
        <p>We do not use cookies for cross-site advertising.</p>
      </LegalSection>

      <LegalSection id="third-parties" title="Third-party cookies">
        <p>Some pages load content from trusted third parties who may set their own cookies, including:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Google Fonts, for typography.</li>
          <li>Google Maps / Places, for address autocomplete on the booking form.</li>
        </ul>
        <p>These third parties have their own privacy and cookie policies, which we encourage you to review.</p>
      </LegalSection>

      <LegalSection id="control" title="How to control cookies">
        <p>
          You can accept, block, or delete cookies through your browser settings. Most browsers let
          you do this on a per-site basis. Blocking strictly necessary cookies will break parts of
          magnoliamaids.com — for example, the booking form and the admin sign-in.
        </p>
        <p>Helpful links for common browsers:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer noopener" className="text-primary underline">Google Chrome</a></li>
          <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noreferrer noopener" className="text-primary underline">Apple Safari</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noreferrer noopener" className="text-primary underline">Mozilla Firefox</a></li>
          <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer noopener" className="text-primary underline">Microsoft Edge</a></li>
        </ul>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>If we change how we use cookies, we will update this page and the "Last updated" date at the top.</p>
      </LegalSection>
    </LegalPage>
  );
}