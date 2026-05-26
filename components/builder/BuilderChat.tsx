"use client";

import { useState, useEffect, useRef } from "react";
import type {
  BuilderStep, BuilderCustomization, ColorScheme, ButtonStyle, FontPair,
} from "@/lib/builder/types";
import {
  BUILDER_STEPS, COLOR_SCHEMES, BUTTON_STYLES, FONT_PAIRS,
} from "@/lib/builder/types";

type Props = {
  templateName: string;
  templateType: string;
  customization: BuilderCustomization;
  currentStep: BuilderStep;
  onStepChange: (step: BuilderStep) => void;
  onCustomizationChange: (update: Partial<BuilderCustomization>) => void;
};

type ChatMessage = { role: "assistant" | "user"; text: string };

const STEP_QUESTIONS: Record<BuilderStep, string> = {
  welcome: "",
  color: "🎨 Choose a **color scheme** for your website:",
  button: "🔲 How should your **buttons** look?",
  font: "🔤 Pick a **font style** for your site:",
  header: "📐 Choose a **header layout**:",
  footer: "📋 How should your **footer** look?",
  done: "",
};

function TypingDot() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "10px 14px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#94a3b8",
          display: "inline-block",
          animation: `builderTyping 1.3s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isBot = msg.role === "assistant";
  return (
    <div style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", marginBottom: 10 }}>
      {isBot && (
        <span style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginRight: 8, marginTop: 2,
          background: "linear-gradient(135deg,#14b8a6,#0e7490)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
        }}>🤖</span>
      )}
      <div style={{
        maxWidth: "78%",
        background: isBot ? "#f1f5f9" : "linear-gradient(135deg,#0e7490,#0c4a6e)",
        color: isBot ? "#1e293b" : "#fff",
        padding: "10px 14px", borderRadius: isBot ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
        fontSize: 13.5, lineHeight: 1.55,
        boxShadow: isBot ? "0 1px 4px rgba(0,0,0,0.07)" : "0 2px 8px rgba(14,116,144,0.25)",
      }}>
        {msg.text.split("**").map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}
      </div>
    </div>
  );
}

/* ── Color swatches ── */
function ColorPicker({ selected, onSelect }: { selected: ColorScheme | null; onSelect: (c: ColorScheme) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {COLOR_SCHEMES.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            background: selected?.id === c.id ? "#f0fdfa" : "#fff",
            border: `2px solid ${selected?.id === c.id ? "#14b8a6" : "#e2e8f0"}`,
            borderRadius: 10, cursor: "pointer", transition: "all 0.15s", textAlign: "left",
            boxShadow: selected?.id === c.id ? "0 0 0 3px rgba(20,184,166,0.15)" : "none",
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {[c.primary, c.secondary, c.accent, c.bg].map((col, i) => (
              <span key={i} style={{ width: 18, height: 18, borderRadius: 4, background: col, border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }} />
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", flex: 1 }}>{c.label}</span>
          {selected?.id === c.id && <span style={{ color: "#14b8a6", fontSize: 16 }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Button style picker ── */
function ButtonPicker({ selected, onSelect }: { selected: ButtonStyle | null; onSelect: (b: ButtonStyle) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {BUTTON_STYLES.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b)}
          style={{
            padding: "14px 10px", background: selected?.id === b.id ? "#f0fdfa" : "#fff",
            border: `2px solid ${selected?.id === b.id ? "#14b8a6" : "#e2e8f0"}`,
            borderRadius: 10, cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 10, transition: "all 0.15s",
            boxShadow: selected?.id === b.id ? "0 0 0 3px rgba(20,184,166,0.15)" : "none",
          }}
        >
          <span style={{
            background: "#0e7490", color: "#fff", padding: "6px 16px",
            borderRadius: b.radius, boxShadow: b.shadow, border: b.border === "none" ? "none" : `2px solid #0e7490`,
            fontSize: 12, fontWeight: 600,
          }}>Click Me</span>
          <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{b.label}</span>
          {selected?.id === b.id && <span style={{ color: "#14b8a6", fontSize: 13 }}>✓ Selected</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Font picker ── */
function FontPicker({ selected, onSelect }: { selected: FontPair | null; onSelect: (f: FontPair) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {FONT_PAIRS.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelect(f)}
          style={{
            padding: "12px 14px", background: selected?.id === f.id ? "#f0fdfa" : "#fff",
            border: `2px solid ${selected?.id === f.id ? "#14b8a6" : "#e2e8f0"}`,
            borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            boxShadow: selected?.id === f.id ? "0 0 0 3px rgba(20,184,166,0.15)" : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0e7490", textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</span>
            {selected?.id === f.id && <span style={{ color: "#14b8a6" }}>✓</span>}
          </div>
          <p style={{ fontFamily: f.heading, fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "6px 0 2px" }}>
            Aa — Heading Font
          </p>
          <p style={{ fontFamily: f.body, fontSize: 13, color: "#64748b", margin: 0 }}>
            Body text looks like this — clean &amp; readable.
          </p>
        </button>
      ))}
    </div>
  );
}

/* ── Header layout picker ── */
function HeaderPicker({ selected, onSelect }: { selected: string | null; onSelect: (h: "centered" | "left" | "minimal") => void }) {
  const options: { id: "centered" | "left" | "minimal"; label: string; desc: string; icon: string }[] = [
    { id: "centered", label: "Centered", desc: "Logo and nav centered — great for premium feel", icon: "⬛ — ⬛ — ⬛" },
    { id: "left",     label: "Left-Aligned", desc: "Logo left, nav right — most common layout", icon: "⬛ — — — ⬛" },
    { id: "minimal",  label: "Minimal",   desc: "Clean line with no background — modern look", icon: "— ⬛ — ⬛ —" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onSelect(o.id)}
          style={{
            padding: "12px 14px", background: selected === o.id ? "#f0fdfa" : "#fff",
            border: `2px solid ${selected === o.id ? "#14b8a6" : "#e2e8f0"}`,
            borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            boxShadow: selected === o.id ? "0 0 0 3px rgba(20,184,166,0.15)" : "none",
            display: "flex", gap: 12, alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, letterSpacing: 2, color: "#64748b", fontFamily: "monospace", flexShrink: 0 }}>{o.icon}</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{o.label}</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{o.desc}</p>
          </div>
          {selected === o.id && <span style={{ color: "#14b8a6", marginLeft: "auto" }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Footer style picker ── */
function FooterPicker({ selected, onSelect }: { selected: string | null; onSelect: (f: "dark" | "light" | "minimal") => void }) {
  const options: { id: "dark" | "light" | "minimal"; label: string; desc: string; preview: string }[] = [
    { id: "dark",    label: "Dark",    desc: "Bold dark background — professional & strong", preview: "#0f172a" },
    { id: "light",   label: "Light",   desc: "Soft light background — clean & modern",       preview: "#f8fafc" },
    { id: "minimal", label: "Minimal", desc: "Just a border — ultra clean look",             preview: "#ffffff" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onSelect(o.id)}
          style={{
            padding: "12px 14px", background: selected === o.id ? "#f0fdfa" : "#fff",
            border: `2px solid ${selected === o.id ? "#14b8a6" : "#e2e8f0"}`,
            borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            boxShadow: selected === o.id ? "0 0 0 3px rgba(20,184,166,0.15)" : "none",
            display: "flex", gap: 12, alignItems: "center",
          }}
        >
          <span style={{
            width: 36, height: 22, borderRadius: 6, background: o.preview,
            border: "1px solid #e2e8f0", flexShrink: 0,
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
          }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{o.label}</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{o.desc}</p>
          </div>
          {selected === o.id && <span style={{ color: "#14b8a6", marginLeft: "auto" }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════ MAIN COMPONENT ════════════════════ */
export function BuilderChat({
  templateName, templateType, customization, currentStep, onStepChange, onCustomizationChange,
}: Props) {
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading]   = useState(false);
  const [pendingSelect, setPending] = useState(false);
  const bottomRef                   = useRef<HTMLDivElement>(null);

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

  async function fetchAiReply(step: BuilderStep, label: string) {
    setAiLoading(true);
    try {
      const res = await fetch("/api/builder-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, selectionLabel: label, templateName }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply ?? "Great choice! Preview updated." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Great choice! Your preview has been updated." }]);
    } finally {
      setAiLoading(false);
      scrollDown();
    }
  }

  // Welcome message on mount
  useEffect(() => {
    setMessages([{
      role: "assistant",
      text: `Welcome! You've selected the **${templateName}** template. Let's customise it together — I'll guide you through 5 quick design choices and update the preview in real time. 🎉`,
    }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: STEP_QUESTIONS["color"],
      }]);
      onStepChange("color");
      scrollDown();
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleColorSelect(c: ColorScheme) {
    if (pendingSelect) return;
    setPending(true);
    onCustomizationChange({ colorScheme: c });
    setMessages((prev) => [...prev, { role: "user", text: `I like the ${c.label} palette.` }]);
    scrollDown();
    fetchAiReply("color", c.label).then(() => {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", text: STEP_QUESTIONS["button"] }]);
        onStepChange("button");
        setPending(false);
        scrollDown();
      }, 600);
    });
  }

  function handleButtonSelect(b: ButtonStyle) {
    if (pendingSelect) return;
    setPending(true);
    onCustomizationChange({ buttonStyle: b });
    setMessages((prev) => [...prev, { role: "user", text: `${b.label} buttons look great!` }]);
    scrollDown();
    fetchAiReply("button", b.label).then(() => {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", text: STEP_QUESTIONS["font"] }]);
        onStepChange("font");
        setPending(false);
        scrollDown();
      }, 600);
    });
  }

  function handleFontSelect(f: FontPair) {
    if (pendingSelect) return;
    setPending(true);
    onCustomizationChange({ fontPair: f });
    setMessages((prev) => [...prev, { role: "user", text: `I'd like the ${f.label} font style.` }]);
    scrollDown();
    fetchAiReply("font", f.label).then(() => {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", text: STEP_QUESTIONS["header"] }]);
        onStepChange("header");
        setPending(false);
        scrollDown();
      }, 600);
    });
  }

  function handleHeaderSelect(h: "centered" | "left" | "minimal") {
    if (pendingSelect) return;
    setPending(true);
    onCustomizationChange({ headerLayout: h });
    setMessages((prev) => [...prev, { role: "user", text: `${h.charAt(0).toUpperCase() + h.slice(1)} header please.` }]);
    scrollDown();
    fetchAiReply("header", h).then(() => {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", text: STEP_QUESTIONS["footer"] }]);
        onStepChange("footer");
        setPending(false);
        scrollDown();
      }, 600);
    });
  }

  function handleFooterSelect(f: "dark" | "light" | "minimal") {
    if (pendingSelect) return;
    setPending(true);
    onCustomizationChange({ footerStyle: f });
    setMessages((prev) => [...prev, { role: "user", text: `${f.charAt(0).toUpperCase() + f.slice(1)} footer looks good!` }]);
    scrollDown();
    fetchAiReply("footer", f).then(() => {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          text: `🎉 All done! Your **${templateName}** template is fully customised. The We Build Trades team will use your preferences to build your site. You can close this or review your choices on the right.`,
        }]);
        onStepChange("done");
        setPending(false);
        scrollDown();
      }, 600);
    });
  }

  return (
    <>
      <style>{`
        @keyframes builderTyping {
          0%,60%,100%{transform:translateY(0);opacity:.5}
          30%{transform:translateY(-4px);opacity:1}
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
        {/* Chat header */}
        <div style={{
          background: "linear-gradient(135deg,#0c4a6e,#0e7490)",
          padding: "16px 20px", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>🤖</span>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>Design Assistant</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              Online · Guiding your customisation
            </p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {aiLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0e7490)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</span>
              <div style={{ background: "#f1f5f9", borderRadius: "18px 18px 18px 4px" }}><TypingDot /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Option pickers */}
        {!pendingSelect && !aiLoading && (
          <div style={{ borderTop: "1px solid #e2e8f0", padding: "14px 16px", background: "#fff", flexShrink: 0, maxHeight: 320, overflowY: "auto" }}>
            {currentStep === "color" && (
              <ColorPicker selected={customization.colorScheme} onSelect={handleColorSelect} />
            )}
            {currentStep === "button" && (
              <ButtonPicker selected={customization.buttonStyle} onSelect={handleButtonSelect} />
            )}
            {currentStep === "font" && (
              <FontPicker selected={customization.fontPair} onSelect={handleFontSelect} />
            )}
            {currentStep === "header" && (
              <HeaderPicker selected={customization.headerLayout} onSelect={handleHeaderSelect} />
            )}
            {currentStep === "footer" && (
              <FooterPicker selected={customization.footerStyle} onSelect={handleFooterSelect} />
            )}
            {currentStep === "done" && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>🎉</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0e7490" }}>Customisation Complete!</p>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Your design preferences have been saved.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
