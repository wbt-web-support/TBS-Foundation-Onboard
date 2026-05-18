"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { SaveProgressHost } from "@/components/save-progress/SaveProgressButton";
import {
  LOCAL_RESUME_SESSION_PREFIX,
  consumeExplicitSavePending,
  readLocalResumeSession,
} from "@/lib/saveProgress/localResumeSession";
import { extractAppAnswersFromDatabase } from "@/lib/submission/persistAnswers";
import {
  firstIncompleteSectionBefore,
  sectionMissingRequired,
  sectionVisibleQuestionCompletion,
} from "@/lib/schema/progress";
import { asNumberOrNull, asStringOrNull, getByPath } from "@/lib/answers";
import type {
  Answers,
  AnswerValue,
  AutosavePayload,
  LoadSubmissionResponse,
  SectionQuestionProgressSnapshot,
  SubmissionResponse,
  UploadResponse,
} from "@/lib/types";
import {
  OnboardingContext,
  useOnboarding,
  type OnboardingContextValue,
  type SaveStatus,
} from "./OnboardingContext";
import { Sidebar } from "./Sidebar";
import { SectionView } from "./SectionView";
import { ResumeRestoreModal } from "./ResumeRestoreModal";
import { Icon } from "@/components/ui/Icon";

const TOKEN_KEY = "fo_resume_token";
/** Survives URL strip + React Strict Mode remount so local resume still runs once. */
const PENDING_RESUME_SESSION_KEY = "fo_pending_resume_session";
/** Until dismissed: reopen restore modal after hydrate (Strict Mode / `router.replace` remount). */
const RESUME_RESTORE_MODAL_FLAG = "fo_resume_restore_modal_prompt";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LAST_SECTION = ONBOARDING_SCHEMA.sections.length - 1;

function clampSection(index: number | undefined | null): number {
  const n = typeof index === "number" && Number.isFinite(index) ? index : 0;
  return Math.max(0, Math.min(n, LAST_SECTION));
}

// --- reducer --------------------------------------------------------------

interface State {
  hydrated: boolean;
  submissionId: string | null;
  resumeToken: string | null;
  answers: Answers;
  currentSectionIndex: number;
  saveStatus: SaveStatus;
  emailSent: boolean;
  completed: boolean;
}

type Action =
  | { type: "HYDRATE"; payload: Partial<State> }
  | { type: "SET_ANSWER"; questionId: string; value: AnswerValue }
  | { type: "GOTO_SECTION"; index: number }
  | { type: "SET_SAVE_STATUS"; status: SaveStatus }
  | { type: "SET_IDS"; submissionId: string; resumeToken: string }
  | { type: "MARK_EMAIL_SENT" }
  | { type: "MARK_COMPLETED" }
  | { type: "RESET" };

const initialState: State = {
  hydrated: false,
  submissionId: null,
  resumeToken: null,
  answers: {},
  currentSectionIndex: 0,
  saveStatus: "idle",
  emailSent: false,
  completed: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, hydrated: true };
    case "SET_ANSWER":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value } };
    case "GOTO_SECTION":
      return { ...state, currentSectionIndex: clampSection(action.index) };
    case "SET_SAVE_STATUS":
      return { ...state, saveStatus: action.status };
    case "SET_IDS":
      return { ...state, submissionId: action.submissionId, resumeToken: action.resumeToken };
    case "MARK_EMAIL_SENT":
      return { ...state, emailSent: true };
    case "MARK_COMPLETED":
      return { ...state, completed: true };
    case "RESET":
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}

// --- helpers --------------------------------------------------------------

function buildSectionQuestionProgressSnapshot(
  currentSectionIndex: number,
  answers: Answers,
): SectionQuestionProgressSnapshot | undefined {
  const section = ONBOARDING_SCHEMA.sections[currentSectionIndex];
  if (!section || section.kind === "intro") return undefined;
  const { completed, total } = sectionVisibleQuestionCompletion(section, answers);
  if (total === 0) return undefined;
  return { sectionId: section.id, completed, total };
}

function buildPayload(state: State, overrides?: Partial<AutosavePayload>): AutosavePayload {
  const a = state.answers;
  return {
    submissionId: state.submissionId,
    resumeToken: state.resumeToken,
    answers: a,
    currentSectionIndex: state.currentSectionIndex,
    email: asStringOrNull(getByPath(a, ONBOARDING_SCHEMA.keyFields.email)),
    phone: asStringOrNull(getByPath(a, ONBOARDING_SCHEMA.keyFields.phone)),
    taxId: asStringOrNull(getByPath(a, ONBOARDING_SCHEMA.keyFields.taxId)),
    satisfactionRating: asNumberOrNull(getByPath(a, ONBOARDING_SCHEMA.satisfactionPath)),
    sectionQuestionProgress: buildSectionQuestionProgressSnapshot(state.currentSectionIndex, a),
    ...overrides,
  };
}

function hasAnyAnswer(answers: Answers): boolean {
  return Object.keys(answers).length > 0;
}

/** Restore modal: after Save progress (same browser) or opening the resume link from email (?token=). */
function shouldPromptResumeRestore(answers: Answers, fromEmailLink: boolean): boolean {
  if (!hasAnyAnswer(answers)) return false;
  if (fromEmailLink) return true;
  return consumeExplicitSavePending();
}

// --- component ------------------------------------------------------------

export default function OnboardingApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [sectionValidationMessage, setSectionValidationMessage] = useState<string | null>(null);
  const [resumeRestoreModalOpen, setResumeRestoreModalOpen] = useState(false);
  const lastRestoredResumeKeyRef = useRef<string | null>(null);
  /** Prevents duplicate restore; changes when URL token / resume key changes. */
  const restoreSourceRef = useRef<string | null>(null);
  const didFirstSave = useRef(false);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- magic-link email ---------------------------------------------------
  const triggerResumeEmail = useCallback(async (submissionId: string) => {
    try {
      const res = await fetch("/api/resume-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      if (res.ok) dispatch({ type: "MARK_EMAIL_SENT" });
    } catch {
      /* email is best-effort */
    }
  }, []);

  // --- save ---------------------------------------------------------------
  const save = useCallback(
    async (overrides?: Partial<AutosavePayload>, opts?: { force?: boolean }) => {
      const s = stateRef.current;
      if (!s.submissionId && !hasAnyAnswer(s.answers) && !opts?.force) return null;

      const body = buildPayload(s, overrides);
      dispatch({ type: "SET_SAVE_STATUS", status: "saving" });
      try {
        const res = await fetch("/api/submission", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`save ${res.status}`);
        const data: SubmissionResponse = await res.json();

        let submissionId = s.submissionId ?? data.id;
        if (!s.submissionId) {
          dispatch({ type: "SET_IDS", submissionId: data.id, resumeToken: data.resumeToken });
          try {
            window.localStorage.setItem(TOKEN_KEY, data.resumeToken);
          } catch {
            /* ignore */
          }
          const params = new URLSearchParams(window.location.search);
          params.set("token", data.resumeToken);
          router.replace(`/?${params.toString()}`);
        }
        dispatch({ type: "SET_SAVE_STATUS", status: "saved" });

        return { id: submissionId, resumeToken: data.resumeToken };
      } catch {
        dispatch({ type: "SET_SAVE_STATUS", status: "error" });
        return null;
      }
    },
    [router, triggerResumeEmail],
  );

  const flushSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    return save(undefined, { force: true });
  }, [save]);

  const dismissResumeRestoreModal = useCallback(() => {
    try {
      window.sessionStorage.removeItem(PENDING_RESUME_SESSION_KEY);
      window.sessionStorage.removeItem(RESUME_RESTORE_MODAL_FLAG);
    } catch {
      /* ignore */
    }
    lastRestoredResumeKeyRef.current = null;
    restoreSourceRef.current = null;
    setResumeRestoreModalOpen(false);
  }, []);

  const handleResumeStartOver = useCallback(() => {
    const key = lastRestoredResumeKeyRef.current;
    if (key) {
      try {
        window.localStorage.removeItem(`${LOCAL_RESUME_SESSION_PREFIX}${key}`);
      } catch {
        /* ignore */
      }
    }
    try {
      window.sessionStorage.removeItem(PENDING_RESUME_SESSION_KEY);
      window.sessionStorage.removeItem(RESUME_RESTORE_MODAL_FLAG);
    } catch {
      /* ignore */
    }
    lastRestoredResumeKeyRef.current = null;
    restoreSourceRef.current = null;
    setResumeRestoreModalOpen(false);
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    didFirstSave.current = false;
    dispatch({ type: "RESET" });
    setValidationErrors(new Set());
    router.replace("/");
  }, [router]);

  // --- restore on load ----------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const readClientSearchParams = () => {
      if (typeof window === "undefined") return new URLSearchParams();
      return new URLSearchParams(window.location.search);
    };

    const urlParams = readClientSearchParams();
    const urlToken = urlParams.get("token") ?? searchParams.get("token");
    const urlResume = urlParams.get("resume") ?? searchParams.get("resume");

    const sourceKey = urlToken
      ? `token:${urlToken}`
      : urlResume
        ? `resume:${urlResume}`
        : "stored";

    if (restoreSourceRef.current === sourceKey && stateRef.current.hydrated) {
      return;
    }

    const paramsWithoutResume = () => {
      const p = readClientSearchParams();
      p.delete("resume");
      return p;
    };

    const hydrateFromServer = async (token: string, tokenWasInUrl: boolean) => {
      const res = await fetch(`/api/submission?token=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("load failed");
      const data: LoadSubmissionResponse = await res.json();
      if (cancelled) return;
      if (data.found && data.submission) {
        const sub = data.submission;
        try {
          window.localStorage.setItem(TOKEN_KEY, sub.resumeToken);
        } catch {
          /* ignore */
        }
        if (tokenWasInUrl && token !== sub.resumeToken) {
          const params = readClientSearchParams();
          params.set("token", sub.resumeToken);
          router.replace(`/?${params.toString()}`);
        }
        const answers = extractAppAnswersFromDatabase(sub.answers ?? {});
        const emailValue = asStringOrNull(getByPath(answers, ONBOARDING_SCHEMA.emailCapturePath));
        restoreSourceRef.current = `token:${sub.resumeToken}`;
        didFirstSave.current = false;
        const showRestoreModal = shouldPromptResumeRestore(answers, tokenWasInUrl);
        if (showRestoreModal) {
          try {
            window.sessionStorage.setItem(RESUME_RESTORE_MODAL_FLAG, "1");
          } catch {
            /* ignore */
          }
        }
        dispatch({
          type: "HYDRATE",
          payload: {
            submissionId: sub.id,
            resumeToken: sub.resumeToken,
            answers,
            currentSectionIndex: clampSection(sub.currentSectionIndex),
            completed: sub.completed,
            emailSent: Boolean(emailValue && EMAIL_RE.test(emailValue)),
          },
        });
        if (showRestoreModal) setResumeRestoreModalOpen(true);
      } else {
        restoreSourceRef.current = sourceKey;
        dispatch({ type: "HYDRATE", payload: {} });
      }
    };

    void (async () => {
      try {
        if (urlToken) {
          try {
            window.sessionStorage.removeItem(PENDING_RESUME_SESSION_KEY);
            window.sessionStorage.removeItem(RESUME_RESTORE_MODAL_FLAG);
          } catch {
            /* ignore */
          }
          await hydrateFromServer(urlToken, true);
          return;
        }

        if (urlResume) {
          try {
            window.sessionStorage.setItem(PENDING_RESUME_SESSION_KEY, urlResume);
          } catch {
            /* ignore */
          }
        }

        let resumeKey: string | null = urlResume;
        if (!resumeKey) {
          try {
            resumeKey = window.sessionStorage.getItem(PENDING_RESUME_SESSION_KEY);
          } catch {
            resumeKey = null;
          }
        }

        if (resumeKey) {
          const local = readLocalResumeSession(resumeKey);
          const params = paramsWithoutResume();

          if (local) {
            lastRestoredResumeKeyRef.current = resumeKey;
            if (local.resumeToken) {
              params.set("token", local.resumeToken);
              try {
                window.localStorage.setItem(TOKEN_KEY, local.resumeToken);
              } catch {
                /* ignore */
              }
            }
            const qs = params.toString();
            if (!cancelled) router.replace(qs ? `/?${qs}` : "/");

            const emailValue = asStringOrNull(
              getByPath(local.answers, ONBOARDING_SCHEMA.emailCapturePath),
            );
            if (!cancelled) {
              restoreSourceRef.current = `resume:${resumeKey}`;
              didFirstSave.current = false;
              const showRestoreModal = shouldPromptResumeRestore(local.answers, false);
              if (showRestoreModal) {
                try {
                  window.sessionStorage.setItem(RESUME_RESTORE_MODAL_FLAG, "1");
                } catch {
                  /* ignore */
                }
              }
              dispatch({
                type: "HYDRATE",
                payload: {
                  submissionId: local.submissionId,
                  resumeToken: local.resumeToken,
                  answers: local.answers,
                  currentSectionIndex: clampSection(local.currentSectionIndex),
                  completed: false,
                  emailSent: Boolean(emailValue && EMAIL_RE.test(emailValue)),
                },
              });
              if (showRestoreModal) setResumeRestoreModalOpen(true);
            }
            return;
          }

          try {
            window.sessionStorage.removeItem(PENDING_RESUME_SESSION_KEY);
            window.sessionStorage.removeItem(RESUME_RESTORE_MODAL_FLAG);
          } catch {
            /* ignore */
          }
          const qs = params.toString();
          if (!cancelled) router.replace(qs ? `/?${qs}` : "/");
        }

        let stored: string | null = null;
        try {
          stored = window.localStorage.getItem(TOKEN_KEY);
        } catch {
          /* ignore */
        }

        if (stored) {
          await hydrateFromServer(stored, false);
          return;
        }

        if (!cancelled) {
          restoreSourceRef.current = "fresh";
          dispatch({ type: "HYDRATE", payload: {} });
        }
      } catch {
        if (!cancelled) {
          restoreSourceRef.current = sourceKey;
          dispatch({ type: "HYDRATE", payload: {} });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      if (window.sessionStorage.getItem(RESUME_RESTORE_MODAL_FLAG) === "1") {
        setResumeRestoreModalOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [state.hydrated]);

  // --- debounced autosave -------------------------------------------------
  useEffect(() => {
    if (!state.hydrated) return;
    // Skip the very first run right after hydrate (nothing changed yet).
    if (!didFirstSave.current) {
      didFirstSave.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void save();
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [state.answers, state.currentSectionIndex, state.hydrated, save]);

  // --- best-effort save on unload ----------------------------------------
  useEffect(() => {
    const flushBeacon = () => {
      const s = stateRef.current;
      if (!s.submissionId && !hasAnyAnswer(s.answers)) return;
      try {
        const body = JSON.stringify(buildPayload(s));
        navigator.sendBeacon("/api/submission", new Blob([body], { type: "application/json" }));
      } catch {
        /* ignore */
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushBeacon();
    };
    window.addEventListener("beforeunload", flushBeacon);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flushBeacon);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // --- actions ------------------------------------------------------------
  const applyValidationFailure = useCallback(
    (missing: { id: string }[], message: string) => {
      setValidationErrors(new Set(missing.map((q) => q.id)));
      setSectionValidationMessage(message);
      const el = document.getElementById(`q-${missing[0]?.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [],
  );

  const setAnswer = useCallback((questionId: string, value: AnswerValue) => {
    dispatch({ type: "SET_ANSWER", questionId, value });
    setValidationErrors((prev) => {
      if (!prev.has(questionId)) return prev;
      const next = new Set(prev);
      next.delete(questionId);
      if (next.size === 0) setSectionValidationMessage(null);
      return next;
    });
  }, []);

  const goToSection = useCallback(
    async (index: number) => {
      const s = stateRef.current;
      const target = clampSection(index);

      if (target > s.currentSectionIndex) {
        const block = firstIncompleteSectionBefore(target, s.answers);
        if (block) {
          const targetSection = ONBOARDING_SCHEMA.sections[target];
          const message =
            block.sectionIndex === s.currentSectionIndex
              ? "Please complete all required fields in this section before continuing."
              : `Complete Step ${block.section.number}: ${block.section.title} before opening Step ${targetSection.number}: ${targetSection.title}.`;
          applyValidationFailure(block.missing, message);
          if (block.sectionIndex !== s.currentSectionIndex) {
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
              debounceRef.current = null;
            }
            await save({ currentSectionIndex: block.sectionIndex });
            dispatch({ type: "GOTO_SECTION", index: block.sectionIndex });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          return;
        }
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      await save({ currentSectionIndex: target });
      dispatch({ type: "GOTO_SECTION", index: target });
      setValidationErrors(new Set());
      setSectionValidationMessage(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [save, applyValidationFailure],
  );

  const goBack = useCallback(() => {
    void goToSection(stateRef.current.currentSectionIndex - 1);
  }, [goToSection]);

  const goNext = useCallback(async () => {
    const s = stateRef.current;
    const section = ONBOARDING_SCHEMA.sections[s.currentSectionIndex];
    const missing = sectionMissingRequired(section, s.answers);
    if (missing.length > 0) {
      applyValidationFailure(
        missing,
        `Please complete all required fields in Step ${section.number}: ${section.title} before continuing.`,
      );
      return;
    }
    setValidationErrors(new Set());
    setSectionValidationMessage(null);
    if (s.currentSectionIndex >= LAST_SECTION) {
      await save({ completed: true }, { force: true });
      dispatch({ type: "MARK_COMPLETED" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await goToSection(s.currentSectionIndex + 1);
    }
  }, [save, goToSection, applyValidationFailure]);

  const uploadFile = useCallback(
    async (questionId: string, file: File): Promise<string> => {
      if (!stateRef.current.submissionId) {
        await save(undefined, { force: true });
      }
      const submissionId = stateRef.current.submissionId;
      const companyName =
        asStringOrNull(getByPath(stateRef.current.answers, "company_details.company_name")) ?? "unknown-company";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("questionId", questionId);
      fd.append("companyName", companyName);
      if (submissionId) fd.append("submissionId", submissionId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`upload ${res.status}`);
      const data: UploadResponse = await res.json();
      return data.publicUrl || data.path;
    },
    [save],
  );

  const resendEmail = useCallback(() => {
    const s = stateRef.current;
    if (s.submissionId) {
      void triggerResumeEmail(s.submissionId);
      return;
    }
    void flushSave().then(() => {
      const id = stateRef.current.submissionId;
      if (id) void triggerResumeEmail(id);
    });
  }, [flushSave, triggerResumeEmail]);

  const signOut = useCallback(() => {
    restoreSourceRef.current = null;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    didFirstSave.current = false;
    dispatch({ type: "RESET" });
    setValidationErrors(new Set());
    setSectionValidationMessage(null);
    router.replace("/");
  }, [router]);

  const email = asStringOrNull(getByPath(state.answers, ONBOARDING_SCHEMA.keyFields.email));

  const ctx: OnboardingContextValue = useMemo(
    () => ({
      answers: state.answers,
      setAnswer,
      currentSectionIndex: state.currentSectionIndex,
      goToSection: (i: number) => void goToSection(i),
      goNext: () => void goNext(),
      goBack,
      flushSave,
      uploadFile,
      validationErrors,
      sectionValidationMessage,
      saveStatus: state.saveStatus,
      submissionId: state.submissionId,
      resumeToken: state.resumeToken,
      email,
      emailSent: state.emailSent,
      resendEmail,
      signOut,
      completed: state.completed,
    }),
    [
      state.answers,
      state.currentSectionIndex,
      state.saveStatus,
      state.submissionId,
      state.resumeToken,
      state.emailSent,
      state.completed,
      validationErrors,
      sectionValidationMessage,
      email,
      setAnswer,
      goToSection,
      goNext,
      goBack,
      flushSave,
      uploadFile,
      resendEmail,
      signOut,
    ],
  );

  if (!state.hydrated) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      </div>
    );
  }

  return (
    <OnboardingContext.Provider value={ctx}>
      <ResumeRestoreModal
        open={resumeRestoreModalOpen}
        onClose={dismissResumeRestoreModal}
        onContinue={dismissResumeRestoreModal}
        onStartOver={handleResumeStartOver}
      />
      <SaveProgressHost />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <Sidebar />
        <main className="flex min-h-0 flex-1 flex-col overflow-x-clip">
          <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:px-8">
            {state.completed ? (
              <div className="flex flex-1 flex-col justify-center">
                <CompletedScreen />
              </div>
            ) : (
              <SectionView />
            )}
          </div>
        </main>
      </div>
    </OnboardingContext.Provider>
  );
}

function CompletedScreen() {
  const { goToSection } = useOnboarding();
  return (
    <div className="rounded-card border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
        <Icon name="check" className="size-6" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-ink">Thank you — your onboarding is complete</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
        We&apos;ve got everything we need to get started. We&apos;ll be in touch shortly. You can still revisit and
        update any section using the menu.
      </p>
      <button
        type="button"
        onClick={() => goToSection(0)}
        className="mt-5 text-sm font-medium text-brand-600 hover:underline"
      >
        Review my answers
      </button>
    </div>
  );
}
