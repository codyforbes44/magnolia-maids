const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Payments aren’t live yet. Finish the go-live steps in the Payments tab to accept real cards.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-accent/40 bg-accent/15 px-4 py-2 text-center text-sm text-accent-strong">
        Test mode — no real money moves. Use card 4242 4242 4242 4242 with any future expiry and CVC.
      </div>
    );
  }
  return null;
}