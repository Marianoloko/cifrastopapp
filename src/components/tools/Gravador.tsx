import { useEffect, useRef, useState } from "react";
import { Download, Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Gravador() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const refs = useRef<{
    recorder?: MediaRecorder;
    stream?: MediaStream;
    timer?: number;
    ctx?: AudioContext;
    frame?: number;
  }>({});

  useEffect(
    () => () => {
      if (refs.current.timer) window.clearInterval(refs.current.timer);
      if (refs.current.frame) window.cancelAnimationFrame(refs.current.frame);
      void refs.current.ctx?.close();
      refs.current.stream?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const drawWave = (analyser: AnalyserNode) => {
    const buffer = new Float32Array(analyser.fftSize);
    const loop = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (canvas && context) {
        const width = (canvas.width = canvas.clientWidth * 2);
        const height = (canvas.height = 140);
        analyser.getFloatTimeDomainData(buffer);
        context.clearRect(0, 0, width, height);
        context.lineWidth = 3;
        context.strokeStyle = "oklch(0.72 0.18 42)";
        context.beginPath();
        for (let i = 0; i < buffer.length; i += 1) {
          const x = (i / buffer.length) * width;
          const y = height / 2 + buffer[i] * (height / 2) * 0.9;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      refs.current.frame = window.requestAnimationFrame(loop);
    };
    refs.current.frame = window.requestAnimationFrame(loop);
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(blob);
        });
      };
      recorder.start();
      setSeconds(0);
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      refs.current = { recorder, stream, ctx: audioCtx };
      refs.current.timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      setRecording(true);
      drawWave(analyser);
    } catch {
      setError("Não foi possível acessar o microfone.");
    }
  };

  const stop = () => {
    refs.current.recorder?.stop();
    refs.current.stream?.getTracks().forEach((t) => t.stop());
    if (refs.current.timer) window.clearInterval(refs.current.timer);
    if (refs.current.frame) window.cancelAnimationFrame(refs.current.frame);
    void refs.current.ctx?.close();
    refs.current.ctx = undefined;
    refs.current.frame = undefined;
    setRecording(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="font-mono text-5xl font-bold tabular-nums text-foreground">
          {formatTime(seconds)}
        </p>
        <p className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {recording ? (
            <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden="true" />
          ) : null}
          {recording ? "Gravando ensaio…" : "Pronto para gravar"}
        </p>
        <canvas
          ref={canvasRef}
          className="mt-4 h-[70px] w-full rounded-lg bg-muted/40"
          aria-label="Onda de áudio da gravação"
        />
      </div>

      <Button
        className="w-full"
        variant={recording ? "destructive" : "default"}
        onClick={recording ? stop : start}
      >
        {recording ? <Square className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
        {recording ? "Parar gravação" : "Gravar"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {url ? (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <audio controls src={url} className="w-full" />
          <Button variant="outline" className="w-full" asChild>
            <a href={url} download="ensaio-cifrastop.webm">
              <Download className="size-4" aria-hidden="true" />
              Baixar gravação
            </a>
          </Button>
        </div>
      ) : null}
    </div>
  );
}