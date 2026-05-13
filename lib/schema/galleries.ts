import type { GalleryOption } from "./types";

// Image-gallery options. Real assets/URLs to be supplied later — `imageUrl`
// is intentionally a placeholder for now (the gallery component renders a
// neutral tile when the URL is empty).

const placeholder = (n: number, prefix: string): GalleryOption[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    label: `Option ${i + 1}`,
    imageUrl: "",
  }));

export const GALLERIES: Record<string, GalleryOption[]> = {
  // Step 16 (logo style picker, "I do not currently have a logo")
  "logo-styles": [
    { id: "wordmark", label: "Wordmark", imageUrl: "" },
    { id: "lettermark", label: "Lettermark / Monogram", imageUrl: "" },
    { id: "pictorial", label: "Pictorial mark", imageUrl: "" },
    { id: "abstract", label: "Abstract mark", imageUrl: "" },
    { id: "mascot", label: "Mascot", imageUrl: "" },
    { id: "combination", label: "Combination mark", imageUrl: "" },
    { id: "emblem", label: "Emblem", imageUrl: "" },
  ],
  // Step 18A — Real template gallery
  "templates-real": placeholder(8, "tpl-real"),
  // Step 18B — Animated template gallery
  "templates-animated": placeholder(8, "tpl-animated"),
  // Step 18C — Mixed template gallery
  "templates-mixed": placeholder(8, "tpl-mixed"),
  // Step 30A — 12 colour palettes
  "colour-palettes": placeholder(12, "palette"),
  // Step 31 — 4 button styles
  "button-styles": [
    { id: "rounded", label: "Rounded", imageUrl: "" },
    { id: "pill", label: "Pill", imageUrl: "" },
    { id: "square", label: "Square", imageUrl: "" },
    { id: "outline", label: "Outline", imageUrl: "" },
  ],
};
