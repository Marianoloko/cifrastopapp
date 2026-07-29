import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Maximize2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from "lucide-react";

import { ChordDiagram } from "@/components/song/ChordDiagram";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CIFRA_THEMES, getCifraTheme, type CifraThemeId } from "@/lib/cifra-themes";
import { extractChords, isChordLine, transposeText } from "@/lib/chords";
import { cn } from "@/lib/utils";

export type Song = {
  id: string;
  title: string;
  artist: string;
  key: string;
  capo: string;
  body: string;
};

export function SongView({
  song,
  themeId,
  onThemeChange,
  onBack,
}: {
  song: Song;
  themeId: CifraThemeId;
  onThemeChange: (id: CifraThemeId) => void;
  onBack: () => void;
}) {
  const [semitones, setSemitones] = useState(0);
  const [stage, setStage] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(3);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const theme = getCifraTheme(themeId);
  const text = useMemo(() => transposeText(song.body, semitones), [song.body, semitones]);
  const chords = useMemo(() => extractChords(text), [text]);

  useEffect(() => {
    if (!scrolling) return;
    let frame = 0;
    const step = () => {
      window.scrollBy(0, speedRef.current * 0.4);
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [scrolling]);

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Button>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-foreground">{song.title}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {song.artist || "Sem artista"} · Tom {song.key} · {song.capo}
          </p>
        </div>
      </div>

      {!stage ? (
        <div className="space-y-3 rounded-xl border bg-card p-3">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Modelo visual</p>
            <div className="flex flex-wrap gap-2">
              {CIFRA_THEMES.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onThemeChange(option.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    option.id === themeId
                      ? "border-primary bg-primary/10 text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Tom</span>
            <Button variant="outline" size="icon" onClick={() => setSemitones((v) => v - 1)}>
              <Minus className="size-4" aria-hidden="true" />
              <span className="sr-only">Descer meio tom</span>
            </Button>
            <span className="w-10 text-center font-mono text-sm">
              {semitones > 0 ? `+${semitones}` : semitones}
            </span>
            <Button variant="outline" size="icon" onClick={() => setSemitones((v) => v + 1)}>
              <Plus className="size-4" aria-hidden="true" />
              <span className="sr-only">Subir meio tom</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSemitones(0)}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Original
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setScrolling((v) => !v)}>
              {scrolling ? (
                <Pause className="size-4" aria-hidden="true" />
              ) : (
                <Play className="size-4" aria-hidden="true" />
              )}
              Rolagem
            </Button>
            <Slider
              value={[speed]}
              min={1}
              max={10}
              step={1}
              onValueChange={([v]) => setSpeed(v)}
              className="flex-1"
            />
            <span className="w-6 text-center text-xs text-muted-foreground">{speed}</span>
          </div>

          {chords.length > 0 ? (
            <div
              className="flex flex-wrap gap-2 rounded-lg p-2"
              style={{ backgroundColor: theme.container }}
            >
              {chords.map((chord) => (
                <ChordDiagram key={chord} chord={chord} color={theme.chord} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button variant={stage ? "default" : "outline"} size="sm" onClick={() => setStage((v) => !v)}>
          <Maximize2 className="size-4" aria-hidden="true" />
          Modo Palco
        </Button>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: theme.container, color: theme.lyric }}
      >
        <pre
          className={cn(
            "whitespace-pre-wrap font-mono leading-relaxed",
            stage ? "text-xl" : "text-sm",
          )}
        >
          {text.split("\n").map((line, index) => {
            const isSection = /^\s*\[.*\]\s*$/.test(line);
            const color = isSection
              ? theme.section
              : isChordLine(line)
                ? theme.chord
                : theme.lyric;
            return (
              <span
                key={index}
                style={{
                  color,
                  fontWeight: isSection || isChordLine(line) ? 700 : 400,
                  display: "block",
                }}
              >
                {line === "" ? " " : line}
              </span>
            );
          })}
        </pre>
      </div>

      {stage ? (
        <div className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2">
          <Button size="sm" onClick={() => setScrolling((v) => !v)}>
            {scrolling ? (
              <Pause className="size-4" aria-hidden="true" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
            Rolagem
          </Button>
        </div>
      ) : null}
    </div>
  );
}