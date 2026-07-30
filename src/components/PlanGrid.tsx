import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { openWhatsApp } from "@/lib/access";
import { cn } from "@/lib/utils";

export type Plan = {
  id: string;
  name: string;
  description: string;
  price_label: string;
  period_label: string;
  duration_days: number;
  badge: string | null;
  featured: boolean;
  whatsapp_message: string;
  features: string[];
  active: boolean;
  sort_order: number;
};

type PlanGridProps = {
  plans?: Plan[];
  className?: string;
  emptyMessage?: string;
};

function normalizeFeatures(features: Json): string[] {
  if (!Array.isArray(features)) return [];
  return features.filter((feature): feature is string => typeof feature === "string");
}

function getPlansErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.toLowerCase().includes("permission") || message.toLowerCase().includes("rls")) {
    return "Os planos não estão disponíveis no momento. Verifique as permissões de acesso.";
  }
  return "Não consegui carregar os planos agora. Tente novamente em instantes.";
}

export function usePlans(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["plans"],
    enabled: options?.enabled ?? true,
    retry: 1,
    queryFn: async (): Promise<Plan[]> => {
      const { data, error } = await supabase
        .from("plans")
        .select(
          "id, name, description, price_label, period_label, duration_days, badge, featured, whatsapp_message, features, active, sort_order",
        )
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Erro ao carregar planos:", error);
        throw new Error(getPlansErrorMessage(error));
      }

      if (!Array.isArray(data)) return [];

      return data.map((plan) => ({
        id: plan.id,
        name: plan.name ?? "Plano",
        description: plan.description ?? "",
        price_label: plan.price_label ?? "",
        period_label: plan.period_label ?? "",
        duration_days: plan.duration_days ?? 30,
        badge: plan.badge,
        featured: plan.featured ?? false,
        whatsapp_message: plan.whatsapp_message ?? "",
        features: normalizeFeatures(plan.features),
        active: plan.active ?? true,
        sort_order: plan.sort_order ?? 0,
      }));
    },
  });
}

export function PlanGrid({ plans: providedPlans, className, emptyMessage }: PlanGridProps) {
  const plansQuery = usePlans({ enabled: providedPlans === undefined });
  const plans = providedPlans ?? plansQuery.data ?? [];

  if (providedPlans === undefined && plansQuery.isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {["mensal", "trimestral", "anual"].map((item) => (
          <Card key={item} className="min-h-56 animate-pulse">
            <CardHeader>
              <div className="h-5 w-24 rounded bg-muted" />
              <div className="h-4 w-40 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-8 w-28 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-4/5 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (providedPlans === undefined && plansQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" aria-hidden="true" />
        <AlertTitle>Planos indisponíveis</AlertTitle>
        <AlertDescription>{getPlansErrorMessage(plansQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-6 text-center">
        <Loader2 className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-card-foreground">
          {emptyMessage ?? "Nenhum plano disponível no momento."}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Assim que os planos forem liberados, eles aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 md:grid-cols-3", className)}>
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "relative flex min-h-72 flex-col",
            plan.featured ? "border-primary bg-primary/5 shadow-md" : undefined,
          )}
        >
          {plan.badge ? (
            <span className="absolute right-4 top-4 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
              {plan.badge}
            </span>
          ) : null}
          <CardHeader className="pr-24">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div>
              <p className="text-3xl font-extrabold text-card-foreground">{plan.price_label}</p>
              <p className="text-xs text-muted-foreground">{plan.period_label}</p>
            </div>

            <ul className="flex-1 space-y-2 text-sm text-card-foreground">
              {plan.features.length > 0 ? (
                plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Acesso completo ao CifraStop.</li>
              )}
            </ul>

            <Button
              type="button"
              className="w-full"
              onClick={() =>
                openWhatsApp(
                  plan.whatsapp_message || `Olá! Quero assinar o plano ${plan.name} do CifraStop.`,
                )
              }
            >
              Assinar pelo WhatsApp
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function Paywall() {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-primary">Teste grátis encerrado</p>
          <h1 className="mt-2 text-3xl font-extrabold text-foreground">Libere seu acesso</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Escolha um plano para continuar usando repertório, retorno, afinador, metrônomo e
            gravador.
          </p>
        </div>
        <PlanGrid />
      </div>
    </div>
  );
}