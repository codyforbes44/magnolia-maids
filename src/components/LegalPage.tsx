import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  toc,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  toc: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="bg-ivory-wash">
        <div className="mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-14 md:py-20">
          <p className="text-primary font-bold text-sm uppercase tracking-wider">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-semibold">{title}</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">{intro}</p>
          <p className="mt-3 text-xs text-muted-foreground">Last updated: {updated}</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 sm:px-5 md:px-8 py-12 grid gap-10 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-24 h-fit">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Contents</div>
            <ul className="text-sm">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="tap-target text-foreground/80 hover:text-primary">{t.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <article className="prose-legal space-y-8 text-[15px] leading-relaxed text-foreground/90">
          {children}
          <div className="mt-12 rounded-2xl bg-ivory-wash p-6 text-sm">
            Questions? Email{" "}
            <a href="mailto:hello@magnoliamaids.pro" className="text-primary font-bold underline">hello@magnoliamaids.pro</a>
            {" "}or visit our{" "}
            <Link to="/about" className="text-primary font-bold underline">About page</Link>.
          </div>
        </article>
      </section>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}