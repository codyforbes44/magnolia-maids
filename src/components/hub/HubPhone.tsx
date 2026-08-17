import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Delete, Phone, PhoneOff, PhoneMissed } from "lucide-react";
import { getVoiceToken, logHubCall } from "@/lib/hub/voice.functions";
import type { HubCall } from "@/lib/hub/hub-types";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

function pretty(n: string) {
  const d = n.replace(/[^0-9]/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return n;
}

export function HubPhone({ calls }: { calls: HubCall[] }) {
  const tokenFn = useServerFn(getVoiceToken);
  const logFn = useServerFn(logHubCall);
  const [digits, setDigits] = useState("");
  const [state, setState] = useState<"idle" | "ready" | "connecting" | "live" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);

  const token = useQuery({ queryKey: ["hub", "voice-token"], queryFn: () => tokenFn({}) });

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!token.data?.token) return;
      const { Device } = await import("@twilio/voice-sdk");
      if (cancelled) return;
      const device = new Device(token.data.token, { logLevel: "error" });
      device.on("error", (e: any) => {
        setState("error");
        setMessage(e?.message ?? "Phone error");
      });
      device.on("registered", () => setState("ready"));
      await device.register();
      deviceRef.current = device;
    }
    void boot();
    return () => {
      cancelled = true;
      deviceRef.current?.destroy?.();
      deviceRef.current = null;
    };
  }, [token.data?.token]);

  useEffect(() => {
    if (state !== "live") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  async function dial(target?: string) {
    const to = (target ?? digits).replace(/[^0-9+]/g, "");
    if (!to || !deviceRef.current) return;
    setMessage(null);
    setState("connecting");
    setSeconds(0);
    try {
      const call = await deviceRef.current.connect({
        params: { To: to.startsWith("+") ? to : `+1${to.replace(/^1/, "")}` },
      });
      callRef.current = call;
      call.on("accept", () => setState("live"));
      call.on("disconnect", () => {
        setState("ready");
        callRef.current = null;
        void logFn({
          data: { phone: to, direction: "out", durationSecs: seconds, status: "completed" },
        }).catch(() => {});
      });
      call.on("cancel", () => setState("ready"));
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Could not place the call");
    }
  }

  function hangUp() {
    callRef.current?.disconnect?.();
    deviceRef.current?.disconnectAll?.();
    setState("ready");
  }

  const notConfigured = token.data && !token.data.token;

  return (
    <div className="p-4">
      <div className="rounded-3xl border border-border bg-background p-4 text-center">
        <p className="min-h-[2.25rem] font-display text-2xl font-semibold tracking-wide">
          {pretty(digits) || <span className="text-muted-foreground">Enter a number</span>}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {notConfigured
            ? "Browser calling not configured"
            : state === "live"
              ? `On call · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
              : state === "connecting"
                ? "Connecting…"
                : state === "ready"
                  ? `Calling from ${token.data?.from ?? "the business line"}`
                  : state === "error"
                    ? (message ?? "Phone error")
                    : "Starting phone…"}
        </p>

        <div className="mx-auto mt-4 grid max-w-[260px] grid-cols-3 gap-2.5">
          {KEYS.map((k) => (
            <button
              key={k}
              onClick={() => {
                setDigits((d) => (d + k).slice(0, 15));
                callRef.current?.sendDigits?.(k);
              }}
              className="rounded-full bg-secondary py-3 font-display text-lg font-semibold text-foreground hover:bg-secondary/70"
            >
              {k}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          {state === "live" || state === "connecting" ? (
            <button
              onClick={hangUp}
              aria-label="End call"
              className="rounded-full bg-destructive p-4 text-destructive-foreground"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => dial()}
              disabled={!digits || !!notConfigured}
              aria-label="Call"
              className="rounded-full bg-primary p-4 text-primary-foreground disabled:opacity-40"
            >
              <Phone className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setDigits((d) => d.slice(0, -1))}
            aria-label="Delete digit"
            className="rounded-full p-3 text-muted-foreground hover:bg-secondary"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>
      </div>

      <h3 className="mt-5 font-display text-base font-semibold">Recent calls</h3>
      <ul className="mt-2 space-y-2">
        {calls.length === 0 && (
          <li className="rounded-2xl bg-background p-3 text-sm text-muted-foreground">
            No calls yet.
          </li>
        )}
        {calls.map((c) => {
          const missed = ["failed", "no-answer", "busy"].includes(c.status);
          return (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
            >
              {missed ? (
                <PhoneMissed className="h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <Phone className="h-4 w-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {pretty(c.phone)} · {c.purpose} · {c.status}
                </p>
              </div>
              <button
                onClick={() => {
                  setDigits(c.phone.replace(/[^0-9+]/g, ""));
                  void dial(c.phone);
                }}
                className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary"
              >
                Call
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
