import { useQuery } from "@tanstack/react-query";
import { Check, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  features: unknown;
  sort_order: number;
};

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });
}

function featureList(features: unknown): string[] {
  return Array.isArray(features) ? (features as string[]) : [];
}

export function PlanGrid({ plans }: { plans: Plan[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3 md:items-center">
      {plans.map((plan) => (
        <article
          key={plan.id}
          className={cn(
            "flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
            plan.featured && "border-primary bg-primary/5 shadow-xl md:scale-105",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-card-foreground">{plan.name}</h3>
            {plan.badge ? <Badge>{plan.badge}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
          <p className="mt-4 text-3xl font-extrabold text-foreground">{plan.price_label}</p>
          <p className="text-xs text-muted-foreground">{plan.period_label}</p>
          <ul className="mt-4 flex-1 space-y-2">
            {featureList(plan.features).map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            className="mt-6 w-full"
            onClick={() =>
              openWhatsApp(
                plan.whatsapp_message || `Olá! Quero assinar o plano ${plan.name} do CifraStop.`,
              )
            }
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Assinar via WhatsApp
          </Button>
        </article>
      ))}
    </div>
  );
}

export function Paywall() {
  const { data: plans = [], isLoading } = usePlans();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
            Escolha seu Plano de Acesso
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Assine diretamente pelo WhatsApp e libere seu acesso instantaneamente.
          </p>
        </header>
        <div className="mt-8">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Carregando planos…</p>
          ) : (
            <PlanGrid plans={plans} />
          )}
        </div>
      </div>
    </div>
  );
}