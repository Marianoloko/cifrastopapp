import { useCallback, useEffect, useState } from "react";

export type UserModeId = "cantor" | "instrumentista" | "voz-som" | "iniciante";

export type UserMode = {
  id: UserModeId;
  emoji: string;
  label: string;
  description: string;
};

export const USER_MODES: UserMode[] = [
  {
    id: "cantor",
    emoji: "🎤",
    label: "Cantor",
    description: "Letra grande, transposição rápida e presets de voz no retorno.",
  },
  {
    id: "instrumentista",
    emoji: "🎸",
    label: "Instrumentista",
    description: "Diagramas do seu instrumento, rolagem automática e modo palco.",
  },
  {
    id: "voz-som",
    emoji: "🎙️🎸",
    label: "Voz e Som",
    description: "Cifra em cima e painel de retorno, metrônomo e gravação embaixo.",
  },
  {
    id: "iniciante",
    emoji: "🐣",
    label: "Iniciante",
    description: "Dicionário de acordes ao toque e versão fácil das cifras.",
  },
];

const MODE_KEY = "cifrastop:modo";
const INSTRUMENT_KEY = "cifrastop:instrumento-cifra";
const TOM_PREFIX = "cifrastop:tom:";

export function getUserMode(): UserModeId | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(MODE_KEY);
  return USER_MODES.some((m) => m.id === saved) ? (saved as UserModeId) : null;
}

/** Guarda o último modo usado como pré-definição. */
export function useUserMode() {
  const [mode, setModeState] = useState<UserModeId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setModeState(getUserMode());
    setReady(true);
  }, []);

  const setMode = useCallback((id: UserModeId) => {
    setModeState(id);
    window.localStorage.setItem(MODE_KEY, id);
  }, []);

  return { mode, setMode, ready };
}

export function getSavedDiagramInstrument() {
  if (typeof window === "undefined") return "violao";
  return window.localStorage.getItem(INSTRUMENT_KEY) ?? "violao";
}

export function saveDiagramInstrument(id: string) {
  window.localStorage.setItem(INSTRUMENT_KEY, id);
}

export function getSavedTranspose(songId: string) {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(TOM_PREFIX + songId) ?? 0) || 0;
}

export function saveTranspose(songId: string, semitones: number) {
  if (semitones === 0) window.localStorage.removeItem(TOM_PREFIX + songId);
  else window.localStorage.setItem(TOM_PREFIX + songId, String(semitones));
}
