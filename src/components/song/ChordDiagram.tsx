import { shapeFor } from "@/lib/chords";

export function ChordDiagram({ chord, color }: { chord: string; color: string }) {
  const shape = shapeFor(chord);
  const width = 60;
  const height = 76;
  const left = 10;
  const top = 20;
  const stringGap = 8;
  const fretGap = 11;

  return (
    <figure className="flex flex-col items-center gap-1">
      <svg width={width} height={height} role="img" aria-label={`Diagrama do acorde ${chord}`}>
        <text x={width / 2} y={12} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
          {chord}
        </text>
        <rect x={left} y={top} width={stringGap * 5} height={2} fill={color} />
        {[0, 1, 2, 3, 4].map((f) => (
          <line
            key={`f${f}`}
            x1={left}
            y1={top + fretGap * (f + 1)}
            x2={left + stringGap * 5}
            y2={top + fretGap * (f + 1)}
            stroke={color}
            strokeOpacity="0.5"
          />
        ))}
        {[0, 1, 2, 3, 4, 5].map((s) => (
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
        {shape
          ? shape.frets.map((fret, index) => {
              const x = left + stringGap * index;
              if (fret === null) {
                return (
                  <text key={index} x={x} y={top - 3} fontSize="8" textAnchor="middle" fill={color}>
                    x
                  </text>
                );
              }
              if (fret === 0) {
                return (
                  <circle key={index} cx={x} cy={top - 6} r="2.5" fill="none" stroke={color} />
                );
              }
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={top + fretGap * (fret - 0.5)}
                  r="3.2"
                  fill={color}
                />
              );
            })
          : null}
      </svg>
      {!shape ? (
        <figcaption className="text-[10px]" style={{ color }}>
          sem diagrama
        </figcaption>
      ) : null}
    </figure>
  );
}