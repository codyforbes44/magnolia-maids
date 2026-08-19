import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useMemo } from "react";
import { getStripe } from "@/lib/stripe";

/**
 * Mounts Stripe's inline payment form. `fetchClientSecret` must be stable —
 * a new reference remounts the provider and Stripe throws.
 */
export function EmbeddedCheckoutPanel({
  fetchClientSecret,
  checkoutKey,
}: {
  fetchClientSecret: () => Promise<string>;
  checkoutKey: string;
}) {
  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);
  return (
    <div id="checkout" key={checkoutKey} className="rounded-2xl border border-border/60 bg-background p-2 shadow-sm">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}