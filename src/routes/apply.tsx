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
import { PLANIT } from "@/lib/partners";
import heroCareers from "@/assets/hero-careers.webp";
import mascot from "@/assets/magnolia-mark.webp";
import { ArrowRight, Check, Clock, MapPin, Gift } from "lucide-react";

const TITLE = "Apply to Magnolia Maids | One-Page Job Application";
const DESC =
  "One short application for every Magnolia Maids role in Durant, OK — house cleaner, team lead, Airbnb turnover, or our remote Operations Assistant. Two minutes, no résumé needed.";

export const Route = createFileRoute("/apply")({
  component: ApplyPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: `${SITE_URL}/apply` },
      { property: "og:image", content: `${SITE_URL}/og-magnolia-maids.jpg` },
      { name: "twitter:image", content: `${SITE_URL}/og-magnolia-maids.jpg` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/apply` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Careers", path: "/about/careers" },
            { name: "Apply", path: "/apply" },
          ]),
        ),
      },
    ],
  }),
});

const ROLE_OPTIONS = [
  "House Cleaner",
  "Team Lead",
  "Airbnb Turnover Specialist",
  "Operations Assistant (remote, part-time)",
  "Other / not sure",
] as const;

const OPS_ROLE = "Operations Assistant (remote, part-time)";
const OTHER_ROLE = "Other / not sure";

const EMPLOYMENT_TYPES = ["Part-time", "Full-time", "Open to either"] as const;

const AVAILABILITY = [
  "Weekday mornings",
  "Weekday afternoons",
  "Early mornings (before 8am)",
  "Evenings",
  "Weekends",
  "Flexible / varies",
];

const PERKS = [
  { icon: MapPin, text: "Durant, Bryan County & Lake Texoma homes — plus one fully remote office role" },
  { icon: Clock, text: "Mon–Fri 8:00 AM–5:00 PM CST scheduling window, built around your availability" },
  { icon: Check, text: "Supplies, uniforms, and insurance on us — no out-of-pocket costs" },
  { icon: Gift, text: `Free plan.It ${PLANIT.plan} household planner (${PLANIT.seats} seats) while you're on the team` },
];

function ApplyPage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="relative overflow-hidden">
          <HeroBackground src={heroCareers} />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-16 md:py-24">
            <Link
              to="/about/careers"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              ← See all open roles
            </Link>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/85 ring-1 ring-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
              One application · Every role
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-semibold max-w-3xl">
              Apply to Magnolia Maids
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-foreground/80">
              One short form for every position we hire — cleaning crews, team leads, Airbnb
              turnovers, and our work-from-home Operations Assistant. Not sure which fits? Pick
              "Other" and we'll help you land in the right spot.
            </p>
            <a
              href="#form"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-bold text-primary-foreground shadow-bloom hover:opacity-95 transition"
            >
              Start my application <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="bg-ivory-wash">
          <div className="mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-10 md:py-14 grid gap-4 sm:grid-cols-2">
            {PERKS.map((p) => (
              <div
                key={p.text}
                className="flex items-start gap-3 rounded-3xl bg-card border border-border p-5"
              >
                <p.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/85">{p.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="form" className="mx-auto max-w-3xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-center">
            Your application
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            About two minutes. No résumé required — we reply to every single one.
          </p>
          <div className="mt-8">
            <GeneralApplicationForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

const inputClass =
  "mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/40";

function GeneralApplicationForm() {
  const [role, setRole] = useState<string>(ROLE_OPTIONS[0]);
  const [otherRole, setOtherRole] = useState("");
  const [employmentType, setEmploymentType] = useState<string>("Open to either");
  const [avail, setAvail] = useState<string[]>([]);
  const [contactPref, setContactPref] = useState<ContactPref>("email");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const send = useServerFn(submitCareersApplication);

  const isOps = role === OPS_ROLE;
  const isOther = role === OTHER_ROLE;

  const toggle = (v: string) =>
    setAvail((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (avail.length === 0) {
      toast.error("Pick at least one availability window.");
      return;
    }
    const finalRole = isOther ? otherRole.trim() || "Open application" : role;
    const fd = new FormData(e.currentTarget);
    setSending(true);
    try {
      await send({
        data: {
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          area: String(fd.get("area") || ""),
          role: isOps ? "Operations Assistant" : finalRole,
          employmentType: isOps ? "Part-time · Work from home" : employmentType,
          availability: avail.join(", "),
          hoursPerWeek: String(fd.get("hours") || ""),
          tools: isOps ? String(fd.get("tools") || "") : "",
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
          A confirmation is already on its way to your inbox with exactly what happens next. Our
          hiring lead reads every application and replies within 1–2 business days.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Need to add something? Call or text{" "}
          <a className="font-semibold text-primary hover:underline" href="tel:+15807450045">
            (580) 745-0045
          </a>{" "}
          — Mon–Fri, 8:00 AM–5:00 PM CST.
        </p>
        <Link
          to="/about/careers"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 font-bold text-foreground hover:bg-secondary/80 transition"
        >
          Back to careers
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl bg-card border border-border shadow-bloom p-6 md:p-8 space-y-6"
    >
      <div>
        <label htmlFor="apply-role" className="text-sm font-semibold">
          Which role are you applying for?
        </label>
        <select
          id="apply-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={inputClass}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {isOther && (
          <input
            aria-label="Tell us the role you have in mind"
            value={otherRole}
            onChange={(e) => setOtherRole(e.target.value)}
            maxLength={80}
            placeholder="Tell us the kind of work you're after"
            className={inputClass}
          />
        )}
      </div>

      {!isOps && (
        <fieldset>
          <legend className="text-sm font-semibold">Employment type</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {EMPLOYMENT_TYPES.map((t) => {
              const on = employmentType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEmploymentType(t)}
                  aria-pressed={on}
                  className={`tap-target rounded-full px-4 py-2 text-sm font-semibold transition ${
                    on
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="apply-name" className="text-sm font-semibold">Full name</label>
          <input id="apply-name" name="name" required maxLength={120} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="apply-email" className="text-sm font-semibold">Email</label>
          <input id="apply-email" name="email" type="email" required maxLength={255} autoComplete="email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="apply-phone" className="text-sm font-semibold">Phone</label>
          <input id="apply-phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" className={inputClass} />
        </div>
        <div>
          <label htmlFor="apply-area" className="text-sm font-semibold">City / area you live in</label>
          <input id="apply-area" name="area" required maxLength={120} placeholder="Durant, OK" className={inputClass} />
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
                  on
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
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
          <label htmlFor="apply-hours" className="text-sm font-semibold">Hours per week you want</label>
          <input id="apply-hours" name="hours" maxLength={80} placeholder="e.g. 20–30" className={inputClass} />
        </div>
        {isOps && (
          <div>
            <label htmlFor="apply-tools" className="text-sm font-semibold">Tools you're comfortable with</label>
            <input id="apply-tools" name="tools" maxLength={300} placeholder="Google Workspace, Slack, CRM…" className={inputClass} />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="apply-exp" className="text-sm font-semibold">Relevant experience (optional)</label>
        <textarea id="apply-exp" name="exp" rows={3} maxLength={2000} className={inputClass} />
      </div>
      <div>
        <label htmlFor="apply-notes" className="text-sm font-semibold">Anything else we should know? (optional)</label>
        <textarea id="apply-notes" name="notes" rows={3} maxLength={2000} className={inputClass} />
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
        We'll email a confirmation right away and reply within 1–2 business days.
      </p>
    </form>
  );
}
