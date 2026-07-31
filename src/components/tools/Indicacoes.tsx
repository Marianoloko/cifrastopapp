import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, Gift, Share2, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

type ReferralStats = {
  ok: boolean;
  user_id: string;
  referral_code: string;
  total_referrals: number;
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

  const code = stats.data?.referral_code ?? "";
  const total = stats.data?.total_referrals ?? 0;
  const available = stats.data?.available_referrals ?? 0;
  const progress = Math.min(available, REFERRAL_GOAL);
  const canClaim = available >= REFERRAL_GOAL;

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
