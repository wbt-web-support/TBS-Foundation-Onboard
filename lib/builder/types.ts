export type TemplateType = "real" | "animated" | "mixed";

export type ColorScheme = {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
};

export type ButtonStyle = {
  id: string;
  label: string;
  radius: string;
  shadow: string;
  border: string;
};

export type FontPair = {
  id: string;
  label: string;
  heading: string;
  body: string;
  headingUrl: string;
  bodyUrl: string;
};

export type HeaderLayout = "centered" | "left" | "minimal";
export type FooterStyle = "dark" | "light" | "minimal";

export type BuilderCustomization = {
  colorScheme: ColorScheme | null;
  buttonStyle: ButtonStyle | null;
  fontPair: FontPair | null;
  headerLayout: HeaderLayout | null;
  footerStyle: FooterStyle | null;
};

export type BuilderStep =
  | "welcome"
  | "color"
  | "button"
  | "font"
  | "header"
  | "footer"
  | "done";

export const BUILDER_STEPS: BuilderStep[] = ["welcome", "color", "button", "font", "header", "footer", "done"];

export const STEP_LABELS: Record<BuilderStep, string> = {
  welcome: "Template Selected",
  color: "Color Scheme",
  button: "Button Style",
  font: "Font Selection",
  header: "Header Design",
  footer: "Footer Design",
  done: "Complete",
};

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: "teal-dark",    label: "Ocean Pro",    primary: "#0e7490", secondary: "#164e63", accent: "#14b8a6", bg: "#f0fdfa", text: "#0f172a" },
  { id: "orange-dark",  label: "Flame Trade",  primary: "#ea580c", secondary: "#9a3412", accent: "#f97316", bg: "#fff7ed", text: "#1c1917" },
  { id: "green-dark",   label: "Eco Fresh",    primary: "#16a34a", secondary: "#14532d", accent: "#4ade80", bg: "#f0fdf4", text: "#0f1f0f" },
  { id: "blue-dark",    label: "Corporate",    primary: "#1d4ed8", secondary: "#1e3a8a", accent: "#60a5fa", bg: "#eff6ff", text: "#0f172a" },
  { id: "slate-dark",   label: "Steel Edge",   primary: "#334155", secondary: "#0f172a", accent: "#94a3b8", bg: "#f8fafc", text: "#0f172a" },
];

export const BUTTON_STYLES: ButtonStyle[] = [
  { id: "rounded",  label: "Rounded",   radius: "8px",   shadow: "0 4px 12px rgba(0,0,0,0.15)", border: "none" },
  { id: "pill",     label: "Pill",      radius: "999px", shadow: "0 4px 12px rgba(0,0,0,0.15)", border: "none" },
  { id: "square",   label: "Square",    radius: "2px",   shadow: "none",                         border: "none" },
  { id: "outline",  label: "Outline",   radius: "8px",   shadow: "none",                         border: "2px solid currentColor" },
];

export const FONT_PAIRS: FontPair[] = [
  {
    id: "inter-inter",
    label: "Modern Clean",
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
    headingUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap",
    bodyUrl: "",
  },
  {
    id: "playfair-lato",
    label: "Classic Elegant",
    heading: "'Playfair Display', serif",
    body: "'Lato', sans-serif",
    headingUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lato:wght@400;600&display=swap",
    bodyUrl: "",
  },
  {
    id: "montserrat-open",
    label: "Bold & Friendly",
    heading: "'Montserrat', sans-serif",
    body: "'Open Sans', sans-serif",
    headingUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Open+Sans:wght@400;600&display=swap",
    bodyUrl: "",
  },
  {
    id: "oswald-roboto",
    label: "Industrial Strong",
    heading: "'Oswald', sans-serif",
    body: "'Roboto', sans-serif",
    headingUrl: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto:wght@400;500&display=swap",
    bodyUrl: "",
  },
];
