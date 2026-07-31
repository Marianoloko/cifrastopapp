import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UsersPanel } from "@/components/admin/UsersPanel";
import {
  adminDeletePlan,
  adminGrantAccess,
  adminIsAdmin,
  adminListPlans,
  adminSavePlan,
  type AdminPlan,
} from "@/lib/admin.functions";

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

const emptyPlan: AdminPlan = {
  id: null,
  name: "",
  description: "",
  price_label: "",
  period_label: "",
  duration_days: 30,
  badge: null,
  featured: false,
  whatsapp_message: "",
  features: [],
  active: true,
  sort_order: 0,
};

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(adminIsAdmin);
  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });

  const listPlans = useServerFn(adminListPlans);
  const savePlanFn = useServerFn(adminSavePlan);
  const deletePlanFn = useServerFn(adminDeletePlan);
  const grantAccessFn = useServerFn(adminGrantAccess);

  const plansQuery = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => listPlans(),
    enabled: adminQuery.data === true,
  });

  const [draft, setDraft] = useState<AdminPlan | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantPlanId, setGrantPlanId] = useState("");

  const openDraft = (plan: AdminPlan) => {
    setDraft(plan);
    setFeaturesText(plan.features.join("\n"));
  };

  const saveMutation = useMutation({
    mutationFn: async (plan: AdminPlan) =>
      savePlanFn({
        data: {
          ...plan,
          badge: plan.badge?.trim() ? plan.badge.trim() : null,
          features: featuresText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Plano salvo.");
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Não consegui salvar o plano."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deletePlanFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Plano removido.");
      void queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Não consegui remover o plano."),
  });

  const grantMutation = useMutation({
    mutationFn: async () => grantAccessFn({ data: { email: grantEmail.trim(), planId: grantPlanId } }),
    onSuccess: (result: { until: string }) => {
      toast.success(`Acesso liberado até ${result.until}.`);
      setGrantEmail("");
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Não consegui liberar o acesso."),
  });

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

      <UsersPanel />

      <Card>
        <CardHeader>
          <CardTitle>Liberar acesso manual</CardTitle>
          <CardDescription>
            Informe o e-mail do usuário e escolha o plano para liberar o período correspondente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[2fr_2fr_auto] md:items-end">
          <div className="space-y-1">
            <Label htmlFor="grant-email">E-mail do usuário</Label>
            <Input
              id="grant-email"
              type="email"
              value={grantEmail}
              onChange={(event) => setGrantEmail(event.target.value)}
              placeholder="pessoa@email.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="grant-plan">Plano</Label>
            <select
              id="grant-plan"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={grantPlanId}
              onChange={(event) => setGrantPlanId(event.target.value)}
            >
              <option value="">Selecione…</option>
              {(plansQuery.data ?? []).map((plan) => (
                <option key={plan.id ?? plan.name} value={plan.id ?? ""}>
                  {plan.name} ({plan.duration_days} dias)
                </option>
              ))}
            </select>
          </div>
          <Button
            disabled={!grantEmail.trim() || !grantPlanId || grantMutation.isPending}
            onClick={() => grantMutation.mutate()}
          >
            {grantMutation.isPending ? "Liberando…" : "Liberar acesso"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Planos de Assinatura</CardTitle>
            <CardDescription>Crie, edite ou remova os planos exibidos no app.</CardDescription>
          </div>
          <Button size="sm" onClick={() => openDraft(emptyPlan)}>
            <Plus className="size-4" aria-hidden="true" />
            Novo plano
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {plansQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando planos…</p>
          ) : null}
          {(plansQuery.data ?? []).map((plan) => (
            <div
              key={plan.id ?? plan.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="font-semibold">
                  {plan.name}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {plan.price_label} · {plan.duration_days} dias
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {plan.active ? "Ativo" : "Inativo"} · ordem {plan.sort_order}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openDraft(plan)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => plan.id && deleteMutation.mutate(plan.id)}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}

          {draft ? (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <h2 className="font-semibold">{draft.id ? "Editar plano" : "Novo plano"}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Selo (badge)</Label>
                  <Input
                    value={draft.badge ?? ""}
                    onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Preço</Label>
                  <Input
                    value={draft.price_label}
                    onChange={(e) => setDraft({ ...draft, price_label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Período</Label>
                  <Input
                    value={draft.period_label}
                    onChange={(e) => setDraft({ ...draft, period_label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Duração (dias)</Label>
                  <Input
                    type="number"
                    value={draft.duration_days}
                    onChange={(e) =>
                      setDraft({ ...draft, duration_days: Number(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Benefícios (um por linha)</Label>
                <Textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-1">
                <Label>Mensagem do WhatsApp</Label>
                <Textarea
                  value={draft.whatsapp_message}
                  onChange={(e) => setDraft({ ...draft, whatsapp_message: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draft.active}
                    onCheckedChange={(value) => setDraft({ ...draft, active: value })}
                  />
                  <Label>Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draft.featured}
                    onCheckedChange={(value) => setDraft({ ...draft, featured: value })}
                  />
                  <Label>Destaque</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={saveMutation.isPending || !draft.name.trim()}
                  onClick={() => saveMutation.mutate(draft)}
                >
                  {saveMutation.isPending ? "Salvando…" : "Salvar plano"}
                </Button>
                <Button variant="outline" onClick={() => setDraft(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
