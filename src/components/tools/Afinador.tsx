import { useEffect, useMemo, useRef, useState } from "react";
import { Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOTES_SHARP } from "@/lib/chords";
import { INSTRUMENTS, midiToFrequency, noteName, noteToMidi } from "@/lib/tunings";
import { cn } from "@/lib/utils";

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
  const [midi, setMidi] = useState<number | null>(null);
  const [instrumentId, setInstrumentId] = useState(INSTRUMENTS[0].id);
  const [tuningId, setTuningId] = useState(INSTRUMENTS[0].tunings[0].id);
  const [mode, setMode] = useState<"cromatico" | "corda">("cromatico");
  const [stringIndex, setStringIndex] = useState<number | null>(null);
  const refs = useRef<{ ctx?: AudioContext; stream?: MediaStream; frame?: number }>({});
  const samples = useRef<number[]>([]);
  const lastUpdate = useRef(0);

  const instrument =
    INSTRUMENTS.find((item) => item.id === instrumentId) ?? INSTRUMENTS[0];
  const tuning =
    instrument.tunings.find((item) => item.id === tuningId) ?? instrument.tunings[0];

  const targets = useMemo(
    () => tuning.strings.map((value) => ({ label: value, midi: noteToMidi(value) })),
    [tuning],
  );

  // Em "corda a corda": corda escolhida, ou a mais próxima do que está soando.
  const activeStringIndex = useMemo(() => {
    if (mode !== "corda") return null;
    if (stringIndex !== null) return stringIndex;
    if (midi === null) return null;
    let best = 0;
    targets.forEach((target, index) => {
      if (Math.abs(target.midi - midi) < Math.abs(targets[best].midi - midi)) best = index;
    });
    return best;
  }, [mode, stringIndex, midi, targets]);

  const target = activeStringIndex !== null ? targets[activeStringIndex] : null;
  const displayCents =
    target && midi !== null ? Math.round((midi - target.midi) * 100) : cents;

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
    setMidi(null);
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
            const value = median(samples.current);
            const rounded = Math.round(value);
            const index = ((rounded % 12) + 12) % 12;
            setNote(NOTES_SHARP[index]);
            setAltNote(NOTES_FLAT[index] === NOTES_SHARP[index] ? "" : NOTES_FLAT[index]);
            setOctave(Math.floor(rounded / 12) - 1);
            setCents(Math.round((value - rounded) * 100));
            setMidi(value);
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

  const playReference = (targetMidi: number) => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = midiToFrequency(targetMidi);
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.7);
    osc.onended = () => void ctx.close();
  };

  const inTune = hasSignal && Math.abs(displayCents) <= 8;
  const outOfTune = hasSignal && !inTune;
  const noteColor = inTune
    ? "var(--emerald)"
    : outOfTune
      ? "var(--destructive)"
      : "var(--foreground)";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={instrumentId}
          onValueChange={(value) => {
            const next = INSTRUMENTS.find((item) => item.id === value) ?? INSTRUMENTS[0];
            setInstrumentId(next.id);
            setTuningId(next.tunings[0].id);
            setStringIndex(null);
          }}
        >
          <SelectTrigger aria-label="Instrumento">
            <SelectValue placeholder="Instrumento" />
          </SelectTrigger>
          <SelectContent>
            {INSTRUMENTS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={tuning.id}
          onValueChange={(value) => {
            setTuningId(value);
            setStringIndex(null);
          }}
        >
          <SelectTrigger aria-label="Afinação">
            <SelectValue placeholder="Afinação" />
          </SelectTrigger>
          <SelectContent>
            {instrument.tunings.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <Button
          size="sm"
          variant={mode === "cromatico" ? "default" : "ghost"}
          onClick={() => {
            setMode("cromatico");
            setStringIndex(null);
          }}
        >
          Cromático
        </Button>
        <Button
          size="sm"
          variant={mode === "corda" ? "default" : "ghost"}
          onClick={() => setMode("corda")}
        >
          Corda a corda
        </Button>
      </div>

      {mode === "corda" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Escolha uma corda (ou toque e o app detecta a mais próxima). Toque duas vezes para ouvir
            a nota de referência.
          </p>
          <div className="flex flex-wrap gap-2">
            {targets.map((item, index) => {
              const isActive = activeStringIndex === index;
              return (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  onClick={() =>
                    setStringIndex((current) => (current === index ? null : index))
                  }
                  onDoubleClick={() => playReference(item.midi)}
                  className={cn(
                    "min-w-14 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card text-foreground",
                  )}
                >
                  {noteName(item.label)}
                  <span className="ml-0.5 text-[10px] opacity-70">
                    {item.label.replace(/^[A-G][#b]?/, "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

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
            Vale para {note} maior e {note}m (menor) — leitura estabilizada a cada 1 segundo
          </p>
        ) : null}
        {target ? (
          <p className="text-xs text-muted-foreground">
            Alvo da corda: {noteName(target.label)} ({midiToFrequency(target.midi).toFixed(1)} Hz)
          </p>
        ) : null}
        <p className="mt-1 text-sm text-muted-foreground">
          {hasSignal ? `${displayCents > 0 ? "+" : ""}${displayCents} cents` : "Toque uma nota"}
        </p>

        <div className="relative mt-6 h-3 w-full rounded-full bg-muted">
          <div className="absolute left-1/2 top-[-6px] h-6 w-0.5 -translate-x-1/2 bg-border" />
          <div
            className="absolute top-[-8px] h-7 w-1 rounded-full transition-[left] duration-100"
            style={{
              left: `${Math.min(100, Math.max(0, 50 + displayCents))}%`,
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
            Desafinado —{" "}
            {displayCents < 0 ? "está grave, suba um pouco" : "está agudo, desça um pouco"}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Toque uma nota</p>
        )}

        {outOfTune ? (
          <p className="mt-1 text-sm font-semibold text-foreground">
            {displayCents < 0
              ? "⬆️ Muito baixa — aperte a tarraxa (gire para esticar a corda)"
              : "⬇️ Muito alta — solte a tarraxa (gire para afrouxar a corda)"}
          </p>
        ) : null}
      </div>
    </div>
  );
}