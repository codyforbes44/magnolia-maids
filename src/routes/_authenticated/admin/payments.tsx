import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { EmptyState, SectionCard, StatCard, StatusPill, inputClass } from "@/components/admin/ui";
import { formatMoney } from "@/lib/stripe";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({
    meta: [
      { title: "Admin — Payments | Magnolia Maids" },
      { name: "description", content: "Send invoice payment links and track customer plans." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPaymentsPage,
});

type PaymentLink = {
  id: string;
  token: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  description: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string | null;
  environment: string;
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  plan_label: string | null;
  price_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-100 text-amber-900 border border-amber-300",
  paid: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  failed: "bg-destructive/10 text-destructive border border-destructive/30",
  void: "bg-secondary text-muted-foreground border border-border",
  active: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  trialing: "bg-sky-100 text-sky-900 border border-sky-300",
  past_due: "bg-amber-100 text-amber-900 border border-amber-300",
  canceled: "bg-secondary text-muted-foreground border border-border",
};

function AdminPaymentsPage() {
  const [links, setLinks] = useState<PaymentLink[] | null>(null);
  const [plans, setPlans] = useState<SubscriptionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", description: "", amount: "" });

  async function load() {
    const [linkRes, planRes] = await Promise.all([
      supabase.from("payment_links").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    ]);
    if (linkRes.error) setError(linkRes.error.message);
    setLinks((linkRes.data as PaymentLink[]) ?? []);
    setPlans((planRes.data as SubscriptionRow[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const outstanding = useMemo(
    () => (links ?? []).filter((l) => l.status === "open").reduce((sum, l) => sum + l.amount_cents, 0),
    [links],
  );
  const collected = useMemo(
    () => (links ?? []).filter((l) => l.status === "paid").reduce((sum, l) => sum + l.amount_cents, 0),
    [links],
  );
  const activePlans = useMemo(
    () => (plans ?? []).filter((p) => ["active", "trialing", "past_due"].includes(p.status)).length,
    [plans],
  );

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dollars = Number(form.amount);
    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(dollars) || dollars < 1) {
      setError("Add a customer name, what the charge is for, and an amount of at least $1.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("payment_links").insert({
      customer_name: form.name.trim(),
      customer_email: form.email.trim() || null,
      customer_phone: form.phone.trim() || null,
      description: form.description.trim(),
      amount_cents: Math.round(dollars * 100),
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm({ name: "", email: "", phone: "", description: "", amount: "" });
    load();
  }

  async function setStatus(id: string, status: string) {
    await supabase.from("payment_links").update({ status }).eq("id", id);
    load();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/pay/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <AdminPageHeader
        title="Payments"
        description="Send an invoice link after a clean, and keep an eye on recurring plans."
      />

      {error && (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={formatMoney(outstanding)} hint="Unpaid invoice links" tone="warn" />
        <StatCard label="Collected" value={formatMoney(collected)} hint="Paid through links" tone="accent" />
        <StatCard label="Active plans" value={activePlans} hint="Recurring cleaning subscriptions" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <SectionCard title="New invoice link" description="Creates a link you can text or email to the customer.">
          <form onSubmit={createLink} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Customer name</span>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Email (optional)</span>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Phone (optional)</span>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">What it’s for</span>
              <input
                className={inputClass}
                placeholder="Deep clean — 3bd/2ba, Aug 20"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Amount (USD)</span>
              <input
                type="number"
                min="1"
                step="0.01"
                className={inputClass}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-laurel px-5 font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {saving ? "Creating…" : "Create link"}
            </button>
          </form>
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard title="Invoice links" description="Copy a link to send it, or void one that's no longer needed.">
            {links === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : links.length === 0 ? (
              <EmptyState title="No invoice links yet" hint="Create one on the left to collect a payment." />
            ) : (
              <ul className="grid gap-3">
                {links.map((link) => (
                  <li key={link.id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{link.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(link.created_at).toLocaleDateString()} · {link.environment === "live" ? "live" : "test"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl">{formatMoney(link.amount_cents, link.currency)}</p>
                        <StatusPill status={link.status} styles={STATUS_STYLES} />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => copyLink(link.token)}
                        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border px-3 text-sm font-semibold hover:bg-secondary"
                      >
                        <Copy className="h-4 w-4" /> {copied === link.token ? "Copied!" : "Copy link"}
                      </button>
                      <a
                        href={`/pay/${link.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border px-3 text-sm font-semibold hover:bg-secondary"
                      >
                        <Link2 className="h-4 w-4" /> Preview
                      </a>
                      {link.status === "open" && (
                        <button
                          onClick={() => setStatus(link.id, "void")}
                          className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-sm font-semibold text-muted-foreground hover:bg-secondary"
                        >
                          Void
                        </button>
                      )}
                      {link.status === "void" && (
                        <button
                          onClick={() => setStatus(link.id, "open")}
                          className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-sm font-semibold hover:bg-secondary"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Recurring plans" description="Subscriptions customers started from their account.">
            {plans === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : plans.length === 0 ? (
              <EmptyState
                title="No plans yet"
                hint="Customers can start a weekly, biweekly or monthly plan from Account → Plan."
              />
            ) : (
              <ul className="grid gap-3">
                {plans.map((plan) => (
                  <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{plan.plan_label ?? plan.price_id ?? "Cleaning plan"}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.current_period_end
                          ? `Renews ${new Date(plan.current_period_end).toLocaleDateString()}`
                          : "Renewal date pending"}
                        {plan.cancel_at_period_end ? " · cancels at period end" : ""}
                      </p>
                    </div>
                    <StatusPill status={plan.status} styles={STATUS_STYLES} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}