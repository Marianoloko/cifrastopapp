import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Headphones, ListMusic, Mic, Music2, Sparkles, Timer, X } from "lucide-react";

import { Afinador } from "@/components/tools/Afinador";
import { Gravador } from "@/components/tools/Gravador";
import { Metronomo } from "@/components/tools/Metronomo";
import { Retorno } from "@/components/tools/Retorno";
import { SongView, type Song } from "@/components/song/SongView";
import { STARTER_SONGS } from "@/lib/starter-songs";
import type { CifraThemeId } from "@/lib/cifra-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/cifrastop-logo.png.asset.json";

export const Route = createFileRoute("/experimentar")({
  head: () => ({
    meta: [
      { title: "Conheça o app — CifraVocal Pro | CifraStop" },
      {
        name: "description",
        content:
          "Veja por dentro o afinador, metrônomo, retorno de áudio, gravador e repertório do CifraStop. Crie sua conta e teste grátis por 4 horas.",
      },
      { property: "og:title", content: "Conheça o CifraVocal Pro por dentro" },
      {
        property: "og:description",
        content: "Explore as ferramentas do músico e libere 4 horas grátis criando sua conta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoPage,
});

const TABS = [
  { id: "repertorio", label: "Repertório", icon: ListMusic },
  { id: "retorno", label: "Retorno", icon: Headphones },
  { id: "afinador", label: "Afinador", icon: Music2 },
  { id: "metronomo", label: "Metrônomo", icon: Timer },
  { id: "gravador", label: "Gravador", icon: Mic },
] as const;

type TabId = (typeof TABS)[number]["id"];

const DEMO_SONGS: Song[] = STARTER_SONGS.map((song, index) => ({
  id: `demo-${index}`,
  title: song.title,
  artist: song.artist,
  key: song.key,
  capo: song.capo,
  body: song.body,
  media_url: song.media_url,
  bpm: song.bpm,
}));

function DemoPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("repertorio");
  const [theme, setTheme] = useState<CifraThemeId>("cifraclub");
  const [openSong, setOpenSong] = useState<Song | null>(null);
  const [showCta, setShowCta] = useState(false);
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const engagement = useRef(0);

  const goRegister = () => navigate({ to: "/auth", search: { redirect: "/app" } });

  // Conta as interações reais (abrir músicas, trocar de ferramenta) e só depois
  // de o usuário realmente experimentar o app mostra o convite para criar conta.
  const registerEngagement = () => {
    engagement.current += 1;
    if (engagement.current >= 4 && !ctaDismissed) setShowCta(true);
  };

  useEffect(() => {
    if (ctaDismissed) return;
    const timer = window.setTimeout(() => setShowCta(true), 120000);
    return () => window.clearTimeout(timer);
  }, [ctaDismissed]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex flex-wrap items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-xs font-semibold text-primary-foreground">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Teste livre — use tudo à vontade, sem cadastro
      </div>

      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={logoAsset.url} alt="Logo CifraStop" className="size-9" />
          <div>
            <h1 className="text-base font-extrabold text-foreground">CifraVocal Pro</h1>
            <p className="text-[11px] text-muted-foreground">Kit completo do músico</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Voltar</Link>
        </Button>
      </header>

      <main className="px-4">
        {tab === "repertorio" ? (
          <div className="space-y-3">
            {openSong ? (
              <SongView
                song={openSong}
                themeId={theme}
                onThemeChange={setTheme}
                playlist={DEMO_SONGS.map((item) => ({
                  id: item.id,
                  title: item.title,
                  artist: item.artist,
                }))}
                onSelectSong={(id) => {
                  const next = DEMO_SONGS.find((item) => item.id === id);
                  if (next) setOpenSong(next);
                  registerEngagement();
                }}
                onBack={() => setOpenSong(null)}
              />
            ) : (
              <div className="space-y-2">
                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                  <h2 className="text-base font-extrabold text-foreground">
                    Escolha uma música e toque agora
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Transposição de tom, rolagem automática, karaokê com vídeo e afinador — tudo
                    liberado para você experimentar.
                  </p>
                </div>
                {DEMO_SONGS.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => {
                      setOpenSong(song);
                      registerEngagement();
                    }}
                    className="flex w-full flex-col items-start rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/50"
                  >
                    <span className="text-sm font-bold text-card-foreground">{song.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {song.artist} · Tom {song.key} · vídeo + karaokê
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {tab === "retorno" ? <Retorno /> : null}
            {tab === "afinador" ? <Afinador /> : null}
            {tab === "metronomo" ? <Metronomo /> : null}
            {tab === "gravador" ? <Gravador /> : null}
          </div>
        )}
      </main>

      {showCta ? (
        <div className="fixed inset-x-3 bottom-16 z-40 rounded-2xl border border-primary/40 bg-card p-4 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setShowCta(false);
              setCtaDismissed(true);
            }}
            aria-label="Fechar convite"
            className="absolute right-2 top-2 text-muted-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <p className="pr-6 text-sm font-extrabold text-foreground">Gostou da experiência? 🎸</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crie sua conta e libere todo o catálogo, seu repertório na nuvem e todas as ferramentas
            por apenas <strong className="text-foreground">R$ 15/mês</strong>.
          </p>
          <Button className="mt-3 w-full" onClick={goRegister}>
            Criar minha conta grátis
          </Button>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 backdrop-blur">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setTab(item.id);
              registerEngagement();
            }}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[10px] font-semibold",
              tab === item.id ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
