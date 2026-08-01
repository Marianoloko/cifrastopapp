export type TuningPreset = {
  id: string;
  name: string;
  /** Cordas da mais grave para a mais aguda, no formato nota + oitava (ex.: "E2"). */
  strings: string[];
};

export type InstrumentPreset = {
  id: string;
  name: string;
  tunings: TuningPreset[];
};

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

/** Converte "F#2" em número MIDI. */
export function noteToMidi(note: string): number {
  const match = /^([A-G][#b]?)(-?\d)$/.exec(note.trim());
  if (!match) return 69;
  const [, name, octave] = match;
  return (NOTE_TO_SEMITONE[name] ?? 9) + (Number(octave) + 1) * 12;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Nome da nota sem a oitava, para exibição. */
export function noteName(note: string): string {
  return note.replace(/-?\d$/, "");
}

export const INSTRUMENTS: InstrumentPreset[] = [
  {
    id: "violao",
    name: "Violão e Guitarra",
    tunings: [
      { id: "padrao", name: "Padrão", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
      {
        id: "meio-tom-abaixo",
        name: "1/2 Tom Abaixo",
        strings: ["D#2", "G#2", "C#3", "F#3", "A#3", "D#4"],
      },
      { id: "um-tom-abaixo", name: "1 Tom Abaixo", strings: ["D2", "G2", "C3", "F3", "A3", "D4"] },
      { id: "afinacao-c", name: "Afinação em C", strings: ["C2", "F2", "A#2", "D#3", "G3", "C4"] },
      { id: "celta", name: 'Afinação "Celta"', strings: ["D2", "A2", "D3", "G3", "A3", "D4"] },
      { id: "drop-d", name: "Drop D", strings: ["D2", "A2", "D3", "G3", "B3", "E4"] },
      { id: "drop-c", name: "Drop C", strings: ["C2", "G2", "C3", "F3", "A3", "D4"] },
      { id: "drop-b", name: "Drop B", strings: ["B1", "F#2", "B2", "E3", "G#3", "C#4"] },
      { id: "drop-a", name: "Drop A", strings: ["A1", "E2", "A2", "D3", "F#3", "B3"] },
      { id: "open-g", name: "Open G", strings: ["D2", "G2", "D3", "G3", "B3", "D4"] },
      { id: "open-d", name: "Open D", strings: ["D2", "A2", "D3", "F#3", "A3", "D4"] },
      { id: "open-c", name: "Open C", strings: ["C2", "G2", "C3", "G3", "C4", "E4"] },
      { id: "open-e", name: "Open E", strings: ["E2", "B2", "E3", "G#3", "B3", "E4"] },
      { id: "7-cordas", name: "7 cordas padrão", strings: ["B1", "E2", "A2", "D3", "G3", "B3", "E4"] },
      {
        id: "7-cordas-c",
        name: "7 cordas com baixo em C",
        strings: ["C2", "E2", "A2", "D3", "G3", "B3", "E4"],
      },
      {
        id: "8-cordas",
        name: "8 cordas padrão",
        strings: ["F#1", "B1", "E2", "A2", "D3", "G3", "B3", "E4"],
      },
      {
        id: "12-cordas",
        name: "12 cordas padrão",
        strings: ["E2", "E3", "A2", "A3", "D3", "D4", "G3", "G4", "B3", "B3", "E4", "E4"],
      },
    ],
  },
  {
    id: "baixo",
    name: "Baixo Elétrico",
    tunings: [
      { id: "padrao", name: "Padrão (4 cordas)", strings: ["E1", "A1", "D2", "G2"] },
      { id: "5-cordas", name: "5 cordas", strings: ["B0", "E1", "A1", "D2", "G2"] },
      { id: "6-cordas", name: "6 cordas", strings: ["B0", "E1", "A1", "D2", "G2", "C3"] },
      { id: "drop-d", name: "Drop D", strings: ["D1", "A1", "D2", "G2"] },
    ],
  },
  {
    id: "viola-caipira",
    name: "Viola Caipira",
    tunings: [
      {
        id: "cebolao-re",
        name: "Cebolão em Ré",
        strings: ["A3", "A2", "D3", "D3", "F#3", "F#3", "A3", "A3", "D4", "D4"],
      },
      {
        id: "cebolao-mi",
        name: "Cebolão em Mi",
        strings: ["B3", "B2", "E3", "E3", "G#3", "G#3", "B3", "B3", "E4", "E4"],
      },
      {
        id: "rio-abaixo",
        name: "Rio Abaixo",
        strings: ["G3", "G2", "D3", "D3", "G3", "G3", "B3", "B3", "D4", "D4"],
      },
      {
        id: "rio-acima",
        name: "Rio Acima",
        strings: ["C3", "C3", "E3", "E3", "G3", "G3", "C4", "C4", "E4", "E4"],
      },
      {
        id: "boiadeira",
        name: "Boiadeira",
        strings: ["G3", "G2", "D3", "D3", "F#3", "F#3", "A3", "A3", "D4", "D4"],
      },
    ],
  },
  {
    id: "cavaquinho",
    name: "Cavaquinho",
    tunings: [
      { id: "padrao", name: "Padrão", strings: ["D4", "G4", "B4", "D5"] },
      { id: "bandolim", name: "Bandolim para Cavaquinho", strings: ["G3", "D4", "A4", "E5"] },
      { id: "portugal", name: "Padrão de Portugal", strings: ["D4", "G4", "B4", "E5"] },
    ],
  },
  {
    id: "bandolim",
    name: "Bandolim",
    tunings: [
      { id: "padrao", name: "Padrão", strings: ["G3", "G3", "D4", "D4", "A4", "A4", "E5", "E5"] },
    ],
  },
  {
    id: "banjo",
    name: "Banjo",
    tunings: [{ id: "padrao", name: "Padrão", strings: ["G4", "D3", "G3", "B3", "D4"] }],
  },
  {
    id: "ukulele",
    name: "Ukulele",
    tunings: [
      { id: "soprano", name: "Soprano, Concert, Tenor", strings: ["G4", "C4", "E4", "A4"] },
      { id: "sopranino", name: "Sopranino", strings: ["A4", "D5", "F#5", "B5"] },
      { id: "baritono", name: "Barítono", strings: ["D3", "G3", "B3", "E4"] },
      { id: "baritono-high-d", name: "Barítono (High D)", strings: ["D4", "G3", "B3", "E4"] },
    ],
  },
  {
    id: "violino",
    name: "Violino",
    tunings: [{ id: "padrao", name: "Padrão", strings: ["G3", "D4", "A4", "E5"] }],
  },
  {
    id: "violoncelo",
    name: "Violoncelo",
    tunings: [{ id: "padrao", name: "Padrão", strings: ["C2", "G2", "D3", "A3"] }],
  },
];