import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import {
  listMessengerMessages,
  listMessengerThreads,
  sendMessengerReply,
} from "@/lib/facebook.functions";
import { FACEBOOK_PAGE_ID } from "@/lib/facebook-config";
import { inputClass } from "@/components/admin/ui";

export function HubMessenger() {
  const qc = useQueryClient();
  const listThreads = useServerFn(listMessengerThreads);
  const listMessages = useServerFn(listMessengerMessages);
  const reply = useServerFn(sendMessengerReply);
  const [open, setOpen] = useState<{ id: string; personId: string | null; name: string } | null>(
    null,
  );
  const [draft, setDraft] = useState("");

  const threads = useQuery({
    queryKey: ["hub", "messenger"],
    queryFn: () => listThreads({ data: { pageId: FACEBOOK_PAGE_ID, limit: 25 } }),
  });

  const convo = useQuery({
    queryKey: ["hub", "messenger", open?.id],
    queryFn: () =>
      listMessages({ data: { pageId: FACEBOOK_PAGE_ID, threadId: open!.id, limit: 50 } }),
    enabled: !!open,
  });

  const sendMut = useMutation({
    mutationFn: (message: string) =>
      reply({ data: { pageId: FACEBOOK_PAGE_ID, recipientId: open!.personId!, message } }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["hub", "messenger"] });
    },
  });

  if (open) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {convo.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {(convo.data?.messages ?? []).map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.fromPage
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "border border-border bg-background"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.text || "(attachment)"}</p>
              <p
                className={`mt-1 text-[10px] ${m.fromPage ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {new Date(m.createdTime).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <form
          className="flex items-end gap-2 border-t border-border bg-background p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim() && open.personId) sendMut.mutate(draft.trim());
          }}
        >
          <textarea
            rows={1}
            className={`${inputClass} min-h-[44px] resize-none`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Reply as the Page…"
            aria-label="Messenger reply"
          />
          <button
            className="rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-50"
            disabled={sendMut.isPending || !open.personId}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <button
          onClick={() => setOpen(null)}
          className="border-t border-border bg-background py-2 text-xs font-bold text-primary"
        >
          Back to Messenger
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {threads.isLoading && <p className="p-3 text-sm text-muted-foreground">Loading…</p>}
      {threads.isError && (
        <p className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
          Messenger is not reachable right now — reconnect the Page in Marketing.
        </p>
      )}
      {(threads.data?.threads ?? []).map((t) => (
        <button
          key={t.id}
          onClick={() => setOpen({ id: t.id, personId: t.personId, name: t.personName })}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left hover:bg-secondary/60"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{t.personName}</span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {t.snippet || "—"}
            </span>
          </span>
          {t.unread > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
              {t.unread}
            </span>
          )}
        </button>
      ))}
      {threads.data && threads.data.threads.length === 0 && (
        <p className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
          No Messenger conversations yet.
        </p>
      )}
    </div>
  );
}
