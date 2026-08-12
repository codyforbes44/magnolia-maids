import { Mail, MessageSquare, Phone } from "lucide-react";
import { CONTACT_PREFS, CONTACT_PREF_HINTS, CONTACT_PREF_LABELS, type ContactPref } from "@/lib/contact-pref";

const ICONS = { email: Mail, text: MessageSquare, call: Phone } as const;

/** Three-way "how should we reach you?" selector used across every form. */
export function ContactPrefPicker({
  value,
  onChange,
  name,
  label = "How should we follow up?",
  className = "",
}: {
  value: ContactPref;
  onChange?: (v: ContactPref) => void;
  /** When set, also renders a hidden input so plain <form> submissions pick it up. */
  name?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {CONTACT_PREFS.map((pref) => {
          const Icon = ICONS[pref];
          const active = value === pref;
          return (
            <button
              key={pref}
              type="button"
              aria-pressed={active}
              onClick={() => onChange?.(pref)}
              className={`tap-target flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? "border-primary bg-primary/10 font-bold text-foreground shadow-sm"
                  : "border-input bg-background hover:border-primary/50"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block">{CONTACT_PREF_LABELS[pref]}</span>
                <span className="block text-xs font-normal text-muted-foreground">{CONTACT_PREF_HINTS[pref]}</span>
              </span>
            </button>
          );
        })}
      </div>
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}