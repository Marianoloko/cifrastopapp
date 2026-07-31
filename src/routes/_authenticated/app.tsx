import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Gift, Headphones, ListMusic, LogOut, Mic, Music2, Timer } from "lucide-react";

import { Paywall } from "@/components/PlanGrid";
import { TrialBanner } from "@/components/TrialBanner";
import { Afinador } from "@/components/tools/Afinador";
import { Gravador } from "@/components/tools/Gravador";
import { Indicacoes } from "@/components/tools/Indicacoes";
import { Metronomo } from "@/components/tools/Metronomo";
import { Repertorio } from "@/components/tools/Repertorio";
import { Retorno } from "@/components/tools/Retorno";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsApp } from "@/lib/access";
import type { CifraThemeId } from "@/lib/cifra-themes";
import { cn } from "@/lib/utils";

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
  { id: "indicacoes", label: "Indique", icon: Gift },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AppPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("repertorio");
  const { data, status, remainingMs } = useAccess();

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
        <div>
          <h1 className="text-base font-extrabold text-foreground">CifraVocal Pro</h1>
          <p className="text-[11px] text-muted-foreground">Kit completo do músico</p>
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
        {tab === "indicacoes" ? <Indicacoes /> : null}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 border-t bg-card">
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