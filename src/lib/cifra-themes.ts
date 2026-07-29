export type CifraThemeId = "cifraclub" | "cifrasdotcom" | "bananacifras";

export type CifraTheme = {
  id: CifraThemeId;
  label: string;
  container: string;
  lyric: string;
  chord: string;
  section: string;
  pill: string;
  pillText: string;
};

export const CIFRA_THEMES: CifraTheme[] = [
  {
    id: "cifraclub",
    label: "Cifra Club",
    container: "#181818",
    lyric: "#FFFFFF",
    chord: "#FF6B00",
    section: "#888888",
    pill: "#FF6B00",
    pillText: "#FFFFFF",
  },
  {
    id: "cifrasdotcom",
    label: "Cifras.com.br",
    container: "#FFFFFF",
    lyric: "#222222",
    chord: "#2B7FFF",
    section: "#0066CC",
    pill: "#2B7FFF",
    pillText: "#FFFFFF",
  },
  {
    id: "bananacifras",
    label: "Banana Cifras",
    container: "#212936",
    lyric: "#E5E7EB",
    chord: "#EF4444",
    section: "#EF4444",
    pill: "#EF4444",
    pillText: "#FFFFFF",
  },
];

export function getCifraTheme(id: string | null | undefined): CifraTheme {
  return CIFRA_THEMES.find((theme) => theme.id === id) ?? CIFRA_THEMES[0];
}