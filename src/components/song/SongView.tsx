import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  Contrast,
  Link2,
  Maximize2,
  Minus,
  Mic2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Type,
} from "lucide-react";

import { ChordDiagram } from "@/components/song/ChordDiagram";
import { BandSyncPanel, useBandSync } from "@/components/song/BandSync";
import { MediaPlayer } from "@/components/song/MediaPlayer";
import { Gravador } from "@/components/tools/Gravador";
import { Metronomo } from "@/components/tools/Metronomo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { CIFRA_THEMES, getCifraTheme, type CifraThemeId } from "@/lib/cifra-themes";
import {
  DIAGRAM_INSTRUMENTS,
  easyVersion,
  type DiagramInstrument,
} from "@/lib/chord-instruments";
import { extractChords, isChordLine, transposeChord, transposeText } from "@/lib/chords";
import {
  getSavedDiagramInstrument,
  getSavedTranspose,
  saveDiagramInstrument,
  saveTranspose,
  type UserModeId,
} from "@/lib/user-mode";
import { cn } from "@/lib/utils";

export type Song = {
  id: string;
  title: string;
  artist: string;
  key: string;
  capo: string;
  body: string;
  media_url?: string | null;
  bpm?: number | null;
};

const HIGH_CONTRAST = { container: "#000000", lyric: "#FFFFFF", chord: "#FFD400", section: "#9CA3AF" };

export function SongView({
  song,
  themeId,
  onThemeChange,
  onBack,
  mode = "instrumentista",
}: {
  song: Song;
  themeId: CifraThemeId;
  onThemeChange: (id: CifraThemeId) => void;
  onBack: () => void;
  mode?: UserModeId;
}) {
  const [semitones, setSemitones] = useState(0);
  const [askKeep, setAskKeep] = useState(false);
  const [stage, setStage] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [bigLyrics, setBigLyrics] = useState(mode === "cantor");
  const [hideChords, setHideChords] = useState(false);
  const [easy, setEasy] = useState(false);
  const [instrument, setInstrument] = useState<DiagramInstrument>("violao");
  const [openChord, setOpenChord] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState(song.media_url ?? "");
  const [karaoke, setKaraoke] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    setSemitones(getSavedTranspose(song.id));
    setInstrument(getSavedDiagramInstrument() as DiagramInstrument);
    setMediaUrl(song.media_url ?? "");
  }, [song.id]);

  const mediaMutation = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from("songs")
        .update({ media_url: url || null } as never)
        .eq("id", song.id);
      if (error) throw error;
    },
  });

  const band = useBandSync((state) => {
    if (state.songId !== song.id) return;
    setSemitones(state.semitones);
    window.scrollTo({ top: state.scrollY });
  });

  const baseTheme = getCifraTheme(themeId);
  const theme = contrast ? { ...baseTheme, ...HIGH_CONTRAST } : baseTheme;

  const originalChords = useMemo(() => extractChords(song.body), [song.body]);
  const easyInfo = useMemo(
    () => easyVersion(originalChords, transposeChord),
    [originalChords],
  );
  const effectiveShift = easy ? easyInfo.shift : semitones;
  const text = useMemo(
    () => transposeText(song.body, effectiveShift),
    [song.body, effectiveShift],
  );
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

  useEffect(() => {
    if (!band.room || !band.leader) return;
    const id = window.setInterval(() => {
      band.broadcast({ songId: song.id, semitones, scrollY: window.scrollY });
    }, 700);
    return () => window.clearInterval(id);
  }, [band, song.id, semitones]);

  const changeTom = (delta: number) => {
    setEasy(false);
    setSemitones((value) => value + delta);
    setAskKeep(true);
  };

  const showDiagrams = mode !== "cantor" && !hideChords;
  const showPanel = mode === "voz-som";

  return (
    <div className={cn("space-y-4", showPanel ? "pb-[19rem]" : "pb-24")}>
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
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          aria-expanded={showSettings}
          className="flex w-full items-center justify-between rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-card-foreground"
        >
          <span className="flex items-center gap-2">
            <Settings2 className="size-4 text-primary" aria-hidden="true" />
            Configurações / Opções
          </span>
          <ChevronDown
            className={cn("size-4 transition-transform", showSettings && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      ) : null}

      {!stage && showSettings ? (
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
            <Button variant="outline" size="icon" onClick={() => changeTom(-1)}>
              <Minus className="size-4" aria-hidden="true" />
              <span className="sr-only">Descer meio tom</span>
            </Button>
            <span className="w-10 text-center font-mono text-sm">
              {semitones > 0 ? `+${semitones}` : semitones}
            </span>
            <Button variant="outline" size="icon" onClick={() => changeTom(1)}>
              <Plus className="size-4" aria-hidden="true" />
              <span className="sr-only">Subir meio tom</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSemitones(0);
                setEasy(false);
                saveTranspose(song.id, 0);
                setAskKeep(false);
              }}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Original
            </Button>
          </div>

          {askKeep ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-2">
              <p className="flex-1 text-xs font-medium text-foreground">
                Quer manter essa alteração de tom sempre que abrir esta música?
              </p>
              <Button
                size="sm"
                onClick={() => {
                  saveTranspose(song.id, semitones);
                  setAskKeep(false);
                }}
              >
                Manter
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAskKeep(false)}>
                Só agora
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={bigLyrics ? "default" : "outline"}
              onClick={() => setBigLyrics((v) => !v)}
            >
              <Type className="size-4" aria-hidden="true" />
              Letra grande
            </Button>
            <Button
              size="sm"
              variant={hideChords ? "default" : "outline"}
              onClick={() => setHideChords((v) => !v)}
            >
              Só letra
            </Button>
            <Button
              size="sm"
              variant={contrast ? "default" : "outline"}
              onClick={() => setContrast((v) => !v)}
            >
              <Contrast className="size-4" aria-hidden="true" />
              Alto contraste
            </Button>
            {mode === "iniciante" ? (
              <Button
                size="sm"
                variant={easy ? "default" : "outline"}
                onClick={() => setEasy((v) => !v)}
              >
                <Sparkles className="size-4" aria-hidden="true" />
                {easy ? "Versão fácil" : "Versão original"}
              </Button>
            ) : null}
          </div>

          {easy ? (
            <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
              Versão fácil: acordes sem pestana. Para soar no tom original, ponha o capotraste na{" "}
              <strong>{easyInfo.capo === 0 ? "casa 0 (sem capo)" : `${easyInfo.capo}ª casa`}</strong>.
            </p>
          ) : null}

          {mode !== "cantor" ? (
            <div className="flex flex-wrap gap-2">
              {DIAGRAM_INSTRUMENTS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setInstrument(option.id);
                    saveDiagramInstrument(option.id);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    option.id === instrument
                      ? "border-primary bg-primary/10 text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

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

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Link2 className="size-4 text-primary" aria-hidden="true" />
              <p className="text-xs font-bold text-foreground">Áudio ou vídeo da música</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={mediaUrl}
                onChange={(event) => setMediaUrl(event.target.value)}
                placeholder="Cole o link do YouTube, Spotify ou áudio"
                className="h-9 text-xs"
              />
              <Button size="sm" onClick={() => mediaMutation.mutate(mediaUrl)}>
                Salvar
              </Button>
            </div>
            <Button
              size="sm"
              variant={karaoke ? "default" : "outline"}
              onClick={() => {
                setKaraoke((v) => !v);
                if (!karaoke) setScrolling(true);
              }}
            >
              <Mic2 className="size-4" aria-hidden="true" />
              Modo Karaokê (rolagem junto com o áudio)
            </Button>
          </div>

          <BandSyncPanel
            room={band.room}
            leader={band.leader}
            onJoin={(code) => band.setRoom(code)}
            onLeave={() => {
              band.setRoom(null);
              band.setLeader(false);
            }}
            onLeaderChange={band.setLeader}
          />
        </div>
      ) : null}

      {!stage && showDiagrams && chords.length > 0 ? (
        <div
          className="flex flex-wrap gap-2 rounded-lg p-2"
          style={{ backgroundColor: theme.container }}
        >
          {chords.map((chord) => (
            <ChordDiagram key={chord} chord={chord} color={theme.chord} instrument={instrument} />
          ))}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button variant={stage ? "default" : "outline"} size="sm" onClick={() => setStage((v) => !v)}>
          <Maximize2 className="size-4" aria-hidden="true" />
          Modo Palco
        </Button>
      </div>

      <div
        className="overflow-x-auto rounded-xl p-4"
        style={{ backgroundColor: theme.container, color: theme.lyric }}
      >
        <pre
          className={cn(
            "whitespace-pre font-mono leading-relaxed tabular-nums",
            stage || bigLyrics ? "text-xl" : "text-sm",
          )}
        >
          {text.split("\n").map((line, index) => {
            const isSection = /^\s*\[.*\]\s*$/.test(line);
            const chordLine = isChordLine(line);
            if (chordLine && hideChords) return null;
            const color = isSection ? theme.section : chordLine ? theme.chord : theme.lyric;
            return (
              <span
                key={index}
                style={{
                  color,
                  fontWeight: isSection || chordLine ? 700 : 400,
                  display: "block",
                }}
              >
                {chordLine
                  ? line.split(/(\s+)/).map((token, tokenIndex) =>
                      token.trim() ? (
                        <button
                          key={tokenIndex}
                          type="button"
                          onClick={() => setOpenChord(token)}
                          className="underline-offset-4 hover:underline"
                        >
                          {token}
                        </button>
                      ) : (
                        <span key={tokenIndex}>{token}</span>
                      ),
                    )
                  : line === ""
                    ? " "
                    : line}
              </span>
            );
          })}
        </pre>
      </div>

      <Dialog open={openChord !== null} onOpenChange={(open) => !open && setOpenChord(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Acorde {openChord}</DialogTitle>
            <DialogDescription>Veja como montar em cada instrumento.</DialogDescription>
          </DialogHeader>
          {openChord ? (
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3">
              {DIAGRAM_INSTRUMENTS.map((option) => (
                <div key={option.id} className="flex flex-col items-center gap-1">
                  <ChordDiagram
                    chord={openChord}
                    color="var(--foreground)"
                    instrument={option.id}
                  />
                  <span className="text-[10px] text-muted-foreground">{option.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {showPanel ? (
        <div className="fixed bottom-16 left-0 right-0 z-30 max-h-64 overflow-y-auto border-t bg-card px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Painel rápido — metrônomo e gravação
          </p>
          <div className="space-y-4">
            <Metronomo />
            <Gravador />
          </div>
        </div>
      ) : null}

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

      {mediaUrl ? (
        <MediaPlayer
          url={song.media_url ?? mediaUrl}
          onPlayingChange={(playing) => {
            if (karaoke) setScrolling(playing);
          }}
        />
      ) : null}
    </div>
  );
}
