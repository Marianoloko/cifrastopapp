import { useEffect, useRef, useState } from "react";
import { ExternalLink, Music4, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaKind = "youtube" | "spotify" | "audio" | "none";

export function detectMedia(url: string): { kind: MediaKind; embed: string; external: string } {
  const value = (url ?? "").trim();
  if (!value) return { kind: "none", embed: "", external: "" };
  const yt = value.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  if (yt) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // playsinline=1 + enablejsapi mantêm a reprodução dentro da própria página,
    // sem abrir o app nativo do YouTube nem uma nova aba.
    const params = new URLSearchParams({
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
      enablejsapi: "1",
      ...(origin ? { origin } : {}),
    });
    return {
      kind: "youtube",
      embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?${params.toString()}`,
      external: `https://www.youtube.com/watch?v=${yt[1]}`,
    };
  }
  const sp = value.match(/spotify\.com\/(track|album|playlist|episode)\/([\w]+)/);
  if (sp) {
    return {
      kind: "spotify",
      embed: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}`,
      external: value,
    };
  }
  return { kind: "audio", embed: value, external: value };
}

const RATES = [0.5, 0.75, 1];

export function MediaPlayer({
  url,
  onPlayingChange,
}: {
  url: string;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const { kind, embed, external } = detectMedia(url);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    // mantém o tom original mesmo em velocidade reduzida
    (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
  }, [rate, embed]);

  useEffect(() => {
    onPlayingChange?.(playing);
  }, [playing, onPlayingChange]);

  if (kind === "none") return null;

  return (
    <div className="fixed inset-x-0 bottom-14 z-40 border-t bg-card/95 px-3 py-2 backdrop-blur">
      {kind === "youtube" || kind === "spotify" ? (
        <div className="space-y-1">
          <iframe
            title="Player da música"
            src={embed}
            allow="autoplay; encrypted-media; clipboard-write; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className={cn("w-full rounded-lg border-0", kind === "spotify" ? "h-20" : "h-44")}
          />
          <p className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            Toca aqui dentro do app. Se o dono do vídeo bloquear a reprodução incorporada,
            <a
              href={external}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline"
            >
              abrir em nova aba
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <audio
            ref={audioRef}
            src={embed}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />
          <Button
            size="icon"
            onClick={() => {
              const audio = audioRef.current;
              if (!audio) return;
              if (audio.paused) void audio.play();
              else audio.pause();
            }}
            aria-label={playing ? "Pausar" : "Tocar"}
          >
            {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          </Button>
          <Music4 className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-xs text-muted-foreground">Modo estudo</span>
          {RATES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRate(option)}
              className={cn(
                "rounded-full border px-2 py-1 text-[11px] font-semibold transition-colors",
                rate === option ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground",
              )}
            >
              {option}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
