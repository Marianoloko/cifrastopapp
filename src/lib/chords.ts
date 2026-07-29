export const NOTES_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

export const CHORD_RE = /^([A-G][b#]?)([^/\s]*)(?:\/([A-G][b#]?))?$/;

function normalize(note: string) {
  return FLAT_TO_SHARP[note] ?? note;
}

function shift(note: string, semitones: number) {
  const index = NOTES_SHARP.indexOf(normalize(note));
  if (index < 0) return note;
  return NOTES_SHARP[(((index + semitones) % 12) + 12) % 12];
}

export function isChordToken(token: string) {
  return CHORD_RE.test(token);
}

/** Uma linha é de acordes quando todos os tokens são acordes válidos. */
export function isChordLine(line: string) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(isChordToken);
}

export function transposeChord(chord: string, semitones: number) {
  const match = chord.match(CHORD_RE);
  if (!match) return chord;
  const [, root, suffix, bass] = match;
  const newRoot = shift(root, semitones);
  const newBass = bass ? `/${shift(bass, semitones)}` : "";
  return `${newRoot}${suffix ?? ""}${newBass}`;
}

/** Reescreve apenas as linhas de acordes, preservando o espaçamento. */
export function transposeText(text: string, semitones: number) {
  if (!semitones) return text;
  return text
    .split("\n")
    .map((line) => {
      if (!isChordLine(line)) return line;
      return line.replace(/\S+/g, (token) => {
        const transposed = transposeChord(token, semitones);
        const diff = token.length - transposed.length;
        return diff > 0 ? transposed + " ".repeat(diff) : transposed;
      });
    })
    .join("\n");
}

export function extractChords(text: string) {
  const found: string[] = [];
  for (const line of text.split("\n")) {
    if (!isChordLine(line)) continue;
    for (const token of line.trim().split(/\s+/)) {
      if (!found.includes(token)) found.push(token);
    }
  }
  return found;
}

export type ChordShape = { frets: (number | null)[]; baseFret: number };

const SHAPES: Record<string, ChordShape> = {
  C: { frets: [null, 3, 2, 0, 1, 0], baseFret: 1 },
  "C#": { frets: [null, 4, 6, 6, 6, 4], baseFret: 1 },
  D: { frets: [null, null, 0, 2, 3, 2], baseFret: 1 },
  "D#": { frets: [null, null, 1, 3, 4, 3], baseFret: 1 },
  E: { frets: [0, 2, 2, 1, 0, 0], baseFret: 1 },
  F: { frets: [1, 3, 3, 2, 1, 1], baseFret: 1 },
  "F#": { frets: [2, 4, 4, 3, 2, 2], baseFret: 1 },
  G: { frets: [3, 2, 0, 0, 0, 3], baseFret: 1 },
  "G#": { frets: [4, 6, 6, 5, 4, 4], baseFret: 1 },
  A: { frets: [null, 0, 2, 2, 2, 0], baseFret: 1 },
  "A#": { frets: [null, 1, 3, 3, 3, 1], baseFret: 1 },
  B: { frets: [null, 2, 4, 4, 4, 2], baseFret: 1 },
  Cm: { frets: [null, 3, 5, 5, 4, 3], baseFret: 1 },
  "C#m": { frets: [null, 4, 6, 6, 5, 4], baseFret: 1 },
  Dm: { frets: [null, null, 0, 2, 3, 1], baseFret: 1 },
  "D#m": { frets: [null, null, 1, 3, 4, 2], baseFret: 1 },
  Em: { frets: [0, 2, 2, 0, 0, 0], baseFret: 1 },
  Fm: { frets: [1, 3, 3, 1, 1, 1], baseFret: 1 },
  "F#m": { frets: [2, 4, 4, 2, 2, 2], baseFret: 1 },
  Gm: { frets: [3, 5, 5, 3, 3, 3], baseFret: 1 },
  "G#m": { frets: [4, 6, 6, 4, 4, 4], baseFret: 1 },
  Am: { frets: [null, 0, 2, 2, 1, 0], baseFret: 1 },
  "A#m": { frets: [null, 1, 3, 3, 2, 1], baseFret: 1 },
  Bm: { frets: [null, 2, 4, 4, 3, 2], baseFret: 1 },
  C7: { frets: [null, 3, 2, 3, 1, 0], baseFret: 1 },
  D7: { frets: [null, null, 0, 2, 1, 2], baseFret: 1 },
  E7: { frets: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  G7: { frets: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  A7: { frets: [null, 0, 2, 0, 2, 0], baseFret: 1 },
  B7: { frets: [null, 2, 1, 2, 0, 2], baseFret: 1 },
};

/** Encontra a forma mais próxima para desenhar o diagrama do acorde. */
export function shapeFor(chord: string): ChordShape | null {
  const match = chord.match(CHORD_RE);
  if (!match) return null;
  const root = normalize(match[1]);
  const suffix = match[2] ?? "";
  const candidates = [
    `${root}${suffix}`,
    `${root}${suffix.startsWith("m") && !suffix.startsWith("maj") ? "m" : ""}`,
    suffix.includes("7") ? `${root}7` : `${root}`,
    root,
  ];
  for (const key of candidates) {
    if (SHAPES[key]) return SHAPES[key];
  }
  return null;
}