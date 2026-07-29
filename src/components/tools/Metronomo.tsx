import { useEffect, useRef, useState } from "react";
import { Hand, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const SIGNATURES = [
  { label: "2/4", beats: 2 },
  { label: "3/4", beats: 3 },
  { label: "4/4", beats: 4 },
  { label: "6/8", beats: 6 },
];

export function Metronomo() {
  const [bpm, setBpm] = useState(100);
  const [signature, setSignature] = useState("4/4");
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(-1);

  const beats = SIGNATURES.find((s) => s.label === signature)?.beats ?? 4;
  const refs = useRef<{
    ctx?: AudioContext;
    timer?: number;
    nextTime: number;
    beat: number;
    bpm: number;
    beats: number;
  }>({ nextTime: 0, beat: 0, bpm: 100, beats: 4 });
  const taps = useRef<number[]>([]);

  refs.current.bpm = bpm;
  refs.current.beats = beats;

  const stop = () => {
    if (refs.current.timer) window.clearInterval(refs.current.timer);
    refs.current.timer = undefined;
    setRunning(false);
    setCurrent(-1);
  };

  useEffect(() => () => stop(), []);

  const start = () => {
    const ctx = refs.current.ctx ?? new AudioContext();
    refs.current.ctx = ctx;
    void ctx.resume();
    refs.current.beat = 0;
    refs.current.nextTime = ctx.currentTime + 0.1;

    const click = (time: number, accent: boolean) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = accent ? 1000 : 800;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.6, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.06);
    };

    refs.current.timer = window.setInterval(() => {
      while (refs.current.nextTime < ctx.currentTime + 0.1) {
        const beatIndex = refs.current.beat % refs.current.beats;
        click(refs.current.nextTime, beatIndex === 0);
        const delay = Math.max(0, (refs.current.nextTime - ctx.currentTime) * 1000);
        window.setTimeout(() => setCurrent(beatIndex), delay);
        refs.current.nextTime += 60 / refs.current.bpm;
        refs.current.beat += 1;
      }
    }, 25);
    setRunning(true);
  };

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current, now].filter((t) => now - t < 3000).slice(-5);
    if (taps.current.length < 2) return;
    const gaps = taps.current.slice(1).map((t, i) => t - taps.current[i]);
    const average = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const value = Math.round(60000 / average);
    setBpm(Math.min(240, Math.max(40, value)));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="text-6xl font-extrabold tabular-nums text-foreground">{bpm}</p>
        <p className="text-xs text-muted-foreground">BPM</p>

        <div className="mt-5 flex justify-center gap-2">
          {Array.from({ length: beats }).map((_, index) => (
            <span
              key={index}
              className="size-4 rounded-full transition-colors"
              style={{
                backgroundColor:
                  current === index
                    ? index === 0
                      ? "var(--tom)"
                      : "var(--amber)"
                    : "var(--muted)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <Slider value={[bpm]} min={40} max={240} step={1} onValueChange={([v]) => setBpm(v)} />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>40</span>
          <span>240</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SIGNATURES.map((option) => (
          <button
            key={option.label}
            onClick={() => setSignature(option.label)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              option.label === signature
                ? "border-primary bg-primary/10 text-foreground"
                : "text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={running ? stop : start}>
          {running ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          {running ? "Parar" : "Iniciar"}
        </Button>
        <Button variant="outline" className="flex-1" onClick={tap}>
          <Hand className="size-4" aria-hidden="true" />
          Tap tempo
        </Button>
      </div>
    </div>
  );
}