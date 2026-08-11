import { breadcrumbSchema, SITE_URL } from "@/lib/structured-data";
import { PAY } from "@/lib/careers-pay";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { submitCareersApplication } from "@/lib/careers.functions";
import { SiteNav } from "@/components/SiteNav";
import { QuoteCallCTA } from "@/components/QuoteCallCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { useInViewOnce, useCountUp } from "@/hooks/useInViewOnce";
import mascot from "@/assets/magnolia-mark.webp";
import heroCareers from "@/assets/hero-careers.webp";
import { HeroBackground } from "@/components/HeroBackground";
import {
  Sparkles, Sun, Heart, ShieldCheck, Flower2, Clock, DollarSign,
  Calendar, GraduationCap, HandHeart, Bus, Car, Coffee, Star, MapPin,
  ArrowRight, Check, ChevronDown, Users, PartyPopper, Leaf,
} from "lucide-react";

export const Route = createFileRoute("/about/careers")({
  component: CareersPage,
  head: () => ({
    meta: [
      { title: "House Cleaning Jobs in Durant, OK | Magnolia Maids Careers" },
      { name: "description", content: `Now hiring house cleaners in Durant, OK. Competitive pay plus 100% of tips, flexible hours, and PTO. Apply in 60 seconds — no experience required.` },
      { name: "keywords", content: "house cleaning jobs Durant OK, maid jobs Durant Oklahoma, cleaner hiring Bryan County, part time cleaning jobs Durant" },
      { property: "og:title", content: "House Cleaning Jobs in Durant, OK | Magnolia Maids Careers" },
      { property: "og:description", content: "Join Magnolia Maids. Fair pay, flexible schedule, real teammates. Now hiring across Durant." },
      { property: "og:url", content: "https://magnoliamaids.pro/about/careers" },
      { property: "og:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { name: "twitter:image", content: "https://magnoliamaids.pro/og-magnolia-maids.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/about/careers" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About Magnolia Maids", path: "/about" },
          { name: "Careers", path: "/about/careers" },
        ])),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: "House Cleaner",
          description:
            "Magnolia Maids is hiring house cleaners in Durant, OK. Choose a W-2 employee role (competitive hourly pay, 100% of tips, and PTO) or a 1099 independent contractor route with per-job pay. Compensation is discussed on your intro call. Founding crew spots available before our September 1, 2026 opening. No experience required.",
          employmentType: ["FULL_TIME", "PART_TIME", "CONTRACTOR"],
          datePosted: "2026-08-01",
          validThrough: "2026-12-31",
          directApply: true,
          hiringOrganization: {
            "@type": "Organization",
            name: "Magnolia Maids",
            sameAs: `${SITE_URL}/`,
            logo: `${SITE_URL}/og-magnolia-maids.jpg`,
          },
          jobLocation: {
            "@type": "Place",
            address: { "@type": "PostalAddress", addressLocality: "Durant", addressRegion: "OK", postalCode: "74701", addressCountry: "US" },
          },
          applicantLocationRequirements: { "@type": "AdministrativeArea", name: "Bryan County, Oklahoma" },
        }),
      },
    ],
  }),
});

const PERKS = [
  { icon: DollarSign, title: PAY.headline, desc: "Competitive base pay plus 100% of tips — you keep every dollar." },
  { icon: Calendar, title: "Pick your days", desc: "Build a schedule around school, family, or a second gig." },
  { icon: GraduationCap, title: "Training & coaching", desc: "Learn the Magnolia Maids Way on the job with a partner and ongoing coaching." },
  { icon: HandHeart, title: "Real teammates", desc: "Work in 2-person pods. No solo grinds. We show up for each other." },
  { icon: Bus, title: "Mileage reimbursed", desc: "Team Leads drive their own vehicle between homes and are reimbursed at the IRS rate." },
  { icon: Sun, title: "Paid time off", desc: "Every full-time teammate earns PTO from day one. Rest matters." },
  { icon: Sparkles, title: "Bonuses that add up", desc: "Referral, review, and perfect-attendance bonuses stack every month." },
  { icon: ShieldCheck, title: "Insured & supported", desc: "We carry the insurance, buy the supplies, book the jobs. You focus on the work." },
];

const ROLES = [
  {
    id: "cleaner",
    title: "House Cleaner",
    tag: "Most openings",
    type: "Full-time · Part-time",
    pay: PAY.cleaner,
    where: "Bryan County",
    blurb: "Turn homes into happy places. You'll roll with a partner across 3–5 homes a day, using our checklists, playlists, and eco-safe products.",
    doing: [
      "Standard & deep cleans in condos and single-family homes",
      "Follow our room-by-room Magnolia Maids Way playbook",
      "Kind, quick communication with clients (bilingual is a plus)",
      "Restock, log the visit, high-five your partner",
    ],
  },
  {
    id: "lead",
    title: "Team Lead",
    tag: "Growth track",
    type: "Full-time",
    pay: PAY.lead,
    where: "Bryan County",
    blurb: "Run a pod of 2–3 cleaners, coach the newest teammates, and own the quality of every home you touch.",
    doing: [
      "Lead daily route with 2–3 teammates",
      "Train new hires through their first 30 days",
      "Own quality scores and 24-hour Magnolia Guarantee callbacks",
      "Report back on wins, blockers, and client love",
    ],
  },
  {
    id: "turnover",
    title: "Airbnb Turnover Specialist",
    tag: "Flexible",
    type: "Part-time · Weekends",
    pay: PAY.turnover,
    where: "Durant · Calera · Silo",
    blurb: "Fast, focused turnovers between guests. Great fit if you love checklists, tight windows, and a spotless finish.",
    doing: [
      "Same-day turnovers in the 11am–3pm window",
      "Photo-verified staging and linen reset",
      "Restock amenities from the Magnolia Maids caddy",
      "Flag maintenance issues right from the app",
    ],
  },
];

const DAY = [
  { time: "7:30 AM", title: "Meet your pod", desc: "Coffee, playlist pick, and route walkthrough at our Durant HQ.", icon: Coffee },
  { time: "8:30 AM", title: "First home", desc: "Roll out to home #1. Two teammates, one plan, one sparkling result.", icon: Sparkles },
  { time: "12:30 PM", title: "Paid lunch break", desc: "A paid 30-minute break — sit down, eat, reset before the afternoon route.", icon: HandHeart },
  { time: "4:00 PM", title: "Wrap & recap", desc: "Restock your kit, log the visits, tag your favorite moment of the day.", icon: PartyPopper },
];

const STEPS = [
  { n: "01", title: "Apply in 60 seconds", desc: "A short form, no résumé needed. Tell us about you." },
  { n: "02", title: "Friendly phone chat", desc: "A 15-minute call with our hiring lead — we do all the questions, you ask us anything." },
  { n: "03", title: "Ride-along shift", desc: "Paid trial shift with a Team Lead. See the crew, feel the vibe." },
  { n: "04", title: "Welcome to the pod", desc: "Background check, training, and your first solo route." },
];

const FAQ = [
  { q: "Do I need cleaning experience?", a: "Not required. If you take pride in details and treat people warmly, we'll teach you the rest during training." },
  { q: "Do I need a car?", a: "Team Leads do — you'll drive your own reliable, insured vehicle between homes and we reimburse mileage at the current IRS rate. Crew members can ride with their Team Lead. Supplies, equipment, and uniforms are always provided by us. See our Vehicle & Mileage FAQ below for full details." },
  { q: "Is this 1099 or W-2?", a: "Both — you choose. W-2 employee roles come with taxes handled, workers' comp, PTO, and a schedule we build with you. 1099 contractor roles are for licensed, insured independent pros who want to set their own availability and take routes à la carte at a per-job rate. We go over compensation for either track on your intro call. Founding crew members can start on either track and switch once we open on September 1, 2026." },
  { q: "What is the founding crew?", a: "The first teammates hired before our September 1, 2026 opening. Founding crew get first pick of routes, top-of-range pay for their track, an onboarding week, and priority for Team Lead promotions — available on both the W-2 and 1099 tracks." },
  { q: "Do you sponsor work authorization?", a: "Applicants must have current US work authorization. We happily welcome bilingual teammates (English + Spanish or Creole)." },
  { q: "What are the hours like?", a: "Most shifts run 8am–4pm, Monday to Saturday. We build the schedule with you, not around you." },
  { q: "What's the vibe?", a: "Warm, low-drama, high-standards. Playlists on, phones down, teammates cheered on. We laugh a lot." },
];

const VEHICLE_FAQ = [
  { q: "Is a personal vehicle required for every role?", a: "A reliable, insured personal vehicle is required for Team Lead positions because you will drive the route between homes and transport your pod. Crew members typically ride with their Team Lead, so a personal vehicle is not required for house cleaner or Airbnb turnover roles, though having one can help with flexibility." },
  { q: "What does 'reliable and insured' mean?", a: "Your vehicle must be in safe working condition, legally registered, and covered by auto insurance that meets Oklahoma state requirements. You will need to show proof of a valid driver's license and current insurance during onboarding." },
  { q: "How does mileage reimbursement work?", a: "Team Leads are reimbursed for business miles driven between client homes during the workday at the current IRS standard mileage rate. We track miles through a simple daily route log in our app or by odometer photo. Reimbursement is paid on your regular paycheck or contractor invoice, not in cash." },
  { q: "Does the company provide gas cards or vehicles?", a: "No. We do not provide company vehicles or gas cards. Team Leads use their own vehicle and are reimbursed for qualifying business miles instead. This keeps routes flexible and lets you drive a vehicle you already know and trust." },
  { q: "Are commuting miles from home to our first stop covered?", a: "No. Standard commuting from your home to the first job and from the last job back home is not reimbursed, which follows IRS guidelines. Reimbursement applies to miles driven between client homes during your scheduled route." },
  { q: "What if I drive my own vehicle as a crew member?", a: "If you voluntarily drive between job sites or transport teammates, you may request pre-approval for mileage reimbursement. Otherwise, crew members who ride with the Team Lead are not expected to use their own vehicle for work." },
  { q: "Do I need to use my vehicle for supply runs?", a: "No. We deliver supplies and equipment to our Durant hub or directly to the route start point. You are not expected to use your personal vehicle for supply shopping or restocking." },
];

const COMMITMENTS = [
  { name: "W-2 or 1099 — your call", role: "Two real tracks, one standard", quote: "Choose employment with taxes, workers' comp, and PTO handled, or contract independently on a per-job rate. Same checklist, same respect." },
  { name: "Hands-on onboarding", role: "Experience not required", quote: "You learn the Magnolia checklist alongside a partner, before you ever work a home solo." },
  { name: "Supplies provided", role: "No out-of-pocket costs", quote: "Eco-safe products, equipment, and uniforms come from us. Team Leads drive their own vehicle and are reimbursed for mileage." },
];

const WORK_TRACKS = [
  {
    id: "w2",
    title: "W-2 Employee",
    tag: "Most popular",
    pay: PAY.w2,
    points: [
      "Payroll taxes, workers' comp, and insurance handled by us",
      "PTO and paid lunch breaks",
      "Steady weekly schedule built with you",
      "Supplies and uniforms provided; mileage reimbursed for Team Leads",
      "Growth track to Team Lead",
    ],
  },
  {
    id: "1099",
    title: "1099 Independent Contractor",
    tag: "Flexible",
    pay: PAY.contractor,
    points: [
      "Set your own availability and accept routes you want",
      "Paid per job; you handle your own taxes",
      "Must carry your own liability insurance and supplies (or rent ours)",
      "Great for existing solo cleaners adding steady volume",
      "Same background check, checklist, and quality standard",
    ],
  },
  {
    id: "founding",
    title: "Founding Crew",
    tag: "Before Sept 1, 2026",
    pay: PAY.founding,
    points: [
      "Available on both the W-2 and 1099 tracks",
      "First pick of Durant, Calera, Silo, and Lake Texoma routes",
      "Founding-rate pay locked for your first year",
      "Priority consideration for Team Lead promotions",
      "Help shape the Magnolia Maids Way checklists",
    ],
  },
];

function CareersPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-ivory-wash">
        <HeroBackground src={heroCareers} position="center 50%" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: "radial-gradient(circle at 15% 20%, oklch(0.85 0.12 200 / 0.55), transparent 45%), radial-gradient(circle at 85% 65%, oklch(0.88 0.16 90 / 0.35), transparent 40%)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-24 left-8 h-16 w-16 rounded-full bg-white/50 animate-float-slow" />
          <div className="absolute top-64 right-16 h-10 w-10 rounded-full bg-white/60 animate-float-slow" style={{ animationDelay: "1.2s" }} />
          <div className="absolute bottom-24 left-1/3 h-6 w-6 rounded-full bg-white/70 animate-float-slow" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pt-10 md:pt-16 pb-20 md:pb-28 grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center">
          <div className="max-w-2xl">
            <nav aria-label="Breadcrumb" className="flex">
              <Link
                to="/about"
                className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-laurel/80 hover:text-laurel"
              >
                <Flower2 className="h-4 w-4" /> About Magnolia Maids
                <span className="text-laurel/40">/</span>
                <span className="text-laurel">Careers</span>
              </Link>
            </nav>

            <div className="mt-3 flex">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/85 backdrop-blur ring-1 ring-primary/20 px-4 py-2 text-xs sm:text-sm font-bold text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                Now hiring across Durant &amp; Bryan County
              </span>
            </div>

            <h1 className="mt-5 font-display text-[2.5rem] sm:text-6xl lg:text-7xl font-semibold leading-[1.02] tracking-tight text-foreground text-balance">
              House cleaning jobs in{" "}
              <span className="relative inline-block text-laurel">
                Durant, OK
                <span className="absolute inset-x-0 -bottom-0.5 h-2.5 sm:h-3 bg-champagne/60 -z-0 rounded-full" aria-hidden />
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Join Magnolia Maids — a locally owned Durant cleaning company built on kindness,
              playlists, and eco-safe products. Steady daytime routes, supplies and uniforms
              provided, and founding crew spots open before we launch.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <a href="#apply" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-7 py-3.5 font-bold shadow-bloom hover:brightness-105 transition">
                Apply in 60 seconds <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#roles" className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-foreground px-7 py-3.5 font-bold ring-1 ring-border hover:bg-secondary transition">
                See open roles
              </a>
            </div>

            <ul className="mt-7 grid gap-2 sm:grid-cols-3 text-sm text-muted-foreground">
              <li className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 shrink-0 text-champagne fill-champagne" /> Founding crew, hiring now</li>
              <li className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> Insured · PTO · Tips are yours</li>
              <li className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0 text-accent" /> Bryan County routes only</li>
            </ul>
          </div>

          <div className="relative hidden md:block">
            <div className="relative mx-auto w-[78%] max-w-sm lg:max-w-md">
              <img loading="lazy" decoding="async" src={mascot} alt="Magnolia Maids magnolia bloom mark" className="w-full drop-shadow-2xl animate-bob" />
              <div className="absolute -left-6 top-4 rounded-2xl bg-white shadow-bloom px-4 py-3 rotate-[-6deg]">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tips</div>
                <div className="font-display text-xl font-semibold text-laurel">100% yours</div>
              </div>
              <div className="absolute -right-4 top-1/2 rounded-2xl bg-white shadow-bloom px-4 py-3 rotate-[5deg]">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Onboarding</div>
                <div className="font-display text-lg font-semibold text-foreground">1 full week</div>
              </div>
              <div className="absolute left-4 -bottom-3 rounded-2xl bg-white shadow-bloom px-4 py-3 rotate-[-3deg]">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {["bg-laurel","bg-accent","bg-champagne"].map((c,i)=>(
                      <div key={i} className={`h-6 w-6 rounded-full ring-2 ring-white ${c}`} />
                    ))}
                  </div>
                  <div className="text-xs font-semibold text-foreground">24 Durant locals<br /><span className="font-normal text-muted-foreground">and growing</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* petal divider */}
        <svg aria-hidden viewBox="0 0 1440 80" className="block w-full text-background">
          <path fill="currentColor" d="M0,32L60,42.7C120,53,240,75,360,69.3C480,64,600,32,720,26.7C840,21,960,43,1080,48C1200,53,1320,43,1380,37.3L1440,32L1440,80L0,80Z" />
        </svg>
      </section>

      <StatsBand />

      {/* PERKS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
        <div className="max-w-2xl">
          <div className="text-primary font-bold text-sm tracking-widest uppercase">Why Magnolia Maids</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">A job that treats you as well as we treat every home.</h2>
          <p className="mt-4 text-lg text-muted-foreground">We built Magnolia Maids to be the cleaning company we always wished existed for the people doing the work.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => (
            <div key={p.title} className="group relative rounded-3xl bg-card border border-border p-6 hover:shadow-bloom hover:-translate-y-1 transition">
              <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                <p.icon className="h-6 w-6" />
              </div>
              <div className="mt-4 font-display text-xl font-bold">{p.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pt-14 md:pt-24">
          <div className="max-w-2xl">
            <div className="text-primary font-bold text-sm tracking-widest uppercase">W-2, 1099, or founding crew</div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Pick the track that fits your life.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every role below can be worked as a W-2 employee or a 1099 independent contractor. Tell us which
              you prefer on the application — and ask about founding crew spots before our September 1, 2026 opening.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {WORK_TRACKS.map((t) => (
              <div key={t.id} className="rounded-3xl bg-card border border-border p-6 md:p-7 hover:shadow-bloom transition flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-display text-2xl font-semibold">{t.title}</div>
                  <span className="shrink-0 rounded-full bg-champagne/25 text-foreground text-[11px] font-bold px-2.5 py-1">{t.tag}</span>
                </div>
                <div className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold">
                  <DollarSign className="h-3 w-3" /> {t.pay}
                </div>
                <ul className="mt-4 space-y-2">
                  {t.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-foreground/85">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
                <a href="#apply" className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 font-bold text-foreground hover:bg-secondary/80 transition">
                  Apply on this track <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-primary font-bold text-sm tracking-widest uppercase">Open roles</div>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Find your fit.</h2>
              <p className="mt-4 text-lg text-muted-foreground">Three ways to join the pod. Same great crew, different schedules.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-border px-4 py-2 text-sm font-semibold text-muted-foreground">
              <MapPin className="h-4 w-4 text-accent" /> All roles are on-site in Bryan County
            </div>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {ROLES.map((r) => (
              <RoleCard key={r.id} role={r} />
            ))}
          </div>
        </div>
      </section>

      {/* DAY IN THE LIFE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
        <div className="max-w-2xl">
          <div className="text-primary font-bold text-sm tracking-widest uppercase">A day with the pod</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">This is what Tuesday looks like.</h2>
        </div>
        <div className="relative mt-12">
          <div aria-hidden className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" />
          <ul className="space-y-8">
            {DAY.map((d, i) => (
              <li key={d.time} className={`relative grid md:grid-cols-2 gap-4 md:gap-10 ${i % 2 ? "md:[&>*:first-child]:col-start-2" : ""}`}>
                <div className={`hidden md:block ${i % 2 ? "md:order-2" : ""}`} />
                <div className={`pl-16 md:pl-0 ${i % 2 ? "md:text-right md:pr-10" : "md:pl-10"}`}>
                  <div className="absolute left-0 md:left-1/2 top-0 md:-translate-x-1/2 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-bloom">
                    <d.icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-bold tracking-widest text-primary uppercase">{d.time}</div>
                  <div className="mt-1 font-display text-2xl font-semibold">{d.title}</div>
                  <p className="mt-1 text-muted-foreground">{d.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-laurel text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
          <div className="max-w-2xl">
            <div className="text-champagne font-bold text-sm tracking-widest uppercase">Our commitments</div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">What we promise our founding crew.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {COMMITMENTS.map((t) => (
              <figure key={t.name} className="rounded-3xl bg-white/10 backdrop-blur border border-white/15 p-7 hover:bg-white/15 transition">
                <Star className="h-5 w-5 fill-champagne text-champagne" />
                <p className="mt-4 text-lg font-display leading-snug">{t.quote}</p>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-champagne to-accent flex items-center justify-center font-bold text-laurel">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs text-white/70">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
        <div className="max-w-2xl">
          <div className="text-primary font-bold text-sm tracking-widest uppercase">How hiring works</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Four steps. About a week. No mystery.</h2>
        </div>
        <ol className="mt-12 grid gap-5 md:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="relative rounded-3xl bg-card border border-border p-6 hover:shadow-bloom transition">
              <div className="font-display text-5xl font-semibold text-laurel/15 leading-none">{s.n}</div>
              <div className="mt-3 font-display text-xl font-bold">{s.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-primary font-bold text-sm tracking-widest uppercase">Questions</div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Everything future teammates ask.</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQ.map((f, i) => (
              <FaqItem key={f.q} f={f} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* VEHICLE & MILEAGE FAQ */}
      <section id="vehicle-mileage" className="bg-ivory-wash border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-border px-3 py-1 text-sm font-bold text-foreground mb-4">
              <Car className="h-4 w-4 text-primary" /> Vehicle & Mileage
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">What to know about driving for Magnolia Maids.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Team Leads drive their own vehicle between homes and are reimbursed at the IRS rate. Crew members ride with the team. Here are the details.</p>
          </div>
          <div className="mt-10 space-y-3">
            {VEHICLE_FAQ.map((f) => (
              <FaqItem key={f.q} f={f} />
            ))}
          </div>
        </div>
      </section>

      {/* APPLY */}
      <section id="apply" className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 py-14 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-primary font-bold text-sm tracking-widest uppercase">Apply</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">Ready to make homes happy?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Tell us a little about you. No résumé needed — we'll take it from here.</p>
        </div>
        <div className="mt-10">
          <ApplyForm />
        </div>
      </section>

      <QuoteCallCTA
        heading="Not applying? Need a cleaning instead"
        body="Get an instant flat-rate quote, or call our Durant office."
      />
      <ShareButtons path="/about/careers" title={"Cleaning Jobs in Durant, OK | Magnolia Maids Careers"} description={"Join Magnolia Maids — great pay, real benefits, and Southern hospitality."} />
      <SiteFooter />
    </div>
  );
}

function StatsBand() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const openings = useCountUp(12, inView);
  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8 -mt-12 md:-mt-16 relative z-10">
      <div className="rounded-3xl bg-card border border-border shadow-bloom p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { v: `${openings}`, l: "Founding roles open" },
          { v: "W-2 or 1099", l: "You choose your track" },
          { v: "Insured", l: "From day one" },
          { v: "Sept 1", l: "Start date, 2026" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="font-display text-3xl md:text-4xl font-semibold text-laurel">{s.v}</div>
            <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoleCard({ role }: { role: typeof ROLES[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group rounded-3xl bg-card border border-border p-6 md:p-7 hover:shadow-bloom hover:-translate-y-1 transition flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="font-display text-2xl font-semibold">{role.title}</div>
        <span className="shrink-0 rounded-full bg-champagne/25 text-foreground text-[11px] font-bold px-2.5 py-1">{role.tag}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-semibold text-foreground/80"><Clock className="h-3 w-3" /> {role.type}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 font-semibold"><DollarSign className="h-3 w-3" /> {role.pay}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent-strong px-2.5 py-1 font-semibold"><MapPin className="h-3 w-3" /> {role.where}</span>
      </div>
      <p className="mt-4 text-muted-foreground leading-relaxed">{role.blurb}</p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary hover:text-laurel"
        aria-expanded={open}
      >
        {open ? "Hide" : "What you'll be doing"}
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {role.doing.map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm text-foreground/85">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {d}
            </li>
          ))}
        </ul>
      )}

      <a
        href={`#apply`}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 font-bold shadow-bloom hover:brightness-105 transition"
      >
        Apply for {role.title} <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}

function FaqItem({ f, defaultOpen }: { f: { q: string; a: string }; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-secondary/60 transition"
        aria-expanded={open}
      >
        <span className="font-display text-lg font-bold">{f.q}</span>
        <ChevronDown className={`h-5 w-5 text-primary transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-muted-foreground leading-relaxed">{f.a}</div>}
    </div>
  );
}

const ROLE_CHOICES = ["House Cleaner", "Team Lead", "Airbnb Turnover Specialist", "Not sure yet"];
const EMPLOYMENT_CHOICES = [
  { id: "W-2 Employee", desc: "Taxes, workers' comp, and PTO handled" },
  { id: "1099 Contractor", desc: "Set your own availability, per-job rate" },
  { id: "Founding Crew (either track)", desc: "Start before Sept 1, 2026 at founding rates" },
  { id: "Open to either", desc: "Help me pick what fits best" },
];
const AVAILABILITY = ["Weekday mornings", "Weekday afternoons", "Weekends", "Full-time", "Flexible"];

function ApplyForm() {
  const [role, setRole] = useState(ROLE_CHOICES[0]);
  const [employment, setEmployment] = useState(EMPLOYMENT_CHOICES[0].id);
  const [avail, setAvail] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const send = useServerFn(submitCareersApplication);
  const toggleAvail = (v: string) =>
    setAvail((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const disabled = useMemo(() => avail.length === 0, [avail]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSending(true);
    try {
      await send({
        data: {
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          area: String(fd.get("area") || ""),
          role,
          employmentType: employment,
          availability: avail.join(", "),
          experience: String(fd.get("exp") || ""),
          notes: String(fd.get("notes") || ""),
          smsConsent: fd.get("smsConsent") === "on",
        },
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't submit — please try again or email hello@bookme.bet.");
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl bg-card border border-border shadow-bloom p-8 md:p-12 text-center">
        <img loading="lazy" decoding="async" src={mascot} alt="" className="mx-auto w-24 animate-bob" />
        <h3 className="mt-4 font-display text-3xl font-semibold">Magnolia Maids got it! 🤍</h3>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Thanks for applying. Our hiring lead will reach out within 2 business days with next steps.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link to="/about" className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 font-bold text-foreground hover:bg-secondary/80 transition">
            Back to About
          </Link>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-border px-6 py-3 font-bold text-foreground hover:bg-secondary transition"
          >
            Apply for another role
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl bg-card border border-border shadow-bloom p-6 md:p-10 grid gap-6"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Full name" required>
          <input name="name" required placeholder="Yesenia Perez" className={inputCls} />
        </Field>
        <Field label="Phone" required>
          <input name="phone" type="tel" required placeholder="(580) 745-0045" className={inputCls} />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" required placeholder="you@email.com" className={inputCls} />
        </Field>
        <Field label="Neighborhood you live in" required>
          <input name="area" required placeholder="Westwood, Westwood, Calera…" className={inputCls} />
        </Field>
      </div>

      <Field label="Which role fits you best?">
        <div className="flex flex-wrap gap-2">
          {ROLE_CHOICES.map((r) => {
            const active = role === r;
            return (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold border transition ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-bloom"
                    : "bg-white text-foreground border-border hover:bg-secondary"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="W-2 employee or 1099 contractor?">
        <div className="grid gap-2 sm:grid-cols-2">
          {EMPLOYMENT_CHOICES.map((c) => {
            const active = employment === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => setEmployment(c.id)}
                aria-pressed={active}
                className={`text-left rounded-2xl border px-4 py-3 transition ${
                  active
                    ? "bg-primary/10 border-primary ring-1 ring-primary/30"
                    : "bg-white border-border hover:bg-secondary"
                }`}
              >
                <span className="block text-sm font-bold text-foreground">
                  {active ? "✓ " : ""}{c.id}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">{c.desc}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="When can you work? (pick any that apply)" required>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY.map((a) => {
            const active = avail.includes(a);
            return (
              <button
                type="button"
                key={a}
                onClick={() => toggleAvail(a)}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold border transition ${
                  active
                    ? "bg-laurel text-white border-primary"
                    : "bg-white text-foreground border-border hover:bg-secondary"
                }`}
                aria-pressed={active}
              >
                {active ? "✓ " : ""}{a}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Cleaning experience (optional)">
        <textarea name="exp" rows={3} placeholder="Homes, hotels, Airbnbs, or none — all welcome." className={`${inputCls} min-h-[96px]`} />
      </Field>

      <Field label="Anything you want us to know?">
        <textarea name="notes" rows={3} placeholder="Languages, favorite playlist, what you're looking for…" className={`${inputCls} min-h-[96px]`} />
      </Field>

      <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-4">
        <input
          type="checkbox"
          name="smsConsent"
          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring"
          aria-describedby="career-sms-consent-desc"
        />
        <span id="career-sms-consent-desc" className="text-sm text-muted-foreground">
          I agree to receive text messages from Magnolia Maids about my application and scheduling. Msg & data rates may apply. Reply STOP to opt out.
        </span>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted-foreground max-w-md">
          By applying you agree to be contacted by Magnolia Maids about this role. We never share your info.
        </p>
        <button
          type="submit"
          disabled={disabled || sending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-8 py-3.5 font-bold shadow-bloom hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Sending…" : "Send application"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="employmentType" value={employment} />
      <input type="hidden" name="availability" value={avail.join(", ")} />
    </form>
  );
}

const inputCls =
  "w-full rounded-2xl border border-border bg-white px-4 py-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-foreground">
        {label} {required && <span className="text-accent-strong">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}