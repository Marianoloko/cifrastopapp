import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BadgeDollarSign, Check, Copy, Gift, MousePointerClick, Share2, Trophy, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsApp } from "@/lib/access";

const PIX_STORAGE_KEY = "cifrastop:pix-key";
const PLAN_PRICE = 15;

type ReferralStats = {
  ok: boolean;
  user_id: string;
  referral_code: string;
  total_referrals: number;
  paid_referrals: number;
  first_month_earnings: number;
  recurring_earnings: number;
  balance: number;
  claimed_rewards: number;
  available_referrals: number;
};

export const REFERRAL_GOAL = 3;

export function useReferralStats() {
  return useQuery({
    queryKey: ["referral-stats"],
    queryFn: async (): Promise<ReferralStats | null> => {
      const { data, error } = await supabase.rpc("get_referral_stats");
      if (error) throw new Error(error.message);
      return (data as unknown as ReferralStats) ?? null;
    },
  });
}

export function Indicacoes() {
  const queryClient = useQueryClient();
  const stats = useReferralStats();
  const [copied, setCopied] = useState<"code" | "id" | null>(null);
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    setPixKey(window.localStorage.getItem(PIX_STORAGE_KEY) ?? "");
  }, []);

  const code = stats.data?.referral_code ?? "";
  const total = stats.data?.total_referrals ?? 0;
  const available = stats.data?.available_referrals ?? 0;
  const progress = Math.min(available, REFERRAL_GOAL);
  const canClaim = available >= REFERRAL_GOAL;
  const paid = Number(stats.data?.paid_referrals ?? 0);
  const firstMonth = Number(stats.data?.first_month_earnings ?? 0);
  const recurring = Number(stats.data?.recurring_earnings ?? 0);
  const balance = Number(stats.data?.balance ?? 0);
  const pending = Math.max(0, total - paid);
  const brl = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const savePix = () => {
    window.localStorage.setItem(PIX_STORAGE_KEY, pixKey.trim());
    toast.success("Chave PIX salva.");
  };

  const requestWithdraw = async () => {
    if (!pixKey.trim()) {
      toast.error("Informe sua chave PIX antes de solicitar o saque.");
      return;
    }
    savePix();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId && balance > 0) {
      await supabase
        .from("withdrawal_requests")
        .insert({ user_id: userId, amount: balance, pix_key: pixKey.trim(), status: "pending" });
    }
    openWhatsApp(
      `Olá! Quero solicitar meu saque de afiliado do CifraStop.\n\nCódigo: ${code}\nIndicados que pagaram: ${paid}\nSaldo disponível: ${brl(balance)}\nChave PIX: ${pixKey.trim()}`,
    );
  };

  const link =
    typeof window !== "undefined" && code
      ? `${window.location.origin}/auth?ref=${code}`
      : "";

  const copy = async (value: string, kind: "code" | "id") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
      toast.success("Copiado!");
    } catch {
      toast.error("Não consegui copiar. Copie manualmente.");
    }
  };

  const share = () => {
    const message = `🎸 Estou usando o CifraStop — repertório, retorno de áudio, afinador, metrônomo e gravador no celular!\n\nUse meu código *${code}* e ganhe 24 horas de acesso VIP grátis:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  };

  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_referral_reward");
      if (error) throw new Error(error.message);
      return data as unknown as { ok: boolean; message: string };
    },
    onSuccess: (result) => {
      if (result?.ok) {
        toast.success(result.message ?? "Prêmio resgatado!");
        void queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
        void queryClient.invalidateQueries({ queryKey: ["access"] });
      } else {
        toast.error(result?.message ?? "Não foi possível resgatar agora.");
      }
    },
    onError: () => toast.error("Não foi possível resgatar agora. Tente novamente."),
  });

  return (
    <div className="space-y-4 py-4">
      <section className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
        <Gift className="mx-auto size-6 text-primary" aria-hidden="true" />
        <h2 className="mt-2 text-lg font-extrabold text-foreground">
          Indique 3 amigos e ganhe 1 Mês VIP Grátis!
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Seu amigo ganha 24 horas de teste VIP ao usar seu código!
        </p>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeDollarSign className="size-4 text-primary" aria-hidden="true" />
            Painel de Afiliados
          </CardTitle>
          <CardDescription>
            Você recebe <strong>R$ 15,00 (100%)</strong> quando o indicado <strong>paga</strong> o
            plano de 30 dias e o pagamento é confirmado — o cadastro sozinho não gera comissão. A
            partir do 2º mês pago, você recebe <strong>30% recorrente</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border p-3">
              <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Wallet className="size-3.5" aria-hidden="true" /> Saldo disponível
              </p>
              <p className="mt-1 text-lg font-extrabold text-foreground">{brl(balance)}</p>
              <p className="text-[10px] text-muted-foreground">só pagamentos confirmados</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <MousePointerClick className="size-3.5" aria-hidden="true" /> Total de cliques
              </p>
              <p className="mt-1 text-lg font-extrabold text-foreground">{total}</p>
              <p className="text-[10px] text-muted-foreground">{paid} viraram assinatura paga</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-[10px] text-muted-foreground">1º mês (100%)</p>
              <p className="text-sm font-bold text-foreground">{brl(firstMonth)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-[10px] text-muted-foreground">Recorrente (30%)</p>
              <p className="text-sm font-bold text-foreground">{brl(recurring)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Suas vendas</p>
            {paid > 0 ? (
              <ul className="space-y-1">
                {Array.from({ length: paid }).map((_, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                  >
                    <span className="text-foreground">Venda paga #{index + 1}</span>
                    <span className="font-semibold text-primary">
                      {brl(PLAN_PRICE)} · 100% (1º mês)
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                Nenhuma venda paga registrada ainda. A comissão entra assim que o indicado pagar os
                R$ 15,00 e o plano for aprovado.
              </p>
            )}
            {pending > 0 ? (
              <p className="rounded-lg border border-dashed border-amber/60 bg-amber-soft/40 p-3 text-xs text-foreground">
                {pending} indicado(s) já se cadastraram mas ainda não pagaram — nenhuma comissão
                gerada por esses cadastros.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Chave PIX para recebimento</p>
            <div className="flex gap-2">
              <Input
                value={pixKey}
                onChange={(event) => setPixKey(event.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                className="h-10 text-xs"
              />
              <Button size="sm" variant="outline" onClick={savePix}>
                Salvar
              </Button>
            </div>
            <Button className="w-full" onClick={requestWithdraw}>
              Solicitar saque
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Os pagamentos são processados a cada 5 dias.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seu código de indicação</CardTitle>
          <CardDescription>Compartilhe e acumule indicações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border bg-muted/40 px-3 py-2 text-center text-xl font-extrabold tracking-[0.2em] text-foreground">
              {stats.isLoading ? "••••••••" : code || "—"}
            </div>
            <Button type="button" variant="outline" disabled={!code} onClick={() => copy(code, "code")}>
              {copied === "code" ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              Copiar código
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">Seu ID de usuário</p>
              <p className="truncate text-xs text-foreground">{stats.data?.user_id ?? "—"}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!stats.data?.user_id}
              onClick={() => copy(stats.data?.user_id ?? "", "id")}
            >
              {copied === "id" ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>

          <Button type="button" className="w-full" disabled={!code} onClick={share}>
            <Share2 className="size-4" aria-hidden="true" />
            Compartilhar no WhatsApp
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" aria-hidden="true" />
            Amigos indicados: {progress} / {REFERRAL_GOAL}
          </CardTitle>
          <CardDescription>
            Total de indicações confirmadas: {total}
            {stats.data?.claimed_rewards ? ` · Prêmios resgatados: ${stats.data.claimed_rewards}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={(progress / REFERRAL_GOAL) * 100} />

          <Button
            type="button"
            className="w-full"
            variant={canClaim ? "default" : "secondary"}
            disabled={!canClaim || claim.isPending}
            onClick={() => claim.mutate()}
          >
            <Trophy className="size-4" aria-hidden="true" />
            {claim.isPending ? "Resgatando…" : "Reivindicar Prêmio"}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            {canClaim
              ? "Você atingiu a meta! Resgate agora e receba 30 dias de VIP."
              : `Faltam ${Math.max(0, REFERRAL_GOAL - progress)} amigo(s) para liberar 1 mês VIP grátis.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
