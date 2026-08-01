import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Headphones, ListMusic, Lock, Mic, Music2, Timer } from "lucide-react";

import { Afinador } from "@/components/tools/Afinador";
import { Gravador } from "@/components/tools/Gravador";
import { Metronomo } from "@/components/tools/Metronomo";
import { Retorno } from "@/components/tools/Retorno";
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

function DemoPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("afinador");

  const goRegister = () => navigate({ to: "/auth", search: { redirect: "/app" } });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
        <span>Modo demonstração — crie sua conta para usar as ferramentas</span>
        <Button size="sm" variant="secondary" onClick={goRegister}>
          Criar conta grátis
        </Button>
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
        <div className="relative">
          <div
            className="pointer-events-none select-none opacity-90"
            aria-hidden="true"
            inert={"" as unknown as boolean}
          >
            {tab === "repertorio" ? (
              <div className="space-y-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                <p className="font-bold text-card-foreground">Seu repertório na nuvem</p>
                <p>
                  Cifras salvas com transposição de tom, temas de leitura e importação de arquivos
                  TXT. Disponível assim que você criar sua conta.
                </p>
              </div>
            ) : null}
            {tab === "retorno" ? <Retorno /> : null}
            {tab === "afinador" ? <Afinador /> : null}
            {tab === "metronomo" ? <Metronomo /> : null}
            {tab === "gravador" ? <Gravador /> : null}
          </div>

          <button
            type="button"
            onClick={goRegister}
            aria-label="Criar conta para usar esta função"
            className="absolute inset-0 z-10 flex items-end justify-center rounded-xl bg-background/10 pb-6"
          >
            <span className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg">
              <Lock className="size-4" aria-hidden="true" />
              Criar conta para usar — 4 horas grátis
            </span>
          </button>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 backdrop-blur">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
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
