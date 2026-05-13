"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import { sectionMissingRequired } from "@/lib/schema/progress";
import { asNumberOrNull, asStringOrNull, getByPath } from "@/lib/answers";
import type {
  Answers,
  AnswerValue,
  AutosavePayload,
  LoadSubmissionResponse,
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
import { Icon } from "@/components/ui/Icon";

const TOKEN_KEY = "fo_resume_token";
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
    ...overrides,
  };
}

function hasAnyAnswer(answers: Answers): boolean {
  return Object.keys(answers).length > 0;
}

// --- component ------------------------------------------------------------

export default function OnboardingApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

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
      if (!s.submissionId && !hasAnyAnswer(s.answers) && !opts?.force) return;

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

        let submissionId = s.submissionId;
        if (!submissionId) {
          submissionId = data.id;
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

        if (submissionId && !stateRef.current.emailSent && body.email && EMAIL_RE.test(body.email)) {
          void triggerResumeEmail(submissionId);
        }
      } catch {
        dispatch({ type: "SET_SAVE_STATUS", status: "error" });
      }
    },
    [router, triggerResumeEmail],
  );

  const flushSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    await save();
  }, [save]);

  // --- restore on load ----------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const urlToken = searchParams.get("token");
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    const token = urlToken || stored;

    (async () => {
      if (!token) {
        dispatch({ type: "HYDRATE", payload: {} });
        return;
      }
      try {
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
          if (urlToken !== sub.resumeToken) {
            const params = new URLSearchParams(window.location.search);
            params.set("token", sub.resumeToken);
            router.replace(`/?${params.toString()}`);
          }
          const answers = sub.answers ?? {};
          const emailValue = asStringOrNull(getByPath(answers, ONBOARDING_SCHEMA.emailCapturePath));
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
        } else {
          dispatch({ type: "HYDRATE", payload: {} });
        }
      } catch {
        if (!cancelled) dispatch({ type: "HYDRATE", payload: {} });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- debounced autosave -------------------------------------------------
  const didFirstSave = useRef(false);
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
  const setAnswer = useCallback((questionId: string, value: AnswerValue) => {
    dispatch({ type: "SET_ANSWER", questionId, value });
    setValidationErrors((prev) => {
      if (!prev.has(questionId)) return prev;
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  }, []);

  const goToSection = useCallback(
    async (index: number) => {
      const target = clampSection(index);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      await save({ currentSectionIndex: target });
      dispatch({ type: "GOTO_SECTION", index: target });
      setValidationErrors(new Set());
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [save],
  );

  const goBack = useCallback(() => {
    void goToSection(stateRef.current.currentSectionIndex - 1);
  }, [goToSection]);

  const goNext = useCallback(async () => {
    const s = stateRef.current;
    const section = ONBOARDING_SCHEMA.sections[s.currentSectionIndex];
    const missing = sectionMissingRequired(section, s.answers);
    if (missing.length > 0) {
      setValidationErrors(new Set(missing.map((q) => q.id)));
      const el = document.getElementById(`q-${missing[0].id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setValidationErrors(new Set());
    if (s.currentSectionIndex >= LAST_SECTION) {
      await save({ completed: true }, { force: true });
      dispatch({ type: "MARK_COMPLETED" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await goToSection(s.currentSectionIndex + 1);
    }
  }, [save, goToSection]);

  const uploadFile = useCallback(
    async (questionId: string, file: File): Promise<string> => {
      if (!stateRef.current.submissionId) {
        await save(undefined, { force: true });
      }
      const submissionId = stateRef.current.submissionId;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("questionId", questionId);
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
      saveStatus: state.saveStatus,
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
      state.emailSent,
      state.completed,
      validationErrors,
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      </div>
    );
  }

  return (
    <OnboardingContext.Provider value={ctx}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
            {state.completed ? <CompletedScreen /> : <SectionView />}
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
