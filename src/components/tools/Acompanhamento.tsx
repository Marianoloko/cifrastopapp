import { useEffect, useRef, useState } from "react";
import { Drum, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { NOTES_SHARP } from "@/lib/chords";
import { cn } from "@/lib/utils";

const PATTERNS = [
  { id: "rock", label: "Rock 4/4", kick: [0, 4], snare: [2, 6], bass: [0, 2, 4, 6] },
  { id: "pop", label: "Pop leve", kick: [0, 3, 4], snare: [2, 6], bass: [0, 4] },
  { id: "balada", label: "Balada", kick: [0], snare: [4], bass: [0, 2, 4, 6] },
  { id: "samba", label: "Samba/Pagode", kick: [0, 3, 4, 7], snare: [2, 5, 6], bass: [0, 1, 4, 5] },
];

const ROOT_FREQ: Record<string, number> = {
  C: 65.41, "C#": 69.3, D: 73.42, "D#": 77.78, E: 82.41, F: 87.31,
  "F#": 92.5, G: 98, "G#": 103.83, A: 110, "A#": 116.54, B: 123.47,
};

export function Acompanhamento() {
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [root, setRoot] = useState("C");
  const [drums, setDrums] = useState(true);
  const [bassOn, setBassOn] = useState(true);

  const state = useRef({ bpm, pattern, root, drums, bassOn });
  state.current = { bpm, pattern, root, drums, bassOn };
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);

  const stop = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    stepRef.current = 0;
    setPlaying(false);
  };

  useEffect(() => () => stop(), []);

  const hit = (ctx: AudioContext, type: "kick" | "snare" | "hat") => {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    if (type === "kick") {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.22);
      return;
    }
    const length = Math.floor(ctx.sampleRate * 0.2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = type === "snare" ? 1200 : 7000;
    gain.gain.setValueAtTime(type === "snare" ? 0.5 : 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (type === "snare" ? 0.18 : 0.05));
    noise.connect(filter);
    filter.connect(gain);
    noise.start(now);
  };

  const bassNote = (ctx: AudioContext, freq: number, duration: number) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  };

  const start = () => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    setPlaying(true);

    const tick = () => {
      const current = state.current;
      const step = stepRef.current % 8;
      const eighth = 30 / current.bpm;

      if (current.drums) {
        if (current.pattern.kick.includes(step)) hit(ctx, "kick");
        if (current.pattern.snare.includes(step)) hit(ctx, "snare");
        hit(ctx, "hat");
      }
      if (current.bassOn && current.pattern.bass.includes(step)) {
        const base = ROOT_FREQ[current.root] ?? 65.41;
        const degrees = [0, 0, 7, 5];
        const degree = degrees[Math.floor(stepRef.current / 8) % degrees.length];
        bassNote(ctx, base * Math.pow(2, degree / 12), eighth * 1.6);
      }

      stepRef.current += 1;
      timerRef.current = window.setTimeout(tick, eighth * 1000);
    };
    tick();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Drum className="size-4 text-primary" aria-hidden="true" />
          <p className="text-sm font-bold text-foreground">Gerador de acompanhamento</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Base de bateria e baixo com metrônomo para treinar improviso e ritmo.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Andamento</span>
          <span className="font-mono text-base text-foreground">{bpm} BPM</span>
        </div>
        <Slider value={[bpm]} min={50} max={200} step={1} onValueChange={([v]) => setBpm(v)} />

        <div className="flex flex-wrap gap-2">
          {PATTERNS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPattern(item)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                pattern.id === item.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Tom do baixo</p>
          <div className="flex flex-wrap gap-1">
            {NOTES_SHARP.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => setRoot(note)}
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-xs transition-colors",
                  root === note ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground",
                )}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant={drums ? "default" : "outline"} onClick={() => setDrums((v) => !v)}>
            Bateria
          </Button>
          <Button size="sm" variant={bassOn ? "default" : "outline"} onClick={() => setBassOn((v) => !v)}>
            Baixo
          </Button>
        </div>

        <Button className="h-12 w-full" variant={playing ? "destructive" : "default"} onClick={playing ? stop : start}>
          {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
          {playing ? "Parar acompanhamento" : "Tocar acompanhamento"}
        </Button>
      </div>
    </div>
  );
}
