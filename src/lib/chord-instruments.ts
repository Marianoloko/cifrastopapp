import { CHORD_RE, FLAT_TO_SHARP, NOTES_SHARP } from "@/lib/chords";

export type DiagramInstrument = "violao" | "teclado" | "baixo" | "ukulele";

export const DIAGRAM_INSTRUMENTS: { id: DiagramInstrument; label: string }[] = [
  { id: "violao", label: "Violão / Guitarra" },
  { id: "teclado", label: "Teclado / Piano" },
  { id: "baixo", label: "Baixo" },
  { id: "ukulele", label: "Ukulele" },
];

function rootIndex(note: string) {
  return NOTES_SHARP.indexOf(FLAT_TO_SHARP[note] ?? note);
}

export function parseChord(chord: string) {
  const match = chord.match(CHORD_RE);
  if (!match) return null;
  return { root: FLAT_TO_SHARP[match[1]] ?? match[1], suffix: match[2] ?? "", bass: match[3] };
}

/** Notas (classes de altura) que formam o acorde — usado no desenho do teclado. */
export function chordTones(chord: string): number[] {
  const parsed = parseChord(chord);
  if (!parsed) return [];
  const base = rootIndex(parsed.root);
  if (base < 0) return [];
  const s = parsed.suffix;
  let intervals: number[];
  if (s.startsWith("dim") || s.startsWith("°")) intervals = [0, 3, 6];
  else if (s.startsWith("aug") || s.startsWith("+")) intervals = [0, 4, 8];
  else if (s.startsWith("sus2")) intervals = [0, 2, 7];
  else if (s.startsWith("sus")) intervals = [0, 5, 7];
  else if (s.startsWith("m") && !s.startsWith("maj")) intervals = [0, 3, 7];
  else intervals = [0, 4, 7];
  if (s.includes("maj7") || s.includes("7M")) intervals.push(11);
  else if (s.includes("7")) intervals.push(10);
  if (s.includes("6")) intervals.push(9);
  if (s.includes("9")) intervals.push(2);
  const tones = intervals.map((i) => (base + i) % 12);
  if (parsed.bass) {
    const bass = rootIndex(FLAT_TO_SHARP[parsed.bass] ?? parsed.bass);
    if (bass >= 0 && !tones.includes(bass)) tones.push(bass);
  }
  return tones;
}

const UKE_MAJOR: Record<string, number[]> = {
  C: [0, 0, 0, 3], "C#": [1, 1, 1, 4], D: [2, 2, 2, 5], "D#": [3, 3, 3, 6],
  E: [4, 4, 4, 7], F: [2, 0, 1, 0], "F#": [3, 1, 2, 1], G: [0, 2, 3, 2],
  "G#": [5, 3, 4, 3], A: [2, 1, 0, 0], "A#": [3, 2, 1, 1], B: [4, 3, 2, 2],
};
const UKE_MINOR: Record<string, number[]> = {
  C: [0, 3, 3, 3], "C#": [1, 4, 4, 4], D: [2, 2, 1, 0], "D#": [3, 3, 2, 1],
  E: [0, 4, 3, 2], F: [1, 0, 1, 3], "F#": [2, 1, 2, 0], G: [0, 2, 3, 1],
  "G#": [1, 3, 4, 2], A: [2, 0, 0, 0], "A#": [3, 1, 1, 1], B: [4, 2, 2, 2],
};
const UKE_SEVENTH: Record<string, number[]> = {
  C: [0, 0, 0, 1], "C#": [1, 1, 1, 2], D: [2, 2, 2, 3], "D#": [3, 3, 3, 4],
  E: [1, 2, 0, 2], F: [2, 3, 1, 3], "F#": [3, 4, 2, 4], G: [0, 2, 1, 2],
  "G#": [1, 3, 2, 3], A: [0, 1, 0, 0], "A#": [1, 2, 1, 1], B: [2, 3, 2, 2],
};

export function ukuleleShape(chord: string): number[] | null {
  const parsed = parseChord(chord);
  if (!parsed) return null;
  const s = parsed.suffix;
  if (s.includes("7") && !s.includes("maj")) return UKE_SEVENTH[parsed.root] ?? null;
  if (s.startsWith("m") && !s.startsWith("maj")) return UKE_MINOR[parsed.root] ?? null;
  return UKE_MAJOR[parsed.root] ?? null;
}

const BASS_STRINGS = [4, 9, 2, 7]; // E A D G (classes de altura)

/** Posições da fundamental no braço do baixo (cordas E A D G, casas 0-5). */
export function bassPositions(chord: string): { string: number; fret: number }[] {
  const parsed = parseChord(chord);
  if (!parsed) return [];
  const target = rootIndex(parsed.bass ? FLAT_TO_SHARP[parsed.bass] ?? parsed.bass : parsed.root);
  if (target < 0) return [];
  const found: { string: number; fret: number }[] = [];
  BASS_STRINGS.forEach((open, index) => {
    const fret = ((target - open) % 12 + 12) % 12;
    if (fret <= 5) found.push({ string: index, fret });
  });
  return found.slice(0, 2);
}

export const EASY_CHORDS = [
  "C", "D", "E", "G", "A", "Am", "Em", "Dm", "A7", "B7", "C7", "D7", "E7", "G7",
  "Asus4", "Dsus4", "Esus4", "Cmaj7", "Gmaj7", "Am7", "Em7", "Dm7",
];

function isEasy(chord: string) {
  return EASY_CHORDS.includes(chord.replace(/\/.+$/, ""));
}

/**
 * Procura a transposição que deixa a música com o maior número de acordes
 * sem pestana, devolvendo também a casa do capotraste que mantém o tom original.
 */
export function easyVersion(chords: string[], transposeChord: (c: string, n: number) => string) {
  let best = { shift: 0, hard: Number.POSITIVE_INFINITY };
  for (let shift = 0; shift < 12; shift += 1) {
    const hard = chords.filter((chord) => !isEasy(transposeChord(chord, shift))).length;
    if (hard < best.hard) best = { shift, hard };
  }
  return { shift: best.shift, capo: (12 - best.shift) % 12, hardCount: best.hard };
}
