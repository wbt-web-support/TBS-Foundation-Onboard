"use client";

import { createContext, useContext } from "react";
import type { Answers, AnswerValue } from "@/lib/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Result of an immediate server save (used for cross-browser resume links). */
export type SaveResult = { id: string; resumeToken: string } | null;

export interface OnboardingContextValue {
  answers: Answers;
  setAnswer: (questionId: string, value: AnswerValue) => void;
  currentSectionIndex: number;
  /** Free navigation from the sidebar. */
  goToSection: (index: number) => void;
  /** Validates the current section, then advances (or submits on the last one). */
  goNext: () => void;
  goBack: () => void;
  /** Cancel the debounce and save immediately. */
  flushSave: () => Promise<SaveResult>;
  /** Upload a file for a question; returns the stored URL/path. */
  uploadFile: (questionId: string, file: File) => Promise<string>;
  /** Question ids that failed required validation on the last Next. */
  validationErrors: Set<string>;
  /** Shown when Next or sidebar navigation is blocked by missing required fields. */
  sectionValidationMessage: string | null;
  saveStatus: SaveStatus;
  submissionId: string | null;
  resumeToken: string | null;
  email: string | null;
  emailSent: boolean;
  resendEmail: () => void;
  signOut: () => void;
  completed: boolean;
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within <OnboardingApp>");
  return ctx;
}
