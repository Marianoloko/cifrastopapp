import { useEffect, useRef, useState } from "react";
import { Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NOTES_SHARP } from "@/lib/chords";

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
  const [octave, setOctave] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [hasSignal, setHasSignal] = useState(false);
  const refs = useRef<{ ctx?: AudioContext; stream?: MediaStream; frame?: number }>({});

  const stop = () => {
    if (refs.current.frame) cancelAnimationFrame(refs.current.frame);
    refs.current.stream?.getTracks().forEach((t) => t.stop());
    void refs.current.ctx?.close();
    refs.current = {};
    setActive(false);
    setHasSignal(false);
    setNote("--");
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
        if (frequency > 0) {
          const midi = 69 + 12 * Math.log2(frequency / 440);
          const rounded = Math.round(midi);
          setNote(NOTES_SHARP[((rounded % 12) + 12) % 12]);
          setOctave(Math.floor(rounded / 12) - 1);
          setCents(Math.round((midi - rounded) * 100));
          setHasSignal(true);
        } else {
          setHasSignal(false);
        }
        refs.current.frame = requestAnimationFrame(loop);
      };

      refs.current = { ctx, stream };
      refs.current.frame = requestAnimationFrame(loop);
      setActive(true);
    } catch {
      setError("Não foi possível acessar o microfone.");
    }
  };

  const inTune = hasSignal && Math.abs(cents) <= 5;

  return (
    <div className="space-y-4">
      <Button className="w-full" variant={active ? "destructive" : "default"} onClick={active ? stop : start}>
        <Power className="size-4" aria-hidden="true" />
        {active ? "Parar afinador" : "Ligar afinador"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-2xl border bg-card p-6 text-center">
        <div className="flex items-end justify-center gap-1">
          <span
            className="text-6xl font-extrabold"
            style={{ color: inTune ? "var(--emerald)" : "var(--foreground)" }}
          >
            {hasSignal ? note : "--"}
          </span>
          <span className="mb-2 text-sm text-muted-foreground">{octave ?? ""}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasSignal ? `${cents > 0 ? "+" : ""}${cents} cents` : "Toque uma nota"}
        </p>

        <div className="relative mt-6 h-3 w-full rounded-full bg-muted">
          <div className="absolute left-1/2 top-[-6px] h-6 w-0.5 -translate-x-1/2 bg-border" />
          <div
            className="absolute top-[-8px] h-7 w-1 rounded-full transition-[left] duration-100"
            style={{
              left: `${Math.min(100, Math.max(0, 50 + cents / 1))}%`,
              backgroundColor: inTune ? "var(--emerald)" : "var(--tom)",
            }}
          />
        </div>

        {inTune ? (
          <p className="mt-4 font-semibold" style={{ color: "var(--emerald)" }}>
            Afinado
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {hasSignal ? (cents < 0 ? "Muito grave" : "Muito agudo") : " "}
          </p>
        )}
      </div>
    </div>
  );
}