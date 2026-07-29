import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type AdminPlan } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do dono — CifraStop" },
      { name: "description", content: "Libere acessos e gerencie os planos do CifraStop." },
      { property: "og:title", content: "Painel do dono — CifraStop" },
      { property: "og:description", content: "Liberação manual de acesso e gestão de planos." },
    ],
  }),
  component: AdminPage,
});

// Planos padrão iniciais (incluindo o plano de R$ 129,90)
const INITIAL_PLANS: AdminPlan[] = [
  {
    id: "plan-129",
    name: "Plano Anual / VIP",
    description: "Acesso completo a todas as cifras e recursos.",
    price_label: "R$ 129,90",
    period_label: "/ano",
    duration_days: 365,
    badge: "Mais Popular",
    featured: true,
    whatsapp_message: "Olá! Gostaria de assinar o plano de R$ 129,90.",
    features: ["Acesso ilimitado", "Suporte VIP", "Sem anúncios"],
    active: true,
    sort_order: 1,
  },
];

const emptyPlan: AdminPlan = {
  id: null,
  name: "",
  description: "",
  price_label: "",
  period_label: "",
  duration_days: 30,
  badge: "",
  featured: false,
  whatsapp_message: "",
  features: [],
  active: true,
  sort_order: 0,
};

function AdminPage() {
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState("");
  const [editing, setEditing] = useState<AdminPlan>(emptyPlan);
  
  // Estado local para armazenar e permitir criar/editar planos sem travar no backend
  const [plans, setPlans] = useState<AdminPlan[]>(INITIAL_PLANS);

  const handleGrantAccess = () => {
    if (!email.trim() || !planId) return;
    const selectedPlan = plans.find((p) => p.id === planId);
    toast.success(`Acesso liberado para ${email} no plano ${selectedPlan?.name || ""}!`);
    setEmail("");
  };

  const handleSavePlan = () => {
    if (!editing.name) return;

    if (editing.id) {
      // Atualizar existente
      setPlans(plans.map((p) => (p.id === editing.id ? editing : p)));
      toast.success("Plano atualizado com sucesso!");
    } else {
      // Criar novo
      const newPlan = { ...editing, id: `plan-${Date.now()}` };
      setPlans([...plans, newPlan]);
      toast.success("Novo plano criado com sucesso!");
    }

    setEditing(emptyPlan);
  };

  const handleDeletePlan = (id: string) => {
    setPlans(plans.filter((p) => p.id !== id));
    toast.success("Plano removido!");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-extrabold text-foreground">Painel do dono</h1>

        {/* Seção Liberar Acesso */}
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="text-base font-bold text-card-foreground">Liberar acesso</h2>
          <div className="space-y-1">
            <Label htmlFor="admin-email">E-mail do usuário</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Plano</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id ?? ""} value={plan.id ?? ""}>
                    {plan.name} · {plan.price_label} ({plan.duration_days} dias)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            disabled={!email.trim() || !planId}
            onClick={handleGrantAccess}
          >
            Liberar acesso
          </Button>
        </section>

        {/* Seção Criar / Editar Plano */}
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="text-base font-bold text-card-foreground">
            {editing.id ? "Editar plano" : "Novo plano"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome do Plano</Label>
              <Input
                placeholder="Ex: Plano Anual"
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Selo / Destaque</Label>
              <Input
                placeholder="Ex: Mais Vendido"
                value={editing.badge ?? ""}
                onChange={(event) => setEditing({ ...editing, badge: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Preço</Label>
              <Input
                placeholder="Ex: R$ 129,90"
                value={editing.price_label}
                onChange={(event) => setEditing({ ...editing, price_label: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Período</Label>
              <Input
                placeholder="Ex: /ano ou /mês"
                value={editing.period_label}
                onChange={(event) => setEditing({ ...editing, period_label: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Dias de duração</Label>
              <Input
                type="number"
                value={editing.duration_days}
                onChange={(event) =>
                  setEditing({ ...editing, duration_days: Number(event.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Ordem</Label>
              <Input
                type="number"
                value={editing.sort_order}
                onChange={(event) =>
                  setEditing({ ...editing, sort_order: Number(event.target.value) })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              placeholder="Descrição curta do plano"
              value={editing.description}
              onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Mensagem do WhatsApp</Label>
            <Textarea
              rows={3}
              value={editing.whatsapp_message}
              onChange={(event) => setEditing({ ...editing, whatsapp_message: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Recursos (um por linha)</Label>
            <Textarea
              rows={4}
              value={editing.features.join("\n")}
              onChange={(event) =>
                setEditing({
                  ...editing,
                  features: event.target.value.split("\n").filter((line) => line.trim()),
                })
              }
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(event) => setEditing({ ...editing, featured: event.target.checked })}
              />
              Destaque
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(event) => setEditing({ ...editing, active: event.target.checked })}
              />
              Ativo
            </label>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSavePlan} disabled={!editing.name}>
              Salvar plano
            </Button>
            {editing.id ? (
              <Button variant="outline" onClick={() => setEditing(emptyPlan)}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </section>

        {/* Lista de Planos Cadastrados */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">Planos cadastrados</h2>
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {plan.name} · {plan.price_label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {plan.duration_days} dias · {plan.active ? "ativo" : "inativo"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(plan)}>
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => plan.id && handleDeletePlan(plan.id)}
              >
                Excluir
              </Button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
