import { Link } from "@tanstack/react-router";
import favicon from "@/assets/magnolia-mark-sm.webp";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { GrandOpeningBanner } from "@/components/GrandOpeningBanner";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/about/careers", label: "Careers" },
  { to: "/airbnb-turnover", label: "Airbnb" },
  { to: "/booking", label: "Book" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border/60">
      <GrandOpeningBanner />
      <nav className="mx-auto max-w-7xl px-4 md:px-8 h-14 md:h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex min-h-11 items-center gap-2 group min-w-0">
          <img loading="lazy" decoding="async" src={favicon} alt="Magnolia Maids the magnolia bloom" className="h-9 w-9 md:h-10 md:w-10 -my-2 shrink-0 group-hover:animate-sway" />
          <span className="truncate font-display text-lg md:text-xl font-semibold tracking-tight">
            <span className="text-laurel">Magnolia Maids</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-4 py-2 rounded-full text-sm font-semibold text-foreground/70 hover:text-foreground hover:bg-secondary transition"
              activeProps={{ className: "px-4 py-2 rounded-full text-sm font-semibold text-primary bg-secondary" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/booking"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-bold shadow-bloom hover:brightness-105 transition"
          >
            Book a Cleaning
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[86%] max-w-sm p-0 bg-background">
              <VisuallyHidden>
                <SheetTitle>Site menu</SheetTitle>
              </VisuallyHidden>
              <div className="flex items-center justify-between px-5 h-16 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <img loading="lazy" decoding="async" src={favicon} alt="" className="h-9 w-9" />
                  <span className="font-display text-xl font-semibold text-laurel">Magnolia Maids</span>
                </div>
              </div>
              <nav className="flex flex-col px-3 py-4 gap-1">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 rounded-2xl text-base font-semibold text-foreground/80 hover:bg-secondary transition"
                    activeProps={{ className: "px-4 py-3 rounded-2xl text-base font-semibold text-primary bg-secondary" }}
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  to="/booking"
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 text-base font-bold shadow-bloom"
                >
                  Book a Cleaning
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}