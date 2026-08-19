import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment received | Magnolia Maids" },
      { name: "description", content: "Your Magnolia Maids payment is confirmed." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Payment received | Magnolia Maids" },
      { property: "og:description", content: "Your Magnolia Maids payment is confirmed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center md:px-6">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 font-display text-3xl text-laurel">
          {sessionId ? "Thank you — payment received" : "Nothing to confirm"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {sessionId
            ? "A receipt is on its way to your inbox. We'll see you at your next clean!"
            : "We couldn't find a payment to confirm. If you were paying an invoice, reopen the link we sent you."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/account"
            className="min-h-12 rounded-full bg-laurel px-6 py-3 font-semibold text-primary-foreground"
          >
            Go to my account
          </Link>
          <Link to="/" className="min-h-12 rounded-full border border-border px-6 py-3 font-semibold text-foreground">
            Back to home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}