import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { submitCareersApplication } from "@/lib/careers.functions";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SmsConsentCheckbox } from "@/components/SmsConsentCheckbox";
import { ContactPrefPicker } from "@/components/ContactPrefPicker";
import { normalizeContactPref, type ContactPref } from "@/lib/contact-pref";
import { breadcrumbSchema, SITE_URL } from "@/lib/structured-data";
import { HeroBackground } from "@/components/HeroBackground";
import heroCareers from "@/assets/hero-careers.webp";
import mascot from "@/assets/magnolia-mark.webp";
import { ArrowRight, Check, Clock, Laptop, MessageSquare, CalendarDays, Home } from "lucide-react";

const ROLE = "Operations Assistant";
const TITLE = "Part-Time Operations Assistant (Work From Home) | Magnolia Maids";
const DESC =
  "Magnolia Maids is hiring a part-time, work-from-home Operations Assistant in Durant, OK. Scheduling, client texts and email, 15–20 hours a week on Central time. Apply in two minutes.";

export const Route = createFileRoute("/about/careers/operations-assistant")({
  component: OpsAssistantPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: `${SITE_URL}/about/careers/operations-assistant` },
      { property: "og:image", content: `${SITE_URL}/og-magnolia-maids.jpg` },
      { name: "twitter:image", content: `${SITE_URL}/og-magnolia-maids.jpg` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/about/careers/operations-assistant` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About Magnolia Maids", path: "/about" },
            { name: "Careers", path: "/about/careers" },
            { name: "Operations Assistant", path: "/about/careers/operations-assistant" },
          ]),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: "Part-Time Operations Assistant (Remote)",
          description: DESC,
          employmentType: "PART_TIME",
          datePosted: "2026-08-01",
          validThrough: "2026-12-31",
          directApply: true,
          jobLocationType: "TELECOMMUTE",
          hiringOrganization: {
            "@type": "Organization",
            name: "Magnolia Maids",
            sameAs: `${SITE_URL}/`,
            logo: `${SITE_URL}/og-magnolia-maids.jpg`,
          },
          applicantLocationRequirements: { "@type": "Country", name: "USA" },
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Durant",
              addressRegion: "OK",
              addressCountry: "US",
            },
          },
        }),
      },
    ],
  }),
});

const DUTIES = [
  { icon: CalendarDays, title: "Build the daily schedule", desc: "Slot new cleans, shuffle reschedules, and keep every crew's route tidy." },
  { icon: MessageSquare, title: "Answer clients kindly", desc: "Texts, emails, and voicemails — warm, quick, and always in our brand voice." },
  { icon: Laptop, title: "Keep records clean", desc: "Update leads, bookings, and applicant notes in our dashboard so nothing slips." },
  { icon: Clock, title: "Run the morning check", desc: "Confirm the day's jobs, flag anything odd, and hand off a clean summary." },
];

const FACTS = [
  "Part-time, 15–20 hours a week",
  "Fully remote — work from home on Central time",
  "Weekday mornings, Mon–Fri 8:00 AM–5:00 PM CST window",
  "Hourly pay, discussed on the intro call",
  "Paid working session before any offer",
  "plan.It Family plan free while you're on the team",
];

const AVAILABILITY = [
  "Weekday mornings",
  "Weekday afternoons",
  "Early mornings (before 8am)",
  "Evenings",
  "Flexible / varies",
];

function OpsAssistantPage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="relative overflow-hidden">
          <HeroBackground src={heroCareers} />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-28">
            <Link to="/about/careers" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              ← All open roles
            </Link>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/85 ring-1 ring-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Home className="h-3.5 w-3.5" /> Work from home · Part-time
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-semibold max-w-3xl">
              Operations Assistant
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-foreground/80">
              You're the calm behind the scenes: scheduling cleans, answering clients, and making sure
              every Magnolia Maids crew knows exactly where to be. About 15–20 hours a week, from your
              own desk, on Central time.
            </p>
            <a
              href="#apply"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-bold text-primary-foreground shadow-bloom hover:opacity-95 transition"
            >
              Apply in two minutes <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="bg-ivory-wash">
          <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-24 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold">What you'll do</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {DUTIES.map((d) => (
                  <div key={d.title} className="rounded-3xl bg-card border border-border p-6">
                    <d.icon className="h-6 w-6 text-primary" />
                    <div className="mt-3 font-display text-xl font-semibold">{d.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <aside className="rounded-3xl bg-card border border-border p-6 md:p-8 h-fit">
              <div className="font-display text-2xl font-semibold">The details</div>
              <ul className="mt-4 space-y-3">
                {FACTS.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-muted-foreground">
                You'll need reliable internet, a laptop, and a quiet space for calls.
              </p>
            </aside>
          </div>
        </section>

        <section id="apply" className="mx-auto max-w-3xl px-4 sm:px-5 md:px-8 py-14 md:py-24">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-center">Apply now</h2>
          <p className="mt-3 text-center text-muted-foreground">
            Two minutes, no résumé required. We reply to every application.
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Looking at a different role?{" "}
            <Link to="/apply" className="font-semibold text-primary hover:underline">
              Use our general application
            </Link>
            .
          </p>
          <div className="mt-8">
            <OpsApplicationForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

const inputClass =
  "mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/40";

function OpsApplicationForm() {
  const [avail, setAvail] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactPref, setContactPref] = useState<ContactPref>("email");
  const send = useServerFn(submitCareersApplication);

  const toggle = (v: string) =>
    setAvail((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (avail.length === 0) {
      toast.error("Pick at least one availability window.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    setSending(true);
    try {
      await send({
        data: {
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          area: String(fd.get("area") || ""),
          role: ROLE,
          employmentType: "Part-time · Work from home",
          availability: avail.join(", "),
          hoursPerWeek: String(fd.get("hours") || ""),
          tools: String(fd.get("tools") || ""),
          experience: String(fd.get("exp") || ""),
          notes: String(fd.get("notes") || ""),
          smsConsent: fd.get("smsConsent") === "on",
          contactPref: normalizeContactPref(fd.get("contactPref")),
        },
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't submit — please try again or email hello@magnoliamaids.pro.");
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl bg-card border border-border shadow-bloom p-8 md:p-12 text-center">
        <img loading="lazy" decoding="async" src={mascot} alt="" className="mx-auto w-24 animate-bob" />
        <h3 className="mt-4 font-display text-3xl font-semibold">Application received 🤍</h3>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          We just emailed you a confirmation with exactly what happens next. Our hiring lead reviews
          every application within 1–2 business days.
        </p>
        <Link
          to="/about/careers"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 font-bold text-foreground hover:bg-secondary/80 transition"
        >
          See other open roles
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl bg-card border border-border shadow-bloom p-6 md:p-8 space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ops-name" className="text-sm font-semibold">Full name</label>
          <input id="ops-name" name="name" required maxLength={120} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="ops-email" className="text-sm font-semibold">Email</label>
          <input id="ops-email" name="email" type="email" required maxLength={255} autoComplete="email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="ops-phone" className="text-sm font-semibold">Phone</label>
          <input id="ops-phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" className={inputClass} />
        </div>
        <div>
          <label htmlFor="ops-area" className="text-sm font-semibold">Where you're based</label>
          <input id="ops-area" name="area" required maxLength={120} placeholder="City, state" className={inputClass} />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">When can you work?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVAILABILITY.map((a) => {
            const on = avail.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggle(a)}
                aria-pressed={on}
                className={`tap-target rounded-full px-4 py-2 text-sm font-semibold transition ${
                  on ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ops-hours" className="text-sm font-semibold">Hours per week you want</label>
          <input id="ops-hours" name="hours" maxLength={80} placeholder="e.g. 15–20" className={inputClass} />
        </div>
        <div>
          <label htmlFor="ops-tools" className="text-sm font-semibold">Tools you're comfortable with</label>
          <input id="ops-tools" name="tools" maxLength={300} placeholder="Google Workspace, Slack, CRM…" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="ops-exp" className="text-sm font-semibold">Relevant experience (optional)</label>
        <textarea id="ops-exp" name="exp" rows={3} maxLength={2000} className={inputClass} />
      </div>
      <div>
        <label htmlFor="ops-notes" className="text-sm font-semibold">Anything else we should know? (optional)</label>
        <textarea id="ops-notes" name="notes" rows={3} maxLength={2000} className={inputClass} />
      </div>

      <ContactPrefPicker value={contactPref} onChange={setContactPref} />
      <SmsConsentCheckbox />

      <button
        type="submit"
        disabled={sending}
        className="tap-target w-full rounded-full bg-primary px-7 py-4 font-bold text-primary-foreground shadow-bloom hover:opacity-95 transition disabled:opacity-60"
      >
        {sending ? "Sending…" : "Submit application"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        We'll email you a confirmation right away and reply within 1–2 business days.
      </p>
    </form>
  );
}
