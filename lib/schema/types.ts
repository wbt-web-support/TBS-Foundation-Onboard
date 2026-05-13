// The "schema language" for the onboarding questionnaire.
// Every question (and its conditional routing) is described declaratively here,
// then rendered generically. No per-step components.

export type QuestionType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "password"
  | "textarea"
  | "select"
  | "single-choice"
  | "multi-choice"
  | "file"
  | "time-range"
  | "year-select"
  | "field-group" // multiple sub-fields rendered once, in one card
  | "repeatable-group" // an array of sub-field sets ("add another")
  | "image-gallery-pick";

/** Sub-field types allowed inside field-group / repeatable-group cards. */
export type SubQuestionType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "password"
  | "textarea"
  | "select"
  | "single-choice"
  | "year-select"
  | "time";

export interface Option {
  value: string;
  label: string;
}

export interface GalleryOption {
  id: string;
  label: string;
  /** Placeholder allowed until real assets are supplied. */
  imageUrl: string;
}

/**
 * A single condition referencing another answer.
 * `questionId` may be a dotted path "cardId.subId" to reference a field-group sub-answer.
 * Inside a card, conditions resolve sibling sub-answers by bare id first.
 * Multiple comparison fields on one Condition are AND-ed together.
 */
export interface Condition {
  questionId: string;
  /** Strict equality. */
  equals?: string | number | boolean;
  /** Answer is one of these values. */
  oneOf?: Array<string | number | boolean>;
  /** Multi-choice answer array contains this value. */
  includes?: string;
  /** Multi-choice answer array contains at least one of these. */
  includesAny?: string[];
  /** Multi-choice answer array contains all of these. */
  includesAll?: string[];
  /** Multi-choice answer array contains at least `count` of `values`. */
  minIncludesFrom?: { values: string[]; count: number };
  /** Answer is a non-empty value. */
  isAnswered?: boolean;
  /** Negate the whole condition. */
  not?: boolean;
}

/** Visibility = ALL of `all` AND ANY of `any`. Either may be omitted (treated satisfied). */
export interface VisibilityRule {
  all?: Condition[];
  any?: Condition[];
}

export interface SubQuestion {
  id: string;
  type: SubQuestionType;
  title: string;
  helper?: string;
  required?: boolean;
  placeholder?: string;
  options?: Option[]; // select / single-choice
  yearRange?: { from: number; to: number }; // year-select
  /** Visibility within the same card (references sibling sub-ids, or top-level via dotted path). */
  visibleIf?: VisibilityRule;
  /** Layout hint for side-by-side fields. */
  width?: "full" | "half";
}

export interface Question {
  /** Stable, unique across the whole schema. */
  id: string;
  type: QuestionType;
  title: string;
  helper?: string;
  /** Icon key into components/ui/Icon. */
  icon?: string;
  required?: boolean;
  placeholder?: string;

  // type-specific:
  options?: Option[]; // select / single-choice / multi-choice
  galleryOptions?: GalleryOption[]; // image-gallery-pick
  galleryKey?: string; // alternative: resolve from lib/schema/galleries
  yearRange?: { from: number; to: number }; // year-select
  group?: SubQuestion[]; // field-group / repeatable-group
  groupItemLabel?: string; // e.g. "Partner", "Offer" (repeatable-group)
  minItems?: number; // repeatable-group
  maxItems?: number; // repeatable-group
  rows?: number; // textarea

  // routing:
  visibleIf?: VisibilityRule;
}

export type SectionKind = "intro" | "questions";

export interface Section {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  kind: SectionKind;
  /** Body copy for intro/congrats screens. */
  introBody?: string;
  /** Heading shown above the question stack. */
  heading?: string;
  questions: Question[];
}

export interface OnboardingSchema {
  sections: Section[];
  /** Dotted-path answer locations extracted into Supabase columns / used as lookup keys. */
  keyFields: { email: string; phone: string; taxId: string };
  /** After this answer path gets a valid value, trigger the magic-link email. */
  emailCapturePath: string;
  /** Answer path holding the 1-10 satisfaction rating (extracted column). */
  satisfactionPath: string;
}
