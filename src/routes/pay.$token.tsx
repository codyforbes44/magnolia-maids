import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { EmbeddedCheckoutPanel } from "@/components/payments/EmbeddedCheckoutPanel";
import { createInvoiceCheckout, getPaymentLink, type PublicPaymentLink } from "@/utils/payments.functions";
import { formatMoney, getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";

export const Route = createFileRoute("/pay/$token")({
  head: () => ({
    meta: [
      { title: "Pay your invoice | Magnolia Maids" },
      { name: "description", content: "Securely pay your Magnolia Maids cleaning invoice online." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Pay your invoice | Magnolia Maids" },
      { property: "og:description", content: "Securely pay your Magnolia Maids cleaning invoice online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PayInvoicePage,
});

function PayInvoicePage() {
  const { token } = Route.useParams();
  const loadLink = useServerFn(getPaymentLink);
  const startCheckout = useServerFn(createInvoiceCheckout);
  const [link, setLink] = useState<PublicPaymentLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await loadLink({ data: { token } });
      if (!active) return;
      if ("error" in result) setError(result.error);
      else setLink(result.link);
    })().catch(() => setError("We couldn't load that invoice."));
    return () => {
      active = false;
    };
  }, [token, loadLink]);

  const fetchClientSecret = useCallback(async () => {
    const result = await startCheckout({
      data: {
        token,
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Payments are temporarily unavailable. Please call the office.");
    return result.clientSecret;
  }, [token, startCheckout]);

  const paid = link?.status === "paid";

  return (
    <div className="flex min-h-dvh flex-col">
      <PaymentTestModeBanner />
      <SiteNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl text-laurel md:text-4xl">Pay your invoice</h1>

        {error && (
          <p className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {link && (
          <section className="mt-6 rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Prepared for</p>
            <p className="font-display text-xl text-foreground">{link.customerName}</p>
            <div className="mt-4 flex items-start justify-between gap-4 border-t border-border/60 pt-4">
              <span className="text-sm text-foreground/80">{link.description}</span>
              <span className="shrink-0 font-display text-2xl text-laurel">
                {formatMoney(link.amountCents, link.currency)}
              </span>
            </div>
          </section>
        )}

        {paid && (
          <p className="mt-6 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
            <CheckCircle2 className="h-5 w-5 text-primary" /> This invoice is paid in full — thank you!
          </p>
        )}

        {link && !paid && !paymentsConfigured() && (
          <p className="mt-6 rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
            Online payment isn’t available right now. Please call the office at (580) 745-0045 to settle up.
          </p>
        )}

        {link && !paid && paymentsConfigured() && (
          <div className="mt-6">
            {paying ? (
              <EmbeddedCheckoutPanel checkoutKey={token} fetchClientSecret={fetchClientSecret} />
            ) : (
              <button
                onClick={() => setPaying(true)}
                className="min-h-12 w-full rounded-full bg-laurel px-6 font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
              >
                Pay {formatMoney(link.amountCents, link.currency)}
              </button>
            )}
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Card details are handled securely by our payment processor.
            </p>
          </div>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Questions about this invoice?{" "}
          <Link to="/" className="font-semibold text-laurel underline">
            Contact the office
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}