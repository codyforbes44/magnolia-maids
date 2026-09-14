import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, EmptyState, inputClass } from "@/components/admin/ui";
import brandKitAsset from "@/assets/magnolia-maids-brand-kit.zip.asset.json";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
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
        description: "The complete Magnolia Maids operations handbook",
        href: "/docs/magnolia-maids-operations-manual.pdf",
        download: "Magnolia-Maids-Operations-Manual.pdf",
        kind: "PDF",
        size: "426 KB",
      },
      {
        name: "Operations manual (editable)",
        description: "Same handbook in plain text for edits",
        href: "/docs/magnolia-maids-operations-manual.md",
        download: "Magnolia-Maids-Operations-Manual.md",
        kind: "MD",
        size: "49 KB",
      },
      {
        name: "Ownership proposal — Desiree Ramos",
        description: "Co-founder equity proposal document",
        href: "/docs/Magnolia-Maids-Ownership-Proposal-Desiree-Ramos.pdf",
        download: "Magnolia-Maids-Ownership-Proposal-Desiree-Ramos.pdf",
        kind: "PDF",
        size: "300 KB",
      },
      {
        name: "Ownership proposal (Word)",
        description: "Editable version of the ownership proposal",
        href: "/docs/Magnolia-Maids-Ownership-Proposal-Desiree-Ramos.docx",
        download: "Magnolia-Maids-Ownership-Proposal-Desiree-Ramos.docx",
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
        href: "/docs/magnolia-maids-lead-followup-call-form.pdf",
        download: "Magnolia-Maids-Lead-Followup-Call-Form.pdf",
        kind: "PDF",
        size: "244 KB",
      },
      {
        name: "Booking follow-up call form",
        description: "Confirm details before a scheduled clean",
        href: "/docs/magnolia-maids-booking-followup-call-form.pdf",
        download: "Magnolia-Maids-Booking-Followup-Call-Form.pdf",
        kind: "PDF",
        size: "244 KB",
      },
      {
        name: "Applicant follow-up call form",
        description: "Phone screen sheet for job applicants",
        href: "/docs/magnolia-maids-applicant-followup-call-form.pdf",
        download: "Magnolia-Maids-Applicant-Followup-Call-Form.pdf",
        kind: "PDF",
        size: "244 KB",
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
        download: "Magnolia-Maids-Brand-Kit.zip",
        kind: "ZIP",
        size: "11.4 MB",
      },
      {
        name: "Design philosophy",
        description: "Palette, typography, and voice notes",
        href: "/docs/magnolia-maids-design-philosophy.md",
        download: "Magnolia-Maids-Design-Philosophy.md",
        kind: "MD",
        size: "3 KB",
      },
      {
        name: "Business card (print-ready)",
        description: "Front and back, 300dpi with booking QR code",
        href: "/docs/magnolia-maids-business-card-v3.pdf",
        download: "Magnolia-Maids-Business-Card.pdf",
        kind: "PDF",
        size: "5.7 MB",
      },
      {
        name: "Business card front",
        description: "High-resolution image of the card front",
        href: "/docs/magnolia-maids-card-front-v3.png",
        download: "Magnolia-Maids-Card-Front.png",
        kind: "PNG",
        size: "246 KB",
      },
      {
        name: "Business card back",
        description: "High-resolution image of the card back",
        href: "/docs/magnolia-maids-card-back-v3.png",
        download: "Magnolia-Maids-Card-Back.png",
        kind: "PNG",
        size: "157 KB",
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
        href: "/docs/magnolia-maids-meta-ads.pdf",
        download: "Magnolia-Maids-Meta-Ads.pdf",
        kind: "PDF",
        size: "2.2 MB",
      },
      {
        name: "Meta ad creatives (source files)",
        description: "All ad images packaged for upload",
        href: "/docs/magnolia-maids-meta-ads.zip",
        download: "Magnolia-Maids-Meta-Ads.zip",
        kind: "ZIP",
        size: "7.9 MB",
      },
      {
        name: "Seasonal campaign pack",
        description: "Holiday, spring, and summer campaign artwork and copy",
        href: "/docs/magnolia-maids-seasonal-campaigns.pdf",
        download: "Magnolia-Maids-Seasonal-Campaigns.pdf",
        kind: "PDF",
        size: "810 KB",
      },
      {
        name: "Social templates guide",
        description: "Post layouts and caption starters",
        href: "/docs/magnolia-maids-social-templates.pdf",
        download: "Magnolia-Maids-Social-Templates.pdf",
        kind: "PDF",
        size: "880 KB",
      },
      {
        name: "Social templates (source files)",
        description: "Editable template images",
        href: "/docs/magnolia-maids-social-templates.zip",
        download: "Magnolia-Maids-Social-Templates.zip",
        kind: "ZIP",
        size: "4.0 MB",
      },
      {
        name: "plan.It Family perk graphic",
        description: "Partner offer image for founding members",
        href: "/docs/planit-family-facebook.jpg",
        download: "Magnolia-Maids-PlanIt-Family.jpg",
        kind: "JPG",
        size: "191 KB",
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
        href: "/docs/magnolia-maids-facebook-cover-maggie-v4.png",
        download: "Magnolia-Maids-Facebook-Cover.png",
        kind: "PNG",
        size: "571 KB",
      },
      {
        name: "Facebook cover (mobile-safe)",
        description: "820x312 crop for phones",
        href: "/docs/magnolia-maids-facebook-cover-maggie-v4-820x312.png",
        download: "Magnolia-Maids-Facebook-Cover-820x312.png",
        kind: "PNG",
        size: "162 KB",
      },
      {
        name: "Durant promo post",
        description: "Founding-member pricing announcement",
        href: "/docs/magnolia-maids-promo-durant.png",
        download: "Magnolia-Maids-Promo-Durant.png",
        kind: "PNG",
        size: "360 KB",
      },
      {
        name: "Facebook feed post",
        description: "General service promotion image",
        href: "/docs/magnolia-maids-facebook-post-v3.png",
        download: "Magnolia-Maids-Facebook-Post.png",
        kind: "PNG",
        size: "1.9 MB",
      },
      {
        name: "Welcome Desiree post",
        description: "Team announcement graphic",
        href: "/docs/magnolia-maids-welcome-desiree-post.png",
        download: "Magnolia-Maids-Welcome-Desiree.png",
        kind: "PNG",
        size: "2.4 MB",
      },
      {
        name: "Website share image",
        description: "1200x630 link preview graphic",
        href: "/docs/magnolia-maids-social-share-1200x630.jpg",
        download: "Magnolia-Maids-Share-1200x630.jpg",
        kind: "JPG",
        size: "140 KB",
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
        href: "/docs/magnolia-maids-hiring-flyer.pdf",
        download: "Magnolia-Maids-Hiring-Flyer.pdf",
        kind: "PDF",
        size: "5.7 MB",
      },
      {
        name: "Hiring flyer (image)",
        description: "Same flyer as an image for posting online",
        href: "/docs/magnolia-maids-hiring-flyer.png",
        download: "Magnolia-Maids-Hiring-Flyer.png",
        kind: "PNG",
        size: "864 KB",
      },
      {
        name: "Operations Assistant post",
        description: "Facebook artwork for the remote assistant role",
        href: "/docs/magnolia-maids-hiring-operations-assistant.png",
        download: "Magnolia-Maids-Hiring-Operations-Assistant.png",
        kind: "PNG",
        size: "1.4 MB",
      },
      {
        name: "Operations Assistant form graphic",
        description: "Application call-to-action image",
        href: "/docs/magnolia-maids-ops-assistant-facebook-form.png",
        download: "Magnolia-Maids-Ops-Assistant-Form.png",
        kind: "PNG",
        size: "2.0 MB",
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
