"use client";

import type { Question } from "@/lib/schema/types";
import type { FieldGroupAnswer, RepeatableAnswer, TimeRangeAnswer } from "@/lib/types";
import { GALLERIES } from "@/lib/schema/galleries";
import { useOnboarding } from "./OnboardingContext";
import { TextInput } from "@/components/inputs/TextInput";
import { TextareaInput } from "@/components/inputs/TextareaInput";
import { SelectInput } from "@/components/inputs/SelectInput";
import { SingleChoice } from "@/components/inputs/SingleChoice";
import { MultiChoice } from "@/components/inputs/MultiChoice";
import { YearSelect } from "@/components/inputs/YearSelect";
import { TimeRangeInput } from "@/components/inputs/TimeRangeInput";
import { FileUpload } from "@/components/inputs/FileUpload";
import { FieldGroupInput } from "@/components/inputs/FieldGroupInput";
import { RepeatableGroup } from "@/components/inputs/RepeatableGroup";
import { ImageGalleryPick } from "@/components/inputs/ImageGalleryPick";

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
    case "email":
    case "tel":
    case "number":
    case "password":
      return (
        <TextInput
          id={id}
          kind={question.type}
          value={asString(value)}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
          placeholder={question.placeholder}
        />
      );
    case "textarea":
      return (
        <TextareaInput
          id={id}
          value={asString(value)}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
          placeholder={question.placeholder}
          rows={question.rows}
        />
      );
    case "select":
      return (
        <SelectInput
          id={id}
          options={question.options ?? []}
          value={asString(value)}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
        />
      );
    case "single-choice":
      return (
        <SingleChoice
          options={question.options ?? []}
          value={asString(value)}
          onChange={(v) => setAnswer(question.id, v)}
        />
      );
    case "multi-choice":
      return (
        <MultiChoice
          options={question.options ?? []}
          value={asStringArray(value)}
          onChange={(v) => setAnswer(question.id, v)}
        />
      );
    case "year-select":
      return (
        <YearSelect
          id={id}
          from={question.yearRange?.from ?? 1999}
          to={question.yearRange?.to ?? new Date().getFullYear()}
          value={asString(value)}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
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
    case "file":
      return (
        <FileUpload
          questionId={question.id}
          value={asString(value)}
          onChange={(v) => setAnswer(question.id, v)}
        />
      );
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
          value={(value as RepeatableAnswer | undefined) ?? undefined}
          answers={answers}
          onChange={(v) => setAnswer(question.id, v)}
          onBlur={onBlur}
        />
      );
    case "image-gallery-pick": {
      const options =
        question.galleryOptions ?? (question.galleryKey ? GALLERIES[question.galleryKey] : []) ?? [];
      return (
        <ImageGalleryPick
          options={options}
          value={asString(value)}
          onChange={(v) => setAnswer(question.id, v)}
        />
      );
    }
    default:
      return null;
  }
}
