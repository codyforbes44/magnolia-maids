import { createFileRoute, Link } from "@tanstack/react-router";
import maggieResting from "@/assets/maggie-resting.jpg";

const TITLE = "Magnolia Maids is resting | Durant, OK";
const DESC =
  "Sometimes you need to pause in order to do it right. Magnolia Maids is taking a short break to come back better than ever.";

export const Route = createFileRoute("/")({
  component: RestingPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "https://magnoliamaids.pro/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://magnoliamaids.pro/" }],
  }),
});

function RestingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-6 text-center">
        <span className="font-display text-2xl font-semibold text-foreground">Magnolia Maids</span>
      </header>

      <section className="flex-1 mx-auto w-full max-w-5xl px-6 pb-12 grid gap-10 md:grid-cols-2 items-center">
        <div className="overflow-hidden rounded-[2rem] border border-border shadow-bloom">
          <img
            src={maggieResting}
            alt="Maggie resting peacefully beside a white magnolia blossom"
            width={1024}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">A gentle pause</p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl font-semibold leading-[1.05] text-foreground">
            Maggie is taking a little rest.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Sometimes you need to pause in order to do it right. Magnolia Maids is taking a short break to come back
            better than ever.
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            Thank you to every Durant family who welcomed us into their home.
          </p>
          <p className="mt-8 text-sm text-muted-foreground">
            Current clients can reach us at{" "}
            <a href="mailto:hello@magnoliamaids.pro" className="font-semibold text-foreground underline underline-offset-4">
              hello@magnoliamaids.pro
            </a>
          </p>
        </div>
      </section>

      <footer className="px-6 py-6 flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Magnolia Maids · Durant, OK</span>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/sms-terms" className="hover:text-foreground">SMS Terms</Link>
        <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
      </footer>
    </main>
  );
}
