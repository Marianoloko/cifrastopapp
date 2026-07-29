import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import {
  adminIsAdmin,
  adminListPlans,
  adminGrantAccess,
  adminSavePlan,
  adminDeletePlan,
  type AdminPlan,
} from "@/lib/admin.functions";

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
  const queryClient = useQueryClient();
  const isAdminFn = useServerFn(adminIsAdmin);
  const listPlansFn = useServerFn(adminListPlans);
  const grantFn = useServerFn(adminGrantAccess);
  const savePlanFn = useServerFn(adminSavePlan);
  const deletePlanFn = useServerFn(adminDeletePlan);

  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState("");
  const [editing, setEditing] = useState<AdminPlan>(emptyPlan);

  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn({}) });
  const plansQuery = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => listPlansFn({}),
    enabled: adminQuery.data === true,
  });

  const grantMutation = useMutation({
    mutationFn: () => grantFn({ data: { email: email.trim(), planId } }),
    onSuccess: (result) => toast.success(`Acesso liberado até ${result.until}.`),
    onError: (error: Error) => toast.error(error.message || "Não consegui liberar o acesso."),
  });

  const saveMutation = useMutation({
    mutationFn: () => savePlanFn({ data: editing }),
    onSuccess: () => {
      toast.success("Plano salvo.");
      setEditing(emptyPlan);
      void queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: () => toast.error("Não consegui salvar o plano."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlanFn({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  if (adminQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verificando permissões…
      </div>
    );
  }

  if (adminQuery.data !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Esta área é exclusiva do administrador.
      </div>
    );
  }

  const plans = plansQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-extrabold text-foreground">Painel do dono</h1>

        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="text-base font-bold text-card-foreground">Liberar acesso</h2>
          <div className="space-y-1">
            <Label htmlFor="admin-email">E-mail do usuário</Label>
            <Input
              id="admin-email"
              type="email"
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
                    {plan.name} · {plan.duration_days} dias
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            disabled={!email.trim() || !planId || grantMutation.isPending}
            onClick={() => grantMutation.mutate()}
          >
            Liberar acesso
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="text-base font-bold text-card-foreground">
            {editing.id ? "Editar plano" : "Novo plano"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Selo</Label>
              <Input
                value={editing.badge ?? ""}
                onChange={(event) => setEditing({ ...editing, badge: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Preço</Label>
              <Input
                value={editing.price_label}
                onChange={(event) => setEditing({ ...editing, price_label: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Período</Label>
              <Input
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
            <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={!editing.name}>
              Salvar plano
            </Button>
            {editing.id ? (
              <Button variant="outline" onClick={() => setEditing(emptyPlan)}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </section>

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
                onClick={() => plan.id && deleteMutation.mutate(plan.id)}
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