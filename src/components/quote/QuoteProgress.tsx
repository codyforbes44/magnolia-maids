import { Check } from "lucide-react";

export const QUOTE_STEPS = ["Your clean", "Your home", "Send it"] as const;

export function QuoteProgress({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <nav aria-label="Quote progress" className="mt-4">
      <ol className="grid grid-cols-3 gap-2">
        {QUOTE_STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="min-w-0">
              <button
                type="button"
                onClick={() => i <= step && onJump(i)}
                disabled={i > step}
                aria-current={active ? "step" : undefined}
                className="w-full text-left disabled:cursor-default"
              >
                <span
                  className={`block h-1.5 rounded-full transition-colors ${
                    done || active ? "bg-primary" : "bg-border"
                  }`}
                />
                <span className="mt-2 flex min-w-0 items-center gap-1.5">
                  {done && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  <span
                    className={`truncate text-[11px] font-bold uppercase tracking-wider ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
