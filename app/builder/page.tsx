"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BuilderChat } from "@/components/builder/BuilderChat";
import { BuilderChecklist } from "@/components/builder/BuilderChecklist";
import { TemplatePreviewFrame } from "@/components/builder/TemplatePreviewFrame";
import type { BuilderStep, BuilderCustomization } from "@/lib/builder/types";

const EMPTY: BuilderCustomization = {
  colorScheme: null,
  buttonStyle: null,
  fontPair: null,
  headerLayout: null,
  footerStyle: null,
};

function BuilderInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const templateId   = searchParams.get("template") ?? "Template";
  const templateType = searchParams.get("type") ?? "real";
  const templateName = searchParams.get("name") ?? templateId;
  const templateThumb = searchParams.get("thumb") ?? undefined;

  const [currentStep, setCurrentStep] = useState<BuilderStep>("welcome");
  const [customization, setCustomization] = useState<BuilderCustomization>(EMPTY);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");

  function handleCustomizationChange(update: Partial<BuilderCustomization>) {
    setCustomization((prev) => ({ ...prev, ...update }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "12px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0, gap: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "#f1f5f9", border: "1px solid #e2e8f0",
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ← Back
          </button>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
              🎨 Template Builder
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
              Customising: <strong style={{ color: "#0e7490" }}>{templateName}</strong> · {templateType}
            </p>
          </div>
        </div>

        {/* Status chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            background: currentStep === "done" ? "#d1fae5" : "#e0f2fe",
            color: currentStep === "done" ? "#059669" : "#0e7490",
            padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>
            {currentStep === "done" ? "✅ Complete" : "🔄 In Progress"}
          </span>

          {/* Mobile tab switcher */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3, gap: 2 }} className="md-hidden">
            {(["chat", "preview"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                style={{
                  padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: mobileTab === tab ? "#fff" : "transparent",
                  color: mobileTab === tab ? "#0e7490" : "#94a3b8",
                  boxShadow: mobileTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {tab === "chat" ? "💬 Chat" : "👁 Preview"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 0 }}>

        {/* ── LEFT: Chat panel ── */}
        <div style={{
          width: 380, flexShrink: 0, display: "flex", flexDirection: "column",
          borderRight: "1px solid #e2e8f0", background: "#fff",
          overflow: "hidden",
        }}>
          {/* Checklist */}
          <div style={{ padding: "14px 14px 0", flexShrink: 0 }}>
            <BuilderChecklist currentStep={currentStep} />
          </div>

          {/* Chat */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <BuilderChat
              templateName={templateName}
              templateType={templateType}
              customization={customization}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              onCustomizationChange={handleCustomizationChange}
            />
          </div>
        </div>

        {/* ── RIGHT: Preview panel ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#e2e8f0" }}>
          {/* Preview header */}
          <div style={{
            background: "#fff", borderBottom: "1px solid #e2e8f0",
            padding: "10px 16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#f87171", "#fbbf24", "#4ade80"].map((c) => (
                  <span key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
                ))}
              </div>
              <div style={{
                background: "#f1f5f9", borderRadius: 6, padding: "4px 12px",
                fontSize: 12, color: "#64748b", minWidth: 200,
              }}>
                yourtradeswebsite.co.uk
              </div>
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
              Live preview — updates as you choose
            </span>
          </div>

          {/* Preview frame */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
            <div style={{
              background: "#fff", borderRadius: 12, overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)", height: "100%", minHeight: 600,
            }}>
              <TemplatePreviewFrame
                customization={customization}
                templateName={templateName}
                templateThumb={templateThumb}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
          <p style={{ color: "#64748b" }}>Loading builder…</p>
        </div>
      </div>
    }>
      <BuilderInner />
    </Suspense>
  );
}
