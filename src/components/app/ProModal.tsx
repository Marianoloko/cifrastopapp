import { Check, Crown, Loader2 } from "lucide-react";

import { usePlans } from "@/components/PlanGrid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { openWhatsApp } from "@/lib/access";
import { cn } from "@/lib/utils";

const VIP_BENEFITS = [
  "Retorno de áudio ilimitado no fone",
  "Gravador sem limite de tempo",
  "Central de Estudos completa",
  "IA de marketing musical",
];

export function ProModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const plansQuery = usePlans({ enabled: open });
  const plans = plansQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 grid size-12 place-items-center rounded-2xl bg-primary/10">
            <Crown className="size-6 text-primary" aria-hidden="true" />
          </div>
          <DialogTitle>CifraVocal PRO</DialogTitle>
          <DialogDescription>
            Libere o kit completo do músico e toque sem limites, no ensaio e no palco.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 rounded-xl bg-muted p-3">
          {VIP_BENEFITS.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

        {plansQuery.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Carregando planos…
          </p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum plano disponível no momento.</p>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() =>
                  openWhatsApp(
                    plan.whatsapp_message || `Olá! Quero assinar o plano ${plan.name} do CifraVocal PRO.`,
                  )
                }
                className={cn(
                  "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  plan.featured ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-foreground">{plan.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {plan.description || plan.period_label}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-base font-extrabold text-foreground">{plan.price_label}</span>
                  <span className="block text-[10px] text-muted-foreground">{plan.period_label}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
          Agora não
        </Button>
      </DialogContent>
    </Dialog>
  );
}