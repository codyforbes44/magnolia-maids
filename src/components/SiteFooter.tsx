import { Link } from "@tanstack/react-router";
import { ArrowRight, Facebook, Mail, MapPin, Phone, Clock } from "lucide-react";
import mascot from "@/assets/magnolia-mark-sm.webp";

type FooterLink = { label: string; to: string; params?: Record<string, string> };

const groups: { title: string; links: FooterLink[] }[] = [
  {
    title: "Services",
    links: [
      { label: "All services", to: "/services" },
      { label: "Airbnb turnover", to: "/airbnb-turnover" },
      { label: "Event cleaning", to: "/post-event-cleaning" },
      { label: "Move-out cleaning", to: "/move-out-cleaning" },
      { label: "Apartment turnovers", to: "/apartment-turnovers" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Service areas",
    links: [
      { label: "Where we clean", to: "/service-areas" },
      { label: "Bryan County", to: "/service-areas/$area", params: { area: "bryan-county" } },
      { label: "Lake Texoma", to: "/service-areas/$area", params: { area: "lake-texoma" } },
      { label: "Summer on the Lake", to: "/summer-on-the-lake" },
      { label: "Holiday Ready", to: "/holiday-ready" },
      { label: "Referral Week", to: "/referral-week" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Magnolia Maids", to: "/about" },
      { label: "Community guide", to: "/community" },
      { label: "Careers", to: "/about/careers" },
      { label: "FAQ", to: "/faq" },
      { label: "Free plan.It Family", to: "/planit-family" },
      { label: "Franchise interest", to: "/franchise" },
      { label: "Book now", to: "/booking" },
      { label: "My account", to: "/account" },
    ],
  },
];

function LinkList({ links }: { links: FooterLink[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-1 text-sm text-white/80">
      {links.map((l) => (
        <li key={l.label}>
          <Link
            to={l.to}
            {...(l.params ? { params: l.params } : {})}
            className="tap-target inline-flex items-center hover:text-white"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-laurel text-white mt-16 md:mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-10 md:py-16">
        {/* Brand + account CTA — first thing on a phone */}
        <div className="grid gap-8 md:grid-cols-4 md:gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img loading="lazy" decoding="async" src={mascot} alt="" className="h-12 w-12 sm:h-14 sm:w-14" />
              <span className="font-display text-xl sm:text-2xl font-semibold">Magnolia Maids</span>
            </div>
            <p className="mt-3 max-w-sm text-sm sm:text-base text-white/85">
              Immaculate homes, quietly delivered. Locally owned, white-glove house cleaning for
              Durant and Bryan County.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link
                to="/quote"
                className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-primary transition hover:bg-secondary"
              >
                Get an instant quote <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/account"
                className="tap-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 font-bold text-white transition hover:bg-white/10"
              >
                My account
              </Link>
            </div>
            <p className="mt-3 text-xs text-white/70">
              Clients: manage visits, request changes, and save entry &amp; pet details in your dashboard.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.facebook.com/MagnoliaMaidsOK"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Magnolia Maids on Facebook"
                className="tap-target inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://x.com/MagnoliaMaidsOK"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Magnolia Maids on X"
                className="tap-target inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact — high value on mobile, so it sits above the link lists */}
          <div className="md:col-span-2 md:order-last">
            <h2 className="font-display font-bold mb-3">Get in touch</h2>
            <ul className="space-y-1 text-sm text-white/85">
              <li>
                <a href="tel:+15807450045" className="tap-target inline-flex items-center gap-2 hover:text-white">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden /> (580) 745-0045
                </a>
              </li>
              <li>
                <a href="mailto:hello@magnoliamaids.pro" className="tap-target inline-flex items-center gap-2 hover:text-white">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">hello@magnoliamaids.pro</span>
                </a>
              </li>
              <li className="flex items-center gap-2 py-1.5">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden /> Durant, OK
              </li>
              <li className="flex items-center gap-2 py-1.5">
                <Clock className="h-4 w-4 shrink-0" aria-hidden /> Mon–Fri · 8am–5pm CST
              </li>
            </ul>
          </div>
        </div>

        {/* Link groups: accordions on phones, columns from sm up */}
        <div className="mt-8 grid gap-2 sm:mt-10 sm:grid-cols-3 sm:gap-8">
          {groups.map((g) => (
            <div key={g.title} className="border-t border-white/15 sm:border-0">
              <details className="group" open>
                <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-display font-bold sm:cursor-default sm:py-0 sm:mb-3">
                  {g.title}
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 rotate-90 transition-transform group-open:-rotate-90 sm:hidden"
                  />
                </summary>
                <div className="pb-3 sm:pb-0">
                  <LinkList links={g.links} />
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-4 pb-24 sm:pb-5 sm:py-5 text-xs text-white/70 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3">
          <nav className="-mx-2 flex flex-wrap gap-1 sm:order-2">
            <Link to="/privacy" className="tap-target justify-center px-2 hover:text-white">Privacy</Link>
            <Link to="/terms" className="tap-target justify-center px-2 hover:text-white">Terms</Link>
            <Link to="/cookies" className="tap-target justify-center px-2 hover:text-white">Cookies</Link>
            <Link to="/sms-terms" className="tap-target justify-center px-2 hover:text-white">SMS Terms</Link>
          </nav>
          <span className="sm:order-1">© {new Date().getFullYear()} Magnolia Maids. All rights reserved.</span>
          <span className="sm:order-3">Proudly made in Durant, Oklahoma</span>
        </div>
      </div>
    </footer>
  );
}
