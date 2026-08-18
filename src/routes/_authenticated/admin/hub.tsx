import { useState } from "react";
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
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { PhoneFrame } from "@/components/hub/PhoneFrame";
import { HubHome } from "@/components/hub/HubHome";
import { HubThreads } from "@/components/hub/HubThreads";
import { HubPhone } from "@/components/hub/HubPhone";
import { HubMessenger } from "@/components/hub/HubMessenger";
import { HubSlack } from "@/components/hub/HubSlack";
import { HubCampaigns } from "@/components/hub/HubCampaigns";
import { HubSearch } from "@/components/hub/HubSearch";
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

type AppKey = "home" | "phone" | "texts" | "chats" | "email" | "messenger" | "slack" | "campaigns";

const APPS: { key: AppKey; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "texts", label: "Texts", icon: MessageSquare },
  { key: "chats", label: "Chats", icon: Mic },
  { key: "email", label: "Email", icon: Mail },
  { key: "messenger", label: "Messenger", icon: Facebook },
  { key: "slack", label: "Slack", icon: Hash },
  { key: "campaigns", label: "Ads", icon: Megaphone },
];

function HubPage() {
  const overviewFn = useServerFn(getHubOverview);
  const [app, setApp] = useState<AppKey>("home");
  const [query, setQuery] = useState("");
  const [jump, setJump] = useState<{ app: AppKey; search: string; threadId: string | null } | null>(
    null,
  );

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
    <div className="grid grid-cols-8 gap-1">
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

  return (
    <div className="py-4">
      <header className="mx-auto mb-5 max-w-[420px] px-2">
        <h1 className="font-display text-2xl font-semibold">Communications hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every call, text, chat, email, Messenger and Slack conversation in one place.
        </p>
      </header>

      <PhoneFrame
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
            : app === "home"
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
        {!searching && app === "phone" && <HubPhone calls={overview.data?.calls ?? []} />}
        {!searching && app === "texts" && (
          <HubThreads
            key={`texts-${jump?.app === "texts" ? jump.search : ""}`}
            channel="sms"
            canReply
            emptyHint="No text conversations yet."
            initialSearch={jump?.app === "texts" ? jump.search : undefined}
            autoOpenThreadId={jump?.app === "texts" ? jump.threadId : null}
          />
        )}
        {!searching && app === "chats" && (
          <HubThreads
            key={`chats-${jump?.app === "chats" ? jump.search : ""}`}
            channel="chat"
            emptyHint="Website chat and voice sessions land here."
            initialSearch={jump?.app === "chats" ? jump.search : undefined}
            autoOpenThreadId={jump?.app === "chats" ? jump.threadId : null}
          />
        )}
        {!searching && app === "email" && (
          <HubThreads
            key={`email-${jump?.app === "email" ? jump.search : ""}`}
            channel="email"
            emptyHint="Email conversations land here."
            initialSearch={jump?.app === "email" ? jump.search : undefined}
            autoOpenThreadId={jump?.app === "email" ? jump.threadId : null}
          />
        )}
        {!searching && app === "messenger" && <HubMessenger />}
        {!searching && app === "slack" && <HubSlack />}
        {!searching && app === "campaigns" && <HubCampaigns />}
      </PhoneFrame>
    </div>
  );
}
