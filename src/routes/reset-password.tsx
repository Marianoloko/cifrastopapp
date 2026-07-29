import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — CifraStop" },
      { name: "description", content: "Defina uma nova senha para acessar sua conta do CifraStop." },
      { property: "og:title", content: "Redefinir senha — CifraStop" },
      { property: "og:description", content: "Escolha uma nova senha e volte para o seu repertório." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Não consegui atualizar a senha. Abra o link do e-mail novamente.");
      return;
    }
    toast.success("Senha atualizada!");
    void navigate({ to: "/app" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-xl border bg-card p-5">
        <h1 className="text-xl font-bold text-foreground">Definir nova senha</h1>
        <div className="space-y-1">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            required
            minLength={6}
            maxLength={72}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Salvar nova senha
        </Button>
      </form>
    </div>
  );
}