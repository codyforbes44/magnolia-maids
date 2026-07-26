import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import mascot from "@/assets/splash-mascot.png";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitBooking } from "@/lib/bookings.functions";

export const Route = createFileRoute("/booking")({
  component: BookingPage,
  head: () => ({
    meta: [
      { title: "Book a Cleaning — Maid 4 Miami" },
      { name: "description", content: "Book a Miami house cleaning in under two minutes. Flexible times, transparent pricing." },
      { property: "og:title", content: "Book a Cleaning — Maid 4 Miami" },
      { property: "og:description", content: "Splash and the crew are ready when you are." },
      { property: "og:url", content: "/booking" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/booking" }],
  }),
});

function BookingPage() {
  const submit = useServerFn(submitBooking);
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("loading");
    const fd = new FormData(e.currentTarget);
    try {
      await submit({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          address: String(fd.get("address") ?? ""),
          bedrooms: String(fd.get("beds") ?? ""),
          bathrooms: String(fd.get("baths") ?? ""),
          service: String(fd.get("service") ?? ""),
          frequency: String(fd.get("freq") ?? ""),
          preferredDay: String(fd.get("preferredDay") ?? ""),
          preferredTime: String(fd.get("preferredTime") ?? ""),
          notes: String(fd.get("notes") ?? ""),
        },
      });
      setState("sent");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14 md:py-20 grid md:grid-cols-[1.2fr_1fr] gap-10 items-start">
        <div>
          <p className="text-primary font-bold text-sm uppercase tracking-wider">Book</p>
          <h1 className="mt-2 font-display text-5xl md:text-6xl font-extrabold leading-[1.05]">
            Tell Splash about<br />your home.
          </h1>
          <p className="mt-5 text-muted-foreground text-lg max-w-md">
            It takes about 60 seconds. We'll follow up within the hour with a firm quote and available times.
          </p>
          {state === "sent" ? (
            <div className="mt-10 rounded-3xl bg-secondary border border-border p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 font-display text-2xl font-bold">Splash got it! 🐬</h2>
              <p className="mt-2 text-muted-foreground">We'll reach out shortly. Keep an eye on your inbox.</p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-10 rounded-3xl bg-card border border-border p-6 md:p-8 grid gap-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name" name="name" placeholder="Isabela Rivera" required />
                <Field label="Email" name="email" type="email" placeholder="you@miami.com" required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Phone" name="phone" type="tel" placeholder="(305) 555-0142" />
                <Field label="Home address" name="address" placeholder="123 Ocean Dr, Miami, FL" required />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Select label="Bedrooms" name="beds" options={["Studio","1","2","3","4","5+"]} />
                <Select label="Bathrooms" name="baths" options={["1","1.5","2","3","4+"]} />
                <Select label="Frequency" name="freq" options={["One-time","Weekly","Biweekly","Monthly"]} />
              </div>
              <Select label="Service" name="service" options={["Standard Clean","Deep Clean","Move In / Out","Post-Party","Not sure — help me pick"]} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Preferred day" name="preferredDay" type="date" />
                <Select label="Preferred time" name="preferredTime" options={["Morning (8am–12pm)","Afternoon (12pm–4pm)","Evening (4pm–7pm)","Flexible"]} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-bold">Anything else?</label>
                <textarea name="notes" rows={3} placeholder="Pets, preferred day, tricky spots..." className="rounded-2xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {error && (
                <p className="text-sm text-destructive font-semibold">{error}</p>
              )}
              <button
                type="submit"
                disabled={state === "loading"}
                className="mt-2 inline-flex justify-center items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3.5 font-bold shadow-splash hover:brightness-105 transition disabled:opacity-70"
              >
                {state === "loading" ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : "Send it to Splash"}
              </button>
            </form>
          )}
        </div>
        <aside className="rounded-3xl bg-ocean text-white p-8 md:sticky md:top-24">
          <img src={mascot} alt="Splash" className="w-40 mx-auto animate-bob" />
          <h3 className="mt-4 font-display text-2xl font-extrabold text-center">Why folks pick us</h3>
          <ul className="mt-4 space-y-3 text-white/90 text-sm">
            {["Vetted, insured local crew","Transparent flat-rate pricing","Eco-friendly options","Reschedule anytime, no fees","Happiness guarantee — we come back free"].map((f) => (
              <li key={f} className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-sunshine shrink-0" />{f}</li>
            ))}
          </ul>
        </aside>
      </section>
      <SiteFooter />
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, required }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={name} className="text-sm font-bold">{label}</label>
      <input id={name} name={name} type={type} placeholder={placeholder} required={required} className="rounded-2xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={name} className="text-sm font-bold">{label}</label>
      <select id={name} name={name} className="rounded-2xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}