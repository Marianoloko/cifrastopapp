import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Drum,
  Gift,
  GraduationCap,
  LifeBuoy,
  ListMusic,
  LogOut,
  SlidersHorizontal,
  Sparkles,
  UserCircle2,
  UserCog,
} from "lucide-react";

import { Paywall } from "@/components/PlanGrid";
import { TrialBanner } from "@/components/TrialBanner";
import { Onboarding } from "@/components/app/Onboarding";
import { Acompanhamento } from "@/components/tools/Acompanhamento";
import { CentralEstudos } from "@/components/tools/CentralEstudos";
import { Ferramentas } from "@/components/tools/Ferramentas";
import { Indicacoes } from "@/components/tools/Indicacoes";
import { Perfil } from "@/components/tools/Perfil";
import { Repertorio } from "@/components/tools/Repertorio";
import { Suporte } from "@/components/tools/Suporte";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useServerFn } from "@tanstack/react-start";

import { adminIsAdmin } from "@/lib/admin.functions";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsApp } from "@/lib/access";
import type { CifraThemeId } from "@/lib/cifra-themes";
import { USER_MODES, useUserMode } from "@/lib/user-mode";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/cifrastop-logo.png.asset.json";

export const Route = createFileRoute("/app")({
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
  { id: "ferramentas", label: "Ferramentas", icon: SlidersHorizontal },
  { id: "estudos", label: "Estudos", icon: GraduationCap },
  { id: "perfil", label: "Perfil", icon: UserCircle2 },
] as const;

type TabId = (typeof TABS)[number]["id"];
type HubId = "indicacoes" | "suporte" | "acompanhamento";

const HUB_ITEMS = [
  { id: "indicacoes", label: "Indique e Ganhe", icon: Gift },
  { id: "suporte", label: "Suporte", icon: LifeBuoy },
  { id: "acompanhamento", label: "Acompanhamento", icon: Drum },
] as const;

function AppPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("repertorio");
  const [hubOpen, setHubOpen] = useState(false);
  const [hubTab, setHubTab] = useState<HubId>("indicacoes");
  const { data, status, remainingMs } = useAccess();
  const checkAdmin = useServerFn(adminIsAdmin);
  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });
  const settingsQuery = useQuery({
    queryKey: ["app-notices"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["banner", "maintenance"]);
      const map = new Map((rows ?? []).map((row) => [row.key, row.value as any]));
      return {
        banner: (map.get("banner") ?? {}) as { enabled?: boolean; message?: string },
        maintenance: (map.get("maintenance") ?? {}) as { enabled?: boolean; message?: string },
      };
    },
  });
  const isAdmin = adminQuery.data === true;
  const maintenance = settingsQuery.data?.maintenance;
  const banner = settingsQuery.data?.banner;
  const { mode, setMode, ready: modeReady } = useUserMode();
  const [modeOpen, setModeOpen] = useState(false);
  const activeMode = USER_MODES.find((item) => item.id === mode) ?? null;

  useEffect(() => {
    if (!data?.userId) return;
    const ping = () => void supabase.rpc("touch_last_seen");
    ping();
    const id = window.setInterval(ping, 120_000);
    return () => window.clearInterval(id);
  }, [data?.userId]);

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

  if (maintenance?.enabled && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <h1 className="text-2xl font-extrabold text-foreground">Em atualização</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {maintenance.message ||
            "Estamos deixando o CifraStop ainda melhor. Volte em alguns minutos."}
        </p>
      </div>
    );
  }

  if (status === "expired") return <Paywall />;

  const themeId = (data?.profile?.preferred_cifra_theme ?? "cifraclub") as CifraThemeId;

  return (
    <div className="min-h-screen bg-background pb-24">
      {banner?.enabled && banner.message ? (
        <div className="bg-primary px-4 py-2 text-center text-xs font-semibold text-primary-foreground">
          {banner.message}
        </div>
      ) : null}
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
        <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModeOpen(true)}
          aria-label="Escolher modo de uso"
        >
          <UserCog className="size-4 text-primary" aria-hidden="true" />
          {activeMode ? `${activeMode.emoji} ${activeMode.label}` : "Modo"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHubOpen(true)}
          aria-label="Abrir extras: programa de afiliados e reclamações"
        >
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          Extras
        </Button>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </Button>
        </div>
      </header>

      <main className="px-4">
        {/* As abas ficam montadas e apenas ocultas para o áudio não parar ao navegar. */}
        <div className={cn(tab === "repertorio" ? "block" : "hidden")}>
          {data?.userId ? (
            <Repertorio
              userId={data.userId}
              themeId={themeId}
              onThemeChange={(id) => themeMutation.mutate(id)}
              mode={mode ?? "instrumentista"}
            />
          ) : null}
        </div>
        <div className={cn(tab === "ferramentas" ? "block" : "hidden")}>
          <Ferramentas />
        </div>
        <div className={cn(tab === "estudos" ? "block" : "hidden")}>
          <CentralEstudos />
        </div>
        {tab === "perfil" ? (
          <Perfil
            email={data?.email ?? ""}
            phone={(data?.profile as { phone?: string | null } | null)?.phone ?? null}
            status={status}
            remainingMs={remainingMs}
            periodEnd={data?.subscription?.current_period_end ?? null}
            mode={mode}
            onModeChange={setMode}
            onSignOut={signOut}
          />
        ) : null}
      </main>

      <Onboarding />

      <Dialog
        open={modeOpen || (modeReady && !mode)}
        onOpenChange={(open) => {
          if (!open && !mode) setMode("instrumentista");
          setModeOpen(open);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Selecione seu modo</DialogTitle>
            <DialogDescription>
              Cada modo destaca o que você mais usa. Salvamos sua última escolha.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {USER_MODES.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMode(item.id);
                  setModeOpen(false);
                }}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  mode === item.id ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <p className="text-sm font-semibold text-foreground">
                  {item.emoji} {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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

          <div className="grid grid-cols-3 gap-2 border-b p-3">
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
            {hubTab === "indicacoes" ? <Indicacoes /> : null}
            {hubTab === "suporte" ? <Suporte /> : null}
            {hubTab === "acompanhamento" ? <Acompanhamento /> : null}
          </div>
        </SheetContent>
      </Sheet>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t bg-card">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
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