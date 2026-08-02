import { useEffect, useRef, useState } from "react";
import { Headphones, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const PRESETS = [
  { id: "quente", label: "Voz Quente", gain: 0.7, reverb: 0.2, delay: 0.08, denoise: false },
  { id: "estudio", label: "Reverb de Estúdio", gain: 0.6, reverb: 0.55, delay: 0.22, denoise: false },
  { id: "limpo", label: "Atenuação de Ruído", gain: 0.5, reverb: 0.08, delay: 0, denoise: true },
];

function makeImpulse(ctx: AudioContext, seconds = 2.2, decay = 2.5) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

export function Retorno() {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gain, setGain] = useState(0.6);
  const [reverb, setReverb] = useState(0.25);
  const [delay, setDelay] = useState(0.15);
  const [level, setLevel] = useState(0);
  const [preset, setPreset] = useState<string | null>(null);
  const [denoise, setDenoise] = useState(false);

  const refs = useRef<{
    ctx?: AudioContext;
    stream?: MediaStream;
    gain?: GainNode;
    wet?: GainNode;
    dry?: GainNode;
    delayGain?: GainNode;
    analyser?: AnalyserNode;
    frame?: number;
  }>({});

  useEffect(() => {
    if (refs.current.gain) refs.current.gain.gain.value = gain;
  }, [gain]);
  useEffect(() => {
    if (refs.current.wet) refs.current.wet.gain.value = reverb;
    if (refs.current.dry) refs.current.dry.gain.value = 1 - reverb * 0.6;
  }, [reverb]);
  useEffect(() => {
    if (refs.current.delayGain) refs.current.delayGain.gain.value = delay;
  }, [delay]);

  const stop = () => {
    const r = refs.current;
    if (r.frame) cancelAnimationFrame(r.frame);
    r.stream?.getTracks().forEach((t) => t.stop());
    void r.ctx?.close();
    refs.current = {};
    setActive(false);
    setLevel(0);
  };

  useEffect(() => () => stop(), []);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: denoise,
          autoGainControl: false,
        },
      });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);

      const gainNode = ctx.createGain();
      gainNode.gain.value = gain;

      const convolver = ctx.createConvolver();
      convolver.buffer = makeImpulse(ctx);
      const wet = ctx.createGain();
      wet.gain.value = reverb;
      const dry = ctx.createGain();
      dry.gain.value = 1 - reverb * 0.6;

      const delayNode = ctx.createDelay(1.5);
      delayNode.delayTime.value = 0.28;
      const delayGain = ctx.createGain();
      delayGain.gain.value = delay;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.25;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;

      source.connect(gainNode);
      gainNode.connect(dry);
      gainNode.connect(convolver);
      convolver.connect(wet);
      dry.connect(delayNode);
      wet.connect(delayNode);
      delayNode.connect(delayGain);
      delayGain.connect(feedback);
      feedback.connect(delayNode);

      dry.connect(analyser);
      wet.connect(analyser);
      delayGain.connect(analyser);
      analyser.connect(ctx.destination);

      const buffer = new Float32Array(analyser.fftSize);
      const loop = () => {
        analyser.getFloatTimeDomainData(buffer);
        let peak = 0;
        for (const sample of buffer) peak = Math.max(peak, Math.abs(sample));
        setLevel(peak);
        refs.current.frame = requestAnimationFrame(loop);
      };

      refs.current = { ctx, stream, gain: gainNode, wet, dry, delayGain, analyser };
      refs.current.frame = requestAnimationFrame(loop);
      setActive(true);
    } catch {
      setError("Não foi possível acessar o microfone.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-primary/40 bg-amber-soft p-3 text-sm text-accent-foreground">
        <Headphones className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="font-medium">Use fones de ouvido para evitar microfonia.</p>
      </div>

      <Button className="w-full" variant={active ? "destructive" : "default"} onClick={active ? stop : start}>
        <Power className="size-4" aria-hidden="true" />
        {active ? "Desligar retorno" : "Ligar retorno"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-xl border bg-card p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Presets de voz</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setPreset(item.id);
                setGain(item.gain);
                setReverb(item.reverb);
                setDelay(item.delay);
                setDenoise(item.denoise);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                preset === item.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {denoise ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Atenuação de ruído entra ao ligar o retorno novamente.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-1 text-xs font-semibold text-muted-foreground">Nível</p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald transition-[width] duration-75"
            style={{ width: `${Math.min(100, level * 140)}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        {[
          { label: "Ganho", value: gain, set: setGain },
          { label: "Reverb", value: reverb, set: setReverb },
          { label: "Delay", value: delay, set: setDelay },
        ].map((control) => (
          <div key={control.label}>
            <div className="mb-2 flex justify-between text-xs font-semibold text-muted-foreground">
              <span>{control.label}</span>
              <span>{Math.round(control.value * 100)}%</span>
            </div>
            <Slider
              value={[control.value]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => control.set(v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}