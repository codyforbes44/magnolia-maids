import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Mic, MicOff, X, Send, Sparkles } from "lucide-react";
import mascot from "@/assets/splash-mascot.png";

const AGENT_ID = "agent_0001kygbk76rfwxrf6bef7z6xf1t";

type ChatMsg = { role: "agent" | "user"; text: string; id: string };

export function SplashChatWidget() {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"idle" | "voice" | "text">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      pushAgent("Hi! I'm Splash 🐬 — Miami's friendliest cleaning helper. How can I make your day easier?");
    },
    onDisconnect: () => {},
    onMessage: (msg: any) => {
      if (!msg) return;
      // AI SDK message shapes vary; try common fields
      const text =
        msg.message ??
        msg?.agent_response_event?.agent_response ??
        msg?.user_transcription_event?.user_transcript ??
        (typeof msg === "string" ? msg : "");
      if (!text) return;
      const source = msg.source ?? (msg.type === "user_transcript" ? "user" : "ai");
      if (source === "user") pushUser(text);
      else pushAgent(text);
    },
    onError: (e: any) => {
      console.error("Splash chat error", e);
      pushAgent("Sorry — I had trouble connecting. Please try again or call (305) 555-0142.");
    },
  });

  const pushAgent = (text: string) =>
    setMessages((m) => [...m, { role: "agent", text, id: crypto.randomUUID() }]);
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

  const openWidget = () => {
    setOpen(true);
    setShowNudge(false);
    if (messages.length === 0) {
      pushAgent("Hey there! 👋 I'm Splash — ask me about pricing, Airbnb turnovers, or booking your grand-opening slot.");
    }
  };

  const startVoice = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
      } as any);
      setMode("voice");
    } catch (e) {
      console.error(e);
      pushAgent("I need microphone access to chat by voice. You can also type below!");
      setMode("text");
    }
  }, [conversation]);

  const stopVoice = useCallback(async () => {
    await conversation.endSession();
    setMode("idle");
  }, [conversation]);

  const startText = useCallback(async () => {
    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        textOnly: true,
      } as any);
      setMode("text");
    } catch (e) {
      console.error(e);
      pushAgent("I couldn't start the chat. Please try again.");
    }
  }, [conversation]);

  const sendText = () => {
    const t = input.trim();
    if (!t) return;
    pushUser(t);
    try {
      (conversation as any).sendUserMessage?.(t);
    } catch (e) {
      console.error(e);
    }
    setInput("");
  };

  const status = conversation.status;
  const isSpeaking = conversation.isSpeaking;
  const connected = status === "connected";

  return (
    <>
      {/* Proactive nudge bubble */}
      {showNudge && !open && (
        <div className="fixed bottom-24 right-5 z-50 max-w-[260px] animate-in fade-in slide-in-from-bottom-2">
          <div className="relative rounded-2xl bg-white shadow-2xl ring-1 ring-ocean/10 p-4">
            <button
              aria-label="Dismiss"
              onClick={() => { setShowNudge(false); setNudgeDismissed(true); }}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <img src={mascot} alt="" className="h-10 w-10 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-ocean">Need a hand? 🐬</p>
                <p className="mt-1 text-xs text-slate-600">
                  Ask me anything about pricing, Airbnb turnovers, or reserving founding-member rates!
                </p>
                <button
                  onClick={openWidget}
                  className="mt-2 rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                >
                  Chat with Splash
                </button>
              </div>
            </div>
            <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white ring-1 ring-ocean/10" />
          </div>
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <button
          onClick={openWidget}
          aria-label="Chat with Splash"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ocean text-white shadow-2xl ring-4 ring-white/60 hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-coral" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[380px]">
          <div className="flex h-[560px] max-h-[85vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-ocean/10">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-ocean to-turquoise px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <img src={mascot} alt="" className="h-9 w-9" />
                <div>
                  <div className="font-display font-bold leading-tight">Splash Assistant</div>
                  <div className="flex items-center gap-1.5 text-[11px] opacity-90">
                    <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-300 animate-pulse" : "bg-white/60"}`} />
                    {connected ? (isSpeaking ? "Speaking…" : "Listening") : "Ready to help"}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 hover:bg-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-sky-50/50 px-3 py-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      m.role === "user"
                        ? "bg-ocean text-white rounded-br-sm"
                        : "bg-white text-slate-800 rounded-bl-sm ring-1 ring-slate-100"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isSpeaking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ocean [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ocean [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ocean [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="border-t border-slate-100 bg-white p-3">
              {mode === "idle" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={startVoice}
                    className="flex items-center justify-center gap-2 rounded-full bg-coral px-3 py-2.5 text-sm font-bold text-white hover:opacity-90"
                  >
                    <Mic className="h-4 w-4" /> Talk
                  </button>
                  <button
                    onClick={startText}
                    className="flex items-center justify-center gap-2 rounded-full bg-ocean px-3 py-2.5 text-sm font-bold text-white hover:opacity-90"
                  >
                    <Sparkles className="h-4 w-4" /> Chat
                  </button>
                </div>
              )}

              {mode === "voice" && (
                <button
                  onClick={stopVoice}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-800 px-3 py-2.5 text-sm font-bold text-white hover:opacity-90"
                >
                  <MicOff className="h-4 w-4" /> End voice call
                </button>
              )}

              {mode === "text" && (
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendText()}
                    placeholder="Type a message…"
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-ocean focus:outline-none"
                  />
                  <button
                    onClick={sendText}
                    aria-label="Send"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean text-white hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}

              <p className="mt-2 text-center text-[10px] text-slate-400">
                Powered by ElevenLabs · Splash 🐬 · Grand Opening Oct 1, 2026
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}