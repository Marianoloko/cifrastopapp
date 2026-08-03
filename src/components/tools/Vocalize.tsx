import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

type Step = { label: string; hint: string; seconds: number; base: number; pattern: number[] };

const A4 = 440;
const semitone = (n: number) => A4 * Math.pow(2, n / 12);

export const VOCALIZE_ROUTINE: Step[] = [
  { label: "Respiração", hint: "Inspire em 4 tempos, solte em 8 no som de 's'", seconds: 60, base: -9, pattern: [0] },
  { label: "Vibração de lábios", hint: "Brrr subindo e descendo na escala", seconds: 60, base: -9, pattern: [0, 2, 4, 5, 7, 5, 4, 2] },
  { label: "Sirene em Ni", hint: "Glissando suave do grave ao agudo", seconds: 60, base: -5, pattern: [0, 4, 7, 12, 7, 4] },
  { label: "Arpejo aberto", hint: "Vogal 'a' com boca relaxada", seconds: 60, base: -2, pattern: [0, 4, 7, 12, 7, 4, 0] },
  { label: "Desaquecimento", hint: "Hum grave e leve, sem forçar", seconds: 60, base: -12, pattern: [4, 2, 0] },
];

const TOTAL = VOCALIZE_ROUTINE.reduce((sum, step) => sum + step.seconds, 0);

export function Vocalize() {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const noteRef = useRef(0);

  const stop = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    setPlaying(false);
  };

  useEffect(() => () => stop(), []);

  let acc = 0;
  let current = VOCALIZE_ROUTINE[0];
  for (const step of VOCALIZE_ROUTINE) {
    if (elapsed < acc + step.seconds) {
      current = step;
      break;
    }
    acc += step.seconds;
  }

  const start = () => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    setPlaying(true);
    let seconds = elapsed >= TOTAL ? 0 : elapsed;
    setElapsed(seconds);

    timerRef.current = window.setInterval(() => {
      seconds += 0.5;
      if (seconds >= TOTAL) {
        stop();
        setElapsed(TOTAL);
        return;
      }
      setElapsed(seconds);

      let sum = 0;
      let step = VOCALIZE_ROUTINE[0];
      for (const item of VOCALIZE_ROUTINE) {
        if (seconds < sum + item.seconds) {
          step = item;
          break;
        }
        sum += item.seconds;
      }

      const note = step.pattern[noteRef.current % step.pattern.length];
      noteRef.current += 1;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = semitone(step.base + note);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }, 500);
  };

  const remaining = Math.max(0, TOTAL - Math.floor(elapsed));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div>
        <p className="text-sm font-bold text-foreground">Vocalize guiado — 5 minutos</p>
        <p className="text-xs text-muted-foreground">
          Aquecimento e desaquecimento com notas de referência tocadas pelo app.
        </p>
      </div>

      <div className="rounded-lg bg-muted p-3">
        <p className="text-sm font-semibold text-foreground">{current.label}</p>
        <p className="text-xs text-muted-foreground">{current.hint}</p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${(elapsed / TOTAL) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button className="flex-1" onClick={playing ? stop : start}>
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          {playing ? "Pausar" : elapsed > 0 && elapsed < TOTAL ? "Continuar" : "Iniciar vocalize"}
        </Button>
        <span className="font-mono text-sm text-muted-foreground">
          {mm}:{ss}
        </span>
      </div>

      <ol className="space-y-1 text-xs text-muted-foreground">
        {VOCALIZE_ROUTINE.map((step) => (
          <li key={step.label}>
            <strong className="text-foreground">{step.label}</strong> — {step.hint}
          </li>
        ))}
      </ol>
    </div>
  );
}
