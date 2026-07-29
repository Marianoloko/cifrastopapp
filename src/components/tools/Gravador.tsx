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
  const refs = useRef<{ recorder?: MediaRecorder; stream?: MediaStream; timer?: number }>({});

  useEffect(
    () => () => {
      if (refs.current.timer) window.clearInterval(refs.current.timer);
      refs.current.stream?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

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
      refs.current = { recorder, stream };
      refs.current.timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      setRecording(true);
    } catch {
      setError("Não foi possível acessar o microfone.");
    }
  };

  const stop = () => {
    refs.current.recorder?.stop();
    refs.current.stream?.getTracks().forEach((t) => t.stop());
    if (refs.current.timer) window.clearInterval(refs.current.timer);
    setRecording(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="font-mono text-5xl font-bold tabular-nums text-foreground">
          {formatTime(seconds)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {recording ? "Gravando ensaio…" : "Pronto para gravar"}
        </p>
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