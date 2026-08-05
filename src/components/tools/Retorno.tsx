import { useEffect, useRef, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Headphones, Power, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
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

function VerticalSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <SliderPrimitive.Root
        orientation="vertical"
        value={[value]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={([v]) => onChange(v)}
        className="relative flex h-40 w-8 touch-none select-none flex-col items-center justify-center"
        aria-label={label}
      >
        <SliderPrimitive.Track className="relative h-full w-2 grow overflow-hidden rounded-full bg-primary/20">
          <SliderPrimitive.Range className="absolute w-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-5 rounded-full border border-primary/50 bg-background shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </SliderPrimitive.Root>
      <span className="font-mono text-xs text-foreground">{Math.round(value * 100)}%</span>
    </div>
  );
}

export function Retorno() {
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gain, setGain] = useState(0.6);
  const [reverb, setReverb] = useState(0.25);
  const [delay, setDelay] = useState(0.15);
  const [level, setLevel] = useState(0);
  const [preset, setPreset] = useState<string | null>(null);
  const [denoise, setDenoise] = useState(false);
  const [silentRehearsal, setSilentRehearsal] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [lineDeviceId, setLineDeviceId] = useState<string>("");
  const [micDeviceId, setMicDeviceId] = useState<string>("");

  useEffect(() => {
    void (async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((device) => device.kind === "audioinput"));
      } catch {
        setDevices([]);
      }
    })();
  }, []);

  const refs = useRef<{
    ctx?: AudioContext;
    streams?: MediaStream[];
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
    r.streams?.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    void r.ctx?.close();
    refs.current = {};
    setActive(false);
    setLevel(0);
  };

  useEffect(() => () => stop(), []);

  const loadDevices = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((device) => device.kind === "audioinput"));
    } catch {
      setDevices([]);
    }
  };

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          ...(micDeviceId ? { deviceId: { exact: micDeviceId } } : {}),
          echoCancellation: false,
          noiseSuppression: denoise,
          autoGainControl: false,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const streams = [stream];

      const ctx = new AudioContext();
      const inputMix = ctx.createGain();
      ctx.createMediaStreamSource(stream).connect(inputMix);

      if (silentRehearsal && lineDeviceId) {
        try {
          const lineStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: lineDeviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });
          streams.push(lineStream);
          ctx.createMediaStreamSource(lineStream).connect(inputMix);
        } catch {
          setError("Não consegui abrir a entrada de instrumento escolhida.");
        }
      }

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

      inputMix.connect(gainNode);
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

      refs.current = { ctx, streams, gain: gainNode, wet, dry, delayGain, analyser };
      refs.current.frame = requestAnimationFrame(loop);
      setActive(true);
      void loadDevices();
    } catch {
      setError("Não foi possível acessar o microfone.");
    } finally {
      setStarting(false);
    }
  };

  const percent = Math.min(100, level * 140);
  const meterColor =
    percent > 85 ? "bg-destructive" : percent > 60 ? "bg-amber-400" : "bg-emerald";

  return (
    <div className="space-y-4">
      {!active ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-amber-400/50 bg-amber-400/10 p-3">
            <Headphones className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
            <p className="text-xs font-medium text-foreground">
              <strong>Use fones de ouvido.</strong> Sem fone, o som do celular volta para o microfone e
              causa microfonia (aquele apito agudo).
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="mic-device">
              Dispositivo de entrada (microfone)
            </label>
            <select
              id="mic-device"
              value={micDeviceId}
              onChange={(event) => setMicDeviceId(event.target.value)}
              className="w-full rounded-lg border bg-card p-2 text-xs text-foreground"
            >
              <option value="">Microfone padrão do aparelho</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || "Entrada de áudio"}
                </option>
              ))}
            </select>
          </div>

          <Button className="h-14 w-full text-base font-semibold" onClick={start} disabled={starting}>
            <Headphones className="size-5" aria-hidden="true" />
            Ativar Retorno de Áudio ao Vivo
          </Button>
          <button
            type="button"
            onClick={() => {
              setSilentRehearsal((v) => !v);
              void loadDevices();
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border p-3 text-left text-xs transition-colors",
              silentRehearsal ? "border-primary bg-primary/10" : "border-border text-muted-foreground",
            )}
          >
            <Radio className="size-4 shrink-0" aria-hidden="true" />
            <span>
              <strong className="block text-foreground">Modo Ensaio Silencioso</strong>
              Mistura microfone + entrada de instrumento direto no seu fone.
            </span>
          </button>
          {silentRehearsal ? (
            <select
              value={lineDeviceId}
              onChange={(event) => setLineDeviceId(event.target.value)}
              className="w-full rounded-lg border bg-card p-2 text-xs text-foreground"
              aria-label="Entrada de instrumento"
            >
              <option value="">Escolher entrada de instrumento…</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || "Entrada de áudio"}
                </option>
              ))}
            </select>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 duration-300">
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Nível de entrada</p>
            <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full transition-[width] duration-75", meterColor)}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border bg-card p-4">
            <VerticalSlider label="Ganho" value={gain} onChange={setGain} />
            <VerticalSlider label="Reverb" value={reverb} onChange={setReverb} />
            <VerticalSlider label="Delay" value={delay} onChange={setDelay} />
          </div>

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

          <Button className="h-12 w-full text-base font-semibold" variant="destructive" onClick={stop}>
            <Power className="size-5" aria-hidden="true" />
            Desligar Retorno
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
