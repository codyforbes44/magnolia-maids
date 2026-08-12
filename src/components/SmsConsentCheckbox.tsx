import { Link } from "@tanstack/react-router";

type Props = {
  /** Controlled usage */
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
  /** Uncontrolled usage inside a native <form> */
  name?: string;
  id?: string;
  /** What the subscriber is signing up for */
  purpose?: "customer" | "applicant";
  className?: string;
};

/**
 * TCPA / A2P 10DLC compliant SMS opt-in.
 * Unchecked by default, never a condition of purchase, and includes the
 * required disclosures: brand, message types, frequency, rates, HELP/STOP,
 * and links to Privacy Policy + Messaging Terms.
 */
export function SmsConsentCheckbox({
  checked,
  onCheckedChange,
  name = "smsConsent",
  id = "sms-consent",
  purpose = "customer",
  className = "",
}: Props) {
  const descId = `${id}-desc`;
  const body =
    purpose === "applicant"
      ? "text messages from Magnolia Maids about my job application, interview scheduling, and hiring updates"
      : "text messages from Magnolia Maids about my quote, appointment confirmations, crew ETA, and reminders";

  return (
    <div className={`rounded-2xl border border-border/70 bg-secondary/30 p-4 ${className}`}>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          id={id}
          name={name}
          {...(checked === undefined
            ? {}
            : { checked, onChange: (e) => onCheckedChange?.(e.target.checked) })}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-ring"
          aria-describedby={descId}
        />
        <span className="text-sm text-foreground">
          <span className="font-semibold">Yes, text me.</span> By checking this box, I agree to receive {body} at
          the mobile number I provided, sent by an automated system. Consent is not a condition of purchase or
          employment.
        </span>
      </label>
      <p id={descId} className="mt-2 pl-7 text-xs text-muted-foreground">
        Message frequency varies (typically 2–6 messages per month, plus messages tied to a scheduled visit).
        Message and data rates may apply. Reply STOP to unsubscribe at any time, or HELP for help. See our{" "}
        <Link to="/sms-terms" className="font-semibold text-primary underline">Messaging Terms</Link> and{" "}
        <Link to="/privacy" className="font-semibold text-primary underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
