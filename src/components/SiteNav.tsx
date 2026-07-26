import { Link } from "@tanstack/react-router";
import favicon from "@/assets/splash-mascot.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/booking", label: "Book" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border/60">
      <nav className="mx-auto max-w-7xl px-5 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={favicon} alt="Splash the dolphin" className="h-10 w-10 -my-2 group-hover:animate-wave" />
          <span className="font-display text-xl font-extrabold tracking-tight">
            <span className="text-ocean">Splash</span>
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
        <Link
          to="/booking"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-bold shadow-splash hover:brightness-105 transition"
        >
          Book a Cleaning
        </Link>
      </nav>
    </header>
  );
}