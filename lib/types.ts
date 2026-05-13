// Shared runtime types: answers map + Supabase row + autosave payload.

export type AnswerPrimitive = string | number | boolean | null;
/** A single field-group's answers, keyed by sub-question id. */
export type FieldGroupAnswer = Record<string, AnswerPrimitive>;
/** A repeatable-group's answers: an array of field-group answers. */
export type RepeatableAnswer = FieldGroupAnswer[];
/** A time-range answer. */
export type TimeRangeAnswer = { open: string; close: string };

export type AnswerValue =
  | AnswerPrimitive
  | string[]
  | FieldGroupAnswer
  | RepeatableAnswer
  | TimeRangeAnswer;

export type Answers = Record<string, AnswerValue>;

export interface SubmissionRow {
  id: string;
  resume_token: string;
  email: string | null;
  phone: string | null;
  tax_identification_number: string | null;
  current_section_index: number;
  answers: Answers;
  satisfaction_rating: number | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

/** Body sent from the client to POST /api/submission (autosave). */
export interface AutosavePayload {
  submissionId: string | null;
  resumeToken: string | null;
  answers: Answers;
  currentSectionIndex: number;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  satisfactionRating: number | null;
  completed?: boolean;
}

/** Response from POST /api/submission. */
export interface SubmissionResponse {
  id: string;
  resumeToken: string;
}

/** Response from GET /api/submission?token=... */
export interface LoadSubmissionResponse {
  found: boolean;
  submission?: {
    id: string;
    resumeToken: string;
    answers: Answers;
    currentSectionIndex: number;
    completed: boolean;
  };
}

export interface UploadResponse {
  path: string;
  publicUrl: string;
}
