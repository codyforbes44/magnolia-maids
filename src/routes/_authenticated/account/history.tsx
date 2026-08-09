import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBookings } from "@/lib/account.functions";
import { Card, StatusPill, fmtDate } from "@/components/account/AccountShell";
import { bathroomCount, bedroomCount, toQuoteSearch } from "@/lib/pricing";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/history")({
  head: () => ({ meta: [{ title: "Service history — Magnolia Maids" }, { name: "robots", content: "noindex" }] }),
  component: History,
});

const today = () => new Date().toISOString().slice(0, 10);

function History() {
  const bookingsFn = useServerFn(getMyBookings);
  const { data, isLoading } = useQuery({ queryKey: ["account", "bookings"], queryFn: () => bookingsFn({}) });
  const rows = (data?.bookings ?? [])
    .filter((b) => b.status === "cancelled" || b.status === "completed" || (b.preferred_day ?? "") < today())
    .sort((a, b) => (b.preferred_day ?? b.created_at).localeCompare(a.preferred_day ?? a.created_at));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Service history</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every clean we've done for you — rebook any of them in two taps.</p>
      </div>

      {isLoading ? (
        <Card>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">No past visits yet.</p>
          <Link
            to="/booking"
            className="mt-3 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom"
          >
            Book your first clean
          </Link>
        </Card>
      ) : (
        <ol className="space-y-4">
          {rows.map((b) => (
            <li key={b.id}>
              <Card>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold">{b.service}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fmtDate(b.preferred_day)} · {b.frequency}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {b.bedrooms} bed · {b.bathrooms} bath · {b.address}
                    </p>
                  </div>
                  <StatusPill status={b.status} />
                </div>
                <Link
                  to="/booking"
                  search={toQuoteSearch({
                    service: b.service as never,
                    frequency: b.frequency as never,
                    bedrooms: bedroomCount(b.bedrooms),
                    bathrooms: bathroomCount(b.bathrooms),
                  })}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-bloom"
                >
                  <RotateCcw className="h-4 w-4" /> Book this again
                </Link>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}