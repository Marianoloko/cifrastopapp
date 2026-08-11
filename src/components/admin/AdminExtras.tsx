import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TRIAL_PRESETS = [
  { label: "4 horas", hours: 4 },
  { label: "24 horas", hours: 24 },
  { label: "7 dias", hours: 24 * 7 },
  { label: "30 dias", hours: 24 * 30 },
  { label: "60 dias", hours: 24 * 60 },
  { label: "1 ano", hours: 24 * 365 },
  { label: "Ilimitado", hours: 24 * 365 * 100 },
];

export function AdminMetricsCards() {
  const query = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const [profiles, subs, withdrawals] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("status, current_period_end, paid_months"),
        supabase.from("withdrawal_requests").select("amount, status"),
      ]);
      const now = Date.now();
      const subscriptions = subs.data ?? [];
      const vip = subscriptions.filter(
        (row) =>
          row.status === "active" &&
          (!row.current_period_end || new Date(row.current_period_end).getTime() > now),
      ).length;
      const revenue = subscriptions.reduce((total, row) => total + Number(row.paid_months ?? 0) * 15, 0);
      const pendingPayouts = (withdrawals.data ?? [])
        .filter((row) => row.status === "pending")
        .reduce((total, row) => total + Number(row.amount ?? 0), 0);
      const users = profiles.count ?? 0;
      return { users, vip, trialing: Math.max(0, users - vip), revenue, pendingPayouts };
    },
  });

  const data = query.data;
  const cards = [
    { label: "Receita total", value: brl(data?.revenue ?? 0), tone: "text-primary" },
    { label: "Usuários em teste", value: String(data?.trialing ?? 0), tone: "text-foreground" },
    { label: "Usuários VIP", value: String(data?.vip ?? 0), tone: "text-accent" },
    { label: "Comissões a pagar", value: brl(data?.pendingPayouts ?? 0), tone: "text-primary" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="glass">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${card.tone}`}>
              {query.isLoading ? "—" : card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TrialSettingsCard() {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState("4");

  const settingQuery = useQuery({
    queryKey: ["app-settings", "trial"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "trial")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as { hours?: number } | null) ?? { hours: 4 };
    },
  });

  useEffect(() => {
    if (settingQuery.data?.hours) setHours(String(settingQuery.data.hours));
  }, [settingQuery.data?.hours]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const value = Number(hours);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Informe um número de horas válido.");
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "trial", value: { hours: value } }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Duração do teste grátis atualizada.");
      void queryClient.invalidateQueries({ queryKey: ["app-settings", "trial"] });
      void queryClient.invalidateQueries({ queryKey: ["access"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Não consegui salvar."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Período de teste grátis</CardTitle>
        <CardDescription>
          Vale para todos os novos usuários e recalcula o tempo restante de quem já está testando.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="trial-hours">Horas de teste</Label>
          <Input
            id="trial-hours"
            inputMode="numeric"
            className="w-32"
            value={hours}
            onChange={(event) => setHours(event.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </div>
        <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? "Salvando…" : "Salvar duração"}
        </Button>
        <div className="flex w-full flex-wrap gap-2">
          {TRIAL_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant={Number(hours) === preset.hours ? "default" : "outline"}
              onClick={() => setHours(String(preset.hours))}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function WithdrawalsCard() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("id, user_id, amount, pix_key, status, created_at, paid_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação atualizada.");
      void queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: () => toast.error("Não consegui atualizar a solicitação."),
  });

  const items = listQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações de saque</CardTitle>
        <CardDescription>Pedidos de pagamento dos afiliados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {listQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma solicitação até agora.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {brl(Number(item.amount))} · {item.status}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  PIX: {item.pix_key} · {new Date(item.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={item.status === "paid" || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id: item.id, status: "paid" })}
                >
                  Marcar como pago
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={item.status === "rejected" || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id: item.id, status: "rejected" })}
                >
                  Recusar
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function TopSongsCard() {
  const query = useQuery({
    queryKey: ["admin-top-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("song_plays")
        .select("title, artist")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      const counts = new Map<string, { title: string; artist: string; plays: number }>();
      for (const row of data ?? []) {
        const key = `${row.title}::${row.artist}`;
        const current = counts.get(key);
        if (current) current.plays += 1;
        else counts.set(key, { title: row.title, artist: row.artist, plays: 1 });
      }
      return [...counts.values()].sort((a, b) => b.plays - a.plays).slice(0, 20);
    },
  });

  const rows = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Músicas mais tocadas</CardTitle>
        <CardDescription>Top 20 aberturas de cifra registradas no app.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma reprodução registrada ainda.</p>
        ) : (
          rows.map((row, index) => (
            <div
              key={`${row.title}-${row.artist}`}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="truncate">
                {index + 1}. {row.title}
                <span className="text-muted-foreground"> — {row.artist || "Sem artista"}</span>
              </span>
              <span className="shrink-0 font-semibold">{row.plays}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}