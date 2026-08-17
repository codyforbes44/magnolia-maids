import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Copy, Gift, Loader2, Mail, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import { FREQUENCY_RATES } from "@/lib/pricing";
import { PLANIT, planitClaimUrl } from "@/lib/partners";
import { getPlanitCode } from "@/lib/partners.functions";
import { requestPlanitCode } from "@/lib/planit-code.functions";
import { businessRef, SITE_URL } from "@/lib/structured-data";

const URL = `${SITE_URL}/planit-family`;
const TITLE = "Free plan.It Family for Magnolia Maids Clients | Durant, OK";
const DESCRIPTION =
  "Every Magnolia Maids client on a recurring cleaning plan gets plan.It Family free — a $10/month household planner with 5 seats. See eligibility and how to redeem your code.";

const FAQ = [
  {
    q: "Who is eligible?",
    a: "Any Magnolia Maids client on a recurring plan — weekly, biweekly, or monthly. Founding members who reserve before opening day qualify from their first visit.",
  },
  {
    q: "How long is it free?",
    a: "For as long as you stay on a recurring Magnolia Maids plan. Pause or cancel your cleaning plan and the plan.It perk ends with it — your plan.It data stays with your account.",
  },
  {
    q: "Do I need a card to redeem?",
    a: "No. The redemption code applies the Family plan at no cost. There is nothing to cancel later on our side.",
  },
  {
    q: "What about one-time cleans?",
    a: "One-time deep cleans, move-outs, and event cleans don't include the perk on their own. Switch to a recurring plan any time and we'll email your code.",
  },
  {
    q: "Is plan.It a Magnolia Maids product?",
    a: "No — plan.It is our partner. We cover the cost of your Family plan; plan.It supports the app itself and owns their own terms and privacy policy.",
  },
];

const STEPS = [
  { title: "Book a recurring cleaning", body: "Reserve a weekly, biweekly, or monthly plan at any price on our site — no card required." },
  { title: "Check your confirmation email", body: "Your booking or quote confirmation includes your plan.It redemption code and a claim button." },
  { title: "Create your plan.It account", body: "Open plan.It, enter the code at checkout, and the Family plan applies at $0." },
  { title: "Invite your household", body: "Add up to 5 seats for shared lists, appointments, bills, and per-person task assignments." },
];

export const Route = createFileRoute("/planit-family")({
  loader: async () => await getPlanitCode(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:image", content: `${SITE_URL}/og-magnolia-maids.jpg` },
      { name: "twitter:image", content: `${SITE_URL}/og-magnolia-maids.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${URL}#faq`,
          url: URL,
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${URL}#webpage`,
          url: URL,
          name: TITLE,
          description: DESCRIPTION,
          about: businessRef,
        }),
      },
    ],
  }),
  component: PlanitPerkPage,
});

function PlanitPerkPage() {
  const { code } = Route.useLoaderData();
  const recurring = FREQUENCY_RATES.filter((f) => f.discount > 0).map((f) => f.key);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-20 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
              <Gift className="h-3.5 w-3.5" /> Client perk · partner offer
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight text-balance">
              plan.It {PLANIT.plan}, free for Magnolia Maids clients
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              We keep your Durant home spotless. Our partner plan.It keeps the rest of it organized —{" "}
              {PLANIT.summary} It's ${PLANIT.monthly}/month on its own (${PLANIT.annualValue} a year), and
              $0 while you're on a recurring cleaning plan.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                to="/quote"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition"
              >
                Get my quote <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={PLANIT.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 font-bold hover:border-primary transition"
              >
                Visit plan.It
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <img src={PLANIT.logo} alt="plan.It logo" className="h-12 w-12 rounded-xl" width={48} height={48} />
              <div>
                <p className="font-display text-lg font-semibold">plan.It {PLANIT.plan}</p>
                <p className="text-sm text-muted-foreground">
                  <s>${PLANIT.monthly}/mo</s> · $0 for Magnolia clients
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {PLANIT.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground">{PLANIT.tagline}</p>
          </div>
        </div>
      </section>

      {/* CODE */}
      <section className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 py-12 md:py-16">
        <div className="rounded-[2rem] border border-laurel/40 bg-card p-6 sm:p-8 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-laurel" aria-hidden />
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold">Your redemption code</h2>
          <p className="mt-2 text-muted-foreground">
            Use this code at plan.It checkout. We also email it with every booking and quote confirmation.
          </p>
          <CodeBox code={code} />
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={planitClaimUrl(code)}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-laurel text-white px-6 py-3.5 font-bold shadow-bloom hover:brightness-110 transition"
            >
              Redeem on plan.It <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <EmailCodeForm />
          <p className="mt-4 text-xs text-muted-foreground">
            No card required. Codes are for active Magnolia Maids clients on a recurring plan.
          </p>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-20">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">Who gets it</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The perk comes with any recurring Magnolia Maids plan — {recurring.join(", ")} — in Durant,
            Bryan County, and around Lake Texoma.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { t: "Recurring clients", b: `${recurring.join(", ")} plans all qualify, from your very first visit.` },
              { t: "Founding members", b: "Reserve before opening day and the perk starts with your first cleaning." },
              { t: "Hosts and property managers", b: "Recurring turnover schedules qualify too — one Family workspace per account." },
            ].map((c) => (
              <li key={c.t} className="rounded-3xl border border-border bg-white p-6">
                <Check className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-semibold">{c.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW TO REDEEM */}
      <section className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-12 md:py-20">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold">How to redeem</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-3xl border border-border bg-white p-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-4xl px-4 sm:px-5 md:px-8 py-12 md:py-20">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-center">Perk questions</h2>
          <div className="mt-8 space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-3xl border border-border bg-white p-6">
                <h3 className="font-display text-lg font-semibold">{f.q}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-3xl border border-border bg-white p-6 text-center">
            <p className="font-display text-xl font-bold">Ready to claim it?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with a flat-rate quote — it takes about 60 seconds.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/quote"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition"
              >
                Get my quote <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={PHONE_HREF}
                className="tap-target inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 font-bold hover:border-primary transition"
              >
                Call {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function EmailCodeForm() {
  const send = useServerFn(requestPlanitCode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state === "sent") {
    return (
      <div className="mt-7 rounded-2xl border border-laurel/40 bg-ivory-wash p-5 text-left sm:text-center">
        <p className="font-display text-lg font-semibold flex items-center justify-center gap-2">
          <Check className="h-5 w-5 text-primary" aria-hidden /> Check your inbox
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We just emailed your redemption code and the four redemption steps to {email}.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-7 rounded-2xl border border-border bg-ivory-wash p-5 text-left"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setState("sending");
        try {
          await send({ data: { email: email.trim(), name: name.trim() } });
          setState("sent");
        } catch (err) {
          setState("idle");
          setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        }
      }}
    >
      <p className="font-semibold flex items-center gap-2">
        <Mail className="h-4 w-4 text-laurel" aria-hidden /> Email me the code and steps
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll send your redemption code plus the four steps to activate plan.It {PLANIT.plan}.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="planit-name" className="block text-xs font-semibold text-muted-foreground">
            First name (optional)
          </label>
          <input
            id="planit-name"
            name="name"
            autoComplete="given-name"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tap-target mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary"
            placeholder="Jamie"
          />
        </div>
        <div>
          <label htmlFor="planit-email" className="block text-xs font-semibold text-muted-foreground">
            Email address
          </label>
          <input
            id="planit-email"
            name="email"
            type="email"
            required
            maxLength={255}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tap-target mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-primary"
            placeholder="you@email.com"
          />
        </div>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={state === "sending"}
        className="tap-target mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-110 transition disabled:opacity-60"
      >
        {state === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" aria-hidden /> Email me the code
          </>
        )}
      </button>
      <p className="mt-3 text-xs text-muted-foreground">
        One email with your code. No spam, and you can reply any time to reach us.
      </p>
    </form>
  );
}

function CodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
      <span className="rounded-2xl border border-dashed border-laurel/60 bg-secondary/60 px-6 py-4 font-mono text-xl font-bold tracking-widest text-forest">
        {code}
      </span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
        className="tap-target inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-bold hover:border-primary transition"
      >
        {copied ? <Check className="h-4 w-4 text-laurel" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy code"}
      </button>
    </div>
  );
}
