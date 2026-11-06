import { formatPrice, type VisitQuote } from "@/lib/pricing";

/** One reconciled itemization on every estimate surface. */
export function QuoteBreakdown({ quote }: { quote: VisitQuote }) {
  return (
    <dl
      className="mt-5 space-y-2 border-t border-current/15 pt-4 text-xs"
      aria-label="Price breakdown"
    >
      {quote.lineItems.map((item) => (
        <div key={item.key} className="flex items-start justify-between gap-4">
          <dt className="min-w-0">{item.label}</dt>
          <dd className="shrink-0 tabular-nums">
            {item.amount < 0 ? `−${formatPrice(-item.amount)}` : formatPrice(item.amount)}
          </dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-current/15 pt-2 font-bold">
        <dt>Total per visit</dt>
        <dd className="tabular-nums">{formatPrice(quote.total)}</dd>
      </div>
    </dl>
  );
}
