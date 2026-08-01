import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Gift,
  Headphones,
  LifeBuoy,
  ListMusic,
  LogOut,
  Mic,
  Music2,
  Sparkles,
  Timer,
} from "lucide-react";

import { Paywall } from "@/components/PlanGrid";
import { TrialBanner } from "@/components/TrialBanner";
import { Afinador } from "@/components/tools/Afinador";
import { Gravador } from "@/components/tools/Gravador";
import { Indicacoes } from "@/components/tools/Indicacoes";
import { Metronomo } from "@/components/tools/Metronomo";
import { Repertorio } from "@/components/tools/Repertorio";
import { Retorno } from "@/components/tools/Retorno";
import { Suporte } from "@/components/tools/Suporte";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsApp } from "@/lib/access";
import type { CifraThemeId } from "@/lib/cifra-themes";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/cifrastop-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Meu kit — CifraVocal Pro | CifraStop" },
      {
        name: "description",
        content:
          "Repertório na nuvem, retorno de áudio, afinador, metrônomo e gravador em um só app.",
      },
      { property: "og:title", content: "CifraVocal Pro — Kit completo do músico" },
      {
        property: "og:description",
        content: "Seu repertório e suas ferramentas de palco sempre à mão.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppPage,
});

const TABS = [
  { id: "repertorio", label: "Repertório", icon: ListMusic },
  { id: "retorno", label: "Retorno", icon: Headphones },
  { id: "afinador", label: "Afinador", icon: Music2 },
  { id: "metronomo", label: "Metrônomo", icon: Timer },
  { id: "gravador", label: "Gravador", icon: Mic },
] as const;

type TabId = (typeof TABS)[number]["id"];
type HubId = "indicacoes" | "suporte";

const HUB_ITEMS = [
  { id: "indicacoes", label: "Indique e Ganhe", icon: Gift },
  { id: "suporte", label: "Suporte", icon: LifeBuoy },
] as const;

function AppPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("repertorio");
  const [hubOpen, setHubOpen] = useState(false);
  const [hubTab, setHubTab] = useState<HubId>("indicacoes");
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const { data, status, remainingMs } = useAccess();

  useEffect(() => {
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      swipeStart.current =
        touch.clientX > window.innerWidth - 40 ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onEnd = (event: TouchEvent) => {
      const start = swipeStart.current;
      const touch = event.changedTouches[0];
      swipeStart.current = null;
      if (!start || !touch) return;
      const dx = start.x - touch.clientX;
      const dy = Math.abs(start.y - touch.clientY);
      if (dx > 60 && dy < 60) setHubOpen(true);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  const themeMutation = useMutation({
    mutationFn: async (themeId: CifraThemeId) => {
      if (!data?.userId) return;
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_cifra_theme: themeId })
        .eq("id", data.userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["access"] }),
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando seu kit…
      </div>
    );
  }

  if (status === "expired") return <Paywall />;

  const themeId = (data?.profile?.preferred_cifra_theme ?? "cifraclub") as CifraThemeId;

  return (
    <div className="min-h-screen bg-background pb-24">
      {status === "trial" ? (
        <TrialBanner
          remainingMs={remainingMs}
          onSubscribe={() =>
            openWhatsApp("Olá! Quero assinar o plano Mensal do CifraStop (R$ 15,00 por mês).")
          }
        />
      ) : null}

      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={logoAsset.url} alt="Logo CifraStop" className="size-9" />
          <div>
          <h1 className="text-base font-extrabold text-foreground">CifraVocal Pro</h1>
          <p className="text-[11px] text-muted-foreground">Kit completo do músico</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </Button>
      </header>

      <main className="px-4">
        {tab === "repertorio" && data?.userId ? (
          <Repertorio
            userId={data.userId}
            themeId={themeId}
            onThemeChange={(id) => themeMutation.mutate(id)}
          />
        ) : null}
        {tab === "retorno" ? <Retorno /> : null}
        {tab === "afinador" ? <Afinador /> : null}
        {tab === "metronomo" ? <Metronomo /> : null}
        {tab === "gravador" ? <Gravador /> : null}
      </main>

      <button
        onClick={() => setHubOpen(true)}
        aria-label="Abrir hub de extras"
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-1 rounded-l-full border border-r-0 border-primary/30 bg-primary/95 py-3 pl-3 pr-2 text-primary-foreground shadow-lg backdrop-blur transition-transform active:translate-x-1"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <Sparkles className="size-4" aria-hidden="true" />
      </button>

      <Sheet open={hubOpen} onOpenChange={setHubOpen}>
        <SheetContent side="right" className="w-[92vw] max-w-sm overflow-y-auto p-0">
          <SheetHeader className="border-b px-4 py-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Extras
            </SheetTitle>
            <SheetDescription>
              Puxe a tela da direita para a esquerda a qualquer momento para abrir este hub.
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2 border-b p-3">
            {HUB_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setHubTab(item.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                  hubTab === item.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="px-4 pb-8">
            {hubTab === "indicacoes" ? <Indicacoes /> : <Suporte />}
          </div>
        </SheetContent>
      </Sheet>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t bg-card">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
              tab === item.id ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>

      <footer className="px-4 pt-6 text-center text-[11px] text-muted-foreground">
        Feito para músicos · Sincronizado na nuvem
      </footer>
    </div>
  );
}