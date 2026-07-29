import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlanGrid } from "@/components/PlanGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Se não estiver logado, manda para a tela de autenticação
          navigate({ to: "/auth" });
          return;
        }

        // Verifica o perfil/função do usuário se necessário
        setIsAdmin(true);
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando painel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
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
          <CardTitle>Gerenciar Planos de Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanGrid />
        </CardContent>
      </Card>
    </div>
  );
}
