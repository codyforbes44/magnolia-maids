import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Facebook,
  Hash,
  Home,
  Mail,
  Megaphone,
  MessageSquare,
  Mic,
  Phone,
  Activity,
  Users,
  Search,
  X,
  Smartphone,
  Monitor,
  Maximize2,
  Minimize2,
  type LucideIcon,
} from "lucide-react";
import { PhoneFrame, type HubLayout } from "@/components/hub/PhoneFrame";
import { HubHome } from "@/components/hub/HubHome";
import { HubThreads } from "@/components/hub/HubThreads";
import { HubPhone } from "@/components/hub/HubPhone";
import { HubMessenger } from "@/components/hub/HubMessenger";
import { HubSlack } from "@/components/hub/HubSlack";
import { HubCampaigns } from "@/components/hub/HubCampaigns";
import { HubDelivery } from "@/components/hub/HubDelivery";
import { HubSearch } from "@/components/hub/HubSearch";
import { HubPeople } from "@/components/hub/HubPeople";
import { getHubOverview } from "@/lib/hub/hub.functions";
import type { HubSearchResult } from "@/lib/hub/hub-types";
import { inputClass } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/hub")({
  head: () => ({
    meta: [
      { title: "Communications hub — Magnolia Maids admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HubPage,
});

type AppKey =
  | "home"
  | "people"
  | "phone"
  | "texts"
  | "chats"
  | "email"
  | "messenger"
  | "slack"
  | "campaigns"
  | "status";

const APPS: { key: AppKey; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "people", label: "People", icon: Users },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "texts", label: "Texts", icon: MessageSquare },
  { key: "chats", label: "Chats", icon: Mic },
  { key: "email", label: "Email", icon: Mail },
  { key: "messenger", label: "Messenger", icon: Facebook },
  { key: "slack", label: "Slack", icon: Hash },
  { key: "campaigns", label: "Ads", icon: Megaphone },
  { key: "status", label: "Status", icon: Activity },
];

function HubPage() {
  const overviewFn = useServerFn(getHubOverview);
  const [app, setApp] = useState<AppKey>("home");
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<HubLayout>("phone");
  const [wideAllowed, setWideAllowed] = useState(false);
  const [jump, setJump] = useState<{ app: AppKey; search: string; threadId: string | null } | null>(
    null,
  );

  // Layout preference is client-only (avoids hydration mismatch) and wide
  // modes are reserved for screens that can actually host two panes.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setWideAllowed(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const saved = window.localStorage.getItem("mm-hub-layout");
    if (saved === "desktop" || saved === "fullscreen" || saved === "phone") {
      setLayout(saved);
    }
    return () => mq.removeEventListener("change", sync);
  }, []);

  const chooseLayout = (next: HubLayout) => {
    setLayout(next);
    try {
      window.localStorage.setItem("mm-hub-layout", next);
    } catch {
      /* storage blocked — session-only preference */
    }
  };

  const effectiveLayout: HubLayout = wideAllowed ? layout : "phone";
  const wide = effectiveLayout !== "phone";

  useEffect(() => {
    if (effectiveLayout !== "fullscreen") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") chooseLayout("desktop");
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [effectiveLayout]);

  const openResult = (r: HubSearchResult) => {
    const target: AppKey =
      r.kind === "sms"
        ? "texts"
        : r.kind === "email"
          ? "email"
          : r.kind === "messenger"
            ? "messenger"
            : r.kind === "slack"
              ? "slack"
              : r.kind === "call"
                ? "phone"
                : "chats";
    setJump({ app: target, search: r.contactKey ?? "", threadId: r.threadId });
    setApp(target);
    setQuery("");
  };

  const overview = useQuery({
    queryKey: ["hub", "overview"],
    queryFn: () => overviewFn({}),
    refetchInterval: 60000,
  });

  const badges = overview.data?.unreadByChannel ?? {};
  const badgeFor = (key: AppKey) =>
    key === "texts"
      ? badges["sms"]
      : key === "messenger"
        ? badges["messenger"]
        : key === "phone"
          ? overview.data?.missedCalls
          : undefined;

  const searching = query.trim().length > 0;

  const title =
    searching
      ? "Search"
      : app === "home"
        ? "Magnolia Maids"
        : (APPS.find((a) => a.key === app)?.label ?? "Hub");

  const dock = (
    <div className="grid grid-cols-5 gap-1">
      {APPS.map((a) => {
        const count = badgeFor(a.key) ?? 0;
        const active = app === a.key;
        return (
          <button
            key={a.key}
            onClick={() => {
              setApp(a.key);
              setQuery("");
              setJump(null);
            }}
            aria-label={a.label}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[9px] font-semibold ${
              active ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            <a.icon className="h-4 w-4" />
            <span className="truncate">{a.label}</span>
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const sidebar = (
    <ul className="space-y-1">
      {APPS.map((a) => {
        const count = badgeFor(a.key) ?? 0;
        const active = app === a.key && !searching;
        return (
          <li key={a.key}>
            <button
              onClick={() => {
                setApp(a.key);
                setQuery("");
                setJump(null);
              }}
              aria-current={active ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                active ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <a.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">{a.label}</span>
              {count > 0 && (
                <span className="shrink-0 rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const layoutToggle = wideAllowed ? (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background p-1">
      {(
        [
          { key: "phone", label: "Phone", icon: Smartphone },
          { key: "desktop", label: "Desktop", icon: Monitor },
          { key: "fullscreen", label: "Full screen", icon: Maximize2 },
        ] as { key: HubLayout; label: string; icon: LucideIcon }[]
      ).map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => chooseLayout(m.key)}
          aria-pressed={layout === m.key}
          title={m.label}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
            layout === m.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <m.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  ) : null;

  const frame = (
    <PhoneFrame
      layout={effectiveLayout}
      sidebar={sidebar}
      accessory={
        effectiveLayout === "fullscreen" ? (
          <button
            type="button"
            onClick={() => chooseLayout("desktop")}
            aria-label="Exit full screen"
            className="shrink-0 rounded-full p-2 hover:bg-primary-foreground/15"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        ) : undefined
      }
      title={title}
      subtitle={
        app === "home"
          ? new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
          : undefined
      }
      onBack={
        searching
          ? () => setQuery("")
          : app === "home" || wide
            ? undefined
            : () => {
                setApp("home");
                setJump(null);
              }
      }
      dock={dock}
      toolbar={
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputClass} pl-9 pr-9`}
            placeholder="Search leads, calls, texts, chats, email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search everything in the hub"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      }
    >
      {searching && <HubSearch query={query} onOpen={openResult} />}
      {!searching && app === "home" &&
        (overview.data ? (
          <HubHome overview={overview.data} />
        ) : (
          <p className="p-6 text-sm text-muted-foreground">Loading your day…</p>
        ))}
      {!searching && app === "people" && <HubPeople wide={wide} />}
      {!searching && app === "phone" && <HubPhone calls={overview.data?.calls ?? []} />}
      {!searching && app === "texts" && (
        <HubThreads
          key={`texts-${jump?.app === "texts" ? jump.search : ""}`}
          channel="sms"
          canReply
          wide={wide}
          emptyHint="No text conversations yet."
          initialSearch={jump?.app === "texts" ? jump.search : undefined}
          autoOpenThreadId={jump?.app === "texts" ? jump.threadId : null}
        />
      )}
      {!searching && app === "chats" && (
        <HubThreads
          key={`chats-${jump?.app === "chats" ? jump.search : ""}`}
          channel="chat"
          wide={wide}
          emptyHint="Website chat and voice sessions land here."
          initialSearch={jump?.app === "chats" ? jump.search : undefined}
          autoOpenThreadId={jump?.app === "chats" ? jump.threadId : null}
        />
      )}
      {!searching && app === "email" && (
        <HubThreads
          key={`email-${jump?.app === "email" ? jump.search : ""}`}
          channel="email"
          wide={wide}
          emptyHint="Email conversations land here."
          initialSearch={jump?.app === "email" ? jump.search : undefined}
          autoOpenThreadId={jump?.app === "email" ? jump.threadId : null}
        />
      )}
      {!searching && app === "messenger" && <HubMessenger wide={wide} />}
      {!searching && app === "slack" && <HubSlack />}
      {!searching && app === "campaigns" && <HubCampaigns />}
      {!searching && app === "status" && <HubDelivery />}
    </PhoneFrame>
  );

  if (effectiveLayout === "fullscreen") {
    return <div className="fixed inset-0 z-50 flex flex-col bg-background">{frame}</div>;
  }

  return (
    <div className="py-4">
      <header
        className={`mx-auto mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 px-2 ${
          wide ? "max-w-[1400px]" : "max-w-[420px]"
        }`}
      >
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">Communications hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every call, text, chat, email, Messenger and Slack conversation in one place.
          </p>
        </div>
        {layoutToggle}
      </header>
      {frame}
    </div>
  );
}
