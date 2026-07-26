import { Link } from "@tanstack/react-router";
import mascot from "@/assets/splash-mascot.png";

export function SiteFooter() {
  return (
    <footer className="bg-ocean text-white mt-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={mascot} alt="" className="h-14 w-14" />
            <span className="font-display text-2xl font-extrabold">Splash</span>
          </div>
          <p className="mt-4 max-w-sm text-white/85">
            Clean homes. Happy people. Miami style. Splash and our local team are ready to
            make your place sparkle.
          </p>
        </div>
        <div>
          <h4 className="font-display font-bold mb-3">Explore</h4>
          <ul className="space-y-2 text-white/80 text-sm">
            <li><Link to="/services" className="hover:text-white">Services</Link></li>
            <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link to="/about" className="hover:text-white">About Splash</Link></li>
            <li><Link to="/booking" className="hover:text-white">Book Now</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold mb-3">Get in touch</h4>
          <ul className="space-y-2 text-white/80 text-sm">
            <li>Miami, FL</li>
            <li>(305) 555-0142</li>
            <li>hello@splash.com</li>
            <li>Mon–Sat · 8am–6pm</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-5 text-xs text-white/70 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Splash. All rights reserved.</span>
          <span>Made with 💙 in Miami</span>
        </div>
      </div>
    </footer>
  );
}