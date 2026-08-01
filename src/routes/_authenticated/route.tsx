import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        if (window.location.pathname === "/admin") {
          void navigate({ to: "/auth", search: { redirect: "/admin" }, replace: true });
        } else {
          // Sem conta: mostra o app em modo demonstração; o login só é pedido ao usar uma ferramenta.
          void navigate({ to: "/experimentar", replace: true });
        }
        return;
      }

      setAllowed(true);
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
        Verificando acesso…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
