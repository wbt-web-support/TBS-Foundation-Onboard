import type { GalleryOption } from "./types";
import { TEMPLATE_GALLERIES } from "./templateGalleries";

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
  // Assets: public/brand-img/brand-img/brand-logo.png … brand-logo-9.png
  "logo-styles": [
    { id: "wordmark", label: "Wordmark", imageUrl: "/brand-img/brand-img/brand-logo.png" },
    { id: "lettermark", label: "Lettermark / Monogram", imageUrl: "/brand-img/brand-img/brand-logo-1.png" },
    { id: "pictorial", label: "Pictorial mark", imageUrl: "/brand-img/brand-img/brand-logo-2.png" },
    { id: "abstract", label: "Abstract mark", imageUrl: "/brand-img/brand-img/brand-logo-3.png" },
    { id: "mascot", label: "Mascot", imageUrl: "/brand-img/brand-img/brand-logo-4.png" },
    { id: "combination", label: "Combination mark", imageUrl: "/brand-img/brand-img/brand-logo-5.png" },
    { id: "emblem", label: "Emblem", imageUrl: "/brand-img/brand-img/brand-logo-6.png" },
    { id: "badge", label: "Badge style", imageUrl: "/brand-img/brand-img/brand-logo-7.png" },
    { id: "minimal", label: "Minimal style", imageUrl: "/brand-img/brand-img/brand-logo-8.png" },
    { id: "dynamic", label: "Dynamic style", imageUrl: "/brand-img/brand-img/brand-logo-9.png" },
  ],
  // Step 18 — template galleries (assets in public/new-design-img/)
  "templates-real": [...TEMPLATE_GALLERIES["templates-real"]],
  "templates-animated": [...TEMPLATE_GALLERIES["templates-animated"]],
  "templates-mixed": [...TEMPLATE_GALLERIES["templates-mixed"]],
  // Step 30A — 12 colour palettes (swatches; no image assets)
  "colour-palettes": [
    {
      id: "palette-1",
      label: "Palette 1",
      swatchColors: ["#E8DCC4", "#2A9D8F", "#1A2744", "#C41E7A"],
    },
    {
      id: "palette-2",
      label: "Palette 2",
      swatchColors: ["#3D6B8F", "#0F1C2E", "#7EB8DA", "#D6EEF8"],
    },
    {
      id: "palette-3",
      label: "Palette 3",
      swatchColors: ["#1B2838", "#F97316", "#FFD4B8", "#EFF6FF"],
    },
    {
      id: "palette-4",
      label: "Palette 4",
      swatchColors: ["#0D1321", "#22D3EE", "#C4B5FD", "#FFFFFF"],
    },
    {
      id: "palette-5",
      label: "Palette 5",
      swatchColors: ["#14532D", "#15803D", "#84CC16", "#FEF9C3"],
    },
    {
      id: "palette-6",
      label: "Palette 6",
      swatchColors: ["#374151", "#DC2626", "#9CA3AF", "#FFFFFF"],
    },
    {
      id: "palette-7",
      label: "Palette 7",
      swatchColors: ["#FB7185", "#FAF7F2", "#93C5FD", "#2563EB", "#0F172A"],
    },
    {
      id: "palette-8",
      label: "Palette 8",
      swatchColors: ["#0369A1", "#EAB308", "#EA580C", "#F4F4F5"],
    },
    {
      id: "palette-9",
      label: "Palette 9",
      swatchColors: ["#64748B", "#EAB308", "#E8DCC4", "#FFFFFF"],
    },
    {
      id: "palette-10",
      label: "Palette 10",
      swatchColors: ["#000000", "#64748B", "#FFFFFF"],
    },
    {
      id: "palette-11",
      label: "Palette 11",
      swatchColors: ["#000000", "#B0C4DE", "#FFDCC4", "#9CA3A1"],
    },
    {
      id: "palette-12",
      label: "Palette 12",
      swatchColors: ["#050A14", "#1E293B", "#475569", "#64748B", "#F5F0E6"],
    },
  ],
  // Step 31 — 4 button styles (visual previews; ids stable for saved answers)
  "button-styles": [
    { id: "square", label: "Style 1", buttonShape: "sharp" },
    { id: "pill", label: "Style 2", buttonShape: "pill" },
    { id: "rounded", label: "Style 3", buttonShape: "skew" },
    { id: "outline", label: "Style 4", buttonShape: "soft" },
  ],
};
