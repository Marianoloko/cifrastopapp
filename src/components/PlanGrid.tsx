import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export function PlanGrid() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPlans() {
    try {
      setLoading(true);
      setError(null);
      
      // Busca os planos direto da tabela "plans"
      const { data, error } = await supabase
        .from("plans")
        .select("*");
      
      if (error) {
        console.error("Erro do Supabase ao carregar planos:", error);
        setError(`Erro: ${error.message}`);
      } else {
        setPlans(data || []);
      }
    } catch (err: any) {
      console.error("Erro na requisição:", err);
      setError("Erro ao conectar ao banco de dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Buscando planos no banco...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchPlans}
          className="text-xs flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Atualizar dados
        </Button>
      </div>

      {error && (
        <div className="p-3 border border-red-500/50 bg-red-500/10 rounded-md text-red-500 text-sm">
          {error}
        </div>
      )}

      {!error && plans.length === 0 && (
        <div className="text-center p-6 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground text-sm">
            Nenhum plano retornado do banco. Verifique se há registros na tabela "plans" do Supabase.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">R$ {plan.price}</p>
              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
