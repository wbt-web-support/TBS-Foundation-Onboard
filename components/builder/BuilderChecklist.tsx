"use client";

import type { BuilderStep } from "@/lib/builder/types";
import { BUILDER_STEPS, STEP_LABELS } from "@/lib/builder/types";

const STEP_ICONS: Record<BuilderStep, string> = {
  welcome: "🖼️",
  color: "🎨",
  button: "🔲",
  font: "🔤",
  header: "📐",
  footer: "📋",
  done: "✅",
};

export function BuilderChecklist({ currentStep }: { currentStep: BuilderStep }) {
  const currentIndex = BUILDER_STEPS.indexOf(currentStep);
  const checklistSteps = BUILDER_STEPS.filter((s) => s !== "done");

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
      padding: "16px 14px", display: "flex", flexDirection: "column", gap: 0,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
        Your Progress
      </p>
      {checklistSteps.map((step, i) => {
        const stepIndex = BUILDER_STEPS.indexOf(step);
        const isDone = stepIndex < currentIndex;
        const isActive = step === currentStep;
        const isPending = stepIndex > currentIndex;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", position: "relative" }}>
            {/* Connector line */}
            {i < checklistSteps.length - 1 && (
              <div style={{
                position: "absolute", left: 14, top: 30, width: 2, height: 16,
                background: isDone ? "#14b8a6" : "#e2e8f0",
                zIndex: 0,
              }} />
            )}
            {/* Icon */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, zIndex: 1,
              background: isDone ? "#14b8a6" : isActive ? "#0e7490" : "#f1f5f9",
              border: isActive ? "2px solid #0e7490" : isDone ? "2px solid #14b8a6" : "2px solid #e2e8f0",
              boxShadow: isActive ? "0 0 0 3px rgba(14,116,144,0.15)" : "none",
              transition: "all 0.3s",
            }}>
              {isDone ? (
                <svg viewBox="0 0 20 20" fill="white" style={{ width: 14, height: 14 }}>
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span style={{ filter: isPending ? "grayscale(1) opacity(0.4)" : "none" }}>
                  {STEP_ICONS[step]}
                </span>
              )}
            </div>
            {/* Label */}
            <div>
              <p style={{
                fontSize: 13, fontWeight: isActive ? 700 : isDone ? 600 : 400,
                color: isDone ? "#0e7490" : isActive ? "#0f172a" : "#94a3b8",
                margin: 0, lineHeight: 1,
              }}>
                {STEP_LABELS[step]}
              </p>
              {isDone && (
                <p style={{ fontSize: 10, color: "#14b8a6", margin: "2px 0 0", fontWeight: 500 }}>Completed ✓</p>
              )}
              {isActive && (
                <p style={{ fontSize: 10, color: "#0e7490", margin: "2px 0 0", fontWeight: 500 }}>In progress…</p>
              )}
            </div>
          </div>
        );
      })}

      {/* Overall progress bar */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Overall</span>
          <span style={{ fontSize: 11, color: "#0e7490", fontWeight: 700 }}>
            {Math.round((Math.max(0, currentIndex - 1) / (BUILDER_STEPS.length - 2)) * 100)}%
          </span>
        </div>
        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg,#14b8a6,#0e7490)",
            width: `${Math.round((Math.max(0, currentIndex - 1) / (BUILDER_STEPS.length - 2)) * 100)}%`,
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>
    </div>
  );
}
