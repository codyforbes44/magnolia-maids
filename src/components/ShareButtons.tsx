import { useState } from "react";
import { Facebook, Linkedin, Link2, Check, Mail, Share2 } from "lucide-react";

export const SITE_URL = "https://magnolia-maids.lovable.app";
export const OG_IMAGE = `${SITE_URL}/og-magnolia-maids.jpg`;

type Props = {
  /** Route path of the page being shared, e.g. "/pricing" */
  path: string;
  title: string;
  description?: string;
  className?: string;
};

export function ShareButtons({ path, title, description = "", className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const d = encodeURIComponent(description);

  const links = [
    {
      label: "Share on Facebook",
      short: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    {
      label: "Share on X",
      short: "X",
      icon: XIcon,
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    },
    {
      label: "Share on LinkedIn",
      short: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
    {
      label: "Share by email",
      short: "Email",
      icon: Mail,
      href: `mailto:?subject=${t}&body=${d}%0A%0A${u}`,
    },
  ];

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
      } catch {
        /* dismissed */
      }
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section
      aria-label="Share this page"
      className={`mx-auto max-w-7xl px-5 md:px-8 pb-16 ${className}`}
    >
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
            Know someone in Durant who needs this?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share Magnolia Maids — the link previews with our magnolia cover image.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((l) => (
            <a
              key={l.short}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={l.label}
              title={l.label}
              className="tap-target inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-sage/10 hover:text-laurel"
            >
              <l.icon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{l.short}</span>
            </a>
          ))}
          <button
            type="button"
            onClick={copy}
            aria-label="Copy link to this page"
            className="tap-target inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-sage/10 hover:text-laurel"
          >
            {copied ? (
              <Check className="h-4 w-4 text-laurel" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only sm:not-sr-only">{copied ? "Copied" : "Copy link"}</span>
          </button>
          <button
            type="button"
            onClick={nativeShare}
            aria-label="Share using your device"
            className="tap-target sm:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground transition"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}