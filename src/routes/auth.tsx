import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: search.redirect === "/admin" || search.redirect === "/app" ? search.redirect : undefined,
    ref: typeof search.ref === "string" && search.ref.trim() ? search.ref.trim().toUpperCase() : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — CifraStop" },
      { name: "description", content: "Acesse sua conta do CifraStop para abrir seu kit musical." },
      { property: "og:title", content: "Entrar — CifraStop" },
      { property: "og:description", content: "Faça login para acessar repertório, retorno, afinador, metrônomo e gravador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState(search.ref ?? "");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const destination = useMemo(() => search.redirect ?? "/app", [search.redirect]);

  useEffect(() => {
    if (search.ref) {
      setReferralCode(search.ref);
      setMode("signup");
    }
  }, [search.ref]);

  const applyReferral = async () => {
    const code = referralCode.trim();
    if (!code) return;
    try {
      const { data, error } = await supabase.rpc("apply_referral_code", { _code: code });
      if (error) return;
      const result = data as unknown as { ok: boolean; message: string } | null;
      if (result?.ok) setInfoMsg(result.message);
    } catch {
      // silencioso: o cadastro já foi concluído
    }
  };

  useEffect(() => {
    let cancelled = false;
    setCheckingSession(true);

    async function checkExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session) {
        setRedirecting(true);
        void navigate({ to: destination, replace: true });
        return;
      }

      setCheckingSession(false);
    }

    void checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, [destination, navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || redirecting) return;

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: fullName },
          },
        });

        if (error) {
          setErrorMsg(
            error.message.toLowerCase().includes("already")
              ? "Este e-mail já possui conta. Faça login."
              : "Não consegui criar sua conta. Verifique os dados e tente novamente.",
          );
          return;
        }

        if (data.session) {
          await applyReferral();
          setRedirecting(true);
          await navigate({ to: destination, replace: true });
          return;
        }

        setInfoMsg("Conta criada! Confirme seu e-mail para começar o teste grátis de 4 horas.");
        setMode("login");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg("E-mail ou senha incorretos. Verifique seus dados.");
        return;
      }

      if (data.session) {
        await applyReferral();
        setRedirecting(true);
        await navigate({ to: destination, replace: true });
      }
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      setErrorMsg("Ocorreu um erro ao tentar entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CifraStop</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Digite suas credenciais para acessar a plataforma"
              : "Crie sua conta e teste grátis por 4 horas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={
                  mode === item
                    ? "rounded-md bg-card px-3 py-2 text-sm font-semibold text-card-foreground shadow-sm"
                    : "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
                }
              >
                {item === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {checkingSession || redirecting ? (
            <div className="flex items-center justify-center rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Verificando acesso…
            </div>
          ) : null}
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {infoMsg && (
              <Alert>
                <AlertDescription>{infoMsg}</AlertDescription>
              </Alert>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="referralCode">Código de indicação (opcional)</Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="Ex.: A1B2C3D4"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Com um código válido você ganha 24 horas de acesso VIP.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || redirecting}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Entrando..." : "Criando conta..."}
                </>
              ) : (
                mode === "login" ? "Entrar" : "Criar conta e testar grátis"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
