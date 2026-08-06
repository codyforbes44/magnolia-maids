import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqGroups } from "@/lib/faq";

/**
 * Shared tabbed FAQ accordion used by the homepage section and the /faq page
 * so both stay in sync with src/lib/faq.ts.
 */
export function FaqAccordion({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const [tab, setTab] = useState<string>(faqGroups[0].key);

  return (
    <div>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {faqGroups.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setTab(g.key)}
            aria-pressed={tab === g.key}
            className={`tap-target inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
              tab === g.key
                ? "bg-primary text-primary-foreground border-primary shadow-bloom"
                : "bg-white text-foreground border-border hover:border-primary/60"
            }`}
          >
            <g.icon className="h-4 w-4" aria-hidden="true" /> {g.label}
          </button>
        ))}
      </div>

      {faqGroups
        .filter((g) => g.key === tab)
        .map((g) => (
          <div key={g.key}>
            <p className="mt-6 text-center text-sm text-muted-foreground">{g.blurb}</p>
            <Accordion type="single" collapsible defaultValue={`${g.key}-0`} className="mt-4 space-y-3">
              {g.items.map((f, i) => (
                <AccordionItem
                  key={f.q}
                  value={`${g.key}-${i}`}
                  className="rounded-2xl bg-white border border-border px-5 border-b data-[state=open]:border-primary/60 transition"
                >
                  <AccordionTrigger
                    className="text-left font-display text-base sm:text-lg font-bold hover:no-underline"
                    headingLevel={headingLevel}
                  >
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
    </div>
  );
}
