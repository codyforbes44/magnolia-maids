import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { engageWithMaggie } from "@/lib/maggie-engage.functions";
import { CONTACT_PREF_LABELS, type ContactPref } from "@/lib/contact-pref";

type Source =
  | "campaign_leads"
  | "booking_requests"
  | "job_applications"
  | "property_inquiries"
  | "franchise_inquiries";

const CHANNELS: Array<{ value: "auto" | ContactPref; label: string }> = [
  { value: "auto", label: "Their preference" },
  { value: "email", label: CONTACT_PREF_LABELS.email },
  { value: "text", label: CONTACT_PREF_LABELS.text },
  { value: "call", label: CONTACT_PREF_LABELS.call },
];

/**
 * Lets an admin put Maggie on one specific contact: she drafts a personal
 * follow-up from the record and sends it on the chosen channel.
 */
export function EngageMaggieButton({
  source,
  id,
  contactPref,
}: {
  source: Source;
  id: string;
  contactPref?: string | null;
}) {
  const engage = useServerFn(engageWithMaggie);
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"auto" | ContactPref>("auto");
  const [instruction, setInstruction] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setState("busy");
    setMessage(null);
    try {
      const res = await engage({
        data: { source, id, channel, ...(instruction.trim() ? { instruction: instruction.trim() } : {}) },
      });
      setState(res.sent ? "done" : "error");
      setMessage(
        res.sent
          ? `Maggie reached out by ${CONTACT_PREF_LABELS[res.channel].toLowerCase()}.`
          : `Couldn't send (${res.reason ?? "unknown reason"}).`,
      );
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Maggie couldn't reach out.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tap-target inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Engage Maggie
      </button>

      {open && (
        <div className="space-y-2 rounded-xl border border-border bg-secondary/40 p-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Channel
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as "auto" | ContactPref)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm font-normal normal-case tracking-normal"
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                  {c.value === "auto" && contactPref ? ` (${contactPref})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            What should she say?
            <textarea
              rows={2}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Optional — e.g. offer Thursday morning, ask about pets"
              className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm font-normal normal-case tracking-normal"
            />
          </label>
          <button
            type="button"
            disabled={state === "busy"}
            onClick={run}
            className="tap-target inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {state === "busy" ? "Maggie is writing…" : "Send now"}
          </button>
        </div>
      )}

      {message && (
        <p className={`text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>
      )}
    </div>
  );
}
