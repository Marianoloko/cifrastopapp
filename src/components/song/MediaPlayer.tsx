import { useEffect, useRef, useState } from "react";
import { Music4, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaKind = "youtube" | "spotify" | "audio" | "none";

export function detectMedia(url: string): { kind: MediaKind; embed: string } {
  const value = (url ?? "").trim();
  if (!value) return { kind: "none", embed: "" };
  const yt = value.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", embed: `https://www.youtube.com/embed/${yt[1]}` };
  const sp = value.match(/spotify\.com\/(track|album|playlist|episode)\/([\w]+)/);
  if (sp) return { kind: "spotify", embed: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}` };
  return { kind: "audio", embed: value };
}

const RATES = [0.5, 0.75, 1];

export function MediaPlayer({
  url,
  onPlayingChange,
}: {
  url: string;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const { kind, embed } = detectMedia(url);
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
            allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
            className={cn("w-full rounded-lg", kind === "spotify" ? "h-20" : "h-40")}
          />
          <p className="text-[10px] text-muted-foreground">
            Controle de velocidade fica dentro do player do {kind === "spotify" ? "Spotify" : "YouTube"}.
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
