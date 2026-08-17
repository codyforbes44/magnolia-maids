import { ArrowRight, Check, Gift } from "lucide-react";
import { PLANIT, planitClaimUrl } from "@/lib/partners";

/**
 * Sitewide reference to the plan.It Family partner perk.
 * `variant="full"` renders the feature band; `variant="strip"` a one-liner.
 */
export function PartnerPerk({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "strip";
  className?: string;
}) {
  if (variant === "strip") {
    return (
      <div
        className={`rounded-3xl border border-border bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}
      >
        <img
          src={PLANIT.logo}
          alt="plan.It"
          loading="lazy"
          decoding="async"
          className="h-11 w-11 shrink-0 rounded-xl"
        />
        <p className="min-w-0 flex-1 text-sm sm:text-base text-muted-foreground">
          <span className="font-semibold text-foreground">
            Recurring plans include plan.It {PLANIT.plan} free.
          </span>{" "}
          A ${PLANIT.annualValue}/yr household planner — tasks, bills, appointments, and an assistant you
          can text, call, or email. {PLANIT.claim}
        </p>
        <a
          href={PLANIT.url}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-foreground hover:bg-secondary transition"
        >
          See plan.It <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-24 ${className}`}>
      <div className="overflow-hidden rounded-[2rem] border border-border bg-white">
        <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-2 md:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
              <Gift className="h-3.5 w-3.5" /> Client perk · partner offer
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-semibold leading-tight text-balance">
              Free plan.It {PLANIT.plan} with every recurring plan
            </h2>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg">
              We keep your home spotless — our partner plan.It keeps the rest of it organized.{" "}
              {PLANIT.summary} Normally ${PLANIT.monthly}/mo, yours free while you're on a recurring
              Magnolia Maids plan.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={planitClaimUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-bloom hover:brightness-105 transition"
              >
                Explore plan.It {PLANIT.plan} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {PLANIT.eligibility} {PLANIT.claim}
            </p>
          </div>

          <div className="rounded-3xl bg-ivory-wash p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <img
                src={PLANIT.logo}
                alt="plan.It logo"
                loading="lazy"
                decoding="async"
                className="h-12 w-12 rounded-xl"
              />
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
          </div>
        </div>
      </div>
    </section>
  );
}
