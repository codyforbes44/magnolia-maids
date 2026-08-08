import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { submitCampaignLead } from "@/lib/campaign-leads.functions";
import { campaignLeadSchema } from "@/lib/campaign-lead-schema";
import type { CampaignContent } from "@/lib/campaigns";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/QuoteCallCTA";
import mascot from "@/assets/magnolia-mark.webp";
import { getAttribution } from "@/lib/attribution";
import { trackNextdoorEvent } from "@/components/NextdoorTracking";

const inputCls =
  "w-full rounded-2xl border border-border bg-white px-4 py-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

function Field({ label, htmlFor, required, children }: { label: string; htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-sm font-semibold text-foreground mb-1.5">
        {label} {required ? <span className="text-accent-strong">*</span> : <span className="text-muted-foreground font-normal">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

export function CampaignLeadForm({ campaign }: { campaign: CampaignContent }) {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const send = useServerFn(submitCampaignLead);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      campaign: campaign.key,
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      homeSize: String(fd.get("homeSize") || ""),
      preferredDate: String(fd.get("preferredDate") || ""),
      referralName: String(fd.get("referralName") || ""),
      message: String(fd.get("message") || ""),
    };

    const parsed = campaignLeadSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
      return;
    }

    setSending(true);
    try {
      await send({ data: { ...parsed.data, attribution: getAttribution() } });
      trackNextdoorEvent("LEAD");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error(`Couldn't send that — please call or text ${PHONE_DISPLAY}.`);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl bg-card border border-border shadow-bloom p-8 md:p-10 text-center">
        <img loading="lazy" decoding="async" src={mascot} alt="" className="mx-auto w-20 animate-bob" />
        <h3 className="mt-4 font-display text-2xl md:text-3xl font-semibold text-foreground">We've got it. 🤍</h3>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          A confirmation with your details is on its way to your inbox, and a real person in Durant will reply within one
          business hour.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            to="/booking"
            className="tap-target inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 font-bold hover:brightness-105 transition"
          >
            Book a date now <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={PHONE_HREF}
            className="tap-target inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-border px-6 py-3 font-bold text-foreground hover:bg-secondary transition"
          >
            <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl bg-card border border-border shadow-bloom p-6 md:p-8">
      <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground">{campaign.formHeading}</h3>
      <p className="mt-2 text-muted-foreground">{campaign.formSub}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="cl-name" required>
          <input id="cl-name" name="name" required autoComplete="name" maxLength={120} placeholder="Sarah Whitfield" className={inputCls} />
        </Field>
        <Field label="Email" htmlFor="cl-email" required>
          <input id="cl-email" name="email" type="email" required autoComplete="email" maxLength={255} placeholder="you@email.com" className={inputCls} />
        </Field>
        <Field label="Phone" htmlFor="cl-phone">
          <input id="cl-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="(580) 745-0045" className={inputCls} />
        </Field>
        <Field label="Home size" htmlFor="cl-home">
          <input id="cl-home" name="homeSize" maxLength={120} autoComplete="off" placeholder="3 bed / 2 bath in Durant" className={inputCls} />
        </Field>

        {campaign.extraField === "date" && (
          <Field label={campaign.key === "holiday-ready" ? "When guests arrive" : "First date you need us"} htmlFor="cl-date">
            <input id="cl-date" name="preferredDate" type="date" className={inputCls} />
          </Field>
        )}
        {campaign.extraField === "referral" && (
          <Field label="Neighbor you're referring" htmlFor="cl-ref">
            <input id="cl-ref" name="referralName" maxLength={120} autoComplete="off" placeholder="Their name" className={inputCls} />
          </Field>
        )}
      </div>

      <div className="mt-4">
        <Field label="Anything else we should know" htmlFor="cl-msg">
          <textarea id="cl-msg" name="message" rows={3} maxLength={2000} placeholder="Pets, gate codes, dates to avoid…" className={`${inputCls} min-h-[96px]`} />
        </Field>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="submit"
          disabled={sending}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-8 py-3.5 font-bold shadow-bloom hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Sending…" : campaign.primaryCta} <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-laurel" /> No spam, no obligation. Reply within one business hour.
        </p>
      </div>
    </form>
  );
}
