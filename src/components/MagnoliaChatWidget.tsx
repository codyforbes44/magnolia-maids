import { useConversation, ConversationProvider, useScribe, CommitStrategy } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Mic, MicOff, X, Send, Sparkles, Maximize2, Minimize2, MapPin, Phone } from "lucide-react";
import { useMaggieImages } from "@/lib/maggie-images";
import { buildAgentKnowledge, FIRST_MESSAGE_TEXT, FIRST_MESSAGE_VOICE } from "@/agents/knowledge";

const AGENT_ID = "agent_0001kygbk76rfwxrf6bef7z6xf1t";

/** Keeps the ElevenLabs agent in sync with the app's live pricing & offerings. */
function sessionOverrides(firstMessage: string) {
  return {
    agent: {
      prompt: { prompt: buildAgentKnowledge() },
      firstMessage,
    },
  };
}

type ChatMsg = { role: "agent" | "user"; text: string; id: string };

export function MagnoliaChatWidget({ initialOpen = false }: { initialOpen?: boolean }) {
  return (
    <ConversationProvider>
      <MagnoliaChatWidgetInner initialOpen={initialOpen} />
    </ConversationProvider>
  );
}

function MagnoliaChatWidgetInner({ initialOpen }: { initialOpen: boolean }) {
  const maggie = useMaggieImages();
  const [open, setOpen] = useState(initialOpen);
  const [expanded, setExpanded] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(initialOpen);
  const [messages, setMessages] = useState<ChatMsg[]>(
    initialOpen
      ? [
          {
            role: "agent",
            text: FIRST_MESSAGE_TEXT,
            id: "welcome",
          },
        ]
      : [],
  );
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"idle" | "voice" | "text">("idle");
  const [switching, setSwitching] = useState(false);
  const messagesRef = useRef<ChatMsg[]>([]);
  const [liveHeard, setLiveHeard] = useState("");
  /** Messages typed before the session finished connecting; flushed on connect. */
  const pendingRef = useRef<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {},
    onDisconnect: () => {},
    onMessage: (msg: any) => {
      if (!msg) return;
      const text =
        msg.message ??
        msg?.agent_response_event?.agent_response ??
        msg?.user_transcription_event?.user_transcript ??
        (typeof msg === "string" ? msg : "");
      if (!text) return;
      const source = msg.source ?? (msg.type === "user_transcript" ? "user" : "ai");
      if (source === "user") {
        setLiveHeard("");
        pushUser(text);
      } else pushAgent(text);
    },
    onError: (e: any) => {
      console.error("Magnolia Maids chat error", e);
      pushAgent("Sorry — I had trouble connecting. Please try again or call (580) 745-0045.");
    },
  });

  /** Live "what Maggie is hearing" partials, streamed from ElevenLabs Scribe. */
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    microphone: { echoCancellation: true, noiseSuppression: true },
    onPartialTranscript: (d) => setLiveHeard(d.text ?? ""),
    onCommittedTranscript: () => setLiveHeard(""),
    onError: (e) => console.error("Live transcription error", e),
  });

  const startLiveTranscription = useCallback(async () => {
    try {
      const res = await fetch("/api/public/elevenlabs/scribe-token", { method: "POST" });
      if (!res.ok) return; // live captions are a nice-to-have; voice still works
      const { token } = (await res.json()) as { token?: string };
      if (!token) return;
      await scribe.connect({ token });
    } catch (e) {
      console.error("Live transcription unavailable", e);
    }
  }, [scribe]);

  const stopLiveTranscription = useCallback(() => {
    setLiveHeard("");
    try {
      scribe.disconnect();
    } catch (e) {
      console.error(e);
    }
  }, [scribe]);

  const pushAgent = (text: string) =>
    setMessages((m) =>
      // Skip a repeat of the welcome line the agent replays when a session opens.
      m.some((existing) => existing.role === "agent" && existing.text === text)
        ? m
        : [...m, { role: "agent", text, id: crypto.randomUUID() }],
    );
  const pushUser = (text: string) =>
    setMessages((m) => [...m, { role: "user", text, id: crypto.randomUUID() }]);

  // Proactive nudge after 6s if not opened
  useEffect(() => {
    if (open || nudgeDismissed) return;
    const t = setTimeout(() => setShowNudge(true), 6000);
    return () => clearTimeout(t);
  }, [open, nudgeDismissed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Fullscreen: lock page scroll, Escape to exit, move focus into the dialog
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    overlayRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const closeWidget = () => {
    setExpanded(false);
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  };

  const openWidget = () => {
    setOpen(true);
    setShowNudge(false);
    if (messages.length === 0) {
      pushAgent(FIRST_MESSAGE_TEXT);
    }
  };

  /** Sends the running transcript so a re-started session keeps full context. */
  const sendTranscriptContext = useCallback(() => {
    const history = messagesRef.current
      .slice(-12)
      .map((m) => `${m.role === "user" ? "Customer" : "Maggie"}: ${m.text}`)
      .join("\n");
    if (!history) return;
    try {
      (conversation as any).sendContextualUpdate?.(
        `The customer just switched how they're talking with you. Continue the same conversation seamlessly — do not restart or re-greet. Conversation so far:\n${history}`,
      );
    } catch (e) {
      console.error(e);
    }
  }, [conversation]);

  const startVoice = useCallback(async (resume = false) => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        overrides: sessionOverrides(resume ? " " : FIRST_MESSAGE_VOICE),
      } as any);
      setMode("voice");
      if (resume) sendTranscriptContext();
      void startLiveTranscription();
    } catch (e) {
      console.error(e);
      pushAgent("I need microphone access to chat by voice. You can also type below!");
      setMode("text");
    }
  }, [conversation, sendTranscriptContext, startLiveTranscription]);

  const stopVoice = useCallback(async () => {
    stopLiveTranscription();
    await conversation.endSession();
    setMode("idle");
  }, [conversation, stopLiveTranscription]);

  const startText = useCallback(async (resume = false) => {
    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        // Text chat has no audio, so a WebSocket connects faster and avoids
        // WebRTC peer-connection failures on restrictive networks.
        connectionType: "websocket",
        textOnly: true,
        // The widget already shows the welcome line, so don't let the agent
        // repeat it when the session opens.
        overrides: sessionOverrides(resume || messagesRef.current.length > 0 ? " " : FIRST_MESSAGE_TEXT),
      } as any);
      setMode("text");
      if (resume) sendTranscriptContext();
    } catch (e) {
      console.error(e);
      pushAgent("I couldn't start the chat. Please try again.");
    }
  }, [conversation, sendTranscriptContext]);

  /** Seamlessly swap the live session between voice and text, keeping the transcript. */
  const switchMode = useCallback(
    async (next: "voice" | "text") => {
      if (switching || mode === next) return;
      setSwitching(true);
      try {
        const wasLive = mode !== "idle";
        if (mode === "voice") stopLiveTranscription();
        if (wasLive) {
          try {
            await conversation.endSession();
          } catch (e) {
            console.error(e);
          }
        }
        if (next === "voice") await startVoice(wasLive);
        else await startText(wasLive);
      } finally {
        setSwitching(false);
      }
    },
    [conversation, mode, switching, startVoice, startText, stopLiveTranscription],
  );

  const status = conversation.status;
  const isSpeaking = conversation.isSpeaking;
  const connected = status === "connected";

  /** Deliver a typed message, queueing it while the session is still connecting. */
  const deliver = useCallback(
    (text: string) => {
      if (conversation.status !== "connected") {
        pendingRef.current.push(text);
        return;
      }
      try {
        conversation.sendUserMessage(text);
      } catch (e) {
        console.error(e);
        pendingRef.current.push(text);
      }
    },
    [conversation],
  );

  // Flush anything typed before the connection was live.
  useEffect(() => {
    if (status !== "connected" || pendingRef.current.length === 0) return;
    const queued = pendingRef.current;
    pendingRef.current = [];
    for (const text of queued) {
      try {
        conversation.sendUserMessage(text);
      } catch (e) {
        console.error(e);
      }
    }
  }, [status, conversation]);

  const sendText = () => {
    const t = input.trim();
    if (!t) return;
    pushUser(t);
    setInput("");
    // Typing before picking Talk/Chat starts a text session automatically.
    if (mode === "idle") {
      pendingRef.current.push(t);
      void startText();
      return;
    }
    deliver(t);
  };

  const statusLabel = connected ? (isSpeaking ? "Speaking…" : "Listening") : "Ready to help";

  const renderMessages = (big: boolean) => (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto bg-sage/5 ${big ? "space-y-4 px-4 py-6 sm:px-8" : "space-y-3 px-3 py-4"}`}
    >
      <div className={big ? "mx-auto w-full max-w-2xl space-y-4" : "space-y-3"}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`shadow-sm ${big ? "max-w-[85%] rounded-3xl px-4 py-3 text-base leading-relaxed" : "max-w-[80%] rounded-2xl px-3 py-2 text-sm"} ${
                m.role === "user"
                  ? "bg-laurel text-white rounded-br-sm"
                  : "bg-white text-slate-800 rounded-bl-sm ring-1 ring-slate-100"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {mode === "voice" && liveHeard && (
          <div className="flex justify-end">
            <div
              aria-live="polite"
              className={`shadow-sm ${big ? "max-w-[85%] rounded-3xl px-4 py-3 text-base" : "max-w-[80%] rounded-2xl px-3 py-2 text-sm"} rounded-br-sm border border-dashed border-laurel/40 bg-laurel/10 italic text-laurel/90`}
            >
              {liveHeard}
              <span className="ml-1 inline-block animate-pulse">▍</span>
            </div>
          </div>
        )}
        {mode === "voice" && !liveHeard && scribe.isConnected && !isSpeaking && (
          <p className="text-center text-[11px] text-slate-400">Listening… I'll show what I hear here.</p>
        )}
        {isSpeaking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-laurel [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-laurel [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-laurel [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderControls = (big: boolean) => (
    <div
      className={`border-t border-slate-100 bg-white ${big ? "px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-8" : "p-3"}`}
    >
      <div className={big ? "mx-auto w-full max-w-2xl" : ""}>
        {mode === "idle" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => void startVoice()}
              className={`flex items-center justify-center gap-2 rounded-full bg-accent font-bold text-white hover:opacity-90 ${big ? "px-4 py-3.5 text-base" : "px-3 py-2.5 text-sm"}`}
            >
              <Mic className="h-4 w-4" /> Talk
            </button>
            <button
              onClick={() => void startText()}
              className={`flex items-center justify-center gap-2 rounded-full bg-laurel font-bold text-white hover:opacity-90 ${big ? "px-4 py-3.5 text-base" : "px-3 py-2.5 text-sm"}`}
            >
              <Sparkles className="h-4 w-4" /> Chat
            </button>
          </div>
        )}

        {mode !== "idle" && (
          <div className="mb-2 flex items-center gap-2">
            <div className="flex flex-1 rounded-full bg-slate-100 p-1">
              <button
                onClick={() => void switchMode("voice")}
                disabled={switching}
                aria-pressed={mode === "voice"}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition disabled:opacity-60 ${
                  mode === "voice" ? "bg-accent text-white shadow" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Mic className="h-3.5 w-3.5" /> Voice
              </button>
              <button
                onClick={() => void switchMode("text")}
                disabled={switching}
                aria-pressed={mode === "text"}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition disabled:opacity-60 ${
                  mode === "text" ? "bg-laurel text-white shadow" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> Text
              </button>
            </div>
            <button
              onClick={() => void stopVoice()}
              className="flex items-center justify-center gap-1.5 rounded-full bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:opacity-90"
            >
              <MicOff className="h-3.5 w-3.5" /> End
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2 ${mode === "idle" ? "mt-2" : ""}`}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder={mode === "voice" ? (switching ? "Switching…" : "Or type to Maggie…") : "Type a message…"}
              className={`flex-1 rounded-full border border-slate-200 focus:border-primary focus:outline-none ${big ? "px-5 py-3 text-base" : "px-4 py-2 text-sm"}`}
            />
            <button
              onClick={sendText}
              aria-label="Send"
              className={`flex items-center justify-center rounded-full bg-laurel text-white hover:opacity-90 ${big ? "h-12 w-12" : "h-9 w-9"}`}
            >
              <Send className={big ? "h-5 w-5" : "h-4 w-4"} />
            </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-slate-400">
          Maggie, your Magnolia Maids neighbor · Powered by ElevenLabs · Durant, OK
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Proactive nudge bubble */}
      {showNudge && !open && (
        <div className="fixed bottom-24 right-5 z-50 max-w-[260px] animate-in fade-in slide-in-from-bottom-2">
          <div className="relative rounded-2xl bg-white shadow-2xl ring-1 ring-primary/10 p-4">
            <button
              aria-label="Dismiss"
              onClick={() => { setShowNudge(false); setNudgeDismissed(true); }}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <img loading="lazy" decoding="async" src={maggie.avatar} srcSet={maggie.avatarSrcSet} sizes="40px" width={40} height={40} alt="Maggie, your Magnolia Maids neighbor" className="h-10 w-10 shrink-0 rounded-full" />
              <div>
                <p className="text-sm font-semibold text-laurel">Hi, neighbor! 🤍</p>
                <p className="mt-1 text-xs text-slate-600">
                  I’m Maggie — ask me anything about pricing, Airbnb turnovers, or booking your next cleaning!
                </p>
                <button
                  onClick={openWidget}
                  className="mt-2 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                >
                  Chat with Maggie
                </button>
              </div>
            </div>
            <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white ring-1 ring-primary/10" />
          </div>
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <button
          ref={launcherRef}
          onClick={openWidget}
          aria-label="Chat with Maggie, your Magnolia Maids neighbor"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-laurel text-white shadow-2xl ring-4 ring-white/60 hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent" />
          </span>
        </button>
      )}

      {/* Corner chat panel */}
      {open && !expanded && (
        <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[380px] animate-scale-in">
          <div className="flex h-[560px] max-h-[85vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-primary/10">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-laurel to-sage px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <img loading="lazy" decoding="async" src={maggie.avatar} srcSet={maggie.avatarSrcSet} sizes="36px" width={36} height={36} alt="Maggie" className="h-9 w-9 rounded-full" />
                <div>
                  <div className="font-display font-bold leading-tight">Maggie, Magnolia Maids Assistant</div>
                  <div className="flex items-center gap-1.5 text-[11px] opacity-90">
                    <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-300 animate-pulse" : "bg-white/60"}`} />
                    {statusLabel}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(true)}
                  aria-label="Expand chat to fullscreen"
                  title="Fullscreen"
                  className="rounded-full p-1.5 hover:bg-white/15"
                >
                  <Maximize2 className="h-4.5 w-4.5" />
                </button>
                <button onClick={closeWidget} aria-label="Close chat" className="rounded-full p-1.5 hover:bg-white/15">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {renderMessages(false)}
            {renderControls(false)}
          </div>
        </div>
      )}

      {/* Fullscreen immersive mode */}
      {open && expanded && (
        <div
          ref={overlayRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Chat with Maggie, your Magnolia Maids neighbor"
          className="fixed inset-0 z-[60] flex flex-col bg-white outline-none animate-fade-in md:flex-row"
        >
          {/* Maggie panel */}
          <div className="relative h-[32vh] w-full shrink-0 overflow-hidden bg-gradient-to-b from-sage/30 to-forest/20 md:h-auto md:w-1/2 md:flex-1">
            <img
              src={maggie.portrait}
              alt="Maggie, your Magnolia Maids neighbor"
              width={896}
              height={1344}
              decoding="async"
              className={`h-full w-full object-cover object-[50%_18%] transition-transform duration-700 md:object-[50%_15%] ${isSpeaking ? "scale-[1.03]" : "scale-100"}`}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest via-forest/60 to-transparent md:via-forest/30" />
            {isSpeaking && (
              <div className="pointer-events-none absolute inset-0 animate-pulse bg-accent/10" />
            )}
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
              <h2 className="font-display text-2xl font-bold leading-tight sm:text-4xl">Maggie</h2>
              <p className="mt-1 text-sm opacity-90 sm:text-base">Your Magnolia Maids neighbor</p>
              <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm">
                <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-300 animate-pulse" : "bg-white/60"}`} />
                {statusLabel}
              </div>
              <div className="mt-4 hidden flex-wrap gap-3 text-xs sm:flex">
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                  <MapPin className="h-3.5 w-3.5" /> Durant, OK &amp; Bryan County
                </span>
                <a
                  href="tel:+15807450045"
                  className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur hover:bg-white/25"
                >
                  <Phone className="h-3.5 w-3.5" /> (580) 745-0045
                </a>
              </div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex min-h-0 flex-1 flex-col md:w-1/2">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-8">
              <div className="flex items-center gap-2">
                <img loading="lazy" decoding="async" src={maggie.avatar} srcSet={maggie.avatarSrcSet} sizes="32px" width={32} height={32} alt="" className="h-8 w-8 rounded-full md:hidden" />
                <div className="font-display text-sm font-bold text-laurel sm:text-base">
                  Magnolia Maids Assistant
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(false)}
                  aria-label="Exit fullscreen"
                  title="Exit fullscreen"
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  <Minimize2 className="h-5 w-5" />
                </button>
                <button
                  onClick={closeWidget}
                  aria-label="Close chat"
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {renderMessages(true)}
            {renderControls(true)}
          </div>
        </div>
      )}
    </>
  );
}
