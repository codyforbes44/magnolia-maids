import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Facebook,
  Hash,
  Mail,
  MessageSquare,
  Mic,
  Phone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { searchHub } from "@/lib/hub/hub.functions";
import type { HubSearchKind, HubSearchResult } from "@/lib/hub/hub-types";

const CHIPS: { key: HubSearchKind; label: string; icon: LucideIcon }[] = [
  { key: "call", label: "Phone", icon: Phone },
  { key: "sms", label: "Texts", icon: MessageSquare },
  { key: "chat", label: "Chats", icon: Mic },
  { key: "email", label: "Email", icon: Mail },
  { key: "messenger", label: "Messenger", icon: Facebook },
  { key: "slack", label: "Slack", icon: Hash },
  { key: "lead", label: "Leads", icon: UserRound },
];

function stamp(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HubSearch({
  query,
  onOpen,
}: {
  query: string;
  onOpen: (r: HubSearchResult) => void;
}) {
  const run = useServerFn(searchHub);
  const [kinds, setKinds] = useState<HubSearchKind[]>([]);

  const q = query.trim();
  const results = useQuery({
    queryKey: ["hub", "search", q, kinds.join(",")],
    queryFn: () => run({ data: { q, kinds } }),
    enabled: q.length >= 2,
  });

  const grouped = useMemo(() => results.data?.results ?? [], [results.data]);

  const toggle = (k: HubSearchKind) =>
    setKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  return (
    <div className="p-3">
      <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1">
        <button
          onClick={() => setKinds([])}
          aria-pressed={kinds.length === 0}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
            kinds.length === 0
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-muted-foreground"
          }`}
        >
          All
        </button>
        {CHIPS.map((c) => {
          const on = kinds.includes(c.key);
          return (
            <button
              key={c.key}
              onClick={() => toggle(c.key)}
              aria-pressed={on}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                on
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground"
              }`}
            >
              <c.icon className="h-3.5 w-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>

      {q.length < 2 && (
        <p className="mt-4 rounded-2xl bg-background p-4 text-sm text-muted-foreground">
          Type at least two characters to search names, numbers, emails and message text across
          every channel.
        </p>
      )}
      {q.length >= 2 && results.isLoading && (
        <p className="mt-4 p-2 text-sm text-muted-foreground">Searching…</p>
      )}
      {q.length >= 2 && results.data && grouped.length === 0 && (
        <p className="mt-4 rounded-2xl bg-background p-4 text-sm text-muted-foreground">
          Nothing matched “{q}”.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {grouped.map((r) => {
          const chip = CHIPS.find((c) => c.key === r.kind);
          const Icon = chip?.icon ?? MessageSquare;
          const body = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{r.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{stamp(r.at)}</span>
                </span>
                {r.subtitle && (
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {r.subtitle}
                  </span>
                )}
                {r.snippet && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {r.snippet}
                  </span>
                )}
              </span>
            </>
          );
          const cls =
            "flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left hover:bg-secondary/60";
          return (
            <li key={r.id}>
              {r.threadId || !r.link ? (
                <button onClick={() => onOpen(r)} className={cls}>
                  {body}
                </button>
              ) : (
                <Link to={r.link as never} className={cls}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
