import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Indicacoes } from "@/components/tools/Indicacoes";
import { supabase } from "@/integrations/supabase/client";

export function AffiliateDashboardPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) {
        void navigate({ to: "/auth", replace: true });
        return;
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Carregando painel de afiliados…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 glass px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            to="/app"
            className="inline-flex size-9 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Voltar ao app"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="text-base font-extrabold text-foreground">Indique e Ganhe</h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <Indicacoes />
      </div>
    </main>
  );
}
