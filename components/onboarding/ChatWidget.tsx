"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

type Message = { role: "user" | "assistant"; content: string };
type View = "home" | "chat";

const LOGO = "https://dtgcctkekahzjtvepowr.supabase.co/storage/v1/object/public/images/unnamed.png";

const QUICK_QUESTIONS = [
  { label: "What is this form about?",              message: "Can you explain what this form is about?" },
  { label: "Required information before starting?", message: "What information do I need to provide before starting?" },
  { label: "How to give Facebook access?",          message: "Can you provide a guide on how to give Facebook access with video?" },
  { label: "How to give Stripe access?",            message: "Can you provide a guide on how to give Stripe access with video?" },
];

/* ── typing dots ── */
function TypingDots() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 12px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 4, height: 4,
            background: "#94a3b8",
            borderRadius: "50%",
            animation: `wbTyping 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── single message bubble ── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: isUser ? 16 : 32 }}>
      <div
        style={{
          background: isUser ? "#104757" : "#f2f2f2",
          color: isUser ? "#fff" : "#000",
          padding: "14px 18px",
          borderRadius: 12,
          borderBottomRightRadius: isUser ? 2 : 12,
          borderBottomLeftRadius: isUser ? 12 : 2,
          maxWidth: "80%",
          fontSize: 14,
          fontFamily: "Inter, sans-serif",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          whiteSpace: "pre-line",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: msg.content }} />
        {!isUser && (
          <span style={{ position: "absolute", bottom: -22, left: 2, color: "#969696", fontSize: 12, whiteSpace: "nowrap" }}>
            🤖 Bot
          </span>
        )}
      </div>
    </div>
  );
}

/* ── session id ── */
let _sessionId: string | null = null;
function getSessionId() {
  if (!_sessionId) _sessionId = typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return _sessionId;
}

/* ── icons ── */
function IconArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
function IconClose({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ════════════════════════════════════════════ */
export function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [view, setView]       = useState<View>("home");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef        = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open && view === "chat") {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, view, scrollToBottom]);

  useEffect(() => { if (view === "chat") scrollToBottom(); }, [messages, view, scrollToBottom]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (view !== "chat") setView("chat");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    // reset textarea height
    if (inputRef.current) { inputRef.current.style.height = "auto"; }

    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId: getSessionId() }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "Sorry, I couldn't process that." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function openChat() {
    setOpen(true);
    setView("chat");
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: "Hi! I'm your onboarding assistant. Ask me anything about completing this form." }]);
    }
  }

  return (
    <>
      <style>{`
        @keyframes wbTyping {
          0%,60%,100% { transform:translateY(0); }
          30% { transform:translateY(-4px); }
        }
        @keyframes wbSlideIn {
          from { opacity:0; transform:translateX(-30px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes wbSlideOut {
          from { opacity:1; transform:translateX(0); }
          to   { opacity:0; transform:translateX(-30px); }
        }
        .wb-chat-open  { animation: wbSlideIn  0.28s ease-out both; }
        .wb-chat-close { animation: wbSlideOut 0.22s ease-in  both; }
        .wb-panel-msgs::-webkit-scrollbar { width:8px; border-radius:10px; }
        .wb-panel-msgs::-webkit-scrollbar-thumb { background:#104757; border-radius:10px; border:2px solid #f0f0f0; }
        .wb-panel-msgs::-webkit-scrollbar-track { background:#f0f0f0; border-radius:10px; }
        .wb-input-ta { resize:none; border:none !important; outline:none !important; background:transparent; flex:1; padding:10px 12px; font-size:15px; font-family:inherit; color:#1e293b; line-height:1.5; }
        .wb-input-ta::placeholder { color:#232a3191; }
        .wb-msg-content h1,.wb-msg-content h2,.wb-msg-content h3,.wb-msg-content h4 { color:#000!important; font-weight:600; margin-bottom:10px; font-size:14px!important; }
        .wb-msg-content p { margin-bottom:6px; font-size:14px; }
        .wb-msg-content ul { display:flex; flex-direction:column; gap:10px; margin:10px 0 10px 20px; list-style:disc; }
        .wb-msg-content ol { margin-left:20px; }
        .wb-msg-content li { margin-bottom:6px; font-size:14px; }
        .wb-msg-content strong { font-weight:600; }
        .wb-msg-content a { color:#104757; text-decoration:underline; }
        .wb-prompt-btn:hover { background:#f5f5f5 !important; }
        .wb-action-btn:hover { background:#47b3c0 !important; }
        .wb-send-btn:hover:not(:disabled) { opacity:0.88; }
      `}</style>

      {/* ── Floating toggle button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle chat"
        style={{
          position: "fixed", bottom: 20, left: 20, zIndex: 1000,
          background: "transparent", border: "none", padding: 0, cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 60, height: 60, borderRadius: "50%",
            background: "#235564", color: "#fff",
            transition: "transform 0.2s",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          }}
        >
          {open ? <IconClose /> : <IconChat />}
        </span>
        {!open && (
          <span style={{
            position: "absolute", right: -128, top: -52,
            background: "rgba(76,89,96,0.85)", color: "#fff",
            borderRadius: "16px 16px 16px 0", padding: "10px 14px",
            fontSize: 14, fontWeight: 500, whiteSpace: "nowrap",
            pointerEvents: "none",
            lineHeight: 1.3,
          }}>
            Need help?<br />Chat with AI!
          </span>
        )}
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          className="wb-chat-open"
          style={{
            position: "fixed",
            bottom: 100, left: 20, right: 20,
            maxWidth: 400,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1000000,
            maxHeight: "calc(100vh - 130px)",
          }}
        >
          {/* Header */}
          <div style={{
            background: "#c4f4f1",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <Image src={LOGO} alt="We Build Trades" width={180} height={40} style={{ objectFit: "contain", height: 36, width: "auto" }} unoptimized />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Back arrow — only shown in chat view */}
              {view === "chat" && (
                <button
                  onClick={() => setView("home")}
                  aria-label="Back"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#235764", padding: 0, display: "flex" }}
                >
                  <IconArrowLeft />
                </button>
              )}
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  background: "#235764", border: "none", cursor: "pointer",
                  color: "#fff", borderRadius: "50%", width: 28, height: 28,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                }}
              >
                <IconClose size={16} />
              </button>
            </div>
          </div>

          {/* ── HOME VIEW ── */}
          {view === "home" && (
            <div style={{
              background: "linear-gradient(180deg, rgb(11 210 199 / 24%) 40%, #f8f8f8 60%)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              overflowY: "auto",
            }}>
              <h2 style={{ fontSize: 36, fontWeight: 700, color: "#0d1117", lineHeight: 1.2, margin: 0 }}>
                Hi there! 👋<br />How can we help?
              </h2>

              <button
                className="wb-action-btn"
                onClick={openChat}
                style={{
                  width: "100%", padding: "14px 20px",
                  background: "#104757", color: "#fff",
                  border: "none", borderRadius: 8, cursor: "pointer",
                  fontSize: 17, fontWeight: 500, marginTop: 8, transition: "background 0.2s",
                }}
              >
                Chat With Our AI Assistant
              </button>

              {/* Quick questions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                <p style={{ fontSize: 17, color: "#0d1117", marginBottom: 4, fontWeight: 500 }}>Quick Questions:</p>
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q.label}
                    className="wb-prompt-btn"
                    onClick={() => sendMessage(q.message)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "14px 16px",
                      background: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
                      fontSize: 14, textAlign: "left", fontFamily: "inherit",
                      boxShadow: "rgba(0,0,0,0.15) 0px 0.6px 0.54px -1.33px, rgba(0,0,0,0.13) 0px 2.29px 2.06px -2.67px, rgba(0,0,0,0.04) 0px 10px 9px -4px",
                      transition: "background 0.15s",
                    }}
                  >
                    <span style={{ color: "#1e293b" }}>{q.label}</span>
                    <span style={{ color: "#104757", fontSize: 18, flexShrink: 0, marginLeft: 8 }}>➤</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CHAT VIEW ── */}
          {view === "chat" && (
            <>
              {/* Messages */}
              <div
                className="wb-panel-msgs"
                style={{
                  flex: 1, overflowY: "auto",
                  padding: "16px 16px 8px",
                  minHeight: 280,
                  scrollbarWidth: "thin",
                  scrollbarColor: "#104757 #f0f0f0",
                }}
              >
                {messages.map((msg, i) => (
                  <div key={i} className="wb-msg-content">
                    <MessageBubble msg={msg} />
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 32 }}>
                    <div style={{ background: "#f2f2f2", borderRadius: 12, borderBottomLeftRadius: 2 }}>
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div style={{
                display: "flex", alignItems: "center",
                margin: "0 10px 10px",
                border: "1px solid #c1b8b8",
                borderRadius: 12, padding: "1px 5px",
                background: "#fff",
                boxShadow: "rgb(0 0 0 / 9%) 0px 0.6px 2px -1.33px, rgb(0 0 0 / 28%) 0px 2.29px 7.8px -2.67px",
              }}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                  onKeyDown={handleKey}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="wb-input-ta"
                />
                <button
                  className="wb-send-btn"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: "#235564", color: "#fff", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: (!input.trim() || loading) ? 0.45 : 1,
                    transition: "opacity 0.15s",
                    padding: 0,
                  }}
                  aria-label="Send"
                >
                  <IconSend />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
