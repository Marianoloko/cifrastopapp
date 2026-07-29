import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  featured: boolean;
  badge: string | null;
  whatsappMessage: string;
  durationDays: number;
  displayOrder: number;
}

// Planos padrão com os valores reais do seu app (Mensal R$ 15, Trimestral R$ 39, Anual R$ 129)
const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: "mensal",
    name: "Mensal",
    price: "R$ 15,00",
    period: "por mês",
    description: "Acesso completo ao kit do músico por 30 dias.",
    features: [
      "Cifras ilimitadas",
      "Sincronização na nuvem",
      "Afinador, metrônomo e gravador",
      "Retorno de áudio ao vivo"
    ],
    featured: false,
    badge: null,
    whatsappMessage: "Olá! Quero assinar o Plano Mensal do CifraStop por R$ 15,00.",
    durationDays: 30,
    displayOrder: 1,
  },
  {
    id: "trimestral",
    name: "Trimestral",
    price: "R$ 39,00",
    period: "a cada 3 meses",
    description: "Três meses de acesso com economia.",
    features: [
      "Tudo do plano Mensal",
      "Economia de 13%",
      "Suporte prioritário no WhatsApp"
    ],
    featured: true,
    badge: "Popular",
    whatsappMessage: "Olá! Quero assinar o Plano Trimestral do CifraStop por R$ 39,00.",
    durationDays: 90,
    displayOrder: 2,
  },
  {
    id: "anual",
    name: "Anual",
    price: "R$ 129,00",
    period: "por ano",
    description: "Um ano inteiro de CifraStop.",
    features: [
      "Tudo do plano Trimestral",
      "Economia de 28%",
      "Acesso a novidades em primeira mão"
    ],
    featured: false,
    badge: "Melhor Valor",
    whatsappMessage: "Olá! Quero assinar o Plano Anual do CifraStop por R$ 129,00.",
    durationDays: 365,
    displayOrder: 3,
  },
];

export function PlanGrid() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);

  useEffect(() => {
    async function loadPlans() {
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        // Se houver planos cadastrados no banco, substitui os padronizados
        if (!error && data && data.length > 0) {
          const mappedPlans: SubscriptionPlan[] = data.map((plan) => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            period: plan.period,
            description: plan.description || "",
            features: Array.isArray(plan.features) ? plan.features : [],
            featured: plan.is_featured || false,
            badge: plan.badge || null,
            whatsappMessage: plan.whatsapp_message || "",
            durationDays: plan.duration_days,
            displayOrder: plan.display_order || 0,
          }));
          setPlans(mappedPlans);
        }
      } catch (e) {
        console.error("Erro ao carregar planos do banco:", e);
      }
    }

    loadPlans();
  }, []);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    const phoneNumber = "5598985223366";
    const message = encodeURIComponent(
      plan.whatsappMessage || `Olá! Gostaria de assinar o ${plan.name} por ${plan.price}.`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto p-4">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative flex flex-col justify-between transition-all ${
            plan.featured
              ? "border-primary shadow-lg scale-105 bg-accent/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          {plan.badge && (
            <div className="absolute -top-3 right-4">
              <Badge variant={plan.featured ? "default" : "secondary"}>
                {plan.badge}
              </Badge>
            </div>
          )}

          <CardHeader>
            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="mt-4 flex items-baseline text-3xl font-extrabold">
              {plan.price}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {plan.period}
              </span>
            </div>
          </CardHeader>

          <CardContent className="flex-1">
            <ul className="space-y-3 my-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full gap-2"
              variant={plan.featured ? "default" : "outline"}
              onClick={() => handleSubscribe(plan)}
            >
              <MessageSquare className="h-4 w-4" />
              Assinar via WhatsApp
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
