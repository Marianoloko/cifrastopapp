import { shapeFor } from "@/lib/chords";
import {
  bassPositions,
  chordTones,
  ukuleleShape,
  type DiagramInstrument,
} from "@/lib/chord-instruments";

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK = [
  { pc: 1, x: 0 },
  { pc: 3, x: 1 },
  { pc: 6, x: 3 },
  { pc: 8, x: 4 },
  { pc: 10, x: 5 },
];

function Fretboard({
  chord,
  color,
  frets,
  strings,
}: {
  chord: string;
  color: string;
  frets: (number | null)[];
  strings: number;
}) {
  const stringGap = strings > 4 ? 8 : 11;
  const fretGap = 11;
  const left = 10;
  const top = 20;
  const width = left * 2 + stringGap * (strings - 1);

  return (
    <svg width={width} height={76} role="img" aria-label={`Diagrama do acorde ${chord}`}>
      <text x={width / 2} y={12} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {chord}
      </text>
      <rect x={left} y={top} width={stringGap * (strings - 1)} height={2} fill={color} />
      {[0, 1, 2, 3, 4].map((f) => (
        <line
          key={`f${f}`}
          x1={left}
          y1={top + fretGap * (f + 1)}
          x2={left + stringGap * (strings - 1)}
          y2={top + fretGap * (f + 1)}
          stroke={color}
          strokeOpacity="0.5"
        />
      ))}
      {Array.from({ length: strings }).map((_, s) => (
        <line
          key={`s${s}`}
          x1={left + stringGap * s}
          y1={top}
          x2={left + stringGap * s}
          y2={top + fretGap * 5}
          stroke={color}
          strokeOpacity="0.5"
        />
      ))}
      {frets.map((fret, index) => {
        const x = left + stringGap * index;
        if (fret === null) {
          return (
            <text key={index} x={x} y={top - 3} fontSize="8" textAnchor="middle" fill={color}>
              x
            </text>
          );
        }
        if (fret === 0) {
          return <circle key={index} cx={x} cy={top - 6} r="2.5" fill="none" stroke={color} />;
        }
        return (
          <circle key={index} cx={x} cy={top + fretGap * (fret - 0.5)} r="3.2" fill={color} />
        );
      })}
    </svg>
  );
}

function Keyboard({ chord, color }: { chord: string; color: string }) {
  const tones = chordTones(chord);
  const keyWidth = 12;
  const width = keyWidth * 7 + 4;

  return (
    <svg width={width} height={76} role="img" aria-label={`Teclas do acorde ${chord}`}>
      <text x={width / 2} y={12} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {chord}
      </text>
      {WHITE.map((pc, index) => (
        <rect
          key={pc}
          x={2 + index * keyWidth}
          y={20}
          width={keyWidth - 1}
          height={50}
          rx={1.5}
          fill={tones.includes(pc) ? color : "transparent"}
          fillOpacity={tones.includes(pc) ? 0.85 : 1}
          stroke={color}
          strokeOpacity="0.6"
        />
      ))}
      {BLACK.map((key) => (
        <rect
          key={key.pc}
          x={2 + key.x * keyWidth + keyWidth * 0.65}
          y={20}
          width={keyWidth * 0.7}
          height={30}
          rx={1.5}
          fill={tones.includes(key.pc) ? color : "currentColor"}
          fillOpacity={tones.includes(key.pc) ? 1 : 0.35}
          stroke={color}
          strokeOpacity="0.6"
        />
      ))}
    </svg>
  );
}

function BassBoard({ chord, color }: { chord: string; color: string }) {
  const positions = bassPositions(chord);
  const frets: (number | null)[] = [null, null, null, null];
  positions.forEach((position) => {
    frets[position.string] = position.fret;
  });
  return <Fretboard chord={chord} color={color} frets={frets} strings={4} />;
}

export function ChordDiagram({
  chord,
  color,
  instrument = "violao",
}: {
  chord: string;
  color: string;
  instrument?: DiagramInstrument;
}) {
  if (instrument === "teclado") {
    return (
      <figure className="flex flex-col items-center gap-1">
        <Keyboard chord={chord} color={color} />
      </figure>
    );
  }

  if (instrument === "baixo") {
    return (
      <figure className="flex flex-col items-center gap-1">
        <BassBoard chord={chord} color={color} />
        <figcaption className="text-[10px]" style={{ color, opacity: 0.7 }}>
          fundamental
        </figcaption>
      </figure>
    );
  }

  if (instrument === "ukulele") {
    const shape = ukuleleShape(chord);
    return (
      <figure className="flex flex-col items-center gap-1">
        {shape ? (
          <Fretboard chord={chord} color={color} frets={shape} strings={4} />
        ) : (
          <span className="text-xs font-bold" style={{ color }}>
            {chord} · sem diagrama
          </span>
        )}
      </figure>
    );
  }

  const shape = shapeFor(chord);
  return (
    <figure className="flex flex-col items-center gap-1">
      <Fretboard
        chord={chord}
        color={color}
        frets={shape ? shape.frets : [null, null, null, null, null, null]}
        strings={6}
      />
      {!shape ? (
        <figcaption className="text-[10px]" style={{ color }}>
          sem diagrama
        </figcaption>
      ) : null}
    </figure>
  );
}
