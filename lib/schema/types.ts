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
  /** Optional image shown on choice cards (e.g. `/image/image/foo.svg`). */
  imageUrl?: string;
  /** Optional link (e.g. Google Fonts) shown under the label; does not change the option value. */
  linkUrl?: string;
  /** Extra copy under the title (tone of voice, etc.). */
  description?: string;
  /** Italic-style example snippet inside the card. */
  example?: string;
  /** Optional caution line (e.g. red) under the description. */
  warning?: string;
}

export interface GalleryOption {
  id: string;
  label: string;
  /** Image tile when no `swatchColors` (may be empty). */
  imageUrl?: string;
  /** When set, the tile shows horizontal colour swatches instead of `imageUrl`. */
  swatchColors?: string[];
  /** When set, the tile shows two sample CTA buttons with this corner treatment. */
  buttonShape?: "sharp" | "pill" | "skew" | "soft";
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

/**
 * Visibility = ALL of `all` AND ANY of `any` AND (if `anyOf` is set) at least one sub-rule fully matches.
 * Use `anyOf` for OR-of-AND groups (e.g. show after path A OR path B with extra conditions).
 */
export interface VisibilityRule {
  all?: Condition[];
  any?: Condition[];
  /** Each entry is evaluated with `isVisible`; if any matches, this part passes. */
  anyOf?: VisibilityRule[];
}

/** Match a sibling answer value for `labelBySibling` rules. Use `oneOf` or `equals`, not both. */
export interface SiblingLabelWhen {
  equals?: string;
  oneOf?: string[];
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
  /**
   * Override title/placeholder from a sibling sub-field answer (e.g. org type → registration label).
   * First matching rule wins; then `default`.
   */
  labelBySibling?: {
    siblingId: string;
    rules: Array<{ when: SiblingLabelWhen; title: string; placeholder?: string }>;
    default: { title: string; placeholder?: string };
  };
  /** Shown inside the control before the input (e.g. "#"). */
  inputPrefix?: string;
  /** `textarea`: visible height in rows (default in UI: 3). */
  rows?: number;
  /** Optional brand icon to the left of the sub-field label (URL under `public/`, e.g. `/image/image/facebook.svg`). */
  labelIconUrl?: string;
}

/** Inline segments for a question title (plain text + external links). */
export type QuestionRichSegment =
  | { type: "text"; text: string }
  | {
      type: "link";
      text: string;
      href: string;
      /** If true and `href` is a Loom share URL, opens the video in a dialog instead of a new tab. */
      openInModal?: boolean;
    };

export interface Question {
  /** Stable, unique across the whole schema. */
  id: string;
  type: QuestionType;
  title: string;
  helper?: string;
  /**
   * When set, renders below the title with the same link styling as `titleRich` (plain `helper` is ignored if both are set).
   */
  helperRich?: QuestionRichSegment[];
  /**
   * When set, the card heading renders these segments instead of plain `title`.
   * Keep `title` as a readable plain-text fallback (exports, legacy payloads).
   */
  titleRich?: QuestionRichSegment[];
  /** Icon key into components/ui/Icon. */
  icon?: string;
  required?: boolean;
  placeholder?: string;
  /** Optional image under the card header (`public/` URL, e.g. `/brand-img/logo-style-01.svg`). */
  cardImageUrl?: string;
  cardImageAlt?: string;

  // type-specific:
  options?: Option[]; // select / single-choice / multi-choice
  /** `single-choice`: fixed column count for the option grid (default is auto from label length). */
  singleChoiceColumns?: 1 | 2 | 3;
  /** `multi-choice`: fixed column count for the checkbox grid (default is auto from labels / images). */
  multiChoiceColumns?: 1 | 2 | 3;
  galleryOptions?: GalleryOption[]; // image-gallery-pick
  galleryKey?: string; // alternative: resolve from lib/schema/galleries
  galleryMulti?: boolean; // image-gallery-pick: allow selecting multiple tiles
  /** `row`: one horizontal strip (e.g. four button styles). Default grid. */
  galleryLayout?: "grid" | "row";
  yearRange?: { from: number; to: number }; // year-select
  group?: SubQuestion[]; // field-group / repeatable-group
  groupItemLabel?: string; // e.g. "Partner", "Offer" (repeatable-group)
  minItems?: number; // repeatable-group
  maxItems?: number; // repeatable-group
  /** `repeatable-group`: label on the dashed add-row button (default: "Add " + lowercased groupItemLabel). */
  repeatableAddButtonLabel?: string;
  rows?: number; // textarea
  /** File upload behavior overrides for `type: "file"` questions. */
  fileUpload?: {
    mode?: "image" | "file";
    maxSizeMB?: number;
  };

  /**
   * `google-sheet-dark`: Google Sheet URL step with template / Loom links and “provide later”
   * (uses a dedicated card layout; `type: "text"`).
   */
  presentation?: "google-sheet-dark";
  /** Resource links when `presentation` is `google-sheet-dark`. */
  googleSheetResources?: {
    templateUrl: string;
    tutorialVideoUrl: string;
    tutorialLinkLabel?: string;
    productSheetButtonLabel?: string;
  };

  /**
   * Teal “I will provide later” control: skips this answer and goes to the next step.
   * Optional repeatables / field-groups: cleared to [] / {}.
   * Required scalar (e.g. email): stores an internal sentinel so validation passes; treat as “no value” in exports/UI.
   * Field-group + `deferFieldGroupToKickoff`: stores a marker so required sub-fields can be skipped until kick-off.
   */
  provideLater?: {
    label?: string;
    deferFieldGroupToKickoff?: boolean;
    /** `dark`: bordered slate button with white text (no clock). Default: teal CTA with clock. */
    variant?: "teal" | "dark";
  };

  /** `single-choice`: when value equals `otherTextWhen` (default `other`), text is stored under this answer id (no separate card). */
  otherTextAnswerId?: string;
  otherTextWhen?: string;

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
  /** Main heading: intro screen headline, or title above the question stack. */
  heading?: string;
  /** Optional transition intro shown before this section's questions. */
  transitionIntro?: {
    title: string;
    description: string;
    checklist: string[];
    /** Shown below the checklist (e.g. closing encouragement). */
    closingText?: string;
    imageSrc?: string;
    imageAlt?: string;
    nextLabel?: string;
  };
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
