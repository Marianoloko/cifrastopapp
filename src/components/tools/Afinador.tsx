import { useEffect, useRef, useState } from "react";
import { Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NOTES_SHARP } from "@/lib/chords";

const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function autoCorrelate(buffer: Float32Array, sampleRate: number) {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i += 1) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.008) return -1;

  const minLag = Math.floor(sampleRate / 1400);
  const maxLag = Math.floor(sampleRate / 60);
  let bestLag = -1;
  let bestCorr = 0;
  const correlations = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let corr = 0;
    for (let i = 0; i < size - lag; i += 1) corr += buffer[i] * buffer[i + lag];
    corr /= size - lag;
    correlations[lag] = corr;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag <= minLag || bestCorr <= 0) return -1;

  const y1 = correlations[bestLag - 1];
  const y2 = correlations[bestLag];
  const y3 = correlations[bestLag + 1] ?? y2;
  const denominator = 2 * (2 * y2 - y1 - y3);
  const shift = denominator !== 0 ? (y3 - y1) / denominator : 0;
  return sampleRate / (bestLag + shift);
}

export function Afinador() {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("--");
  const [altNote, setAltNote] = useState("");
  const [octave, setOctave] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [hasSignal, setHasSignal] = useState(false);
  const refs = useRef<{ ctx?: AudioContext; stream?: MediaStream; frame?: number }>({});
  const samples = useRef<number[]>([]);
  const lastUpdate = useRef(0);

  const stop = () => {
    if (refs.current.frame) cancelAnimationFrame(refs.current.frame);
    refs.current.stream?.getTracks().forEach((t) => t.stop());
    void refs.current.ctx?.close();
    refs.current = {};
    samples.current = [];
    lastUpdate.current = 0;
    setActive(false);
    setHasSignal(false);
    setNote("--");
    setAltNote("");
    setOctave(null);
    setCents(0);
  };

  useEffect(() => () => stop(), []);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);

      const loop = () => {
        analyser.getFloatTimeDomainData(buffer);
        const frequency = autoCorrelate(buffer, ctx.sampleRate);
        const now = performance.now();
        if (frequency > 0) {
          samples.current.push(69 + 12 * Math.log2(frequency / 440));
          if (samples.current.length > 120) samples.current.shift();
        }

        // Atualiza a leitura apenas 1x por segundo, usando a mediana das amostras:
        // evita que qualquer variação mínima faça a nota "pular".
        if (now - lastUpdate.current >= 1000) {
          lastUpdate.current = now;
          if (samples.current.length >= 8) {
            const midi = median(samples.current);
            const rounded = Math.round(midi);
            const index = ((rounded % 12) + 12) % 12;
            setNote(NOTES_SHARP[index]);
            setAltNote(NOTES_FLAT[index] === NOTES_SHARP[index] ? "" : NOTES_FLAT[index]);
            setOctave(Math.floor(rounded / 12) - 1);
            setCents(Math.round((midi - rounded) * 100));
            setHasSignal(true);
          } else {
            setHasSignal(false);
          }
          samples.current = [];
        }
        refs.current.frame = requestAnimationFrame(loop);
      };

      refs.current = { ctx, stream };
      samples.current = [];
      lastUpdate.current = performance.now();
      refs.current.frame = requestAnimationFrame(loop);
      setActive(true);
    } catch {
      setError("Não foi possível acessar o microfone.");
    }
  };

  const inTune = hasSignal && Math.abs(cents) <= 8;
  const outOfTune = hasSignal && !inTune;
  const noteColor = inTune
    ? "var(--emerald)"
    : outOfTune
      ? "var(--destructive)"
      : "var(--foreground)";

  return (
    <div className="space-y-4">
      <Button className="w-full" variant={active ? "destructive" : "default"} onClick={active ? stop : start}>
        <Power className="size-4" aria-hidden="true" />
        {active ? "Parar afinador" : "Ligar afinador"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-2xl border bg-card p-6 text-center">
        <div className="flex items-end justify-center gap-1">
          <span className="text-6xl font-extrabold" style={{ color: noteColor }}>
            {hasSignal ? note : "--"}
          </span>
          <span className="mb-2 text-sm text-muted-foreground">
            {hasSignal && octave !== null ? octave : ""}
          </span>
        </div>
        {hasSignal && altNote ? (
          <p className="text-xs text-muted-foreground">também chamada de {altNote}</p>
        ) : null}
        {hasSignal ? (
          <p className="text-xs text-muted-foreground">
            {note}m / {note}  •  leitura estabilizada (1x por segundo)
          </p>
        ) : null}
        <p className="mt-1 text-sm text-muted-foreground">
          {hasSignal ? `${cents > 0 ? "+" : ""}${cents} cents` : "Toque uma nota"}
        </p>

        <div className="relative mt-6 h-3 w-full rounded-full bg-muted">
          <div className="absolute left-1/2 top-[-6px] h-6 w-0.5 -translate-x-1/2 bg-border" />
          <div
            className="absolute top-[-8px] h-7 w-1 rounded-full transition-[left] duration-100"
            style={{
              left: `${Math.min(100, Math.max(0, 50 + cents))}%`,
              backgroundColor: inTune ? "var(--emerald)" : "var(--destructive)",
            }}
          />
        </div>

        {inTune ? (
          <p className="mt-4 font-semibold" style={{ color: "var(--emerald)" }}>
            Afinado
          </p>
        ) : outOfTune ? (
          <p className="mt-4 font-semibold" style={{ color: "var(--destructive)" }}>
            Desafinado — {cents < 0 ? "está grave, suba um pouco" : "está agudo, desça um pouco"}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Toque uma nota</p>
        )}
      </div>
    </div>
  );
}