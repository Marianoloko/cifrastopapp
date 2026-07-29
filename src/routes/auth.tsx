import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — CifraStop" },
      {
        name: "description",
        content: "Crie sua conta no CifraStop e teste grátis por 4 horas o kit completo do músico.",
      },
      { property: "og:title", content: "Entrar ou criar conta — CifraStop" },
      {
        property: "og:description",
        content: "Cadastre-se para experimentar 4 horas de acesso gratuito!",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void navigate({ to: "/app" });
    });
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) void navigate({ to: "/app" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { phone: phone.trim() },
          },
        });
        if (error) throw error;
        toast.success("Conta criada com sucesso!", {
          description: "Você ganhou 4 horas de teste grátis no CifraStop.",
        });
        void navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        void navigate({ to: "/app" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/app" });
  };

  const handleReset = async () => {
    if (!email.trim()) {
      toast.error("Informe seu e-mail para receber o link.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error("Não consegui enviar o e-mail de recuperação.");
    else toast.success("Enviamos um link de redefinição para seu e-mail.");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center text-lg font-extrabold text-foreground">
          CifraStop
        </Link>
        <h1 className="mt-4 text-center text-xl font-bold text-foreground">
          {mode === "signup" ? "Criar conta" : "Entrar"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Cadastre-se para experimentar 4 horas de acesso gratuito!
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-xl border bg-card p-4">
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {mode === "signup" ? (
            <div className="space-y-1">
              <Label htmlFor="phone">Telefone/WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                required
                maxLength={20}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {mode === "signup" ? "Iniciar Teste Grátis (4 horas)" : "Entrar"}
          </Button>
        </form>

        <Button variant="outline" className="mt-3 w-full" onClick={handleGoogle}>
          Entrar com Google
        </Button>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          <button
            className="text-primary underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          >
            {mode === "signup" ? "Já tenho conta" : "Criar Conta e Testar Grátis por 4 Horas"}
          </button>
          <button className="text-muted-foreground hover:underline" onClick={handleReset}>
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  );
}