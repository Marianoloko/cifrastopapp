import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert } from "lucide-react";

import { PlanGrid } from "@/components/PlanGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel admin — CifraStop" },
      { name: "description", content: "Área administrativa para acompanhar os planos do CifraStop." },
      { property: "og:title", content: "Painel admin — CifraStop" },
      { property: "og:description", content: "Área administrativa protegida do CifraStop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(adminIsAdmin);
  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });

  if (adminQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
        Verificando permissões…
      </div>
    );
  }

  if (adminQuery.data !== true) {
    return (
      <div className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <ShieldAlert className="size-8 text-destructive" aria-hidden="true" />
        <h1 className="text-xl font-bold">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          Esta área é exclusiva para administradores do CifraStop.
        </p>
        <Button onClick={() => navigate({ to: "/app" })}>Voltar ao app</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel de Administração</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/app" })}>
          Voltar ao App
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos de Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanGrid />
        </CardContent>
      </Card>
    </div>
  );
}
