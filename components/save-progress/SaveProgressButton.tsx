"use client";

import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { questionDisplayComplete } from "@/lib/schema/progress";
import type { Question } from "@/lib/schema/types";
import { asStringOrNull, getByPath } from "@/lib/answers";
import type { Answers } from "@/lib/types";
import {
  readSaveProgressNotifyEmail,
  writeLocalResumeSession,
  writeSaveProgressNotifyEmail,
  type LocalResumePayload,
} from "@/lib/saveProgress/localResumeSession";
import { SAVE_PROGRESS_UNLOCK_AFTER_QUESTION_ID } from "@/lib/saveProgress/unlock";
import { Icon } from "@/components/ui/Icon";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { SaveSuccessBanner } from "./SaveSuccessBanner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SaveProgressButtonProps {
  /** Display step number for email (e.g. sidebar section number). */
  currentStep: number;
  /** 0-based section index stored in the session snapshot. */
  currentSectionIndex: number;
  formData: Answers;
  totalSteps: number;
  /** Called after local session is written (e.g. scroll to top). */
  onRestoreSession?: () => void;
  /** `emailed` is false when the server has no mail configured but local save still succeeded. */
  onSaveSuccess: (emailed: boolean) => void;
}

export function SaveProgressButton({
  currentStep,
  currentSectionIndex,
  formData,
  totalSteps,
  onRestoreSession,
  onSaveSuccess,
}: SaveProgressButtonProps) {
  const { flushSave, completed, submissionId, resumeToken } = useOnboarding();
  const [phase, setPhase] = useState<"idle" | "loading" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const modalTitleId = useId();

  useEffect(() => {
    if (!emailModalOpen) return;
    const stored = readSaveProgressNotifyEmail();
    const fromForm = asStringOrNull(getByPath(formData, ONBOARDING_SCHEMA.keyFields.email));
    setModalEmail(stored ?? fromForm ?? "");
  }, [emailModalOpen, formData]);

  const runSave = useCallback(
    async (notifyEmail: string) => {
      setPhase("loading");
      setModalError(null);
      setErrorMsg(null);
      try {
        const saved = await flushSave();
        const serverToken = saved?.resumeToken ?? resumeToken;
        if (!serverToken) {
          throw new Error(
            "Could not save your progress to the server. Check your connection and try again.",
          );
        }

        const sessionKey = crypto.randomUUID();
        const savedAt = new Date().toISOString();
        const displayName = asStringOrNull(getByPath(formData, "your_name.first_name"));
        const businessEmail = asStringOrNull(getByPath(formData, ONBOARDING_SCHEMA.keyFields.email));
        const effectiveNotify =
          businessEmail && EMAIL_RE.test(businessEmail) ? businessEmail : notifyEmail.trim();
        const payload: LocalResumePayload = {
          v: 1,
          answers: { ...formData },
          currentSectionIndex,
          savedAt,
          notifyEmail: effectiveNotify,
          submissionId: saved?.id ?? submissionId,
          resumeToken: serverToken,
        };
        writeLocalResumeSession(sessionKey, payload);

        const resumeUrl = `${window.location.origin}${window.location.pathname}?token=${encodeURIComponent(serverToken)}`;

        const res = await fetch("/api/save-progress-email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            to: notifyEmail.trim(),
            businessEmail: businessEmail && EMAIL_RE.test(businessEmail) ? businessEmail : undefined,
            resumeUrl,
            savedAt,
            currentStep,
            totalSteps,
            referenceId: serverToken,
            displayName: displayName ?? undefined,
          }),
        });

        const saveEmailBody = (await res.json().catch(() => null)) as {
          ok?: boolean;
          emailed?: boolean;
          error?: string;
        } | null;

        if (!res.ok || saveEmailBody?.ok === false) {
          throw new Error(saveEmailBody?.error ?? `Email failed (${res.status})`);
        }

        const emailed = saveEmailBody?.emailed !== false;

        writeSaveProgressNotifyEmail(effectiveNotify);
        onRestoreSession?.();
        onSaveSuccess(emailed);
        setPhase("success");
        window.setTimeout(() => setPhase("idle"), 2200);
      } catch (e) {
        setPhase("idle");
        setErrorMsg(e instanceof Error ? e.message : "Save failed");
        window.setTimeout(() => setErrorMsg(null), 7000);
      }
    },
    [
      flushSave,
      formData,
      currentSectionIndex,
      submissionId,
      resumeToken,
      currentStep,
      totalSteps,
      onRestoreSession,
      onSaveSuccess,
    ],
  );

  const onFloatingClick = useCallback(() => {
    if (completed || phase === "loading") return;
    const fromForm = asStringOrNull(getByPath(formData, ONBOARDING_SCHEMA.keyFields.email));
    const stored = readSaveProgressNotifyEmail();
    const email =
      (stored && EMAIL_RE.test(stored) ? stored : null) ??
      (fromForm && EMAIL_RE.test(fromForm) ? fromForm : null);
    if (email) {
      void runSave(email);
    } else {
      setEmailModalOpen(true);
    }
  }, [completed, phase, formData, runSave]);

  const onModalSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const v = modalEmail.trim();
      if (!EMAIL_RE.test(v)) {
        setModalError("Enter a valid email address.");
        return;
      }
      setEmailModalOpen(false);
      void runSave(v);
    },
    [modalEmail, runSave],
  );

  if (completed) return null;

  return (
    <>
      {emailModalOpen ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => setEmailModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="w-full max-w-md rounded-card border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={modalTitleId} className="text-lg font-semibold text-ink">
              Save progress
            </h2>
            <p className="mt-1 text-sm text-muted">
              We&apos;ll email you a link to continue on any device. Enter your email:
            </p>
            <form onSubmit={onModalSubmit} className="mt-4 space-y-3">
              <input
                type="email"
                autoComplete="email"
                value={modalEmail}
                onChange={(e) => {
                  setModalEmail(e.target.value);
                  setModalError(null);
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-2"
                placeholder="you@company.com"
                required
              />
              {modalError ? <p className="text-sm text-rose-600">{modalError}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Save &amp; email
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed bottom-6 right-6 z-[1000] flex flex-col items-center gap-2">
        {errorMsg ? (
          <p className="pointer-events-auto max-w-[14rem] rounded-md bg-rose-50 px-2 py-1.5 text-center text-[11px] leading-snug text-rose-800 shadow">
            {errorMsg}
          </p>
        ) : null}
        <p className="pointer-events-none max-w-[7rem] text-center text-[11px] font-medium leading-tight tracking-wide text-slate-600">
          Click To
          <br />
          Save
          <br />
          Progress
        </p>
        <button
          type="button"
          onClick={onFloatingClick}
          disabled={phase === "loading"}
          aria-busy={phase === "loading"}
          aria-label="Save progress and email a resume link"
          className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-[#2a2a2a] text-white shadow-lg transition-transform duration-200 hover:scale-105 disabled:opacity-70"
        >
          {phase === "loading" ? (
            <span className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : phase === "success" ? (
            <Icon name="check" className="size-7 text-emerald-400" />
          ) : (
            <Icon name="floppy" className="size-7" />
          )}
        </button>
      </div>
    </>
  );
}

function findQuestionById(id: string): Question | undefined {
  for (const s of ONBOARDING_SCHEMA.sections) {
    const q = s.questions.find((x) => x.id === id);
    if (q) return q;
  }
  return undefined;
}

function SaveProgressHostInner() {
  const { answers, currentSectionIndex, completed } = useOnboarding();
  const [bannerOpen, setBannerOpen] = useState(false);
  const [bannerEmailSent, setBannerEmailSent] = useState(true);
  const section = ONBOARDING_SCHEMA.sections[currentSectionIndex];
  const stepDisplay = section?.number ?? currentSectionIndex + 1;
  const totalSteps = ONBOARDING_SCHEMA.sections.length;

  const unlockQuestion = useMemo(
    () => findQuestionById(SAVE_PROGRESS_UNLOCK_AFTER_QUESTION_ID),
    [],
  );
  const saveProgressUnlocked = useMemo(
    () => !unlockQuestion || questionDisplayComplete(unlockQuestion, answers),
    [unlockQuestion, answers],
  );

  if (completed) return null;

  return (
    <>
      <SaveSuccessBanner
        open={bannerOpen}
        emailSent={bannerEmailSent}
        onDismiss={() => setBannerOpen(false)}
      />
      {saveProgressUnlocked ? (
        <SaveProgressButton
          currentStep={stepDisplay}
          currentSectionIndex={currentSectionIndex}
          formData={answers}
          totalSteps={totalSteps}
          onSaveSuccess={(emailed) => {
            setBannerEmailSent(emailed);
            setBannerOpen(true);
          }}
          onRestoreSession={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
      ) : null}
    </>
  );
}

/** Floating save + success banner; must render inside `OnboardingContext`. */
export function SaveProgressHost() {
  return <SaveProgressHostInner />;
}
