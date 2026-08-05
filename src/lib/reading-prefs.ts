export type ReadingThemeId = "escuro" | "claro" | "contraste";

export type ReadingTheme = {
  id: ReadingThemeId;
  label: string;
  container: string;
  lyric: string;
  chord: string;
  section: string;
};

export const READING_THEMES: ReadingTheme[] = [
  { id: "escuro", label: "Escuro", container: "#111418", lyric: "#F3F4F6", chord: "#FF8A3D", section: "#8B93A1" },
  { id: "claro", label: "Claro", container: "#FFFFFF", lyric: "#16181D", chord: "#1D4ED8", section: "#4B5563" },
  { id: "contraste", label: "Alto contraste", container: "#000000", lyric: "#FFFFFF", chord: "#FFD400", section: "#9CA3AF" },
];

const THEME_KEY = "cifrastop:leitura-tema";
const FONT_KEY = "cifrastop:leitura-fonte";
const LEFTY_KEY = "cifrastop:canhoto";

export const MIN_FONT = 12;
export const MAX_FONT = 34;

export function getReadingTheme(): ReadingThemeId | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(THEME_KEY);
  return READING_THEMES.some((theme) => theme.id === saved) ? (saved as ReadingThemeId) : null;
}

export function saveReadingTheme(id: ReadingThemeId) {
  window.localStorage.setItem(THEME_KEY, id);
}

export function getFontSize() {
  if (typeof window === "undefined") return 16;
  const value = Number(window.localStorage.getItem(FONT_KEY));
  return Number.isFinite(value) && value >= MIN_FONT && value <= MAX_FONT ? value : 16;
}

export function saveFontSize(value: number) {
  window.localStorage.setItem(FONT_KEY, String(value));
}

export function getLefty() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LEFTY_KEY) === "1";
}

export function saveLefty(value: boolean) {
  window.localStorage.setItem(LEFTY_KEY, value ? "1" : "0");
}