import { Link } from "@tanstack/react-router";
import mascot from "@/assets/magnolia-mark-sm.webp";

export function SiteFooter() {
  return (
    <footer className="bg-laurel text-white mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img loading="lazy" decoding="async" src={mascot} alt="" className="h-14 w-14" />
            <span className="font-display text-2xl font-semibold">Magnolia Maids</span>
          </div>
          <p className="mt-4 max-w-sm text-white/85">
            Immaculate homes, quietly delivered. Magnolia Maids is a locally owned, white-glove
            house cleaning service for Durant and Bryan County.
          </p>
        </div>
        <div>
          <h4 className="font-display font-bold mb-3">Explore</h4>
          <ul className="text-white/80 text-sm">
            <li><Link to="/services" className="tap-target hover:text-white">Services</Link></li>
            <li><Link to="/airbnb-turnover" className="tap-target hover:text-white">Airbnb Turnover</Link></li>
            <li><Link to="/pricing" className="tap-target hover:text-white">Pricing</Link></li>
            <li><Link to="/about" className="tap-target hover:text-white">About Magnolia Maids</Link></li>
            <li><Link to="/about/careers" className="tap-target hover:text-white">Careers</Link></li>
            <li><Link to="/booking" className="tap-target hover:text-white">Book Now</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold mb-3">Get in touch</h4>
          <ul className="space-y-2 text-white/80 text-sm">
            <li>Durant, OK</li>
            <li>(580) 745-0045</li>
            <li>hello@magnoliamaids.pro</li>
            <li>Mon–Sat · 8am–6pm</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-5 text-xs text-white/70 flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Magnolia Maids. All rights reserved.</span>
          <nav className="flex flex-wrap gap-2">
            <Link to="/privacy" className="tap-target justify-center px-2 hover:text-white">Privacy</Link>
            <Link to="/terms" className="tap-target justify-center px-2 hover:text-white">Terms</Link>
            <Link to="/cookies" className="tap-target justify-center px-2 hover:text-white">Cookies</Link>
          </nav>
          <span>Proudly made in Durant, Oklahoma</span>
        </div>
      </div>
    </footer>
  );
}