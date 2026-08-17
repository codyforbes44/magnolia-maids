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
  type LucideIcon,
} from "lucide-react";
import { PhoneFrame } from "@/components/hub/PhoneFrame";
import { HubHome } from "@/components/hub/HubHome";
import { HubThreads } from "@/components/hub/HubThreads";
import { HubPhone } from "@/components/hub/HubPhone";
import { HubMessenger } from "@/components/hub/HubMessenger";
import { HubSlack } from "@/components/hub/HubSlack";
import { HubCampaigns } from "@/components/hub/HubCampaigns";
import { getHubOverview } from "@/lib/hub/hub.functions";

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

  const title =
    app === "home" ? "Magnolia Maids" : (APPS.find((a) => a.key === app)?.label ?? "Hub");

  const dock = (
    <div className="grid grid-cols-8 gap-1">
      {APPS.map((a) => {
        const count = badgeFor(a.key) ?? 0;
        const active = app === a.key;
        return (
          <button
            key={a.key}
            onClick={() => setApp(a.key)}
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
        onBack={app === "home" ? undefined : () => setApp("home")}
        dock={dock}
      >
        {app === "home" &&
          (overview.data ? (
            <HubHome overview={overview.data} />
          ) : (
            <p className="p-6 text-sm text-muted-foreground">Loading your day…</p>
          ))}
        {app === "phone" && <HubPhone calls={overview.data?.calls ?? []} />}
        {app === "texts" && (
          <HubThreads channel="sms" canReply emptyHint="No text conversations yet." />
        )}
        {app === "chats" && (
          <HubThreads channel="chat" emptyHint="Website chat and voice sessions land here." />
        )}
        {app === "email" && (
          <HubThreads channel="email" emptyHint="Email conversations land here." />
        )}
        {app === "messenger" && <HubMessenger />}
        {app === "slack" && <HubSlack />}
        {app === "campaigns" && <HubCampaigns />}
      </PhoneFrame>
    </div>
  );
}
