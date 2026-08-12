import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PhoneCall } from "lucide-react";
import { queueOutboundCall } from "@/lib/outbound-calls.functions";
import { OUTBOUND_AGENT_ID } from "@/lib/agents";

/** Adds a contact to Maggie's outbound follow-up queue from any admin list. */
export function QueueCallButton({
  contactName,
  phone,
  email,
  purpose = "general_followup",
  context,
  sourceTable,
  sourceId,
}: {
  contactName: string;
  phone?: string | null;
  email?: string | null;
  purpose?: string;
  context?: string;
  sourceTable?: string;
  sourceId?: string;
}) {
  const queue = useServerFn(queueOutboundCall);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!phone) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={state === "busy" || state === "done"}
        onClick={async () => {
          setState("busy");
          setMessage(null);
          try {
            await queue({
              data: {
                contactName,
                phone,
                email: email ?? "",
                purpose,
                contextNote: context ?? "",
                agentId: OUTBOUND_AGENT_ID,
                sourceTable: sourceTable ?? "",
                sourceId: sourceId ?? "",
              },
            });
            setState("done");
            setMessage("Added to the outbound call queue.");
          } catch (e) {
            setState("error");
            setMessage(e instanceof Error ? e.message : "Couldn't queue the call.");
          }
        }}
        className="tap-target inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
      >
        <PhoneCall className="h-3.5 w-3.5" aria-hidden />
        {state === "busy" ? "Queuing…" : state === "done" ? "Call queued" : "Queue Maggie call"}
      </button>
      {message && (
        <p className={`text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>
      )}
    </div>
  );
}
