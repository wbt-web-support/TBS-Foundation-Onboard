"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import {
  trackStepViewed,
  trackStepCompleted,
  trackStepBack,
  trackFieldErrored,
  trackFormCompleted,
} from "@/lib/analytics/track";
import { SaveProgressHost } from "@/components/save-progress/SaveProgressButton";
import { LOCAL_RESUME_SESSION_PREFIX, readLocalResumeSession } from "@/lib/saveProgress/localResumeSession";
import { extractAppAnswersFromDatabase, normalizeCompanyAnswers } from "@/lib/submission/persistAnswers";
import {
  firstIncompleteSectionBefore,
  overallProgress,
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
import { isQuestionVisible } from "@/lib/schema/visibility";
import { Sidebar } from "./Sidebar";
import { SectionView } from "./SectionView";
import { ResumeRestoreModal } from "./ResumeRestoreModal";
import { Icon } from "@/components/ui/Icon";

const TOKEN_KEY = "fo_resume_token";
/** Survives URL strip + React Strict Mode remount so local resume still runs once. */
const PENDING_RESUME_SESSION_KEY = "fo_pending_resume_session";
/** Per resume token: user already saw/dismissed the restore modal this browser session. */
const RESTORE_MODAL_SEEN_PREFIX = "fo_restore_modal_seen:";
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
  | { type: "CLEAR_ANSWERS"; questionIds: string[] }
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
    case "CLEAR_ANSWERS": {
      const next = { ...state.answers };
      for (const id of action.questionIds) delete next[id];
      return { ...state, answers: next };
    }
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
  if (!section) return undefined;
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

function restoreModalSeenKey(resumeToken: string): string {
  return `${RESTORE_MODAL_SEEN_PREFIX}${resumeToken}`;
}

function hasSeenRestoreModal(resumeToken: string): boolean {
  try {
    return window.sessionStorage.getItem(restoreModalSeenKey(resumeToken)) === "1";
  } catch {
    return false;
  }
}

function markRestoreModalSeen(resumeToken: string): void {
  try {
    window.sessionStorage.setItem(restoreModalSeenKey(resumeToken), "1");
  } catch {
    /* ignore */
  }
}

/** `?token=` present on first page load (not added later by save-progress redirect). */
function captureInitialUrlToken(ref: { current: string | null | undefined }): string | null {
  if (ref.current === undefined) {
    ref.current =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;
  }
  return ref.current;
}

/** Restore modal: email link on first load with saved answers, once per token until dismissed. */
function shouldPromptResumeRestore(
  answers: Answers,
  resumeToken: string,
  arrivedViaEmailLink: boolean,
): boolean {
  if (!arrivedViaEmailLink || !hasAnyAnswer(answers) || !resumeToken) return false;
  return !hasSeenRestoreModal(resumeToken);
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
  const initialUrlTokenRef = useRef<string | null | undefined>(undefined);
  const didFirstSave = useRef(false);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track when the user entered the current step (for time-on-step calculation)
  const stepEnteredAtRef = useRef<number>(Date.now());

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
    const token = stateRef.current.resumeToken;
    if (token) markRestoreModalSeen(token);
    try {
      window.sessionStorage.removeItem(PENDING_RESUME_SESSION_KEY);
    } catch {
      /* ignore */
    }
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
        const arrivedViaEmailLink =
          tokenWasInUrl && captureInitialUrlToken(initialUrlTokenRef) != null;
        const showRestoreModal = shouldPromptResumeRestore(
          answers,
          sub.resumeToken,
          arrivedViaEmailLink,
        );
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
        captureInitialUrlToken(initialUrlTokenRef);

        if (urlToken) {
          try {
            window.sessionStorage.removeItem(PENDING_RESUME_SESSION_KEY);
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
              dispatch({
                type: "HYDRATE",
                payload: {
                  submissionId: local.submissionId,
                  resumeToken: local.resumeToken,
                  answers: normalizeCompanyAnswers(local.answers),
                  currentSectionIndex: clampSection(local.currentSectionIndex),
                  completed: false,
                  emailSent: Boolean(emailValue && EMAIL_RE.test(emailValue)),
                },
              });
            }
            return;
          }

          try {
            window.sessionStorage.removeItem(PENDING_RESUME_SESSION_KEY);
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

  // --- analytics: track step views ----------------------------------------
  useEffect(() => {
    if (!state.hydrated) return;
    const section = ONBOARDING_SCHEMA.sections[state.currentSectionIndex];
    if (!section) return;
    stepEnteredAtRef.current = Date.now();
    trackStepViewed(section.title);
  }, [state.currentSectionIndex, state.hydrated]);

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

    // Cascade-clear answers for questions that become hidden after this change.
    // Loop until stable so that clearing one answer doesn't leave dependents dirty.
    const working = { ...stateRef.current.answers, [questionId]: value };
    const toClear: string[] = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const section of ONBOARDING_SCHEMA.sections) {
        for (const question of section.questions) {
          if (
            question.visibleIf &&
            !isQuestionVisible(question, working) &&
            working[question.id] !== undefined &&
            !toClear.includes(question.id)
          ) {
            toClear.push(question.id);
            delete working[question.id];
            changed = true;
          }
        }
      }
    }
    if (toClear.length > 0) dispatch({ type: "CLEAR_ANSWERS", questionIds: toClear });

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
      const currentSection = ONBOARDING_SCHEMA.sections[s.currentSectionIndex];

      if (target > s.currentSectionIndex) {
        const block = firstIncompleteSectionBefore(target, s.answers, s.currentSectionIndex);
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
        // Forward navigation: step completed
        if (currentSection) {
          const timeSpentMs = Date.now() - stepEnteredAtRef.current;
          trackStepCompleted(currentSection.title, timeSpentMs);
        }
      } else if (target < s.currentSectionIndex) {
        // Back navigation
        const targetSection = ONBOARDING_SCHEMA.sections[target];
        if (currentSection && targetSection) {
          trackStepBack(currentSection.title, targetSection.title);
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
      // Track each field that triggered a validation error
      for (const q of missing) {
        trackFieldErrored(section.title, q.id);
      }
      return;
    }
    setValidationErrors(new Set());
    setSectionValidationMessage(null);
    if (s.currentSectionIndex >= LAST_SECTION) {
      await save({ completed: true }, { force: true });
      trackFormCompleted();
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
          <MobileProgressHeader />
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

function MobileProgressHeader() {
  const { answers, currentSectionIndex, completed, goToSection } = useOnboarding();
  const section = ONBOARDING_SCHEMA.sections[currentSectionIndex];
  const overall = overallProgress(answers, currentSectionIndex);
  if (completed || !section) return null;
  return (
    <div className="sticky top-14 z-10 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Step {section.number} of {ONBOARDING_SCHEMA.sections.length}
          </p>
          <p className="truncate text-sm font-semibold text-slate-800">{section.title}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-brand-600">{overall}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${overall >= 100 ? "bg-emerald-500" : "bg-brand-500"}`}
          style={{ width: `${overall}%` }}
        />
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
        {ONBOARDING_SCHEMA.sections.map((s, i) => {
          const isActive = i === currentSectionIndex;
          const isDone = i < currentSectionIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToSection(i)}
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : isDone
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {s.number}
            </button>
          );
        })}
      </div>
    </div>
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
