import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { submitCareersApplication } from "@/lib/careers.functions";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { useInViewOnce, useCountUp } from "@/hooks/useInViewOnce";
import mascot from "@/assets/magnolia-mark.png";
import {
  Sparkles, Sun, Heart, ShieldCheck, Waves, Clock, DollarSign,
  Calendar, GraduationCap, HandHeart, Bus, Coffee, Star, MapPin,
  ArrowRight, Check, ChevronDown, Users, PartyPopper, Leaf,
} from "lucide-react";

export const Route = createFileRoute("/about/careers")({
  component: CareersPage,
  head: () => ({
    meta: [
      { title: "Careers at Magnolia Maids — Join Miami's Friendliest Cleaning Crew" },
      { name: "description", content: "Now hiring house cleaners in Miami. Flexible hours, $18–$26/hr with tips, paid training, and a crew that feels like family. Apply in 60 seconds." },
      { property: "og:title", content: "Careers at Magnolia Maids — Clean with the pod" },
      { property: "og:description", content: "Join Magnolia Maids. Fair pay, flexible schedule, real teammates. Now hiring across Miami." },
      { property: "og:url", content: "/about/careers" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/about/careers" }],
  }),
});

const PERKS = [
  { icon: DollarSign, title: "$18–$26 / hr", desc: "Base pay plus 100% of tips — you keep every dollar." },
  { icon: Calendar, title: "Pick your days", desc: "Build a schedule around school, family, or a second gig." },
  { icon: GraduationCap, title: "Paid training", desc: "One paid week learning the Magnolia Maids Way — plus ongoing coaching." },
  { icon: HandHeart, title: "Real teammates", desc: "Work in 2-person pods. No solo grinds. We show up for each other." },
  { icon: Bus, title: "Transit stipend", desc: "$40/week toward gas, Metrorail, or rideshare between jobs." },
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
    pay: "$18–$22/hr + tips",
    where: "Miami-Dade",
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
    pay: "$22–$26/hr + bonuses",
    where: "Miami-Dade",
    blurb: "Run a pod of 2–3 cleaners, coach the newest teammates, and own the quality of every home you touch.",
    doing: [
      "Lead daily route with 2–3 teammates",
      "Train new hires through their first 30 days",
      "Own quality scores and 24-hour Sparkle Guarantee callbacks",
      "Report back on wins, blockers, and client love",
    ],
  },
  {
    id: "turnover",
    title: "Airbnb Turnover Specialist",
    tag: "Flexible",
    type: "Part-time · Weekends",
    pay: "$20–$24/hr + tips",
    where: "Brickell · Beach · Grove",
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
  { time: "7:30 AM", title: "Meet your pod", desc: "Coffee, playlist pick, and route walkthrough at the Little River HQ.", icon: Coffee },
  { time: "8:30 AM", title: "First splash", desc: "Roll out to home #1. Two teammates, one plan, one sparkling result.", icon: Sparkles },
  { time: "12:30 PM", title: "Lunch on us", desc: "Paid 30-minute lunch break — bring it or grab it, we've got a $12 stipend.", icon: HandHeart },
  { time: "4:00 PM", title: "Wrap & recap", desc: "Restock the van, log the visits, tag your favorite moment of the day.", icon: PartyPopper },
];

const STEPS = [
  { n: "01", title: "Apply in 60 seconds", desc: "A short form, no résumé needed. Tell us about you." },
  { n: "02", title: "Friendly phone chat", desc: "A 15-minute call with our hiring lead — we do all the questions, you ask us anything." },
  { n: "03", title: "Ride-along shift", desc: "Paid trial shift with a Team Lead. See the crew, feel the vibe." },
  { n: "04", title: "Welcome to the pod", desc: "Background check, paid training week, and your first solo route." },
];

const FAQ = [
  { q: "Do I need cleaning experience?", a: "Not required. If you take pride in details and treat people warmly, we'll teach you the rest during paid training." },
  { q: "Do I need a car?", a: "Nope. We provide the vans, supplies, and route. If you drive, we'll route you closer to home when possible." },
  { q: "Is this 1099 or W-2?", a: "W-2 employees only. Real jobs with taxes handled, PTO, and workers' comp — never 1099." },
  { q: "Do you sponsor work authorization?", a: "Applicants must have current US work authorization. We happily welcome bilingual teammates (English + Spanish or Creole)." },
  { q: "What are the hours like?", a: "Most shifts run 8am–4pm, Monday to Saturday. We build the schedule with you, not around you." },
  { q: "What's the vibe?", a: "Warm, low-drama, high-standards. Playlists on, phones down, teammates cheered on. We laugh a lot." },
];

const TESTIMONIALS = [
  { name: "Yesenia", role: "Team Lead, 2 years", quote: "First job that actually feels like a team. My pod is my people — and the tips are real." },
  { name: "Marco", role: "Cleaner, 8 months", quote: "Paid training changed the game. I walked in nervous and walked out proud of my work." },
  { name: "Karla", role: "Turnover Specialist, 1 year", quote: "Weekend-only schedule fits my kids. And Maya actually knows my name." },
];

function CareersPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-ivory-wash">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: "radial-gradient(circle at 15% 20%, oklch(0.85 0.12 200 / 0.55), transparent 45%), radial-gradient(circle at 85% 65%, oklch(0.88 0.16 90 / 0.35), transparent 40%)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-24 left-8 h-16 w-16 rounded-full bg-white/50 animate-float-slow" />
          <div className="absolute top-64 right-16 h-10 w-10 rounded-full bg-white/60 animate-float-slow" style={{ animationDelay: "1.2s" }} />
          <div className="absolute bottom-24 left-1/3 h-6 w-6 rounded-full bg-white/70 animate-float-slow" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 md:px-8 pt-14 md:pt-20 pb-24 md:pb-32 grid gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center">
          <div>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold text-laurel/80 hover:text-laurel"
            >
              <Waves className="h-4 w-4" /> About Magnolia Maids
              <span className="text-laurel/40">/</span>
              <span className="text-laurel">Careers</span>
            </Link>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 ring-1 ring-primary/20 px-4 py-2 text-sm font-bold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-coral" />
              </span>
              Now hiring across Miami · 12 open spots
            </div>
            <h1 className="mt-5 font-display text-5xl md:text-7xl font-extrabold leading-[0.95] text-foreground">
              Clean homes.
              <br />
              <span className="text-laurel">Great crew.</span>
              <br />
              <span className="relative inline-block">
                Fair pay.
                <span className="absolute inset-x-0 -bottom-1 h-3 bg-sunshine/60 -z-0 rounded-full" aria-hidden />
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Join Magnolia Maids — a locally owned Miami cleaning company built on kindness, playlists,
              and eco-safe products. Real W-2 jobs, real teammates, real growth.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#apply" className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-7 py-3.5 font-bold shadow-bloom hover:brightness-105 transition">
                Apply in 60 seconds <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#roles" className="inline-flex items-center gap-2 rounded-full bg-white text-foreground px-7 py-3.5 font-bold ring-1 ring-border hover:bg-secondary transition">
                See open roles
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-sunshine fill-sunshine" /> 4.9 crew Glassdoor score</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> W-2 · Insured · PTO</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-coral" /> Miami-Dade only</span>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto w-[86%] max-w-md">
              <img src={mascot} alt="Magnolia Maids the dolphin waving hello" className="w-full drop-shadow-2xl animate-bob" />
              {/* floating cards */}
              <div className="absolute -left-4 top-6 rounded-2xl bg-white shadow-bloom px-4 py-3 rotate-[-6deg]">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg. tips / week</div>
                <div className="font-display text-2xl font-extrabold text-laurel">$185</div>
              </div>
              <div className="absolute -right-2 top-40 rounded-2xl bg-white shadow-bloom px-4 py-3 rotate-[5deg]">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid training</div>
                <div className="font-display text-lg font-extrabold text-foreground">1 full week</div>
              </div>
              <div className="absolute left-6 -bottom-2 rounded-2xl bg-white shadow-bloom px-4 py-3 rotate-[-3deg]">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {["bg-laurel","bg-coral","bg-sunshine"].map((c,i)=>(
                      <div key={i} className={`h-6 w-6 rounded-full ring-2 ring-white ${c}`} />
                    ))}
                  </div>
                  <div className="text-xs font-semibold text-foreground">24 Miamians<br /><span className="font-normal text-muted-foreground">and growing</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* wave divider */}
        <svg aria-hidden viewBox="0 0 1440 80" className="block w-full text-background">
          <path fill="currentColor" d="M0,32L60,42.7C120,53,240,75,360,69.3C480,64,600,32,720,26.7C840,21,960,43,1080,48C1200,53,1320,43,1380,37.3L1440,32L1440,80L0,80Z" />
        </svg>
      </section>

      <StatsBand />

      {/* PERKS */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="text-primary font-bold text-sm tracking-widest uppercase">Why Magnolia Maids</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-extrabold">A job that treats you as well as we treat every home.</h2>
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
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-primary font-bold text-sm tracking-widest uppercase">Open roles</div>
              <h2 className="mt-3 font-display text-4xl md:text-5xl font-extrabold">Find your fit.</h2>
              <p className="mt-4 text-lg text-muted-foreground">Three ways to join the pod. Same great crew, different schedules.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-border px-4 py-2 text-sm font-semibold text-muted-foreground">
              <MapPin className="h-4 w-4 text-coral" /> All roles are on-site in Miami-Dade
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
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="text-primary font-bold text-sm tracking-widest uppercase">A day with the pod</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-extrabold">This is what Tuesday looks like.</h2>
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
                  <div className="mt-1 font-display text-2xl font-extrabold">{d.title}</div>
                  <p className="mt-1 text-muted-foreground">{d.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-laurel text-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="text-sunshine font-bold text-sm tracking-widest uppercase">In their words</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-extrabold">Teammates say it best.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-3xl bg-white/10 backdrop-blur border border-white/15 p-7 hover:bg-white/15 transition">
                <div className="flex gap-1 text-sunshine">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-sunshine" />
                  ))}
                </div>
                <blockquote className="mt-4 text-lg font-display italic leading-snug">"{t.quote}"</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sunshine to-coral flex items-center justify-center font-bold text-laurel">
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
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="text-primary font-bold text-sm tracking-widest uppercase">How hiring works</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-extrabold">Four steps. About a week. No mystery.</h2>
        </div>
        <ol className="mt-12 grid gap-5 md:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="relative rounded-3xl bg-card border border-border p-6 hover:shadow-bloom transition">
              <div className="font-display text-5xl font-extrabold text-laurel/15 leading-none">{s.n}</div>
              <div className="mt-3 font-display text-xl font-bold">{s.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-4xl px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-primary font-bold text-sm tracking-widest uppercase">Questions</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-extrabold">Everything future teammates ask.</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQ.map((f, i) => (
              <FaqItem key={f.q} f={f} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* APPLY */}
      <section id="apply" className="mx-auto max-w-4xl px-5 md:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-primary font-bold text-sm tracking-widest uppercase">Apply</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-extrabold">Ready to make homes happy?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Tell us a little about you. No résumé needed — we'll take it from here.</p>
        </div>
        <div className="mt-10">
          <ApplyForm />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function StatsBand() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const openings = useCountUp(12, inView);
  const tips = useCountUp(185, inView);
  const rating = useCountUp(49, inView);
  const crew = useCountUp(24, inView);
  return (
    <section ref={ref} className="mx-auto max-w-6xl px-5 md:px-8 -mt-12 md:-mt-16 relative z-10">
      <div className="rounded-3xl bg-card border border-border shadow-bloom p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { v: `${openings}`, l: "Open roles" },
          { v: `$${tips}`, l: "Avg tips / wk" },
          { v: `${(rating / 10).toFixed(1)}★`, l: "Crew rating" },
          { v: `${crew}`, l: "Teammates" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="font-display text-3xl md:text-4xl font-extrabold text-laurel">{s.v}</div>
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
        <div className="font-display text-2xl font-extrabold">{role.title}</div>
        <span className="shrink-0 rounded-full bg-sunshine/25 text-foreground text-[11px] font-bold px-2.5 py-1">{role.tag}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-semibold text-foreground/80"><Clock className="h-3 w-3" /> {role.type}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 font-semibold"><DollarSign className="h-3 w-3" /> {role.pay}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 text-coral px-2.5 py-1 font-semibold"><MapPin className="h-3 w-3" /> {role.where}</span>
      </div>
      <p className="mt-4 text-muted-foreground leading-relaxed">{role.blurb}</p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-laurel"
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
const AVAILABILITY = ["Weekday mornings", "Weekday afternoons", "Weekends", "Full-time", "Flexible"];

function ApplyForm() {
  const [role, setRole] = useState(ROLE_CHOICES[0]);
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
          availability: avail.join(", "),
          experience: String(fd.get("exp") || ""),
          notes: String(fd.get("notes") || ""),
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
        <img src={mascot} alt="" className="mx-auto w-24 animate-bob" />
        <h3 className="mt-4 font-display text-3xl font-extrabold">Magnolia Maids got it! 🐬</h3>
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
          <input name="phone" type="tel" required placeholder="(305) 555-0142" className={inputCls} />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" required placeholder="you@email.com" className={inputCls} />
        </Field>
        <Field label="Neighborhood you live in" required>
          <input name="area" required placeholder="Little River, Brickell, Hialeah…" className={inputCls} />
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
                className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
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

      <Field label="When can you work? (pick any that apply)" required>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY.map((a) => {
            const active = avail.includes(a);
            return (
              <button
                type="button"
                key={a}
                onClick={() => toggleAvail(a)}
                className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
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
        {label} {required && <span className="text-coral">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}