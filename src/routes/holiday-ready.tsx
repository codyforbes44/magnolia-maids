import { createFileRoute } from "@tanstack/react-router";
import { CampaignLanding } from "@/components/CampaignLanding";
import { CAMPAIGNS } from "@/lib/campaigns";
import { breadcrumbSchema, serviceSchema } from "@/lib/structured-data";
import hero from "@/assets/hero-holiday.jpg";

const CAMPAIGN = CAMPAIGNS["holiday-ready"];
const OG_IMAGE = "https://magnoliamaids.pro/og-magnolia-maids.jpg";

export const Route = createFileRoute("/holiday-ready")({
  component: () => <CampaignLanding campaign={CAMPAIGN} hero={hero} />,
  head: () => ({
    meta: [
      { title: CAMPAIGN.seo.title },
      { name: "description", content: CAMPAIGN.seo.description },
      { name: "keywords", content: CAMPAIGN.seo.keywords },
      { property: "og:title", content: CAMPAIGN.seo.title },
      { property: "og:description", content: CAMPAIGN.seo.description },
      { property: "og:url", content: `https://magnoliamaids.pro${CAMPAIGN.path}` },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `https://magnoliamaids.pro${CAMPAIGN.path}` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceSchema({
            name: CAMPAIGN.label,
            description: CAMPAIGN.seo.description,
            url: CAMPAIGN.path,
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: CAMPAIGN.label, path: CAMPAIGN.path },
          ]),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: CAMPAIGN.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
});
