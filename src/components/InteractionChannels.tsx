import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Facebook,
  Hash,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Mic,
  Phone,
  type LucideIcon,
} from "lucide-react";

type Channel = {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { label: string; to?: string; href?: string };
  note?: string;
};

/** Every way a Magnolia Maids client can reach us — single source of copy. */
export const interactionChannels: Channel[] = [
  {
    icon: MessageSquare,
    title: "Pick how we contact you",
    body: "Choose email, text, or a phone call on any form — we follow up the way you asked, every time.",
    action: { label: "Get a quote", to: "/quote" },
  },
  {
    icon: Mic,
    title: "Maggie by chat or voice",
    body: "Type or talk to Maggie for pricing and answers, switch mid-conversation, and go full screen when you want fewer distractions.",
    note: "Tap the Maggie bubble in the corner to start.",
  },
  {
    icon: Phone,
    title: "Text or call us",
    body: "Message our Durant number for quotes, scheduling, and reminders. Reply STOP anytime to opt out.",
    action: { label: "Call (580) 745-0045", href: "tel:+15807450045" },
  },
  {
    icon: Facebook,
    title: "Facebook Messenger",
    body: "Message our page and Maggie answers there too — same pricing, same schedule, no repeating yourself.",
    action: { label: "Message us", href: "https://m.me/MagnoliaMaidsOK" },
  },
  {
    icon: Hash,
    title: "Slack",
    body: "Property managers, hosts, and partners can add Maggie to a Slack channel for turnovers and status updates.",
    action: { label: "Ask about Slack", href: "mailto:hello@magnoliamaids.pro?subject=Slack%20access" },
  },
  {
    icon: LayoutDashboard,
    title: "Your client dashboard",
    body: "See your next visit, request a reschedule, review service history, and keep entry, pet, and preference notes on file.",
    action: { label: "My account", to: "/account" },
  },
];

export function InteractionChannels({
  heading = "Reach us however you like",
  body = "Six ways to talk to Magnolia Maids — all connected, so nothing gets lost between them.",
  className = "",
}: {
  heading?: string;
  body?: string;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-5 md:px-8 py-14 md:py-24 ${className}`}>
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
          <MessagesSquare className="h-3.5 w-3.5" /> Client interaction
        </span>
        <h2 className="mt-4 font-display text-3xl sm:text-4xl font-semibold leading-tight">{heading}</h2>
        <p className="mt-3 text-muted-foreground text-base sm:text-lg">{body}</p>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {interactionChannels.map((c) => (
          <li key={c.title} className="rounded-3xl border border-border bg-white p-6">
            <c.icon className="h-6 w-6 text-primary" aria-hidden />
            <h3 className="mt-3 font-display text-lg font-semibold">{c.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>
            {c.action?.to && (
              <Link
                to={c.action.to}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4"
              >
                {c.action.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            {c.action?.href && (
              <a
                href={c.action.href}
                target={c.action.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4"
              >
                {c.action.label} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
            {c.note && <p className="mt-3 text-xs text-muted-foreground">{c.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
