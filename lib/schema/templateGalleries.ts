import type { GalleryOption } from "./types";

/** Selected when the user chooses “Upload my own” instead of a preset template. */
export const TEMPLATE_UPLOAD_OWN_ID = "upload-my-own";

export const TEMPLATE_UPLOAD_OWN_OPTION: GalleryOption = {
  id: TEMPLATE_UPLOAD_OWN_ID,
  label: "Upload my own",
};

const BASE = "/new-design-img";

type TemplateAsset = {
  slug: string;
  ext: "png" | "jpg";
  label: string;
};

function templateOption({ slug, ext, label }: TemplateAsset): GalleryOption {
  return {
    id: slug,
    label,
    imageUrl: `${BASE}/${slug}-thumb.${ext}`,
    previewUrl: `${BASE}/${slug}.${ext}`,
  };
}

function build(assets: TemplateAsset[]): GalleryOption[] {
  return assets.map(templateOption);
}

/** Real-life template mockups (shown when branding_style = real). */
const REAL_ASSETS: TemplateAsset[] = [
  { slug: "adahome", ext: "jpg", label: "Ada Home" },
  { slug: "allsolar", ext: "jpg", label: "All Solar" },
  { slug: "cb-plumbing-and-heating", ext: "png", label: "CB Plumbing & Heating" },
  { slug: "cheltenham-heating", ext: "png", label: "Cheltenham Heating" },
  { slug: "current-renewables", ext: "png", label: "Current Renewables" },
  { slug: "eco-boiler", ext: "jpg", label: "Eco Boiler" },
  { slug: "ecofueled", ext: "jpg", label: "Ecofueled" },
  { slug: "ecohome", ext: "jpg", label: "Eco Home" },
];

/** Animated-style template mockups (branding_style = animated). */
const ANIMATED_ASSETS: TemplateAsset[] = [
  { slug: "actismart", ext: "png", label: "Actismart" },
  { slug: "homexe", ext: "jpg", label: "HomeXE" },
  { slug: "midland", ext: "jpg", label: "Midland" },
  { slug: "sheffield", ext: "jpg", label: "Sheffield" },
  { slug: "srw", ext: "jpg", label: "SRW" },
  { slug: "stoake", ext: "jpg", label: "Stoake" },
];

/** Mixed real + animated templates (branding_style = mixed). */
const MIXED_ASSETS: TemplateAsset[] = [
  { slug: "heatseal-solar", ext: "png", label: "Heatseal Solar" },
  { slug: "humber-homes-heating", ext: "png", label: "Humber Homes Heating" },
  { slug: "plumbing-and-heating", ext: "png", label: "Plumbing & Heating" },
  { slug: "vaca-services", ext: "jpg", label: "Vaca Services" },
  { slug: "warmcare", ext: "jpg", label: "Warmcare" },
];

export const TEMPLATE_GALLERIES = {
  "templates-real": build(REAL_ASSETS),
  "templates-animated": build(ANIMATED_ASSETS),
  "templates-mixed": build(MIXED_ASSETS),
} as const satisfies Record<string, GalleryOption[]>;
