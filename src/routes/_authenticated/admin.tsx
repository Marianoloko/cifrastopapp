import { createFileRoute } from "@tanstack/react-router";
import { PlanGrid } from "@/components/PlanGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

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
