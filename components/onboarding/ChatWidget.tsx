"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
};
type View = "home" | "chat";

const LOGO = "https://dtgcctkekahzjtvepowr.supabase.co/storage/v1/object/public/images/unnamed.png";

const QUICK_QUESTIONS = [
  { label: "What is this form about?",              icon: "📋", message: "Can you explain what this form is about?" },
  { label: "Required information before starting?", icon: "📝", message: "What information do I need to provide before starting?" },
  { label: "How to give Facebook access?",          icon: "📘", message: "Can you provide a guide on how to give Facebook access with video?" },
  { label: "How to give Stripe access?",            icon: "💳", message: "Can you provide a guide on how to give Stripe access with video?" },
  { label: "How long does this take?",              icon: "⏱️", message: "How long does the onboarding form take to complete?" },
  { label: "Can I save and resume later?",          icon: "💾", message: "What happens if I stop filling the form? Can I save and continue later?" },
];

const FOLLOW_UP_SUGGESTIONS: Record<string, string[]> = {
  "what is this form about": ["How long does it take?", "What info do I need?"],
  "information before starting": ["How do I give Stripe access?", "Can I save progress?"],
  "stripe access": ["How do I give Facebook access?", "What is this form about?"],
  "facebook access": ["How do I give Stripe access?", "What info is required?"],
  "stop form": ["How do I save my progress?", "How long does this take?"],
};

function getFollowUps(message: string): string[] {
  const lower = message.toLowerCase();
  for (const [key, suggestions] of Object.entries(FOLLOW_UP_SUGGESTIONS)) {
    if (key.split(" ").some((word) => lower.includes(word))) return suggestions;
  }
  return [];
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── typing dots ── */
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "linear-gradient(135deg,#14b8a6,#104757)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, flexShrink: 0,
      }}>🤖</span>
      <div style={{ background: "#f1f5f9", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 6, height: 6,
            background: "#94a3b8", borderRadius: "50%",
            animation: `wbTyping 1.4s ease-in-out ${i * 0.2}s infinite`,
            display: "inline-block",
          }} />
        ))}
      </div>
    </div>
  );
}

/* ── message bubble ── */
function MessageBubble({ msg, onSuggestion }: { msg: Message; onSuggestion: (s: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", marginBottom: 16, gap: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isUser ? "row-reverse" : "row" }}>
        {/* Avatar */}
        {!isUser && (
          <span style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0, marginBottom: 2,
            background: "linear-gradient(135deg,#14b8a6,#104757)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>🤖</span>
        )}
        {isUser && (
          <span style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0, marginBottom: 2,
            background: "linear-gradient(135deg,#334155,#1e293b)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>👤</span>
        )}
        {/* Bubble */}
        <div style={{
          background: isUser ? "linear-gradient(135deg,#104757,#0d3a47)" : "#f1f5f9",
          color: isUser ? "#fff" : "#1e293b",
          padding: "11px 15px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          maxWidth: "72%",
          fontSize: 13.5,
          lineHeight: 1.55,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          boxShadow: isUser ? "0 2px 8px rgba(16,71,87,0.25)" : "0 1px 4px rgba(0,0,0,0.07)",
        }}>
          {/* eslint-disable-next-line react/no-danger */}
          <div className="wb-msg-content" dangerouslySetInnerHTML={{ __html: msg.content }} />
        </div>
      </div>
      {/* Timestamp */}
      <span style={{ fontSize: 10.5, color: "#94a3b8", paddingLeft: isUser ? 0 : 38, paddingRight: isUser ? 38 : 0 }}>
        {formatTime(msg.timestamp)}
      </span>
      {/* Follow-up suggestions */}
      {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 38, marginTop: 2 }}>
          {msg.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20,
                padding: "5px 12px", fontSize: 12, color: "#104757", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f0fdfa"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#14b8a6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0"; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
function IconClose({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 26, height: 26 }}>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

/* ════════════════════════════════════════════ */
export function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [view, setView]         = useState<View>("home");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [searchQ, setSearchQ]   = useState("");
  const messagesEndRef          = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) { setUnread(0); }
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

    const userMsg: Message = { role: "user", content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    if (inputRef.current) { inputRef.current.style.height = "auto"; }

    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId: getSessionId() }),
      });
      const data = await res.json();
      const reply = data.reply ?? "Sorry, I couldn't process that.";
      const suggestions = getFollowUps(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", content: reply, timestamp: new Date(), suggestions }]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again.", timestamp: new Date() }]);
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
      setMessages([{
        role: "assistant",
        content: "Hi! I'm your <strong>WBT onboarding assistant</strong>. Ask me anything about completing this form — I'm here to help! 🎯",
        timestamp: new Date(),
        suggestions: ["What is this form about?", "How long does it take?"],
      }]);
    }
  }

  function clearChat() {
    setMessages([{
      role: "assistant",
      content: "Chat cleared. How can I help you?",
      timestamp: new Date(),
      suggestions: ["What is this form about?", "How long does it take?"],
    }]);
  }

  const filteredQ = QUICK_QUESTIONS.filter((q) =>
    searchQ === "" || q.label.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <>
      <style>{`
        @keyframes wbTyping {
          0%,60%,100% { transform:translateY(0); opacity:0.6; }
          30% { transform:translateY(-4px); opacity:1; }
        }
        @keyframes wbSlideUp {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes wbPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(20,184,166,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(20,184,166,0); }
        }
        @keyframes wbBounce {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .wb-panel { animation: wbSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
        .wb-toggle-btn { animation: wbPulse 2.5s ease-in-out infinite; }
        .wb-panel-msgs::-webkit-scrollbar { width:5px; }
        .wb-panel-msgs::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:10px; }
        .wb-panel-msgs::-webkit-scrollbar-track { background:transparent; }
        .wb-input-ta { resize:none; border:none !important; outline:none !important; background:transparent; flex:1; padding:10px 12px; font-size:14px; font-family:inherit; color:#1e293b; line-height:1.5; }
        .wb-input-ta::placeholder { color:#94a3b8; }
        .wb-msg-content a { color:#0e7490; text-decoration:underline; }
        .wb-msg-content p { margin-bottom:6px; }
        .wb-msg-content ul { margin:6px 0 6px 18px; list-style:disc; display:flex; flex-direction:column; gap:4px; }
        .wb-msg-content ol { margin-left:18px; }
        .wb-msg-content li { font-size:13.5px; }
        .wb-msg-content strong { font-weight:600; }
        .wb-msg-content h3, .wb-msg-content h4 { font-weight:600; margin-bottom:6px; font-size:13.5px; }
        .wb-msg-content .video-container { margin-top:10px; }
        .wb-qbtn:hover { background:#f8fafc !important; transform: translateX(3px); }
        .wb-send-btn:hover:not(:disabled) { opacity:0.88; transform:scale(1.05); }
      `}</style>

      {/* ── Floating toggle ── */}
      <button
        onClick={() => { setOpen((v) => !v); }}
        aria-label="Toggle chat"
        style={{
          position: "fixed", bottom: 24, left: 24, zIndex: 1000,
          background: "none", border: "none", padding: 0, cursor: "pointer",
        }}
      >
        <span
          className={!open ? "wb-toggle-btn" : ""}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 58, height: 58, borderRadius: "50%",
            background: "linear-gradient(135deg,#14b8a6,#104757)",
            color: "#fff",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 6px 20px rgba(16,71,87,0.35)",
          }}
        >
          {open ? <IconClose size={20} /> : <IconChat />}
        </span>
        {/* Unread badge */}
        {!open && unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "#ef4444", color: "#fff",
            width: 20, height: 20, borderRadius: "50%",
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
          }}>
            {unread}
          </span>
        )}
        {/* Tooltip */}
        {!open && (
          <span style={{
            position: "absolute", left: 68, top: "50%", transform: "translateY(-50%)",
            background: "#1e293b", color: "#fff",
            borderRadius: 10, padding: "8px 14px",
            fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}>
            💬 Need help? Ask AI!
          </span>
        )}
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          className="wb-panel"
          style={{
            position: "fixed",
            bottom: 96, left: 16, right: 16,
            maxWidth: 400,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999999,
            maxHeight: "calc(100vh - 120px)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {/* ── HEADER ── */}
          <div style={{
            background: "linear-gradient(135deg,#0e7490 0%,#104757 100%)",
            padding: "14px 16px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0, gap: 10,
          }}>
            {view === "chat" && (
              <button
                onClick={() => setView("home")}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer", color: "#fff", borderRadius: 8, height: 32,
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "0 10px 0 8px", flexShrink: 0, fontSize: 13, fontWeight: 600,
                  backdropFilter: "blur(4px)",
                }}
              >
                <IconArrowLeft /> Back
              </button>
            )}

            {view === "home" ? (
              <Image src={LOGO} alt="We Build Trades" width={160} height={34} style={{ objectFit: "contain", height: 30, width: "auto" }} unoptimized />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
                }}>🤖</span>
                <div>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 13.5, margin: 0 }}>AI Assistant</p>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    Online · Typically replies instantly
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
              {view === "chat" && messages.length > 1 && (
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  style={{
                    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8, width: 30, height: 30, cursor: "pointer",
                    color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <IconTrash />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8, width: 30, height: 30, cursor: "pointer",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <IconClose size={14} />
              </button>
            </div>
          </div>

          {/* ── HOME VIEW ── */}
          {view === "home" && (
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {/* Hero */}
              <div style={{
                background: "linear-gradient(160deg, #e0fdf4 0%, #ccfbf1 40%, #f0fdfa 100%)",
                padding: "22px 20px 18px",
              }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0d1117", lineHeight: 1.25, margin: "0 0 6px" }}>
                  Hi there! 👋<br />
                  <span style={{ color: "#0e7490" }}>How can we help?</span>
                </h2>
                <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                  Ask anything about the onboarding form — we reply instantly.
                </p>

                <button
                  onClick={openChat}
                  style={{
                    marginTop: 16, width: "100%", padding: "13px 20px",
                    background: "linear-gradient(135deg,#14b8a6,#104757)",
                    color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
                    fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 4px 14px rgba(16,71,87,0.3)",
                    transition: "opacity 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.92"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                >
                  <span style={{ fontSize: 18 }}>💬</span>
                  Chat With Our AI Assistant
                </button>
              </div>

              {/* Quick questions */}
              <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                    Quick Questions
                  </p>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{filteredQ.length} topics</span>
                </div>

                {/* Search */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px",
                  marginBottom: 4,
                }}>
                  <span style={{ fontSize: 14, color: "#94a3b8" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    style={{
                      border: "none", outline: "none", background: "transparent",
                      flex: 1, fontSize: 13, color: "#1e293b", fontFamily: "inherit",
                    }}
                  />
                  {searchQ && (
                    <button onClick={() => setSearchQ("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, padding: 0 }}>✕</button>
                  )}
                </div>

                {filteredQ.map((q) => (
                  <button
                    key={q.label}
                    className="wb-qbtn"
                    onClick={() => sendMessage(q.message)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      width: "100%", padding: "12px 14px",
                      background: "#fff", border: "1px solid #e2e8f0",
                      borderRadius: 12, cursor: "pointer",
                      fontSize: 13.5, textAlign: "left", fontFamily: "inherit",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      transition: "all 0.15s", color: "#1e293b",
                    }}
                  >
                    <span style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: "linear-gradient(135deg,#e0fdf4,#ccfbf1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}>{q.icon}</span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{q.label}</span>
                    <span style={{ color: "#14b8a6", fontSize: 16, flexShrink: 0 }}>›</span>
                  </button>
                ))}

                {filteredQ.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
                    No questions match your search
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CHAT VIEW ── */}
          {view === "chat" && (
            <>
              <div
                className="wb-panel-msgs"
                style={{
                  flex: 1, overflowY: "auto",
                  padding: "16px 14px 8px",
                  minHeight: 260,
                  background: "#f8fafc",
                }}
              >
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} onSuggestion={(s) => sendMessage(s)} />
                ))}
                {loading && (
                  <div style={{ marginBottom: 16 }}>
                    <TypingDots />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                borderTop: "1px solid #e2e8f0",
                padding: "10px 12px",
                background: "#fff",
                flexShrink: 0,
              }}>
                <div style={{
                  display: "flex", alignItems: "flex-end", gap: 8,
                  background: "#f8fafc", border: "1.5px solid #e2e8f0",
                  borderRadius: 14, padding: "4px 4px 4px 12px",
                  transition: "border-color 0.15s",
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
                    style={{ maxHeight: 100, minHeight: 36 }}
                  />
                  <button
                    className="wb-send-btn"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: input.trim() && !loading
                        ? "linear-gradient(135deg,#14b8a6,#104757)"
                        : "#e2e8f0",
                      color: input.trim() && !loading ? "#fff" : "#94a3b8",
                      border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s", padding: 0,
                    }}
                    aria-label="Send"
                  >
                    <IconSend />
                  </button>
                </div>
                <p style={{ fontSize: 10.5, color: "#cbd5e1", textAlign: "center", margin: "6px 0 0", fontFamily: "inherit" }}>
                  AI · Powered by We Build Trades
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
