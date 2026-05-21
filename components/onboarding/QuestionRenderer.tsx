"use client";

import { isProvideLaterSentinel } from "@/lib/answers";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import type { Question } from "@/lib/schema/types";
import type { FieldGroupAnswer, RepeatableAnswer, TimeRangeAnswer } from "@/lib/types";
import { GALLERIES } from "@/lib/schema/galleries";
import { useOnboarding } from "./OnboardingContext";
import { TextInput } from "@/components/inputs/TextInput";
import { TextareaInput } from "@/components/inputs/TextareaInput";
import { DropdownSelect } from "@/components/inputs/DropdownSelect";
import { SingleChoice } from "@/components/inputs/SingleChoice";
import { MultiChoice } from "@/components/inputs/MultiChoice";
import { YearSelect } from "@/components/inputs/YearSelect";
import { TimeRangeInput } from "@/components/inputs/TimeRangeInput";
import { FileUpload } from "@/components/inputs/FileUpload";
import { ImageUpload } from "@/components/inputs/ImageUpload";
import { TEMPLATE_UPLOAD_OWN_ID, TEMPLATE_UPLOAD_OWN_OPTION } from "@/lib/schema/templateGalleries";
import { FieldGroupInput } from "@/components/inputs/FieldGroupInput";
import { RepeatableGroup } from "@/components/inputs/RepeatableGroup";
import { ImageGalleryPick } from "@/components/inputs/ImageGalleryPick";
import { LABEL_CLASS } from "@/components/inputs/fieldStyles";

function questionById(id: string): Question | undefined {
  for (const s of ONBOARDING_SCHEMA.sections) {
    const q = s.questions.find((x) => x.id === id);
    if (q) return q;
  }
  return undefined;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function QuestionRenderer({ question }: { question: Question }) {
  const { answers, setAnswer, flushSave } = useOnboarding();
  const value = answers[question.id];
  const onBlur = () => void flushSave();
  const id = `field-${question.id}`;

  switch (question.type) {
    case "text":
    case "url":
    case "email":
    case "tel":
    case "number":
    case "password": {
      const raw = asString(value);
      const inputValue = isProvideLaterSentinel(value) ? "" : raw;
      const autoIcon =
        question.type === "email" ? "mail" :
        question.type === "url" ? "globe" :
        question.type === "tel" ? "phone" :
        question.type === "password" ? "lock" :
        undefined;
      return (
        <TextInput
          id={id}
          kind={question.type}
          value={inputValue}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
          placeholder={question.placeholder}
          leadingIcon={question.leadingIcon ?? autoIcon}
        />
      );
    }
    case "textarea": {
      const textareaValue = isProvideLaterSentinel(value) ? "" : asString(value);
      return (
        <TextareaInput
          id={id}
          value={textareaValue}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
          placeholder={question.placeholder}
          rows={question.rows}
        />
      );
    }
    case "select":
      return (
        <DropdownSelect
          id={id}
          options={question.options ?? []}
          value={asString(value)}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
          placeholder={question.placeholder ?? "Select…"}
          leadingIcon={question.leadingIcon}
        />
      );
    case "single-choice": {
      const otherId = question.otherTextAnswerId;
      const otherWhen = question.otherTextWhen ?? "other";
      const otherMeta = otherId ? questionById(otherId) : undefined;
      const showOther = Boolean(otherId && asString(value) === otherWhen);
      return (
        <>
          <SingleChoice
            groupId={`${id}-choices`}
            options={question.options ?? []}
            value={asString(value)}
            onChange={(v) => setAnswer(question.id, v)}
            columns={question.singleChoiceColumns}
            tile={question.singleChoiceTileImages}
          />
          {showOther && otherId ? (
            <div className="mt-4">
              <label htmlFor={`field-${otherId}`} className={LABEL_CLASS}>
                {otherMeta?.title ?? "Enter font name"}
              </label>
              <TextInput
                id={`field-${otherId}`}
                kind="text"
                value={asString(answers[otherId])}
                onChange={(v) => setAnswer(otherId, v)}
                onBlur={onBlur}
                placeholder={otherMeta?.placeholder ?? "Enter Font Name"}
              />
            </div>
          ) : null}
        </>
      );
    }
    case "multi-choice":
      return (
        <MultiChoice
          groupId={`${id}-choices`}
          options={question.options ?? []}
          value={isProvideLaterSentinel(value) ? [] : asStringArray(value)}
          onChange={(v) => setAnswer(question.id, v)}
          columns={question.multiChoiceColumns}
        />
      );
    case "year-select":
      return (
        <YearSelect
          id={id}
          from={question.yearRange?.from ?? 1970}
          to={question.yearRange?.to ?? new Date().getFullYear()}
          value={asString(value)}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
          beforeEarliestLabel={question.yearBeforeEarliestLabel}
        />
      );
    case "time-range":
      return (
        <TimeRangeInput
          value={(value as TimeRangeAnswer | undefined) ?? undefined}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
        />
      );
    case "file": {
      const fileValue = isProvideLaterSentinel(value) ? "" : asString(value);
      if (question.fileUpload?.mode === "image") {
        return (
          <ImageUpload
            questionId={question.id}
            value={fileValue}
            onChange={(v) => setAnswer(question.id, v)}
            maxSizeMB={question.fileUpload?.maxSizeMB ?? 5}
          />
        );
      }
      return (
        <FileUpload
          questionId={question.id}
          value={fileValue}
          onChange={(v) => setAnswer(question.id, v)}
        />
      );
    }
    case "field-group":
      return (
        <FieldGroupInput
          question={question}
          value={(value as FieldGroupAnswer | undefined) ?? undefined}
          answers={answers}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
        />
      );
    case "repeatable-group":
      return (
        <RepeatableGroup
          question={question}
          value={
            isProvideLaterSentinel(value) ? undefined : ((value as RepeatableAnswer | undefined) ?? undefined)
          }
          answers={answers}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
        />
      );
    case "image-gallery-pick": {
      const baseOptions =
        question.galleryOptions ?? (question.galleryKey ? GALLERIES[question.galleryKey] : []) ?? [];
      const isTemplateGallery = question.galleryKey?.startsWith("templates-") ?? false;
      const options = isTemplateGallery ? [...baseOptions, TEMPLATE_UPLOAD_OWN_OPTION] : baseOptions;
      const pick = question.galleryMulti ? asStringArray(value) : asString(value);
      const companionKey = question.galleryUploadCompanionKey;
      const uploadMeta = companionKey ? questionById(companionKey) : undefined;

      return (
        <>
          <ImageGalleryPick
            options={options}
            value={pick}
            multiple={Boolean(question.galleryMulti)}
            onChange={(v) => {
              setAnswer(question.id, v);
              if (companionKey && v !== TEMPLATE_UPLOAD_OWN_ID) setAnswer(companionKey, "");
            }}
            layout={isTemplateGallery ? "template" : "compact"}
            enableZoom={isTemplateGallery}
            allowUploadOwn={isTemplateGallery}
            uploadOwn={
              isTemplateGallery && companionKey && uploadMeta
                ? {
                    questionId: companionKey,
                    value: asString(answers[companionKey]),
                    onChange: (v) => setAnswer(companionKey, v),
                    maxSizeMB: uploadMeta.fileUpload?.maxSizeMB ?? 10,
                  }
                : undefined
            }
          />
        </>
      );
    }
    default:
      return null;
  }
}
