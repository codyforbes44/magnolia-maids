import { ShieldCheck, Sparkles } from "lucide-react";
import { AnimatedPrice } from "./QuotePrice";

export type SummaryProps = {
  total: number;
  savings: number;
  line: string;
  addons: string[];
};

/** Sticky desktop rail. */
export function QuoteSummaryCard({ total, savings, line, addons }: SummaryProps) {
  return (
    <aside className="lg:sticky lg:top-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your flat rate</div>
        <div className="mt-1 font-display text-5xl font-bold text-foreground">
          <AnimatedPrice total={total} />
        </div>
        <p className="mt-1 min-w-0 text-sm text-muted-foreground">{line}</p>
        {savings > 0 && (
          <p className="mt-2 text-sm font-semibold text-laurel">You save ${savings} per visit</p>
        )}
        {addons.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">Includes {addons.join(", ")}</p>
        )}
        <ul className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Insured, background-checked cleaners
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Flat rate — no payment today, nothing booked yet
          </li>
        </ul>
      </div>
    </aside>
  );
}

/** Mobile sticky action bar, safe-area aware. */
export function StickyQuoteBar({
  total,
  line,
  actionLabel,
  onAction,
  disabled,
}: {
  total: number;
  line: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <div
        className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="min-w-0">
          <div className="font-display text-2xl font-bold leading-none">
            <AnimatedPrice total={total} />
          </div>
          <div className="truncate text-[11px] text-muted-foreground">{line}</div>
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="tap-target shrink-0 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground shadow-bloom transition hover:brightness-105 disabled:opacity-60"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
