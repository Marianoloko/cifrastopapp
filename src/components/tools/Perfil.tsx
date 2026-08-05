import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Crown, Gift, KeyRound, LifeBuoy, Loader2, LogOut, Rocket, UserCog } from "lucide-react";
import { toast } from "sonner";

import { ProModal } from "@/components/app/ProModal";
import { ImpulsionarIA } from "@/components/tools/ImpulsionarIA";
import { Indicacoes } from "@/components/tools/Indicacoes";
import { Suporte } from "@/components/tools/Suporte";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatRemaining, type AccessStatus } from "@/lib/access";
import { USER_MODES, type UserModeId } from "@/lib/user-mode";
import { cn } from "@/lib/utils";

type Section = "conta" | "senha" | "ia" | "indicacoes" | "suporte";

const SECTIONS: { id: Section; label: string; icon: typeof KeyRound }[] = [
  { id: "conta", label: "Minha conta", icon: UserCog },
  { id: "senha", label: "Alterar senha", icon: KeyRound },
  { id: "ia", label: "Impulsionar com IA", icon: Rocket },
  { id: "indicacoes", label: "Indique e Ganhe", icon: Gift },
  { id: "suporte", label: "Suporte", icon: LifeBuoy },
];

function ChangePassword({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signInError) throw new Error("Sua senha atual está incorreta.");
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw new Error("Não consegui trocar a senha. Tente novamente.");
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Não consegui trocar a senha."),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (next.length < 6) {
      toast.error("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (next !== confirm) {
      toast.error("A confirmação não confere com a nova senha.");
      return;
    }
    mutation.mutate();
  };

  return (
    <form className="space-y-3 rounded-2xl border bg-card p-4" onSubmit={submit}>
      <p className="text-sm font-bold text-card-foreground">Alterar minha senha</p>
      <div className="space-y-1">
        <Label htmlFor="senha-atual">Senha atual</Label>
        <Input
          id="senha-atual"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="senha-nova">Nova senha</Label>
        <Input
          id="senha-nova"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={next}
          onChange={(event) => setNext(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="senha-confirma">Confirmar nova senha</Label>
        <Input
          id="senha-confirma"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Salvar nova senha
      </Button>
    </form>
  );
}

export function Perfil({
  email,
  phone,
  status,
  remainingMs,
  periodEnd,
  mode,
  onModeChange,
  onSignOut,
}: {
  email: string;
  phone: string | null;
  status: AccessStatus;
  remainingMs: number;
  periodEnd: string | null;
  mode: UserModeId | null;
  onModeChange: (id: UserModeId) => void;
  onSignOut: () => void;
}) {
  const [section, setSection] = useState<Section>("conta");
  const [proOpen, setProOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-card-foreground">{email || "Minha conta"}</p>
            <p className="truncate text-xs text-muted-foreground">{phone || "WhatsApp não informado"}</p>
          </div>
          <Badge variant={status === "subscriber" ? "default" : "secondary"} className="shrink-0">
            {status === "subscriber" ? "PRO" : status === "trial" ? "Teste grátis" : "Sem acesso"}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {status === "subscriber"
            ? periodEnd
              ? `Plano ativo até ${new Date(periodEnd).toLocaleDateString("pt-BR")}.`
              : "Plano ativo."
            : status === "trial"
              ? `Teste grátis termina em ${formatRemaining(remainingMs)}.`
              : "Seu acesso está bloqueado. Assine para continuar."}
        </p>
        {status !== "subscriber" ? (
          <Button className="mt-3 w-full" onClick={() => setProOpen(true)}>
            <Crown className="size-4" aria-hidden="true" />
            Conhecer o CifraVocal PRO
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="mb-2 text-sm font-bold text-card-foreground">Modo de uso</p>
        <div className="grid gap-2">
          {USER_MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onModeChange(item.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                mode === item.id ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              <span className="block text-sm font-semibold text-foreground">
                {item.emoji} {item.label}
              </span>
              <span className="block text-xs text-muted-foreground">{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
              section === item.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      {section === "senha" ? <ChangePassword email={email} /> : null}
      {section === "ia" ? <ImpulsionarIA /> : null}
      {section === "indicacoes" ? <Indicacoes /> : null}
      {section === "suporte" ? <Suporte /> : null}

      <Button variant="outline" className="w-full" onClick={onSignOut}>
        <LogOut className="size-4" aria-hidden="true" />
        Sair da conta
      </Button>

      <ProModal open={proOpen} onOpenChange={setProOpen} />
    </div>
  );
}