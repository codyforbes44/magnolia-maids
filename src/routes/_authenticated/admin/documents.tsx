import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, EmptyState, inputClass } from "@/components/admin/ui";
import brandKitAsset from "@/assets/astro-maids-brand-kit.zip.asset.json";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  head: () => ({
    meta: [
      { title: "Document library | Astro Maids Admin" },
      { name: "description", content: "Astro Maids operations documents and marketing downloads." },
      { property: "og:title", content: "Document library | Astro Maids Admin" },
      {
        property: "og:description",
        content: "Astro Maids operations documents and marketing downloads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DocumentsPage,
});

type Doc = {
  name: string;
  description: string;
  href: string;
  download: string;
  kind: string;
  size: string;
};

type Group = { title: string; description: string; docs: Doc[] };

const GROUPS: Group[] = [
  {
    title: "Operations",
    description: "Handbooks and internal reference material",
    docs: [
      {
        name: "Operations manual",
        description: "The complete Astro Maids operations handbook",
        href: "/docs/astro-maids-operations-manual.pdf",
        download: "Astro-Maids-Operations-Manual.pdf",
        kind: "PDF",
        size: "1010 KB",
      },
      {
        name: "Operations manual (editable)",
        description: "Same handbook in plain text for edits",
        href: "/docs/astro-maids-operations-manual.md",
        download: "Astro-Maids-Operations-Manual.md",
        kind: "MD",
        size: "49 KB",
      },
      {
        name: "Ownership proposal — Desiree Ramos",
        description: "Co-founder equity proposal document",
        href: "/docs/Astro-Maids-Ownership-Proposal-Desiree-Ramos.pdf",
        download: "Astro-Maids-Ownership-Proposal-Desiree-Ramos.pdf",
        kind: "PDF",
        size: "300 KB",
      },
      {
        name: "Ownership proposal (Word)",
        description: "Editable version of the ownership proposal",
        href: "/docs/Astro-Maids-Ownership-Proposal-Desiree-Ramos.docx",
        download: "Astro-Maids-Ownership-Proposal-Desiree-Ramos.docx",
        kind: "DOCX",
        size: "175 KB",
      },
    ],
  },
  {
    title: "Call forms",
    description: "Print-ready follow-up call sheets",
    docs: [
      {
        name: "Lead follow-up call form",
        description: "One-page script and notes sheet for new leads",
        href: "/docs/astro-maids-lead-followup-call-form.pdf",
        download: "Astro-Maids-Lead-Followup-Call-Form.pdf",
        kind: "PDF",
        size: "926 KB",
      },
      {
        name: "Booking follow-up call form",
        description: "Confirm details before a scheduled clean",
        href: "/docs/astro-maids-booking-followup-call-form.pdf",
        download: "Astro-Maids-Booking-Followup-Call-Form.pdf",
        kind: "PDF",
        size: "926 KB",
      },
      {
        name: "Applicant follow-up call form",
        description: "Phone screen sheet for job applicants",
        href: "/docs/astro-maids-applicant-followup-call-form.pdf",
        download: "Astro-Maids-Applicant-Followup-Call-Form.pdf",
        kind: "PDF",
        size: "926 KB",
      },
    ],
  },
  {
    title: "Brand",
    description: "Logo, colors, business cards, and brand rules",
    docs: [
      {
        name: "Full brand kit",
        description: "Logos, favicons, social sizes, print files, brand guide",
        href: brandKitAsset.url,
        download: "Astro-Maids-Brand-Kit.zip",
        kind: "ZIP",
        size: "5.6 MB",
      },
      {
        name: "Design philosophy",
        description: "Palette, typography, and voice notes",
        href: "/docs/astro-maids-design-philosophy.md",
        download: "Astro-Maids-Design-Philosophy.md",
        kind: "MD",
        size: "1 KB",
      },
      {
        name: "Business card (print-ready)",
        description: "Front and back, 300dpi with booking QR code",
        href: "/docs/astro-maids-business-card-dallas.pdf",
        download: "Astro-Maids-Business-Card.pdf",
        kind: "PDF",
        size: "170 KB",
      },
      {
        name: "Business card front",
        description: "High-resolution image of the card front",
        href: "/docs/astro-maids-card-front-dallas.png",
        download: "Astro-Maids-Card-Front.png",
        kind: "PNG",
        size: "59 KB",
      },
      {
        name: "Business card back",
        description: "High-resolution image of the card back",
        href: "/docs/astro-maids-card-back-dallas.png",
        download: "Astro-Maids-Card-Back.png",
        kind: "PNG",
        size: "39 KB",
      },
    ],
  },
  {
    title: "Marketing collateral",
    description: "Ads, campaign packs, and social templates",
    docs: [
      {
        name: "Meta ad creatives",
        description: "Ad images and copy guide for Facebook and Instagram",
        href: "/docs/astro-maids-meta-ads-dallas.pdf",
        download: "Astro-Maids-Meta-Ads.pdf",
        kind: "PDF",
        size: "2.9 MB",
      },
      {
        name: "Meta ad creatives (source files)",
        description: "All ad images packaged for upload",
        href: "/docs/astro-maids-meta-ads-dallas.zip",
        download: "Astro-Maids-Meta-Ads.zip",
        kind: "ZIP",
        size: "3.9 MB",
      },
      {
        name: "Seasonal campaign pack",
        description: "Spring, summer, holiday, and neighbor campaign artwork",
        href: "/docs/astro-maids-seasonal-campaigns-dallas.pdf",
        download: "Astro-Maids-Seasonal-Campaigns.pdf",
        kind: "PDF",
        size: "2.1 MB",
      },
      {
        name: "Social templates guide",
        description: "Post layouts and caption starters",
        href: "/docs/astro-maids-social-templates-dallas.pdf",
        download: "Astro-Maids-Social-Templates.pdf",
        kind: "PDF",
        size: "2.1 MB",
      },
      {
        name: "Social templates (source files)",
        description: "Editable template images",
        href: "/docs/astro-maids-social-templates-dallas.zip",
        download: "Astro-Maids-Social-Templates.zip",
        kind: "ZIP",
        size: "2.9 MB",
      },
      {
        name: "Flyer",
        description: "Grand opening flyer with quote QR code",
        href: "/docs/astro-maids-flyer-redesigned.pdf",
        download: "Astro-Maids-Flyer.pdf",
        kind: "PDF",
        size: "1.1 MB",
      },
      {
        name: "Pricing flyer",
        description: "Founding biweekly rates flyer",
        href: "/docs/astro-maids-flyer-2.pdf",
        download: "Astro-Maids-Pricing-Flyer.pdf",
        kind: "PDF",
        size: "715 KB",
      },
      {
        name: "plan.It Family perk graphic",
        description: "Partner offer image for founding members",
        href: "/docs/astro-maids-planit-family.jpg",
        download: "Astro-Maids-PlanIt-Family.jpg",
        kind: "JPG",
        size: "176 KB",
      },
    ],
  },
  {
    title: "Social images",
    description: "Ready-to-post covers and graphics",
    docs: [
      {
        name: "Facebook cover with Maggie",
        description: "Full-size cover image",
        href: "/docs/astro-maids-facebook-cover-maggie-dallas.png",
        download: "Astro-Maids-Facebook-Cover.png",
        kind: "PNG",
        size: "417 KB",
      },
      {
        name: "Facebook cover (mobile-safe)",
        description: "820x312 crop for phones",
        href: "/docs/astro-maids-facebook-cover-maggie-dallas-820x312.png",
        download: "Astro-Maids-Facebook-Cover-820x312.png",
        kind: "PNG",
        size: "162 KB",
      },
      {
        name: "Facebook feed post",
        description: "General service promotion image",
        href: "/docs/astro-maids-facebook-post-dallas.png",
        download: "Astro-Maids-Facebook-Post.png",
        kind: "PNG",
        size: "653 KB",
      },
      {
        name: "Welcome Desi post",
        description: "Desi Ramos, Co-Owner and Director of Client Experience and Operations",
        href: "/docs/astro-maids-welcome-desi-post.png",
        download: "Astro-Maids-Welcome-Desi.png",
        kind: "PNG",
        size: "130 KB",
      },
      {
        name: "Website share image",
        description: "1200x630 link preview graphic",
        href: "/docs/astro-maids-social-share-dallas-1200x630.jpg",
        download: "Astro-Maids-Share-1200x630.jpg",
        kind: "JPG",
        size: "120 KB",
      },
      {
        name: "Facebook cover",
        description: "1640x624 cover image",
        href: "/docs/astro-maids-facebook-cover-dallas.jpg",
        download: "Astro-Maids-Facebook-Cover-Dallas.jpg",
        kind: "JPG",
        size: "132 KB",
      },
      {
        name: "Facebook cover (mobile size)",
        description: "820x312 cover image",
        href: "/docs/astro-maids-facebook-cover-dallas-820x312.jpg",
        download: "Astro-Maids-Facebook-Cover-Dallas-820x312.jpg",
        kind: "JPG",
        size: "49 KB",
      },
      {
        name: "Share image (1600x900)",
        description: "Wide link preview graphic",
        href: "/docs/astro-maids-social-share-dallas-1600x900.jpg",
        download: "Astro-Maids-Share-1600x900.jpg",
        kind: "JPG",
        size: "193 KB",
      },
      {
        name: "Share image (1080x1080)",
        description: "Square share graphic",
        href: "/docs/astro-maids-social-share-dallas-1080x1080.jpg",
        download: "Astro-Maids-Share-1080x1080.jpg",
        kind: "JPG",
        size: "212 KB",
      },
      {
        name: "Maggie intro post",
        description: "Meet Maggie, Dallas skyline",
        href: "/docs/astro-maids-maggie-intro-dallas.png",
        download: "Astro-Maids-Maggie-Intro.png",
        kind: "PNG",
        size: "731 KB",
      },
      {
        name: "Maggie intro template",
        description: "Blank message version",
        href: "/docs/astro-maids-maggie-intro-template.png",
        download: "Astro-Maids-Maggie-Intro-Template.png",
        kind: "PNG",
        size: "695 KB",
      },
    ],
  },
  {
    title: "Hiring",
    description: "Recruiting flyers and job post artwork",
    docs: [
      {
        name: "Hiring flyer (print)",
        description: "Print-ready cleaner recruiting flyer",
        href: "/docs/astro-maids-hiring-flyer-dallas.pdf",
        download: "Astro-Maids-Hiring-Flyer.pdf",
        kind: "PDF",
        size: "1.0 MB",
      },
      {
        name: "Hiring flyer (image)",
        description: "Same flyer as an image for posting online",
        href: "/docs/astro-maids-hiring-flyer-dallas.png",
        download: "Astro-Maids-Hiring-Flyer.png",
        kind: "PNG",
        size: "1.7 MB",
      },
      {
        name: "Operations Assistant post",
        description: "Facebook artwork for the remote assistant role",
        href: "/docs/astro-maids-hiring-operations-assistant.png",
        download: "Astro-Maids-Hiring-Operations-Assistant.png",
        kind: "PNG",
        size: "171 KB",
      },
      {
        name: "Operations Assistant form graphic",
        description: "Application call-to-action image",
        href: "/docs/astro-maids-ops-assistant-facebook-form.png",
        download: "Astro-Maids-Ops-Assistant-Form.png",
        kind: "PNG",
        size: "654 KB",
      },
    ],
  },
];

function DocRow({ doc }: { doc: Doc }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border/50 py-3 last:border-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{doc.name}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {doc.kind}
          </span>
          <span className="text-xs text-muted-foreground">{doc.size}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{doc.description}</p>
      </div>
      <a
        href={doc.href}
        download={doc.download}
        className="tap-target inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        Download
      </a>
    </li>
  );
}

function DocumentsPage() {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      docs: g.docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.kind.toLowerCase().includes(q),
      ),
    })).filter((g) => g.docs.length > 0);
  }, [query]);

  const total = GROUPS.reduce((n, g) => n + g.docs.length, 0);

  return (
    <div>
      <AdminPageHeader
        title="Document library"
        description={`${total} documents, brand files, and marketing collateral ready to download`}
      />

      <div className="relative mb-6 max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents"
          aria-label="Search documents"
          className={`${inputClass} pl-9`}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState title="No documents match that search" hint="Try a different word." />
      ) : (
        <div className="grid gap-6">
          {groups.map((group) => (
            <SectionCard key={group.title} title={group.title} description={group.description}>
              <ul className="grid">
                {group.docs.map((doc) => (
                  <DocRow key={doc.href} doc={doc} />
                ))}
              </ul>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
