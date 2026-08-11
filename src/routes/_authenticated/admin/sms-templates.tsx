import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, FieldGroup, inputClass } from "@/components/admin/ui";
import {
  bookingConfirmationSms,
  bookingAlertSms,
  appointmentReminderSms,
  crewEtaSms,
  crewArrivedSms,
  completionSms,
  quoteFollowUpSms,
  optOutConfirmationSms,
  optInWelcomeSms,
  helpSms,
  fallbackInboundSms,
} from "@/lib/sms/messages";

export const Route = createFileRoute("/_authenticated/admin/sms-templates")({
  head: () => ({
    meta: [
      { title: "Admin — SMS templates | Magnolia Maids" },
      {
        name: "description",
        content: "Preview every automated Magnolia Maids text message with sample variables.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SmsTemplatesPage,
});

type Sample = {
  name: string;
  phone: string;
  service: string;
  frequency: string;
  bedrooms: string;
  bathrooms: string;
  preferredDay: string;
  preferredTime: string;
  timeWindow: string;
  estimate: string;
  address: string;
  eta: string;
  reviewUrl: string;
  quoteUrl: string;
  id: string;
};

const DEFAULTS: Sample = {
  name: "Sarah Whitfield",
  phone: "(580) 555-0134",
  service: "Deep Clean",
  frequency: "Every 2 weeks",
  bedrooms: "3",
  bathrooms: "2",
  preferredDay: "2026-08-19",
  preferredTime: "Morning (8am-12pm)",
  timeWindow: "8:00 AM - 12:00 PM",
  estimate: "$249",
  address: "1420 Magnolia Ln, Durant, OK 74701",
  eta: "8:45-9:15 AM",
  reviewUrl: "https://g.page/r/magnolia-maids/review",
  quoteUrl: "https://magnoliamaids.pro/quote",
  id: "8f3c21ab-77de-4c1e-9a0b-1122aabbccdd",
};

const FIELDS: { key: keyof Sample; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "service", label: "Service" },
  { key: "frequency", label: "Frequency" },
  { key: "bedrooms", label: "Bedrooms" },
  { key: "bathrooms", label: "Bathrooms" },
  { key: "preferredDay", label: "Preferred day" },
  { key: "preferredTime", label: "Preferred time" },
  { key: "timeWindow", label: "Arrival window" },
  { key: "estimate", label: "Estimate" },
  { key: "address", label: "Address" },
  { key: "eta", label: "Crew ETA" },
  { key: "reviewUrl", label: "Review link" },
  { key: "quoteUrl", label: "Quote link" },
  { key: "id", label: "Record ID (ref #)" },
];

const SEGMENTS = (body: string) => {
  const gsm = !/[^\u0000-\u007F]/.test(body);
  const limit = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  return body.length <= limit ? 1 : Math.ceil(body.length / multi);
};

function SmsTemplatesPage() {
  const [s, setS] = useState<Sample>(DEFAULTS);
  const [copied, setCopied] = useState<string | null>(null);

  const templates = useMemo(() => {
    const booking = {
      id: s.id,
      name: s.name,
      service: s.service,
      frequency: s.frequency,
      bedrooms: s.bedrooms,
      bathrooms: s.bathrooms,
      preferredDay: s.preferredDay,
      preferredTime: s.preferredTime,
      estimate: s.estimate,
      address: s.address,
    };
    return [
      {
        key: "booking-confirmation",
        title: "Booking confirmation",
        audience: "Customer",
        trigger: "Immediately after a booking request is submitted",
        body: bookingConfirmationSms(booking),
      },
      {
        key: "booking-alert",
        title: "Dispatch alert",
        audience: "Internal",
        trigger: "Same time as the confirmation, sent to the office line",
        body: bookingAlertSms({ ...booking, phone: s.phone }),
      },
      {
        key: "appointment-reminder",
        title: "Appointment reminder",
        audience: "Customer",
        trigger: "Daily cron, 1 day before the scheduled clean",
        body: appointmentReminderSms({ ...booking, timeWindow: s.timeWindow }),
      },
      {
        key: "crew-eta",
        title: "Crew ETA",
        audience: "Customer",
        trigger: "Morning of the clean, once the route is set",
        body: crewEtaSms({ name: s.name, eta: s.eta }),
      },
      {
        key: "crew-arrived",
        title: "Crew arrived",
        audience: "Customer",
        trigger: "When the crew pulls up",
        body: crewArrivedSms({ name: s.name, eta: s.eta }),
      },
      {
        key: "completion",
        title: "Completion + review request",
        audience: "Customer",
        trigger: "After the job is marked complete",
        body: completionSms({ name: s.name, service: s.service, reviewUrl: s.reviewUrl }),
      },
      {
        key: "quote-follow-up",
        title: "Quote follow-up",
        audience: "Lead",
        trigger: "Lead requested a quote but hasn't finished it",
        body: quoteFollowUpSms({ name: s.name, quoteUrl: s.quoteUrl, estimate: s.estimate }),
      },
      {
        key: "stop",
        title: "STOP auto-reply",
        audience: "Compliance",
        trigger: "Inbound STOP / UNSUBSCRIBE",
        body: optOutConfirmationSms(),
      },
      {
        key: "start",
        title: "START auto-reply",
        audience: "Compliance",
        trigger: "Inbound START / YES / SUBSCRIBE",
        body: optInWelcomeSms(),
      },
      {
        key: "help",
        title: "HELP auto-reply",
        audience: "Compliance",
        trigger: "Inbound HELP / INFO",
        body: helpSms(),
      },
      {
        key: "fallback",
        title: "Unknown keyword fallback",
        audience: "Compliance",
        trigger: "Any other inbound text",
        body: fallbackInboundSms(),
      },
    ];
  }, [s]);

  async function copy(key: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="SMS templates"
        description="Every automated text rendered with sample variables, exactly as customers receive it."
        actions={
          <button
            type="button"
            onClick={() => setS(DEFAULTS)}
            className="tap-target rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
          >
            Reset sample data
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <SectionCard
          title="Sample variables"
          description="Edit any value to see the messages update live."
        >
          <div className="grid gap-3">
            {FIELDS.map((f) => (
              <FieldGroup key={f.key} label={f.label}>
                <input
                  className={inputClass}
                  value={s[f.key]}
                  onChange={(e) => setS((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </FieldGroup>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-5 sm:grid-cols-2">
          {templates.map((t) => {
            const segments = SEGMENTS(t.body);
            return (
              <section
                key={t.key}
                className="flex flex-col rounded-2xl border border-border/60 bg-card"
              >
                <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/60 px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-semibold">{t.title}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.trigger}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    {t.audience}
                  </span>
                </header>

                <div className="flex-1 px-5 py-5">
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <div className="max-w-[19rem] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-laurel/10 px-4 py-3 text-sm leading-relaxed">
                      {t.body}
                    </div>
                  </div>
                </div>

                <footer className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border/60 px-5 py-3">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {t.body.length} chars · {segments} segment{segments === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(t.key, t.body)}
                    className="tap-target rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                  >
                    {copied === t.key ? "Copied" : "Copy"}
                  </button>
                </footer>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}